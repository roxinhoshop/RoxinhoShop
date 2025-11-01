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

  const email = `teste.contact.${Date.now()}@example.com`;
  const [res] = await conn.execute(
    'INSERT INTO contato_clientes (nome, email, mensagem, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
    ['Teste Direto', email, 'Mensagem inserida via script']
  );
  const id = res.insertId;
  const [rows] = await conn.execute(
    'SELECT id, nome, email, mensagem, created_at FROM contato_clientes WHERE id = ?',
    [id]
  );

  console.log(JSON.stringify({ insertedId: id, row: rows[0] }, null, 2));
  await conn.end();
})().catch(err => {
  console.error('Erro ao inserir/consultar contato_clientes:', err && err.message || err);
  process.exit(1);
});
