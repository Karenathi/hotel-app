import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, addDays, fmtMoney, today } from '../api';
import { ErrorMsg, Field, PageHeader } from '../components/ui.jsx';

const JOURS_PLANNING = 14;

export default function Disponibilites() {
  const [arrivee, setArrivee] = useState(today());
  const [depart, setDepart] = useState(addDays(today(), 1));
  const [type, setType] = useState('');
  const [personnes, setPersonnes] = useState(1);
  const [libres, setLibres] = useState([]);
  const [planning, setPlanning] = useState(null);
  const [debut, setDebut] = useState(today());
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (depart <= arrivee) { setLibres([]); setErreur('Le départ doit être après l\'arrivée'); return; }
    setErreur('');
    api(`/disponibilites?arrivee=${arrivee}&depart=${depart}&personnes=${personnes}${type ? `&type=${type}` : ''}`)
      .then(setLibres).catch((e) => setErreur(e.message));
  }, [arrivee, depart, type, personnes]);

  useEffect(() => {
    api(`/disponibilites/planning?debut=${debut}&jours=${JOURS_PLANNING}`).then(setPlanning).catch((e) => setErreur(e.message));
  }, [debut]);

  const jours = Array.from({ length: JOURS_PLANNING }, (_, i) => addDays(debut, i));
  const resaDu = (chambreId, jour) =>
    planning?.reservations.find((r) => r.chambre_id === chambreId && r.date_arrivee <= jour && r.date_depart > jour);

  return (
    <div>
      <PageHeader titre="Disponibilités" />

      <div className="panel p-5 mb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Field label="Arrivée"><input className="input" type="date" value={arrivee} onChange={(e) => setArrivee(e.target.value)} /></Field>
          <Field label="Départ"><input className="input" type="date" value={depart} onChange={(e) => setDepart(e.target.value)} /></Field>
          <Field label="Type">
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Tous</option><option value="simple">Simple</option><option value="double">Double</option><option value="suite">Suite</option>
            </select>
          </Field>
          <Field label="Personnes"><input className="input" type="number" min="1" value={personnes} onChange={(e) => setPersonnes(e.target.value)} /></Field>
        </div>
        <ErrorMsg message={erreur} />
        {!erreur && (
          <>
            <p className="font-semibold mb-2">{libres.length} chambre(s) libre(s)</p>
            <div className="flex flex-wrap gap-2">
              {libres.map((c) => (
                <span key={c.id} className="rounded-md bg-lagon-50 border border-lagon-100 px-3 py-1.5 text-sm">
                  <strong>{c.numero}</strong> · <span className="capitalize">{c.type}</span> · {fmtMoney(c.prix_nuit)}
                </span>
              ))}
            </div>
            {libres.length > 0 && <Link to="/reservations" className="btn-primary mt-4">Réserver une chambre</Link>}
          </>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Planning sur {JOURS_PLANNING} jours</h2>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={() => setDebut(addDays(debut, -7))}>− 7 jours</button>
          <button className="btn-secondary btn-sm" onClick={() => setDebut(today())}>Aujourd'hui</button>
          <button className="btn-secondary btn-sm" onClick={() => setDebut(addDays(debut, 7))}>+ 7 jours</button>
        </div>
      </div>
      <div className="panel overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="th sticky left-0 bg-white">Chambre</th>
              {jours.map((j) => (
                <th key={j} className={`th text-center px-1 ${j === today() ? 'bg-lagon-100' : ''}`}>{j.slice(8)}/{j.slice(5, 7)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planning?.chambres.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2 font-semibold sticky left-0 bg-white border-b border-ink/5">{c.numero}</td>
                {jours.map((j) => {
                  const r = resaDu(c.id, j);
                  const classe = c.statut === 'maintenance' ? 'bg-amber-200' : r ? (r.statut === 'en_cours' ? 'bg-lagon-700' : 'bg-lagon-500') : 'bg-white';
                  return (
                    <td key={j} className={`border border-ink/5 w-9 h-8 ${classe}`} title={r ? `${r.prenom} ${r.nom}` : c.statut === 'maintenance' ? 'Maintenance' : 'Libre'} />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink/60 mt-2">Bleu clair : confirmée · Bleu foncé : en cours · Jaune : maintenance · Survole une case pour voir le client.</p>
    </div>
  );
}
