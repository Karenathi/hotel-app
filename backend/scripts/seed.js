// Cree l'administrateur + quelques donnees de demo (sans doublons)
import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

const ADMIN_EMAIL = 'admin@hotel.com';
const ADMIN_PASSWORD = 'admin123';

const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
await pool.query(
  "INSERT IGNORE INTO utilisateurs (email, mot_de_passe_hash, role) VALUES (?, ?, 'admin')",
  [ADMIN_EMAIL, hash]);
const hash2 = await bcrypt.hash('recep123', 10);
await pool.query(
  "INSERT IGNORE INTO utilisateurs (email, mot_de_passe_hash, role) VALUES ('recep@hotel.com', ?, 'receptionniste')",
  [hash2]);

const chambres = [
  ['101', 'simple', 1, 1800], ['102', 'simple', 1, 1800], ['103', 'simple', 2, 2000],
  ['201', 'double', 2, 3200], ['202', 'double', 2, 3200], ['203', 'double', 3, 3800],
  ['301', 'suite', 4, 7500], ['302', 'suite', 4, 8500],
];
for (const c of chambres) {
  await pool.query('INSERT IGNORE INTO chambres (numero, type, capacite, prix_nuit) VALUES (?,?,?,?)', c);
}

const clients = [
  ['Ramgoolam', 'Anita', 'anita@example.com', '5712 3456', 'Curepipe'],
  ['Dupont', 'Marc', 'marc@example.com', '5898 1122', 'Port Louis'],
  ['Li', 'Wei', 'wei@example.com', '5701 9988', 'Quatre Bornes'],
];
for (const c of clients) {
  await pool.query('INSERT IGNORE INTO clients (nom, prenom, email, telephone, adresse) VALUES (?,?,?,?,?)', c);
}

console.log('Seed termine.');
console.log(`Admin : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
console.log('Receptionniste : recep@hotel.com / recep123');
await pool.end();
