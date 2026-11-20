
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
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

// Autoriser le frontend Vercel
const origins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: origins.length ? origins : true
}));

app.use(express.json());

// Tester si le backend fonctionne
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// TEST 1 : connexion avec le pool MySQL
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

// TEST 2 : nouvelle connexion directe à Enzonic
app.get('/api/db-diagnostic', async (_req, res) => {
  let connection;
  let stage = 'connecting';

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        status: 'error',
        stage: 'configuration',
        code: 'DATABASE_URL_MISSING'
      });
    }

    connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: {},
      connectTimeout: 30000
    });

    stage = 'querying';

    const [rows] = await connection.query(
      'SELECT 1 AS test'
    );

    res.json({
      status: 'connected',
      result: rows[0].test
    });
  } catch (err) {
    console.error('MYSQL DIAGNOSTIC:', {
      stage,
      code: err.code,
      message: err.message
    });

    res.status(503).json({
      status: 'error',
      stage,
      code: err.code || 'UNKNOWN'
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (_) {
        // La connexion peut deja etre fermee
      }
    }
  }
});

// Connexion des utilisateurs
app.use('/api/auth', authRoutes);

// Protection des routes suivantes
app.use('/api', authenticate);

// Routes de l'application Hotel Lagon
app.use('/api/clients', clientsRoutes);
app.use('/api/chambres', chambresRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/disponibilites', disponibilitesRoutes);
app.use('/api/factures', facturesRoutes);
app.use('/api/stats', statsRoutes);

// Gestion des erreurs
app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(500).json({
    error: 'Erreur serveur'
  });
});

// Demarrage du serveur
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`API hotel sur http://localhost:${port}`);
});
