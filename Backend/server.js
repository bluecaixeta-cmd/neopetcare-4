import dotenv from 'dotenv';

dotenv.config({
  path: new URL('./.env', import.meta.url),
  quiet: true
});

const { default: app } =
  await import('./src/app.js');

const { applySchema, pool } =
  await import('./src/database.js');

const port = Number(
  process.env.PORT || 3000
);

async function start() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'A variável DATABASE_URL não foi configurada.'
    );
  }

  await applySchema();

const adminEmail =
  String(
    process.env.ADMIN_EMAIL || ''
  )
    .trim()
    .toLowerCase();

if (adminEmail) {
  const result =
    await pool.query(
      `UPDATE users
       SET role = 'admin'
       WHERE LOWER(email) = $1
       RETURNING id, email, role`,
      [
        adminEmail
      ]
    );

  if (result.rows[0]) {
    console.log(
      'Conta administrativa configurada.'
    );
  } else {
    console.warn(
      'ADMIN_EMAIL não corresponde a uma conta cadastrada.'
    );
  }
}

const server = app.listen(
    port,
    '0.0.0.0',
    () => {
      console.log(
        `NeoPetCare API executando na porta ${port}`
      );
    }
  );

  async function shutdown(signal) {
    console.log(
      `${signal} recebido. Encerrando...`
    );

    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  }

  process.on(
    'SIGTERM',
    () => shutdown('SIGTERM')
  );

  process.on(
    'SIGINT',
    () => shutdown('SIGINT')
  );
}

start().catch((error) => {
  console.error(
    'Não foi possível iniciar a API:',
    error.message
  );

  process.exit(1);
});