import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtMoney } from '../api';
import { ErrorMsg, PageHeader } from '../components/ui.jsx';

function Liste({ titre, items, vide }) {
  return (
    <div className="panel p-5">
      <h2 className="font-bold mb-3">{titre}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink/60">{vide}</p>
      ) : (
        <ul className="divide-y divide-ink/10">
          {items.map((r) => (
            <li key={r.id} className="py-2 flex justify-between text-sm">
              <span>{r.prenom} {r.nom}</span>
              <span className="text-ink/60">Chambre {r.numero} · {r.nb_personnes} pers.</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api('/stats/dashboard').then(setD).catch((e) => setErreur(e.message));
  }, []);

  if (erreur) return <ErrorMsg message={erreur} />;
  if (!d) return <p>Chargement…</p>;

  return (
    <div>
      <PageHeader titre="Tableau de bord">
        <Link to="/reservations" className="btn-primary">Nouvelle réservation</Link>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="panel p-6 lg:col-span-2">
          <p className="text-sm text-ink/60">Occupation ce soir</p>
          <p className="font-titre text-6xl font-bold mt-1">{d.tauxOccupation}%</p>
          <p className="text-sm mt-1">{d.chambresOccupees} chambre(s) occupée(s) sur {d.chambresTotal}</p>
          <div className="h-2 rounded-full bg-lagon-100 mt-4 overflow-hidden">
            <div className="h-full bg-lagon-500" style={{ width: `${d.tauxOccupation}%` }} />
          </div>
        </div>
        <div className="panel p-6 space-y-4">
          <div>
            <p className="text-sm text-ink/60">Revenus facturés ce mois</p>
            <p className="font-titre text-2xl font-bold">{fmtMoney(d.revenusMois)}</p>
          </div>
          <div>
            <p className="text-sm text-ink/60">Factures en attente de paiement</p>
            <p className="font-titre text-2xl font-bold">{d.facturesImpayees}</p>
          </div>
          <div>
            <p className="text-sm text-ink/60">Clients enregistrés</p>
            <p className="font-titre text-2xl font-bold">{d.clients}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Liste titre="Arrivées aujourd'hui" items={d.arrivees} vide="Aucune arrivée prévue." />
        <Liste titre="Départs aujourd'hui" items={d.departs} vide="Aucun départ prévu." />
      </div>
    </div>
  );
}
