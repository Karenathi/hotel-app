import 'dotenv/config';
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'hotel_db',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,      // les DATE restent des chaines 'YYYY-MM-DD'
  decimalNumbers: true,   // les DECIMAL sont renvoyes en nombres
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});
