const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const root = process.cwd();
const port = process.env.PREVIEW_PORT ? Number(process.env.PREVIEW_PORT) : 3012;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function safeJoin(base, target) {
  const targetPath = path.join(base, target);
  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(path.resolve(base))) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  try {
    const parsed = url.parse(req.url);
    let pathname = decodeURI(parsed.pathname || '/');
    if (pathname === '/') pathname = '/index.html';
    const filePath = safeJoin(root, pathname);
    if (!filePath) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    fs.stat(filePath, (err, stats) => {
      if (err) {
        // Try directory index
        const dirIndex = safeJoin(filePath, 'index.html');
        if (dirIndex) {
          fs.stat(dirIndex, (err2, stats2) => {
            if (!err2 && stats2.isFile()) {
              const ext = path.extname(dirIndex).toLowerCase();
              res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
              fs.createReadStream(dirIndex).pipe(res);
            } else {
              res.writeHead(404);
              res.end('Not Found');
            }
          });
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
        return;
      }
      if (stats.isDirectory()) {
        const indexPath = path.join(filePath, 'index.html');
        fs.stat(indexPath, (err3, stats3) => {
          if (!err3 && stats3.isFile()) {
            const ext = path.extname(indexPath).toLowerCase();
            res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
            fs.createReadStream(indexPath).pipe(res);
          } else {
            res.writeHead(403);
            res.end('Directory listing forbidden');
          }
        });
      } else if (stats.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
  } catch (e) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(port, () => {
  console.log(`Preview server running at http://localhost:${port}/`);
});

