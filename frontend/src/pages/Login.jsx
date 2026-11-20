import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { ErrorMsg, Field } from '../components/ui.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function envoyer(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-ink text-white p-12 flex-col justify-end">
        <h1 className="text-5xl font-bold leading-tight">Hôtel Lagon</h1>
        <p className="mt-3 text-white/70 max-w-sm">Réservations, chambres, factures et occupation, au même endroit.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={envoyer} className="w-full max-w-sm space-y-4">
          <h2 className="text-2xl font-bold">Connexion</h2>
          <Field label="Email">
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Field>
          <Field label="Mot de passe">
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <ErrorMsg message={erreur} />
          <button className="btn-primary w-full" disabled={chargement}>{chargement ? 'Connexion…' : 'Se connecter'}</button>
        </form>
      </div>
    </div>
  );
}
