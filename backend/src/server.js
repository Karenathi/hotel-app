
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
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

const origins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: origins.length ? origins : true
}));

app.use(express.json({ limit: '10kb' }));

// Vérification du serveur
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Création temporaire du premier administrateur
app.post('/api/setup-admin', async (req, res) => {
  try {
    const secret = process.env.ADMIN_SETUP_SECRET;
    const provided = req.get('x-setup-secret');

    if (!secret || !provided) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const expectedBuffer = Buffer.from(secret);
    const providedBuffer = Buffer.from(provided);

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const [existingAdmins] = await pool.query(
      "SELECT id FROM utilisateurs WHERE role = 'admin' LIMIT 1"
    );

    if (existingAdmins.length > 0) {
      return res.status(409).json({
        error: 'Un administrateur existe déjà'
      });
    }

    const password = req.body?.password;

    if (typeof password !== 'string' || password.length < 12) {
      return res.status(400).json({
        error: 'Mot de passe de 12 caractères minimum requis'
      });
    }

    const hash = await bcrypt.hash(password, 12);

    await pool.query(
      `INSERT INTO utilisateurs
       (email, mot_de_passe_hash, role)
       VALUES (?, ?, ?)`,
      ['admin@hotel.com', hash, 'admin']
    );

    res.status(201).json({
      status: 'created',
      email: 'admin@hotel.com'
    });
  } catch (err) {
    console.error('ADMIN SETUP ERROR:', err.code || err.message);

    res.status(500).json({
      error: 'Impossible de créer le compte'
    });
  }
});

// Connexion des utilisateurs
app.use('/api/auth', authRoutes);

// Protection des routes de l'application
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

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`API hotel sur http://localhost:${port}`);
});
