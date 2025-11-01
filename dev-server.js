const http = require('http');
const fs = require('fs');
const path = require('path');

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const abs = path.join(process.cwd(), urlPath);
    fs.stat(abs, (err, st) => {
      if (err) { res.statusCode = 404; res.end('Not Found'); return; }
      const filePath = st.isDirectory() ? path.join(abs, 'index.html') : abs;
      fs.readFile(filePath, (err2, data) => {
        if (err2) { res.statusCode = 404; res.end('Not Found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
        res.end(data);
      });
    });
  } catch (_) {
    res.statusCode = 500; res.end('Server Error');
  }
});

const port = Number(process.env.PORT || 5500);
server.listen(port, () => console.log(`Preview: http://localhost:${port}/administracao.html`));

