import { Router } from 'express';
import { pool } from '../db.js';
import { genererFacture } from './factures.js';

const router = Router();

const TRANSITIONS = {
  confirmee: ['en_cours', 'annulee'],
  en_cours: ['terminee'],
  terminee: [],
  annulee: [],
};

async function chambreLibre(chambreId, arrivee, depart, ignoreId = 0) {
  const [[{ n }]] = await pool.query(
    `SELECT COUNT(*) AS n FROM reservations
     WHERE chambre_id = ? AND statut != 'annulee' AND id != ?
       AND date_arrivee < ? AND date_depart > ?`,
    [chambreId, ignoreId, depart, arrivee]);
  return n === 0;
}

router.get('/', async (req, res) => {
  const { statut } = req.query;
  const q = `%${req.query.q || ''}%`;
  const params = [q, q, q];
  let where = '(c.nom LIKE ? OR c.prenom LIKE ? OR ch.numero LIKE ?)';
  if (statut) { where += ' AND r.statut = ?'; params.push(statut); }
  const [rows] = await pool.query(
    `SELECT r.*, c.nom, c.prenom, ch.numero, ch.type, ch.prix_nuit,
            DATEDIFF(r.date_depart, r.date_arrivee) AS nuits,
            f.id AS facture_id
     FROM reservations r
     JOIN clients c ON c.id = r.client_id
     JOIN chambres ch ON ch.id = r.chambre_id
     LEFT JOIN factures f ON f.reservation_id = r.id
     WHERE ${where}
     ORDER BY r.date_arrivee DESC, r.id DESC`, params);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { client_id, chambre_id, date_arrivee, date_depart, nb_personnes } = req.body;
  if (!client_id || !chambre_id || !date_arrivee || !date_depart) {
    return res.status(400).json({ error: 'Client, chambre et dates requis' });
  }
  if (date_depart <= date_arrivee) return res.status(400).json({ error: 'Le depart doit etre apres l\'arrivee' });

  const [[chambre]] = await pool.query('SELECT * FROM chambres WHERE id = ?', [chambre_id]);
  if (!chambre) return res.status(404).json({ error: 'Chambre introuvable' });
  if (chambre.statut !== 'disponible') return res.status(409).json({ error: 'Chambre en maintenance' });
  if (Number(nb_personnes || 1) > chambre.capacite) {
    return res.status(400).json({ error: `Capacite maximale : ${chambre.capacite} personne(s)` });
  }
  if (!(await chambreLibre(chambre_id, date_arrivee, date_depart))) {
    return res.status(409).json({ error: 'Chambre deja reservee sur cette periode' });
  }
  const [r] = await pool.query(
    `INSERT INTO reservations (client_id, chambre_id, date_arrivee, date_depart, nb_personnes)
     VALUES (?,?,?,?,?)`,
    [client_id, chambre_id, date_arrivee, date_depart, nb_personnes || 1]);
  res.status(201).json({ id: r.insertId });
});

// Modifier chambre / dates / nb personnes (uniquement si confirmee)
router.put('/:id', async (req, res) => {
  const { chambre_id, date_arrivee, date_depart, nb_personnes } = req.body;
  const [[resa]] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
  if (!resa) return res.status(404).json({ error: 'Reservation introuvable' });
  if (resa.statut !== 'confirmee') return res.status(409).json({ error: 'Seule une reservation confirmee peut etre modifiee' });
  if (!chambre_id || !date_arrivee || !date_depart || date_depart <= date_arrivee) {
    return res.status(400).json({ error: 'Dates invalides' });
  }
  const [[chambre]] = await pool.query('SELECT * FROM chambres WHERE id = ?', [chambre_id]);
  if (!chambre || chambre.statut !== 'disponible') return res.status(409).json({ error: 'Chambre indisponible' });
  if (Number(nb_personnes || 1) > chambre.capacite) {
    return res.status(400).json({ error: `Capacite maximale : ${chambre.capacite} personne(s)` });
  }
  if (!(await chambreLibre(chambre_id, date_arrivee, date_depart, resa.id))) {
    return res.status(409).json({ error: 'Chambre deja reservee sur cette periode' });
  }
  await pool.query(
    'UPDATE reservations SET chambre_id=?, date_arrivee=?, date_depart=?, nb_personnes=? WHERE id=?',
    [chambre_id, date_arrivee, date_depart, nb_personnes || 1, resa.id]);
  res.json({ ok: true });
});

// Check-in, check-out, annulation
router.patch('/:id/statut', async (req, res) => {
  const { statut } = req.body;
  const [[resa]] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
  if (!resa) return res.status(404).json({ error: 'Reservation introuvable' });
  if (!TRANSITIONS[resa.statut].includes(statut)) {
    return res.status(409).json({ error: `Passage de "${resa.statut}" a "${statut}" impossible` });
  }
  await pool.query('UPDATE reservations SET statut = ? WHERE id = ?', [statut, resa.id]);
  let factureId = null;
  if (statut === 'terminee') factureId = await genererFacture(resa.id); // facture auto au check-out
  res.json({ ok: true, factureId });
});

export default router;
