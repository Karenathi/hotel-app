import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Cree la facture d'une reservation si elle n'existe pas. Retourne l'id.
export async function genererFacture(reservationId) {
  const [[exist]] = await pool.query('SELECT id FROM factures WHERE reservation_id = ?', [reservationId]);
  if (exist) return exist.id;
  const [[resa]] = await pool.query(
    `SELECT DATEDIFF(r.date_depart, r.date_arrivee) * ch.prix_nuit AS montant
     FROM reservations r JOIN chambres ch ON ch.id = r.chambre_id WHERE r.id = ?`, [reservationId]);
  if (!resa) return null;
  const [r] = await pool.query(
    'INSERT INTO factures (reservation_id, montant_total, date_emission) VALUES (?, ?, CURDATE())',
    [reservationId, resa.montant]);
  return r.insertId;
}

const SELECT_FACTURE = `
  SELECT f.*, r.date_arrivee, r.date_depart, r.nb_personnes,
         DATEDIFF(r.date_depart, r.date_arrivee) AS nuits,
         c.nom, c.prenom, c.email, c.telephone, c.adresse,
         ch.numero, ch.type, ch.prix_nuit
  FROM factures f
  JOIN reservations r ON r.id = f.reservation_id
  JOIN clients c ON c.id = r.client_id
  JOIN chambres ch ON ch.id = r.chambre_id`;

router.get('/', async (_req, res) => {
  const [rows] = await pool.query(`${SELECT_FACTURE} ORDER BY f.date_emission DESC, f.id DESC`);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(`${SELECT_FACTURE} WHERE f.id = ?`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Facture introuvable' });
  res.json(rows[0]);
});

router.post('/generer/:reservationId', async (req, res) => {
  const id = await genererFacture(req.params.reservationId);
  if (!id) return res.status(404).json({ error: 'Reservation introuvable' });
  res.status(201).json({ id });
});

router.patch('/:id/payer', async (req, res) => {
  await pool.query("UPDATE factures SET statut_paiement = 'payee' WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

export default router;
