// Configuração da conexão exclusivamente com o banco MySQL da Railway
const { Sequelize } = require('sequelize');
// Garante que o driver mysql2 esteja disponível
require('mysql2');
const path = require('path');
// Carrega .env do root do projeto
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const getSequelizeInstance = () => {
  // Exige URL completa do MySQL da Railway
  const url = process.env.MYSQL_URL;
  if (!url) {
    throw new Error('MYSQL_URL ausente. Configure a URL do MySQL da Railway no arquivo .env');
  }
  return new Sequelize(url, {
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
};

const sequelize = getSequelizeInstance();

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL (Railway) conectado com sucesso.');
    // Garantir conexão usando UTF-8 completo para evitar mojibake (Ã, Â, �)
    try {
      await sequelize.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
    } catch (err) {
      console.warn('Falha ao aplicar SET NAMES utf8mb4:', err && err.message ? err.message : err);
    }
  } catch (error) {
    console.error(`Erro ao conectar ao MySQL (Railway): ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, sequelize };
