import { Router } from 'express';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const [rows] = await pool.query(
    `SELECT * FROM clients
     WHERE nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR telephone LIKE ?
     ORDER BY nom, prenom`, [q, q, q, q]);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Client introuvable' });
  const [historique] = await pool.query(
    `SELECT r.*, ch.numero, ch.type FROM reservations r
     JOIN chambres ch ON ch.id = r.chambre_id
     WHERE r.client_id = ? ORDER BY r.date_arrivee DESC`, [req.params.id]);
  res.json({ ...rows[0], historique });
});

router.post('/', async (req, res) => {
  const { nom, prenom, email, telephone, adresse } = req.body;
  if (!nom || !prenom) return res.status(400).json({ error: 'Nom et prenom requis' });
  try {
    const [r] = await pool.query(
      'INSERT INTO clients (nom, prenom, email, telephone, adresse) VALUES (?,?,?,?,?)',
      [nom, prenom, email || null, telephone || null, adresse || null]);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Cet email existe deja' });
    throw e;
  }
});

router.put('/:id', async (req, res) => {
  const { nom, prenom, email, telephone, adresse } = req.body;
  if (!nom || !prenom) return res.status(400).json({ error: 'Nom et prenom requis' });
  try {
    await pool.query(
      'UPDATE clients SET nom=?, prenom=?, email=?, telephone=?, adresse=? WHERE id=?',
      [nom, prenom, email || null, telephone || null, adresse || null, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Cet email existe deja' });
    throw e;
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'Ce client a des reservations, suppression impossible' });
    throw e;
  }
});

export default router;
