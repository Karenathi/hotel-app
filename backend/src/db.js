
import 'dotenv/config';
import mysql from 'mysql2/promise';

// Connexion MySQL : Railway ou configuration locale
const databaseUrl = process.env.DATABASE_URL;

export const pool = mysql.createPool({
  ...(databaseUrl
    ? { uri: databaseUrl }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_NAME || 'hotel_db'
      }),

  // SSL uniquement si explicitement activé
  ...(process.env.DB_SSL === 'true'
    ? { ssl: { rejectUnauthorized: true } }
    : { ssl: undefined }),

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 30000,

  dateStrings: true,
  decimalNumbers: true
});
