require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const listPath = process.argv[2] && !process.argv[2].startsWith('--')
  ? process.argv[2]
  : path.resolve(__dirname, '../data/curated-links.json');

if (!fs.existsSync(listPath)) {
  console.error(`Arquivo de lista não encontrado: ${listPath}`);
  process.exit(1);
}

let items = [];
try {
  const raw = fs.readFileSync(listPath, 'utf8');
  items = JSON.parse(raw);
} catch (e) {
  console.error('Falha ao ler lista curada:', e.message);
  process.exit(1);
}

if (!Array.isArray(items) || items.length === 0) {
  console.error('Lista curada vazia. Adicione entradas com campos { titulo?, amazon?, ml? }');
  process.exit(1);
}

console.log(`Importação em lote iniciada. Itens: ${items.length}`);
for (const it of items) {
  const args = ['api/scripts/import-from-links.js'];
  if (it.amazon) { args.push('--amazon', String(it.amazon)); }
  if (it.ml) { args.push('--ml', String(it.ml)); }
  if (it.titulo) { args.push('--titulo', String(it.titulo)); }

  console.log(`\n>> Importando: ${it.titulo || '(sem título)'}\n   Amazon: ${it.amazon || '-'}\n   ML: ${it.ml || '-'}`);
  const proc = spawnSync(process.execPath, args, {
    cwd: path.resolve(__dirname, '../../'),
    stdio: 'inherit',
    env: process.env,
  });
  if (proc.status !== 0) {
    console.error(`Falha ao importar item: status=${proc.status}`);
  }
}

console.log('\nImportação em lote concluída.');

