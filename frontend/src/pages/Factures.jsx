import { useEffect, useState } from 'react';
import { api, fmtDate, fmtMoney } from '../api';
import { Badge, ErrorMsg, Modal, PageHeader, Table } from '../components/ui.jsx';

export default function Factures() {
  const [factures, setFactures] = useState([]);
  const [detail, setDetail] = useState(null);
  const [erreur, setErreur] = useState('');

  const charger = () => api('/factures').then(setFactures).catch((e) => setErreur(e.message));
  useEffect(() => { charger(); }, []);

  async function payer(f) {
    setErreur('');
    try {
      await api(`/factures/${f.id}/payer`, { method: 'PATCH' });
      setDetail(null);
      charger();
    } catch (err) { setErreur(err.message); }
  }

  const numero = (f) => `FAC-${String(f.id).padStart(5, '0')}`;

  return (
    <div>
      <PageHeader titre="Factures" />
      <div className="mb-4"><ErrorMsg message={erreur} /></div>
      <p className="no-print text-sm text-ink/60 mb-3">Les factures sont créées automatiquement au check-out.</p>

      <Table colonnes={['N°', 'Client', 'Chambre', 'Émise le', 'Montant', 'Paiement', '']} vide={factures.length === 0 && 'Aucune facture pour le moment.'}>
        {factures.map((f) => (
          <tr key={f.id}>
            <td className="td font-medium">{numero(f)}</td>
            <td className="td">{f.prenom} {f.nom}</td>
            <td className="td">{f.numero}</td>
            <td className="td">{fmtDate(f.date_emission)}</td>
            <td className="td">{fmtMoney(f.montant_total)}</td>
            <td className="td"><Badge valeur={f.statut_paiement} /></td>
            <td className="td text-right whitespace-nowrap space-x-2">
              <button className="btn-secondary btn-sm" onClick={() => setDetail(f)}>Voir / imprimer</button>
              {f.statut_paiement === 'en_attente' && <button className="btn-primary btn-sm" onClick={() => payer(f)}>Marquer payée</button>}
            </td>
          </tr>
        ))}
      </Table>

      {detail && (
        <Modal titre={`Facture ${numero(detail)}`} onClose={() => setDetail(null)} large>
          <div className="print-area bg-white p-2">
            <div className="flex justify-between mb-6">
              <div>
                <p className="font-titre text-2xl font-bold">Hôtel Lagon</p>
                <p className="text-sm text-ink/60">Facture {numero(detail)} · émise le {fmtDate(detail.date_emission)}</p>
              </div>
              <Badge valeur={detail.statut_paiement} />
            </div>
            <div className="mb-6 text-sm">
              <p className="font-semibold">{detail.prenom} {detail.nom}</p>
              {detail.adresse && <p>{detail.adresse}</p>}
              {detail.email && <p>{detail.email}</p>}
              {detail.telephone && <p>{detail.telephone}</p>}
            </div>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-ink/20 text-left">
                  <th className="py-2">Description</th><th className="py-2">Nuits</th><th className="py-2">Prix / nuit</th><th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2">Chambre {detail.numero} ({detail.type})<br /><span className="text-ink/60">{fmtDate(detail.date_arrivee)} → {fmtDate(detail.date_depart)}</span></td>
                  <td className="py-2">{detail.nuits}</td>
                  <td className="py-2">{fmtMoney(detail.prix_nuit)}</td>
                  <td className="py-2 text-right">{fmtMoney(detail.montant_total)}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-right text-lg font-bold border-t border-ink/20 pt-3">Total à payer : {fmtMoney(detail.montant_total)}</p>
          </div>
          <div className="no-print flex justify-end gap-2 mt-4">
            {detail.statut_paiement === 'en_attente' && <button className="btn-secondary" onClick={() => payer(detail)}>Marquer payée</button>}
            <button className="btn-primary" onClick={() => window.print()}>Imprimer / PDF</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
