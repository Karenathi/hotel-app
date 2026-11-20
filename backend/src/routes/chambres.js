import { Router } from 'express';
import { pool } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

function valide(b) {
  return b.numero && ['simple', 'double', 'suite'].includes(b.type) && Number(b.capacite) > 0 && Number(b.prix_nuit) >= 0;
}

router.get('/', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM chambres ORDER BY numero');
  res.json(rows);
});

router.post('/', requireAdmin, async (req, res) => {
  if (!valide(req.body)) return res.status(400).json({ error: 'Champs invalides' });
  const { numero, type, capacite, prix_nuit, statut } = req.body;
  try {
    const [r] = await pool.query(
      'INSERT INTO chambres (numero, type, capacite, prix_nuit, statut) VALUES (?,?,?,?,?)',
      [numero, type, capacite, prix_nuit, statut || 'disponible']);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ce numero de chambre existe deja' });
    throw e;
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  if (!valide(req.body)) return res.status(400).json({ error: 'Champs invalides' });
  const { numero, type, capacite, prix_nuit, statut } = req.body;
  try {
    await pool.query(
      'UPDATE chambres SET numero=?, type=?, capacite=?, prix_nuit=?, statut=? WHERE id=?',
      [numero, type, capacite, prix_nuit, statut || 'disponible', req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ce numero de chambre existe deja' });
    throw e;
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM chambres WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'Cette chambre a des reservations, suppression impossible' });
    throw e;
  }
});

export default router;
