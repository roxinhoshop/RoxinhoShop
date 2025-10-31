// Configuração da conexão exclusivamente com MySQL (Railway/produção)
const { Sequelize } = require('sequelize');
require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const getSequelizeInstance = () => {
  // Preferir URL completa; se ausente, montar a partir de variáveis discretas
  const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DB || process.env.MYSQL_DATABASE;
  const port = Number(process.env.MYSQL_PORT || 3306);

  if (mysqlUrl) {
    return new Sequelize(mysqlUrl, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : undefined,
        charset: 'utf8mb4'
      },
      define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
    });
  }

  if (host && user && password && database) {
    return new Sequelize(database, user, password, {
      host,
      port,
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : undefined,
        charset: 'utf8mb4'
      },
      define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
    });
  }

  // Sem SQLite fallback: falha claramente quando MySQL não está configurado
  throw new Error('Configuração MySQL ausente. Defina MYSQL_URL ou (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB, MYSQL_PORT).');
};

const sequelize = getSequelizeInstance();

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL conectado com sucesso.');
    try {
      await sequelize.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
    } catch (err) {
      console.warn('Falha ao aplicar SET NAMES utf8mb4:', err && err.message ? err.message : err);
    }
  } catch (error) {
    console.error(`Erro ao conectar ao MySQL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, sequelize };
