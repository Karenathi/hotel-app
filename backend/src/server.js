
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

import { authenticate } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import clientsRoutes from './routes/clients.js';
import chambresRoutes from './routes/chambres.js';
import reservationsRoutes from './routes/reservations.js';
import disponibilitesRoutes from './routes/disponibilites.js';
import facturesRoutes from './routes/factures.js';
import statsRoutes from './routes/stats.js';

const app = express();

// Autoriser le frontend à communiquer avec le backend
const origins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: origins.length ? origins : true
}));

app.use(express.json());

// Vérifier que le serveur fonctionne
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// TEST TEMPORAIRE : connexion à MySQL Enzonic
app.get('/api/db-test', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS test');

    res.json({
      database: 'connected',
      result: rows[0].test
    });
  } catch (err) {
    console.error('DB TEST ERROR:', {
      code: err.code,
      message: err.message
    });

    res.status(503).json({
      database: 'disconnected',
      code: err.code || 'UNKNOWN'
    });
  }
});

// Routes de connexion
app.use('/api/auth', authRoutes);

// Les routes suivantes demandent une connexion
app.use('/api', authenticate);

app.use('/api/clients', clientsRoutes);
app.use('/api/chambres', chambresRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/disponibilites', disponibilitesRoutes);
app.use('/api/factures', facturesRoutes);
app.use('/api/stats', statsRoutes);

// Gestion des erreurs
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

// Démarrer le serveur
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`API hotel sur http://localhost:${port}`);
});
