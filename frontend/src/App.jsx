import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Clients from './pages/Clients.jsx';
import Chambres from './pages/Chambres.jsx';
import Reservations from './pages/Reservations.jsx';
import Disponibilites from './pages/Disponibilites.jsx';
import Factures from './pages/Factures.jsx';
import Statistiques from './pages/Statistiques.jsx';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="chambres" element={<Chambres />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="disponibilites" element={<Disponibilites />} />
        <Route path="factures" element={<Factures />} />
        <Route path="statistiques" element={<Statistiques />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
