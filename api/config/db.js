// Configuração da conexão com banco de dados (MySQL com fallback opcional para SQLite em desenvolvimento)
const { Sequelize } = require('sequelize');
const path = require('path');
// Carrega .env do root do projeto para garantir disponibilidade em scripts executados dentro de /api
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const getSequelizeInstance = () => {
  // Fallback de desenvolvimento: usar SQLite se SQLITE_PATH estiver definido
  const sqlitePath = process.env.SQLITE_PATH;
  if (sqlitePath) {
    return new Sequelize({
      dialect: 'sqlite',
      storage: sqlitePath,
      logging: false,
    });
  }

  // Preferir URL completa se disponível (Railway / conexões remotas)
  const url = process.env.MYSQL_URL || process.env.DB_PUBLIC_URL;
  if (url) {
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
  }

  // Mapeia variáveis padrão (DB_* ou MYSQL*)
  const name = process.env.DB_NAME || process.env.MYSQLDATABASE;
  const user = process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_ROOT_USER || 'root';
  const pass = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
  const host = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);

  return new Sequelize(name, user, pass, {
    host,
    port,
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
    console.log('MySQL conectado com sucesso.');
  } catch (error) {
    console.error(`Erro ao conectar ao MySQL: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, sequelize };
