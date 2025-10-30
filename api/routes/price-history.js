const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const PriceHistory = require('../models/PriceHistory');

// GET /api/price-history?produto_id=123&range=30&plataforma=Amazon
router.get('/', async (req, res) => {
  try {
    const produto_id = parseInt(req.query.produto_id, 10);
    if (!produto_id) {
      return res.status(400).json({ success: false, message: 'produto_id é obrigatório' });
    }
    const rangeDias = Math.max(1, Math.min(365, parseInt(req.query.range || '90', 10)));
    const plataforma = (req.query.plataforma || '').trim();

    const dataMin = new Date(Date.now() - rangeDias * 24 * 60 * 60 * 1000);

    const where = {
      produto_id,
      data_coleta: { [Op.gte]: dataMin }
    };
    if (plataforma) where.plataforma = plataforma;

    const registros = await PriceHistory.findAll({
      where,
      order: [['data_coleta', 'ASC']]
    });

    const data = registros.map(r => ({
      id: r.id,
      produto_id: r.produto_id,
      plataforma: r.plataforma,
      preco: Number(r.preco),
      emEstoque: r.emEstoque,
      data_coleta: r.data_coleta
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Erro ao listar histórico de preços:', err);
    return res.status(500).json({ success: false, message: 'Erro ao listar histórico de preços' });
  }
});

module.exports = router;

