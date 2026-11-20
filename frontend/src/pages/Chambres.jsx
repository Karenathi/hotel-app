import { useEffect, useState } from 'react';
import { api, fmtMoney } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Badge, ErrorMsg, Field, Modal, PageHeader, Table } from '../components/ui.jsx';

const VIDE = { numero: '', type: 'simple', capacite: 1, prix_nuit: '', statut: 'disponible' };

export default function Chambres() {
  const { isAdmin } = useAuth();
  const [chambres, setChambres] = useState([]);
  const [form, setForm] = useState(null);
  const [erreur, setErreur] = useState('');

  const charger = () => api('/chambres').then(setChambres).catch((e) => setErreur(e.message));
  useEffect(() => { charger(); }, []);

  async function sauver(e) {
    e.preventDefault();
    setErreur('');
    try {
      if (form.id) await api(`/chambres/${form.id}`, { method: 'PUT', body: form });
      else await api('/chambres', { method: 'POST', body: form });
      setForm(null);
      charger();
    } catch (err) { setErreur(err.message); }
  }

  async function supprimer(c) {
    if (!confirm(`Supprimer la chambre ${c.numero} ?`)) return;
    setErreur('');
    try { await api(`/chambres/${c.id}`, { method: 'DELETE' }); charger(); }
    catch (err) { setErreur(err.message); }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <PageHeader titre="Chambres">
        {isAdmin && <button className="btn-primary" onClick={() => { setErreur(''); setForm(VIDE); }}>Ajouter une chambre</button>}
      </PageHeader>
      {!form && <div className="mb-4"><ErrorMsg message={erreur} /></div>}

      <Table colonnes={['Numéro', 'Type', 'Capacité', 'Prix / nuit', 'Statut', '']}>
        {chambres.map((c) => (
          <tr key={c.id}>
            <td className="td font-medium">{c.numero}</td>
            <td className="td capitalize">{c.type}</td>
            <td className="td">{c.capacite} pers.</td>
            <td className="td">{fmtMoney(c.prix_nuit)}</td>
            <td className="td"><Badge valeur={c.statut} /></td>
            <td className="td text-right whitespace-nowrap space-x-2">
              {isAdmin && (
                <>
                  <button className="btn-secondary btn-sm" onClick={() => { setErreur(''); setForm(c); }}>Modifier</button>
                  <button className="btn-danger btn-sm" onClick={() => supprimer(c)}>Supprimer</button>
                </>
              )}
            </td>
          </tr>
        ))}
      </Table>

      {form && (
        <Modal titre={form.id ? 'Modifier la chambre' : 'Nouvelle chambre'} onClose={() => setForm(null)}>
          <form onSubmit={sauver} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Numéro"><input className="input" required value={form.numero} onChange={set('numero')} /></Field>
              <Field label="Type">
                <select className="input" value={form.type} onChange={set('type')}>
                  <option value="simple">Simple</option>
                  <option value="double">Double</option>
                  <option value="suite">Suite</option>
                </select>
              </Field>
              <Field label="Capacité (personnes)"><input className="input" type="number" min="1" required value={form.capacite} onChange={set('capacite')} /></Field>
              <Field label="Prix par nuit (Rs)"><input className="input" type="number" min="0" step="0.01" required value={form.prix_nuit} onChange={set('prix_nuit')} /></Field>
            </div>
            <Field label="Statut">
              <select className="input" value={form.statut} onChange={set('statut')}>
                <option value="disponible">Disponible</option>
                <option value="maintenance">En maintenance</option>
              </select>
            </Field>
            <ErrorMsg message={erreur} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setForm(null)}>Annuler</button>
              <button className="btn-primary">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
