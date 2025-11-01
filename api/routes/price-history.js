const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Gerador pseudo-determinístico baseado em seeded LCG
function lcg(seed) {
  // Parâmetros clássicos de LCG
  seed = (seed * 1664525 + 1013904223) >>> 0;
  // Normaliza para [0,1)
  return { seed, rnd: (seed & 0xffffffff) / 0x100000000 };
}

function derivarPrecoBase(produto) {
  const ml = produto && produto.precoMercadoLivre != null ? Number(produto.precoMercadoLivre) : null;
  const az = produto && produto.precoAmazon != null ? Number(produto.precoAmazon) : null;
  const candidatos = [ml, az].filter(v => typeof v === 'number' && isFinite(v) && v > 0);
  if (candidatos.length === 0) return 299.9; // fallback razoável
  // usar o menor preço como base para a linha do gráfico
  return Math.min(...candidatos);
}

// GET /api/price-history?produto_id=123&range=30[&plataforma=Amazon]
// Gera série sintética sempre que solicitado, sem depender de tabela no banco
router.get('/', async (req, res) => {
  try {
    const produto_id = parseInt(req.query.produto_id, 10);
    if (!produto_id) {
      return res.status(400).json({ success: false, message: 'produto_id é obrigatório' });
    }
    const rangeDias = Math.max(1, Math.min(365, parseInt(req.query.range || '90', 10)));
    const plataforma = (req.query.plataforma || '').trim(); // ignorado na síntese, apenas ecoado

    let produto = null;
    try {
      produto = await Product.findByPk(produto_id);
    } catch (_) {}

    let base = derivarPrecoBase(produto);
    const baseInicial = base;
    const agora = Date.now();
    const diaMs = 24 * 60 * 60 * 1000;

    // Semente estável por produto+range para manter consistência visual
    let seed = (produto_id * 9301 + rangeDias * 49297) >>> 0;
    // Define alvo de queda entre 20% e 30% do valor base
    const targetDrop = 0.2 + 0.1 * lcg(seed + 2).rnd;
    const piso = Math.max(1, baseInicial * (1 - targetDrop));
    // Drift diário suave, levando ao piso sem quedas bruscas
    const driftDiario = (-targetDrop) / rangeDias;
    const vol = 0.015; // +/-1.5% de variação diária máxima
    const maxStepDown = -0.03; // queda diária máxima de 3%
    const maxStepUp = 0.02; // alta diária máxima de 2%

    const data = [];
    for (let k = rangeDias - 1; k >= 0; k--) {
      const step = lcg(seed);
      seed = step.seed;
      const noise = (step.rnd - 0.5) * 2 * vol; // [-vol, +vol]
      let fator = 1 + driftDiario + noise;
      // Limita passo diário para evitar quedas/altas abruptas
      fator = Math.max(1 + maxStepDown, Math.min(1 + maxStepUp, fator));
      base = base * fator;
      if (base < piso) base = piso;
      if (base < 1) base = 1;
      const preco = Number(base.toFixed(2));
      const data_coleta = new Date(agora - k * diaMs);
      data.push({
        id: null,
        produto_id,
        plataforma: plataforma || 'Fictício',
        preco,
        data_coleta
      });
    }

    // Garante ordem cronológica ascendente
    data.sort((a, b) => new Date(a.data_coleta) - new Date(b.data_coleta));

    // Âncora: último valor deve refletir o preço atual do produto
    try {
      const ml = produto && produto.precoMercadoLivre != null ? Number(produto.precoMercadoLivre) : NaN;
      const az = produto && produto.precoAmazon != null ? Number(produto.precoAmazon) : NaN;
      const candidatos = [ml, az].filter(v => !Number.isNaN(v) && Number.isFinite(v) && v > 0);
      const precoAtual = candidatos.length ? Math.min(...candidatos) : baseInicial;
      if (data.length) {
        data[data.length - 1].preco = Number(precoAtual.toFixed(2));
      }
    } catch (_) {}

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Erro ao gerar histórico sintético de preços:', err);
    return res.status(500).json({ success: false, message: 'Erro ao gerar histórico sintético de preços' });
  }
});

module.exports = router;
