import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, fmtMoney } from '../api';
import { ErrorMsg, PageHeader, Table } from '../components/ui.jsx';

export default function Statistiques() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api(`/stats/occupation?annee=${annee}`).then(setData).catch((e) => setErreur(e.message));
  }, [annee]);

  const totalRevenus = data?.mois.reduce((s, m) => s + m.revenus, 0) || 0;
  const tauxMoyen = data ? Math.round((data.mois.reduce((s, m) => s + m.taux, 0) / 12) * 10) / 10 : 0;

  return (
    <div>
      <PageHeader titre="Statistiques d'occupation">
        <button className="btn-secondary" onClick={() => setAnnee(annee - 1)}>←</button>
        <span className="self-center font-titre font-bold text-lg w-16 text-center">{annee}</span>
        <button className="btn-secondary" onClick={() => setAnnee(annee + 1)}>→</button>
      </PageHeader>
      <ErrorMsg message={erreur} />
      {data && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="panel p-5"><p className="text-sm text-ink/60">Taux d'occupation moyen</p><p className="font-titre text-4xl font-bold">{tauxMoyen}%</p></div>
            <div className="panel p-5"><p className="text-sm text-ink/60">Revenus facturés sur l'année</p><p className="font-titre text-4xl font-bold">{fmtMoney(totalRevenus)}</p></div>
          </div>

          <div className="panel p-5">
            <h2 className="font-bold mb-3">Taux d'occupation par mois (%)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.mois}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mois" /><YAxis domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="taux" name="Occupation" fill="#1B7F86" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="font-bold mb-3">Revenus par mois (Rs)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.mois}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mois" /><YAxis />
                  <Tooltip formatter={(v) => fmtMoney(v)} />
                  <Line type="monotone" dataKey="revenus" name="Revenus" stroke="#E8603C" strokeWidth={2.5} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h2 className="font-bold mb-3">Chambres les plus réservées</h2>
            <Table colonnes={['Chambre', 'Type', 'Réservations', 'Nuits']}>
              {data.topChambres.map((c) => (
                <tr key={c.numero}>
                  <td className="td font-medium">{c.numero}</td>
                  <td className="td capitalize">{c.type}</td>
                  <td className="td">{c.reservations}</td>
                  <td className="td">{c.nuits}</td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
