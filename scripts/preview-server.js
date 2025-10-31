// Simple static file server for local preview (no external deps)
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2] || process.env.PORT || 3011);
const root = process.cwd();
// Permite definir o alvo da API via argumento de linha de comando (process.argv[3])
// ou via variáveis de ambiente (API_BASE / API_TARGET), com fallback para localhost:3000
const apiTarget = process.argv[3] || process.env.API_BASE || process.env.API_TARGET || 'http://localhost:3000';
const apiUrl = new URL(apiTarget);
// Seleciona biblioteca correta conforme protocolo (http/https)
const httpLib = apiUrl.protocol === 'https:' ? require('https') : require('http');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function safeJoin(rootDir, urlPath) {
  try {
    // Decodificar e remover querystring
    const decoded = decodeURIComponent(String(urlPath || '/').split('?')[0]);
    // Remover barras iniciais para evitar que path.join trate como absoluto no Windows
    const stripped = decoded.replace(/^\/+/, '');
    const p = path.normalize(path.join(rootDir, stripped));
    if (!p.startsWith(rootDir)) return null;
    return p;
  } catch (_) { return null; }
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  // Proxy simples: encaminhar /api para backend
  if (url.startsWith('/api')) {
    const options = {
      protocol: apiUrl.protocol,
      hostname: apiUrl.hostname,
      port: apiUrl.port || (apiUrl.protocol === 'https:' ? 443 : 80),
      method: req.method,
      path: url,
      headers: req.headers
    };
    const proxyReq = httpLib.request(options, (proxyRes) => {
      try { res.writeHead(proxyRes.statusCode, proxyRes.headers); }
      catch (_) { res.writeHead(proxyRes.statusCode || 500); }
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway: ' + String(err && err.message || err));
    });
    req.pipe(proxyReq);
    return;
  }

  let filePath = safeJoin(root, url);
  if (!filePath) { res.writeHead(400); res.end('Bad Request'); return; }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.access(filePath, fs.constants.F_OK, (accErr) => {
      if (accErr) {
        // Se a rota não tem extensão, tentar servir o arquivo .html correspondente
        const ext = path.extname(filePath);
        if (!ext) {
          const htmlPath = `${filePath}.html`;
          fs.access(htmlPath, fs.constants.F_OK, (htmlErr) => {
            if (!htmlErr) {
              res.writeHead(200, { 'Content-Type': MIME['.html'] });
              fs.createReadStream(htmlPath).pipe(res);
              return;
            }
            // Fallback para página 404 personalizada, se existir
            const notFoundPage = path.join(root, '404.html');
            if (fs.existsSync(notFoundPage)) {
              res.writeHead(404, { 'Content-Type': MIME['.html'] });
              fs.createReadStream(notFoundPage).pipe(res);
              return;
            }
            // Nenhum arquivo correspondente encontrado: responder 404 texto
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          });
          return;
        }
        // Arquivo com extensão não encontrado: tentar servir 404.html
        const notFoundPage = path.join(root, '404.html');
        if (fs.existsSync(notFoundPage)) {
          res.writeHead(404, { 'Content-Type': MIME['.html'] });
          fs.createReadStream(notFoundPage).pipe(res);
          return;
        }
        // Fallback texto
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      fs.createReadStream(filePath).pipe(res);
    });
  });
});

server.listen(port, () => {
  console.log(`Preview server running at http://localhost:${port}/`);
});
