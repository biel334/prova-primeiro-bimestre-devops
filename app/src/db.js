const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'reservas',
});

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas (
      id SERIAL PRIMARY KEY,
      cliente VARCHAR(255) NOT NULL,
      data DATE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pendente',
      criado_em TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

module.exports = { pool, initSchema };
