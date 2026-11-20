import { useEffect, useState } from 'react';
import { api, fmtDate } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Badge, ErrorMsg, Field, Modal, PageHeader, Table } from '../components/ui.jsx';

const VIDE = { nom: '', prenom: '', email: '', telephone: '', adresse: '' };

export default function Clients() {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [historique, setHistorique] = useState(null);
  const [erreur, setErreur] = useState('');

  const charger = () => api(`/clients?q=${encodeURIComponent(q)}`).then(setClients).catch((e) => setErreur(e.message));
  useEffect(() => { charger(); }, [q]);

  async function sauver(e) {
    e.preventDefault();
    setErreur('');
    try {
      if (form.id) await api(`/clients/${form.id}`, { method: 'PUT', body: form });
      else await api('/clients', { method: 'POST', body: form });
      setForm(null);
      charger();
    } catch (err) { setErreur(err.message); }
  }

  async function supprimer(c) {
    if (!confirm(`Supprimer ${c.prenom} ${c.nom} ?`)) return;
    setErreur('');
    try { await api(`/clients/${c.id}`, { method: 'DELETE' }); charger(); }
    catch (err) { setErreur(err.message); }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <PageHeader titre="Clients">
        <input className="input !w-64" placeholder="Rechercher un client" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-primary" onClick={() => { setErreur(''); setForm(VIDE); }}>Ajouter un client</button>
      </PageHeader>
      {!form && <div className="mb-4"><ErrorMsg message={erreur} /></div>}

      <Table colonnes={['Nom', 'Email', 'Téléphone', 'Adresse', '']} vide={clients.length === 0 && 'Aucun client trouvé.'}>
        {clients.map((c) => (
          <tr key={c.id}>
            <td className="td font-medium">{c.prenom} {c.nom}</td>
            <td className="td">{c.email}</td>
            <td className="td">{c.telephone}</td>
            <td className="td">{c.adresse}</td>
            <td className="td whitespace-nowrap text-right space-x-2">
              <button className="btn-secondary btn-sm" onClick={async () => setHistorique(await api(`/clients/${c.id}`))}>Séjours</button>
              <button className="btn-secondary btn-sm" onClick={() => { setErreur(''); setForm(c); }}>Modifier</button>
              {isAdmin && <button className="btn-danger btn-sm" onClick={() => supprimer(c)}>Supprimer</button>}
            </td>
          </tr>
        ))}
      </Table>

      {form && (
        <Modal titre={form.id ? 'Modifier le client' : 'Nouveau client'} onClose={() => setForm(null)}>
          <form onSubmit={sauver} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom"><input className="input" required value={form.prenom} onChange={set('prenom')} /></Field>
              <Field label="Nom"><input className="input" required value={form.nom} onChange={set('nom')} /></Field>
            </div>
            <Field label="Email"><input className="input" type="email" value={form.email || ''} onChange={set('email')} /></Field>
            <Field label="Téléphone"><input className="input" value={form.telephone || ''} onChange={set('telephone')} /></Field>
            <Field label="Adresse"><input className="input" value={form.adresse || ''} onChange={set('adresse')} /></Field>
            <ErrorMsg message={erreur} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setForm(null)}>Annuler</button>
              <button className="btn-primary">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}

      {historique && (
        <Modal titre={`Séjours de ${historique.prenom} ${historique.nom}`} onClose={() => setHistorique(null)}>
          {historique.historique.length === 0 ? (
            <p className="text-sm text-ink/60">Aucun séjour pour ce client.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {historique.historique.map((r) => (
                <li key={r.id} className="py-2 flex justify-between items-center text-sm">
                  <span>Chambre {r.numero} · {fmtDate(r.date_arrivee)} → {fmtDate(r.date_depart)}</span>
                  <Badge valeur={r.statut} />
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}
