import { useEffect, useState } from 'react';
import { api, addDays, fmtDate, fmtMoney, today } from '../api';
import { Badge, ErrorMsg, Field, Modal, PageHeader, Table } from '../components/ui.jsx';

const STATUTS = ['', 'confirmee', 'en_cours', 'terminee', 'annulee'];
const LIB = { '': 'Tous les statuts', confirmee: 'Confirmées', en_cours: 'En cours', terminee: 'Terminées', annulee: 'Annulées' };

function FormReservation({ resa, onClose, onSaved }) {
  const edition = !!resa;
  const [clients, setClients] = useState([]);
  const [libres, setLibres] = useState([]);
  const [f, setF] = useState({
    client_id: resa?.client_id || '',
    chambre_id: resa?.chambre_id || '',
    date_arrivee: resa?.date_arrivee || today(),
    date_depart: resa?.date_depart || addDays(today(), 1),
    nb_personnes: resa?.nb_personnes || 1,
  });
  const [erreur, setErreur] = useState('');

  useEffect(() => { api('/clients').then(setClients); }, []);

  // Recharge les chambres libres quand les dates changent
  useEffect(() => {
    if (f.date_depart <= f.date_arrivee) { setLibres([]); return; }
    api(`/disponibilites?arrivee=${f.date_arrivee}&depart=${f.date_depart}&personnes=${f.nb_personnes}`)
      .then(async (rows) => {
        // en edition, la chambre actuelle reste proposee
        if (edition && !rows.find((c) => c.id === resa.chambre_id)) {
          const toutes = await api('/chambres');
          const actuelle = toutes.find((c) => c.id === resa.chambre_id);
          if (actuelle && actuelle.capacite >= f.nb_personnes) rows = [actuelle, ...rows];
        }
        setLibres(rows);
      })
      .catch((e) => setErreur(e.message));
  }, [f.date_arrivee, f.date_depart, f.nb_personnes]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const chambre = libres.find((c) => String(c.id) === String(f.chambre_id));
  const nuits = Math.max(0, (Date.parse(f.date_depart) - Date.parse(f.date_arrivee)) / 86400000);

  async function envoyer(e) {
    e.preventDefault();
    setErreur('');
    try {
      if (edition) await api(`/reservations/${resa.id}`, { method: 'PUT', body: f });
      else await api('/reservations', { method: 'POST', body: f });
      onSaved();
    } catch (err) { setErreur(err.message); }
  }

  return (
    <Modal titre={edition ? 'Modifier la réservation' : 'Nouvelle réservation'} onClose={onClose}>
      <form onSubmit={envoyer} className="space-y-3">
        <Field label="Client">
          <select className="input" required disabled={edition} value={f.client_id} onChange={set('client_id')}>
            <option value="">Choisir un client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Arrivée"><input className="input" type="date" required value={f.date_arrivee} onChange={set('date_arrivee')} /></Field>
          <Field label="Départ"><input className="input" type="date" required value={f.date_depart} onChange={set('date_depart')} /></Field>
          <Field label="Personnes"><input className="input" type="number" min="1" required value={f.nb_personnes} onChange={set('nb_personnes')} /></Field>
        </div>
        <Field label={`Chambre (${libres.length} libre(s) sur cette période)`}>
          <select className="input" required value={f.chambre_id} onChange={set('chambre_id')}>
            <option value="">Choisir une chambre</option>
            {libres.map((c) => <option key={c.id} value={c.id}>{c.numero} · {c.type} · {c.capacite} pers. · {fmtMoney(c.prix_nuit)}/nuit</option>)}
          </select>
        </Field>
        {chambre && nuits > 0 && (
          <p className="text-sm rounded-md bg-lagon-50 px-3 py-2">
            {nuits} nuit(s) × {fmtMoney(chambre.prix_nuit)} = <strong>{fmtMoney(nuits * chambre.prix_nuit)}</strong>
          </p>
        )}
        <ErrorMsg message={erreur} />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary">{edition ? 'Enregistrer' : 'Créer la réservation'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Reservations() {
  const [rows, setRows] = useState([]);
  const [statut, setStatut] = useState('');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | reservation
  const [erreur, setErreur] = useState('');

  const charger = () =>
    api(`/reservations?statut=${statut}&q=${encodeURIComponent(q)}`).then(setRows).catch((e) => setErreur(e.message));
  useEffect(() => { charger(); }, [statut, q]);

  async function changer(r, nouveau, message) {
    if (message && !confirm(message)) return;
    setErreur('');
    try {
      const res = await api(`/reservations/${r.id}/statut`, { method: 'PATCH', body: { statut: nouveau } });
      if (res.factureId) alert('Check-out effectué. La facture a été générée (onglet Factures).');
      charger();
    } catch (err) { setErreur(err.message); }
  }

  return (
    <div>
      <PageHeader titre="Réservations">
        <input className="input !w-56" placeholder="Client ou chambre" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !w-44" value={statut} onChange={(e) => setStatut(e.target.value)}>
          {STATUTS.map((s) => <option key={s} value={s}>{LIB[s]}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setModal('new')}>Nouvelle réservation</button>
      </PageHeader>
      <div className="mb-4"><ErrorMsg message={erreur} /></div>

      <Table colonnes={['Client', 'Chambre', 'Séjour', 'Total', 'Statut', '']} vide={rows.length === 0 && 'Aucune réservation.'}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="td font-medium">{r.prenom} {r.nom}</td>
            <td className="td">{r.numero} <span className="text-ink/50 capitalize">({r.type})</span></td>
            <td className="td whitespace-nowrap">{fmtDate(r.date_arrivee)} → {fmtDate(r.date_depart)} <span className="text-ink/50">({r.nuits} n.)</span></td>
            <td className="td">{fmtMoney(r.nuits * r.prix_nuit)}</td>
            <td className="td"><Badge valeur={r.statut} /></td>
            <td className="td text-right whitespace-nowrap space-x-2">
              {r.statut === 'confirmee' && (
                <>
                  <button className="btn-primary btn-sm" onClick={() => changer(r, 'en_cours')}>Check-in</button>
                  <button className="btn-secondary btn-sm" onClick={() => setModal(r)}>Modifier</button>
                  <button className="btn-danger btn-sm" onClick={() => changer(r, 'annulee', 'Annuler cette réservation ?')}>Annuler</button>
                </>
              )}
              {r.statut === 'en_cours' && (
                <button className="btn-primary btn-sm" onClick={() => changer(r, 'terminee', 'Faire le check-out et générer la facture ?')}>Check-out</button>
              )}
            </td>
          </tr>
        ))}
      </Table>

      {modal && (
        <FormReservation
          resa={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); charger(); }}
        />
      )}
    </div>
  );
}
