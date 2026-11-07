import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

const currentDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);

const backendDirectory = path.resolve(
  currentDirectory,
  '..'
);

const useSsl = process.env.DATABASE_SSL === 'true';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX || 10),
  ssl: useSsl
    ? {
        rejectUnauthorized:
          process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
      }
    : false
});

pool.on('error', (error) => {
  console.error(
    'Erro inesperado no PostgreSQL:',
    error.message
  );
});

export async function applySchema() {
  const schemaPath = path.join(
    backendDirectory,
    'db',
    'schema.sql'
  );

  const schema = await fs.readFile(
    schemaPath,
    'utf8'
  );

  await pool.query(schema);
}

export async function checkDatabase() {
  const result = await pool.query(
    'SELECT NOW() AS current_time'
  );

  return result.rows[0];
}