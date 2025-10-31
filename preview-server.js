const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 5534;
const ROOT = process.cwd();

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
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.map': 'application/octet-stream'
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function safeJoin(base, target) {
  const p = path.posix.normalize('/' + target).replace(/^\/+/, '');
  return path.join(base, p);
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0] || '/');
    let filePath = urlPath;
    if (filePath === '/' || filePath === '/index') filePath = '/index.html';
    const abs = safeJoin(ROOT, filePath);
    fs.stat(abs, (err, stat) => {
      if (err) {
        send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, '404 Not Found');
        return;
      }
      if (stat.isDirectory()) {
        const fallback = path.join(abs, 'index.html');
        fs.readFile(fallback, (e2, data2) => {
          if (e2) {
            send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, '403 Forbidden');
            return;
          }
          send(res, 200, { 'Content-Type': MIME['.html'] || 'text/html; charset=utf-8' }, data2);
        });
        return;
      }
      const ext = path.extname(abs).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';
      fs.readFile(abs, (e, data) => {
        if (e) {
          send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, '500 Internal Server Error');
          return;
        }
        send(res, 200, { 'Content-Type': type }, data);
      });
    });
  } catch (e) {
    send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, '500 Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Static preview server running at http://localhost:${PORT}/`);
});

