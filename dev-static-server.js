// Simple static file server for local preview on port 5526
// Uses only Node core modules (no external dependencies)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5526;
const ROOT = path.resolve(__dirname);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function send(res, status, headers, body) {
  try { res.writeHead(status, headers); res.end(body); } catch (_) {}
}

function serveFile(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate' }, 'Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (err2, data) => {
      if (err2) return send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate' }, 'Internal Server Error');
      send(res, 200, { 'Content-Type': type, 'Cache-Control': 'no-cache, no-store, must-revalidate' }, data);
    });
  });
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    const ext = path.extname(pathname);

    // Normalize and attempt to serve directly
    let filePath = path.join(ROOT, pathname.replace(/\.+/g, '.'));

    // If the request has no extension, try HTML fallbacks
    if (!ext) {
      const htmlPath = path.join(ROOT, (pathname + '.html').replace(/\.+/g, '.'));
      const indexHtmlPath = path.join(ROOT, path.join(pathname, 'index.html').replace(/\.+/g, '.'));
      if (fs.existsSync(htmlPath)) {
        return serveFile(htmlPath, res);
      }
      if (fs.existsSync(indexHtmlPath)) {
        return serveFile(indexHtmlPath, res);
      }
    }

    serveFile(filePath, res);
  } catch (e) {
    send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}/`);
});
