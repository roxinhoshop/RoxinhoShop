const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const User = require('../models/User');
const { saveBase64Image, removeLocalImage } = require('../utils/saveBase64');

// Util para mapear review do BD para formato do frontend atual
const mapReviewToFrontend = (r) => {
  const nome = r.usuario_nome || 'Usuário';
  const avatar = nome.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'US';
  return {
    id: r.id,
    usuarioNome: nome,
    usuarioAvatar: avatar,
    nota: r.nota,
    titulo: r.titulo || '',
    comentario: r.comentario || '',
    data: r.data_postagem,
    compraVerificada: true, // simplificação
    fotos: Array.isArray(r.fotos) ? r.fotos : [],
  };
};

// GET /api/reviews?produto_id=123
router.get('/', async (req, res) => {
  try {
    const produto_id = parseInt(req.query.produto_id, 10);
    if (!produto_id) return res.status(400).json({ success: false, message: 'produto_id é obrigatório' });

    const reviews = await Review.findAll({
      where: { produto_id },
      order: [['data_postagem', 'DESC']],
    });

    // Mapear nomes completos a partir de usuario_id quando possível
    const userIds = Array.from(new Set(reviews.map(r => r.usuario_id).filter(Boolean)));
    let nomePorUsuarioId = {};
    if (userIds.length) {
      try {
        const usuarios = await User.findAll({
          where: { id: userIds },
          attributes: ['id', 'nome', 'sobrenome']
        });
        usuarios.forEach(u => {
          const nome = (String(u.nome || '').trim());
          const sobrenome = (String(u.sobrenome || '').trim());
          const completo = [nome, sobrenome].filter(Boolean).join(' ').trim();
          if (u.id != null && completo) nomePorUsuarioId[u.id] = completo;
        });
      } catch (e) {
        // Não bloquear resposta em caso de erro; segue com nomes existentes
        console.warn('Falha ao obter nomes de usuários para avaliações:', e);
      }
    }

    const data = reviews.map(r => {
      const plain = r.toJSON ? r.toJSON() : r;
      const nomeOverride = nomePorUsuarioId[plain.usuario_id];
      return mapReviewToFrontend({ ...plain, usuario_nome: nomeOverride || plain.usuario_nome });
    });

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Erro ao listar avaliações:', err);
    return res.status(500).json({ success: false, message: 'Erro ao listar avaliações' });
  }
});

// POST /api/reviews
router.post('/', async (req, res) => {
  try {
    const { produto_id, usuario_id, usuario_nome, nota, titulo, comentario, fotos } = req.body || {};
    if (!produto_id) return res.status(400).json({ success: false, message: 'produto_id é obrigatório' });
    const notaInt = parseInt(nota, 10);
    if (!notaInt || notaInt < 1 || notaInt > 5) return res.status(400).json({ success: false, message: 'nota deve ser 1..5' });

    // Resolver usuário via token (Bearer ou Cookie) e usar nome completo
    let userIdFromToken = null;
    let nomeCompleto = null;
    try {
      const bearer = req.headers.authorization?.split(' ')[1];
      const token = bearer || req.parsedCookies?.token;
      if (token) {
        const secrets = [process.env.JWT_SECRET, 'devsecret'].filter(Boolean);
        let decoded = null;
        for (const s of secrets) {
          try { decoded = jwt.verify(token, s); break; } catch (_) {}
        }
        if (decoded && decoded.id) {
          const u = await User.findByPk(decoded.id);
          if (u) {
            userIdFromToken = u.id;
            const nome = (String(u.nome || '').trim());
            const sobrenome = (String(u.sobrenome || '').trim());
            const completo = [nome, sobrenome].filter(Boolean).join(' ').trim();
            nomeCompleto = completo || null;
          }
        }
      }
    } catch (_) {
      // Ignorar erros de token; seguir com dados do body
    }

    // Processar fotos: salvar base64 como arquivos locais e manter URLs existentes
    const fotosInput = Array.isArray(fotos) ? fotos : [];
    const fotosUrls = [];
    for (const f of fotosInput) {
      if (typeof f === 'string' && f.startsWith('data:image/')) {
        const saved = await saveBase64Image(
          f,
          'reviews',
          `prod-${produto_id}-user-${userIdFromToken || usuario_id || 'anon'}`
        );
        if (saved) fotosUrls.push(saved);
      } else if (typeof f === 'string' && f.trim()) {
        fotosUrls.push(f.trim());
      }
    }

    const created = await Review.create({
      produto_id,
      usuario_id: userIdFromToken || usuario_id || null,
      usuario_nome: nomeCompleto || usuario_nome || 'Anônimo',
      nota: notaInt,
      titulo: titulo || null,
      comentario: comentario || null,
      fotos: fotosUrls,
      data_postagem: new Date(),
    });

    return res.status(201).json({ success: true, data: mapReviewToFrontend(created) });
  } catch (err) {
    console.error('Erro ao criar avaliação:', err);
    return res.status(500).json({ success: false, message: 'Erro ao criar avaliação' });
  }
});





// DELETE /api/reviews/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ success: false, message: 'ID inválido' });

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Avaliação não encontrada' });
    }

    // Remover imagens locais associadas à avaliação (se houver)
    const fotosList = Array.isArray(review.fotos) ? review.fotos : [];
    for (const f of fotosList) {
      await removeLocalImage(f);
    }

    await Review.destroy({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    console.error('Erro ao excluir avaliação:', err);
    return res.status(500).json({ success: false, message: 'Erro ao excluir avaliação' });
  }
});

module.exports = router;
