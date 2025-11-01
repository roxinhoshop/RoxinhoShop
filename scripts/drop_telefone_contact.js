const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await conn.execute('ALTER TABLE contato_clientes DROP COLUMN telefone');
    console.log('Coluna "telefone" removida de "contato_clientes".');
  } catch (e) {
    console.log('Aviso ao remover coluna "telefone":', e?.message || e);
  }

  const [cols] = await conn.execute('SHOW COLUMNS FROM contato_clientes');
  console.log('Colunas atuais em contato_clientes:', cols.map(c => c.Field));
  await conn.end();
})().catch(err => {
  console.error('Erro ao executar remoção de coluna:', err && err.message || err);
  process.exit(1);
});

