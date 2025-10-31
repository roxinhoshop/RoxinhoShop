const app = require('./server')
module.exports = app


// Captura erros não tratados (throw)
process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
  process.exit(1);
});

// Captura promises rejeitadas sem .catch()
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada:', reason);
  process.exit(1);
});

// Graceful shutdown (Ctrl+C)
process.on('SIGINT', () => {
  console.log('Servidor encerrando...');
  process.exit(0);
});

// Graceful shutdown (kill)
process.on('SIGTERM', () => {
  console.log('Servidor encerrando...');
  process.exit(0);
});