import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Chambres libres entre deux dates (+ filtre type / capacite)
router.get('/', async (req, res) => {
  const { arrivee, depart, type, personnes } = req.query;
  if (!arrivee || !depart || depart <= arrivee) {
    return res.status(400).json({ error: 'Dates invalides' });
  }
  const params = [depart, arrivee];
  let filtres = '';
  if (type) { filtres += ' AND c.type = ?'; params.push(type); }
  if (personnes) { filtres += ' AND c.capacite >= ?'; params.push(Number(personnes)); }
  const [rows] = await pool.query(
    `SELECT c.* FROM chambres c
     WHERE c.statut = 'disponible'
       AND c.id NOT IN (
         SELECT chambre_id FROM reservations
         WHERE statut != 'annulee' AND date_arrivee < ? AND date_depart > ?
       )
     ${filtres}
     ORDER BY c.numero`, params);
  res.json(rows);
});

// Planning : chambres + reservations sur une fenetre de jours
router.get('/planning', async (req, res) => {
  const debut = req.query.debut || new Date().toISOString().slice(0, 10);
  const jours = Math.min(Number(req.query.jours) || 14, 31);
  const [chambres] = await pool.query('SELECT id, numero, type, statut FROM chambres ORDER BY numero');
  const [reservations] = await pool.query(
    `SELECT r.id, r.chambre_id, r.date_arrivee, r.date_depart, r.statut, c.nom, c.prenom
     FROM reservations r JOIN clients c ON c.id = r.client_id
     WHERE r.statut != 'annulee'
       AND r.date_arrivee < DATE_ADD(?, INTERVAL ? DAY) AND r.date_depart > ?`,
    [debut, jours, debut]);
  res.json({ debut, jours, chambres, reservations });
});

export default router;
