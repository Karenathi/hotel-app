import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const LIENS = [
  ['/', 'Tableau de bord'],
  ['/reservations', 'Réservations'],
  ['/disponibilites', 'Disponibilités'],
  ['/clients', 'Clients'],
  ['/chambres', 'Chambres'],
  ['/factures', 'Factures'],
  ['/statistiques', 'Statistiques'],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const quitter = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen md:flex">
      <aside className="no-print bg-ink text-white md:w-60 md:min-h-screen md:fixed md:inset-y-0 flex md:flex-col">
        <div className="px-5 py-4 md:py-6 font-titre text-lg font-bold shrink-0">Hôtel Lagon</div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible flex-1 px-2 md:px-3 gap-1">
          {LIENS.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white text-ink' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:block px-5 py-4 border-t border-white/15 text-sm">
          <div className="truncate text-white/80">{user.email}</div>
          <div className="text-xs text-white/50 mb-2">{user.role === 'admin' ? 'Administrateur' : 'Réceptionniste'}</div>
          <button onClick={quitter} className="text-white/80 underline hover:text-white">Se déconnecter</button>
        </div>
      </aside>
      <main className="flex-1 md:ml-60 p-4 md:p-8 max-w-full overflow-x-hidden">
        <button onClick={quitter} className="no-print md:hidden text-sm underline mb-3">Se déconnecter</button>
        <Outlet />
      </main>
    </div>
  );
}
