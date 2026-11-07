import dotenv from 'dotenv';

const envResult = dotenv.config({
  path: new URL('./.env', import.meta.url)
});

if (envResult.error) {
  console.error(
    'Não foi possível carregar o arquivo .env:',
    envResult.error.message
  );
}

const { default: app } = await import('./src/app.js');
const { applySchema, pool } = await import('./src/database.js');

const port = Number(process.env.PORT || 3000);

async function start() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'A variável DATABASE_URL não foi configurada.'
    );
  }

  await applySchema();

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(
      `NeoPetCare API executando na porta ${port}`
    );
  });

  async function shutdown(signal) {
    console.log(`${signal} recebido. Encerrando...`);

    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  console.error(
    'Não foi possível iniciar a API:',
    error.message
  );

  process.exit(1);
});