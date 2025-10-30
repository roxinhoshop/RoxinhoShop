const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5526;
const HOST = process.env.HOST || 'localhost';
const ROOT = process.cwd();
// Aliases para slugs antigos que foram renomeados para padrão com hífen
const ALIASES = {
  '/paginaproduto': '/pagina-produto.html',
  '/redefinirsenha': '/redefinir-senha.html',
  '/cabecalhorodape': '/cabecalho-rodape.html'
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function safeResolve(requestPath) {
  const urlPath = decodeURI(requestPath.split('?')[0]);
  // Redireciona páginas *.html para URLs limpas
  if (/\.html$/i.test(urlPath)) {
    return { redirect: urlPath.replace(/\.html$/i, '') };
  }
  // Mapeia slugs antigos para novos arquivos renomeados
  if (ALIASES[urlPath]) {
    const fullAlias = path.resolve(ROOT, '.' + ALIASES[urlPath]);
    if (fullAlias.startsWith(ROOT) && fs.existsSync(fullAlias)) {
      return fullAlias;
    }
  }
  // Mapear URLs sem extensão para arquivo .html quando existir
  let target = urlPath === '/' ? '/index.html' : urlPath;
  if (!path.extname(target)) {
    const candidate = path.resolve(ROOT, '.' + (target + '.html'));
    if (candidate.startsWith(ROOT) && fs.existsSync(candidate)) {
      target = target + '.html';
    }
  }
  const fullPath = path.resolve(ROOT, '.' + target);
  if (!fullPath.startsWith(ROOT)) return null; // bloqueia path traversal
  return fullPath;
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.createReadStream(filePath)
    .on('open', () => {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    })
    .on('error', () => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Erro interno ao ler arquivo');
    })
    .pipe(res);
}

const server = http.createServer((req, res) => {
  try {
    const filePathOrRedirect = safeResolve(req.url);
    if (!filePathOrRedirect) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Acesso negado');
    }
    if (typeof filePathOrRedirect === 'object' && filePathOrRedirect.redirect) {
      res.writeHead(301, { Location: filePathOrRedirect.redirect });
      return res.end();
    }
    const filePath = filePathOrRedirect;

    fs.stat(filePath, (err, stat) => {
      if (err) {
        // tentativa de servir index.html dentro de diretório
        if (path.extname(filePath) === '' || filePath.endsWith('/')) {
          const idx = path.join(filePath, 'index.html');
          fs.stat(idx, (err2) => {
            if (err2) {
              res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
              return res.end('Arquivo não encontrado');
            }
            serveFile(idx, res);
          });
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Arquivo não encontrado');
      }

      if (stat.isDirectory()) {
        const idx = path.join(filePath, 'index.html');
        fs.stat(idx, (err2) => {
          if (err2) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('Diretório sem index.html');
          }
          serveFile(idx, res);
        });
      } else {
        serveFile(filePath, res);
      }
    });
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Erro interno');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Servidor estático rodando em http://${HOST}:${PORT}/`);
});
