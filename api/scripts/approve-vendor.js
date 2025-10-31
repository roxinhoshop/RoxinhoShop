#!/usr/bin/env node
// Dev helper to approve a vendor by email or id
// Usage:
//   node api/scripts/approve-vendor.js --email someone@example.com --status ativo
//   node api/scripts/approve-vendor.js --id 8 --status ativo

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { sequelize } = require('../config/db');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.replace(/^--/, '');
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else {
      out[key] = true; // boolean switch
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = args.email || args.e || null;
  const idRaw = args.id || args.vendorId || args.vid || null;
  const id = idRaw ? Number(idRaw) : null;
  const status = (args.status || args.s || 'ativo').trim();

  if (!email && (!id || isNaN(id))) {
    console.error('Uso: --email someone@example.com OU --id <vendorId>');
    process.exit(1);
  }
  if (!/^(ativo|pendente|inativo)$/i.test(status)) {
    console.error('Status inválido. Use: ativo | pendente | inativo');
    process.exit(1);
  }

  try {
    let vend = null;
    if (email) {
      const [rows] = await sequelize.query(
        `SELECT v.* FROM vendedor v INNER JOIN usuario u ON u.id = v.userId WHERE u.email = :email LIMIT 1`,
        { replacements: { email } }
      );
      vend = Array.isArray(rows) ? rows[0] : rows;
      if (!vend) {
        console.error('Vendedor não encontrado para email:', email);
        process.exit(2);
      }
    } else {
      const [rows] = await sequelize.query(
        `SELECT * FROM vendedor WHERE id = :id LIMIT 1`,
        { replacements: { id } }
      );
      vend = Array.isArray(rows) ? rows[0] : rows;
      if (!vend) {
        console.error('Vendedor não encontrado para id:', id);
        process.exit(2);
      }
    }

    await sequelize.query(
      `UPDATE vendedor SET status = :status WHERE id = :id`,
      { replacements: { status, id: vend.id } }
    );

    const [rowsOut] = await sequelize.query(
      `SELECT v.*, u.email FROM vendedor v INNER JOIN usuario u ON u.id = v.userId WHERE v.id = :id LIMIT 1`,
      { replacements: { id: vend.id } }
    );
    const updated = Array.isArray(rowsOut) ? rowsOut[0] : rowsOut;
    console.log(JSON.stringify({ success: true, data: updated }, null, 2));
  } catch (err) {
    console.error('Erro ao atualizar status do vendedor:', err && err.message ? err.message : err);
    process.exit(3);
  } finally {
    try { await sequelize.close(); } catch {}
  }
}

main();

