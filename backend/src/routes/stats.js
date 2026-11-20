import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Tableau de bord : chiffres du jour
router.get('/dashboard', async (_req, res) => {
  const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM chambres WHERE statut = 'disponible'");
  const [[{ occupees }]] = await pool.query(
    `SELECT COUNT(DISTINCT chambre_id) AS occupees FROM reservations
     WHERE statut IN ('confirmee','en_cours') AND date_arrivee <= CURDATE() AND date_depart > CURDATE()`);
  const [[{ revenus }]] = await pool.query(
    `SELECT COALESCE(SUM(montant_total),0) AS revenus FROM factures
     WHERE YEAR(date_emission) = YEAR(CURDATE()) AND MONTH(date_emission) = MONTH(CURDATE())`);
  const [[{ impayees }]] = await pool.query("SELECT COUNT(*) AS impayees FROM factures WHERE statut_paiement = 'en_attente'");
  const [[{ clients }]] = await pool.query('SELECT COUNT(*) AS clients FROM clients');
  const base = `SELECT r.id, r.nb_personnes, c.nom, c.prenom, ch.numero FROM reservations r
                JOIN clients c ON c.id = r.client_id JOIN chambres ch ON ch.id = r.chambre_id`;
  const [arrivees] = await pool.query(`${base} WHERE r.date_arrivee = CURDATE() AND r.statut = 'confirmee'`);
  const [departs] = await pool.query(`${base} WHERE r.date_depart = CURDATE() AND r.statut = 'en_cours'`);
  res.json({
    chambresTotal: total,
    chambresOccupees: occupees,
    tauxOccupation: total ? Math.round((occupees / total) * 100) : 0,
    revenusMois: revenus,
    facturesImpayees: impayees,
    clients,
    arrivees,
    departs,
  });
});

// Statistiques d'occupation sur une annee
router.get('/occupation', async (req, res) => {
  const annee = Number(req.query.annee) || new Date().getFullYear();
  const [[{ n }]] = await pool.query("SELECT COUNT(*) AS n FROM chambres WHERE statut = 'disponible'");
  const [resas] = await pool.query(
    `SELECT date_arrivee, date_depart FROM reservations
     WHERE statut != 'annulee' AND date_arrivee <= ? AND date_depart >= ?`,
    [`${annee}-12-31`, `${annee}-01-01`]);
  const [revenus] = await pool.query(
    `SELECT MONTH(date_emission) AS mois, SUM(montant_total) AS total FROM factures
     WHERE YEAR(date_emission) = ? GROUP BY mois`, [annee]);

  const NOMS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];
  const JOUR = 86400000;
  const mois = NOMS.map((nom, m) => {
    const debut = Date.UTC(annee, m, 1);
    const fin = Date.UTC(annee, m + 1, 1);
    const jours = (fin - debut) / JOUR;
    let nuits = 0;
    for (const r of resas) {
      const a = Date.parse(r.date_arrivee);
      const d = Date.parse(r.date_depart);
      nuits += Math.max(0, (Math.min(d, fin) - Math.max(a, debut)) / JOUR);
    }
    const dispo = n * jours;
    const rev = revenus.find((x) => x.mois === m + 1);
    return {
      mois: nom,
      nuits,
      taux: dispo ? Math.round((nuits / dispo) * 1000) / 10 : 0,
      revenus: rev ? Number(rev.total) : 0,
    };
  });

  const [topChambres] = await pool.query(
    `SELECT c.numero, c.type, COUNT(r.id) AS reservations,
            COALESCE(SUM(DATEDIFF(r.date_depart, r.date_arrivee)), 0) AS nuits
     FROM chambres c
     LEFT JOIN reservations r ON r.chambre_id = c.id AND r.statut != 'annulee' AND YEAR(r.date_arrivee) = ?
     GROUP BY c.id ORDER BY nuits DESC, c.numero LIMIT 5`, [annee]);

  res.json({ annee, mois, topChambres });
});

export default router;
