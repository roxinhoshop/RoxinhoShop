// Limpeza e otimização do banco de dados
// - Remove registros órfãos em histórico e avaliações
// - Deduplica histórico por dia/plataforma/produto, mantendo o mais recente
// - Mantém apenas últimos N dias de histórico (DEFAULT_MAX_DAYS)
// - Otimiza tabelas para liberar espaço

const { sequelize, connectDB } = require('../config/db');

// Ajuste conforme necessário
const DEFAULT_MAX_DAYS = parseInt(process.env.PRICE_HISTORY_MAX_DAYS || '120', 10);

async function count(table) {
  const [[row]] = await sequelize.query(`SELECT COUNT(*) AS c FROM ${table}`);
  return Number(row.c || 0);
}

async function cleanupOrphans() {
  console.log('> Removendo registros órfãos...');
  // Histórico sem produto correspondente
  await sequelize.query(`
    DELETE h FROM produto_preco_historico h
    LEFT JOIN produto p ON p.id = h.produto_id
    WHERE p.id IS NULL
  `);
  // Avaliações sem produto correspondente
  await sequelize.query(`
    DELETE a FROM produto_avaliacao a
    LEFT JOIN produto p ON p.id = a.produto_id
    WHERE p.id IS NULL
  `);
}

async function deduplicatePriceHistory() {
  console.log('> Deduplicando histórico por dia/plataforma/produto (mantendo o mais recente)...');
  await sequelize.query(`
    DELETE t1 FROM produto_preco_historico t1
    INNER JOIN produto_preco_historico t2
      ON t1.produto_id = t2.produto_id
     AND t1.plataforma = t2.plataforma
     AND DATE(t1.data_coleta) = DATE(t2.data_coleta)
     AND t1.id < t2.id
  `);
}

async function pruneOldHistory(maxDays) {
  console.log(`> Removendo histórico com mais de ${maxDays} dias...`);
  await sequelize.query(`
    DELETE FROM produto_preco_historico
    WHERE data_coleta < (NOW() - INTERVAL ${maxDays} DAY)
  `);
}

async function optimizeTables() {
  console.log('> Otimizando tabelas (OPTIMIZE TABLE)...');
  // OPTIMIZE TABLE pode variar por engine; em InnoDB, reorg/defragmenta
  try {
    await sequelize.query('OPTIMIZE TABLE produto');
  } catch {}
  try {
    await sequelize.query('OPTIMIZE TABLE produto_preco_historico');
  } catch {}
  try {
    await sequelize.query('OPTIMIZE TABLE produto_avaliacao');
  } catch {}
  try {
    await sequelize.query('OPTIMIZE TABLE usuario');
  } catch {}
}

async function main() {
  try {
    await connectDB();

    const before = {
      produto: await count('produto'),
      historico: await count('produto_preco_historico'),
      avaliacao: await count('produto_avaliacao'),
    };
    console.log('Contagem antes:', before);

    await cleanupOrphans();
    await deduplicatePriceHistory();
    await pruneOldHistory(DEFAULT_MAX_DAYS);
    await optimizeTables();

    const after = {
      produto: await count('produto'),
      historico: await count('produto_preco_historico'),
      avaliacao: await count('produto_avaliacao'),
    };
    console.log('Contagem depois:', after);

    console.log('Limpeza concluída com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('Falha na limpeza:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

