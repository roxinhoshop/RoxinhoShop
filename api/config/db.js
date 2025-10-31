// Configuração da conexão com fallback: MySQL (Railway) ou SQLite local
const { Sequelize } = require('sequelize');
// Garante que o driver mysql2 esteja disponível quando dialeto for MySQL
try { require('mysql2'); } catch (_) {}
const path = require('path');
// Carrega .env do root do projeto
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const getSequelizeInstance = () => {
  // Prioriza URL completa do MySQL (Railway/Vercel/produção)
  const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (mysqlUrl) {
    return new Sequelize(mysqlUrl, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : undefined,
        charset: 'utf8mb4'
      },
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    });
  }

  // Fallback de desenvolvimento: SQLite em arquivo
  const sqlitePath = (process.env.SQLITE_PATH && String(process.env.SQLITE_PATH).trim())
    ? String(process.env.SQLITE_PATH).trim()
    : path.resolve(__dirname, '../../roxinho.sqlite3');

  console.warn(`[DB] MYSQL_URL não definido. Usando SQLite em: ${sqlitePath}`);
  return new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    logging: false
  });
};

const sequelize = getSequelizeInstance();

const connectDB = async () => {
  try {
    const dialect = (sequelize.getDialect && sequelize.getDialect()) || 'desconhecido';
    await sequelize.authenticate();
    console.log(`Banco conectado com sucesso (dialeto: ${dialect}).`);
    // Ajuste de charset apenas para MySQL
    if (dialect === 'mysql') {
      try {
        await sequelize.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
      } catch (err) {
        console.warn('Falha ao aplicar SET NAMES utf8mb4:', err && err.message ? err.message : err);
      }
    }
  } catch (error) {
    console.error(`Erro ao conectar ao banco: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, sequelize };
