import { useEffect } from 'react';

export function PageHeader({ titre, children }) {
  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 className="text-2xl md:text-3xl font-bold">{titre}</h1>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Modal({ titre, onClose, children, large }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={titre}
        className={`bg-white rounded-lg w-full ${large ? 'max-w-3xl' : 'max-w-lg'} my-8 p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="no-print flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{titre}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-2xl leading-none text-ink/50 hover:text-ink">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function ErrorMsg({ message }) {
  if (!message) return null;
  return <p role="alert" className="rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">{message}</p>;
}

const COULEURS = {
  confirmee: 'bg-lagon-100 text-lagon-700',
  en_cours: 'bg-emerald-100 text-emerald-800',
  terminee: 'bg-ink/10 text-ink/70',
  annulee: 'bg-red-100 text-red-800',
  disponible: 'bg-emerald-100 text-emerald-800',
  maintenance: 'bg-amber-100 text-amber-800',
  payee: 'bg-emerald-100 text-emerald-800',
  en_attente: 'bg-amber-100 text-amber-800',
};
const LIBELLES = {
  confirmee: 'Confirmée', en_cours: 'En cours', terminee: 'Terminée', annulee: 'Annulée',
  disponible: 'Disponible', maintenance: 'Maintenance', payee: 'Payée', en_attente: 'En attente',
};

export function Badge({ valeur }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${COULEURS[valeur] || ''}`}>{LIBELLES[valeur] || valeur}</span>;
}

export function Table({ colonnes, children, vide }) {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full">
        <thead><tr>{colonnes.map((c) => <th key={c} className="th">{c}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
      {vide && <p className="px-4 py-8 text-center text-sm text-ink/60">{vide}</p>}
    </div>
  );
}
