import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authenticate } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import clientsRoutes from './routes/clients.js';
import chambresRoutes from './routes/chambres.js';
import reservationsRoutes from './routes/reservations.js';
import disponibilitesRoutes from './routes/disponibilites.js';
import facturesRoutes from './routes/factures.js';
import statsRoutes from './routes/stats.js';

const app = express();

const origins = (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);

// Tout ce qui suit demande d'etre connecte
app.use('/api', authenticate);
app.use('/api/clients', clientsRoutes);
app.use('/api/chambres', chambresRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/disponibilites', disponibilitesRoutes);
app.use('/api/factures', facturesRoutes);
app.use('/api/stats', statsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API hotel sur http://localhost:${port}`));
