const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const SearchHistory = require('../models/SearchHistory');

// Middleware para verificar autenticação (Cookie httpOnly ou Bearer)
const auth = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.split(' ')[1];
    const token = bearer || req.parsedCookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Não autorizado' });
    }
    const secrets = [process.env.JWT_SECRET, 'devsecret'].filter(Boolean);
    let decoded = null;
    for (const s of secrets) {
      try { decoded = jwt.verify(token, s); break; } catch (e) {}
    }
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Não autorizado' });
    }
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }
};

// @desc    Atualizar perfil do usuário (nome, sobrenome, email opcional)
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { nome, sobrenome, email } = req.body;
    const user = req.user;

    if (typeof nome === 'string') user.nome = nome;
    if (typeof sobrenome === 'string') user.sobrenome = sobrenome;
    if (typeof email === 'string') user.email = email;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        email: user.email,
        foto_perfil: user.foto_perfil
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar perfil' });
  }
});

// @desc    Alterar senha
// @route   PUT /api/users/password
// @access  Private
router.put('/password', auth, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const user = req.user;

    const isMatch = await user.matchPassword(senhaAtual);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Senha atual incorreta' });
    }

    user.senha = novaSenha;
    await user.save();

    res.status(200).json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro ao alterar senha' });
  }
});

// @desc    Atualizar avatar do usuário via Base64
// @route   POST /api/users/avatar
// @access  Private
router.post('/avatar', auth, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'Imagem inválida' });
    }

    // Guardar referência do avatar anterior para eventual exclusão
    const oldUrl = (typeof req.user.foto_perfil === 'string' ? req.user.foto_perfil.trim() : null);

    const [meta, base64Data] = imageBase64.split(',');
    const mime = meta.match(/data:(image\/[^;]+);base64/);
    const extRaw = mime ? mime[1].split('/')[1] : 'png';
    const ext = (extRaw === 'jpg') ? 'jpeg' : extRaw;
    const allowed = ['png', 'jpeg', 'webp'];
    const finalExt = allowed.includes(ext) ? ext : 'png';

    const filename = `user-${req.user.id}-${Date.now()}.${finalExt}`;
    const avatarsDir = path.join(__dirname, '../../imagens/avatars');
    await fs.promises.mkdir(avatarsDir, { recursive: true });
    const filePath = path.join(avatarsDir, filename);
    await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'));

    const publicUrl = `/imagens/avatars/${filename}`;
    req.user.foto_perfil = publicUrl;
    await req.user.save();

    // Excluir arquivo anterior se era local em /imagens/avatars
    try {
      if (oldUrl && /^\/?imagens\/avatars\//.test(oldUrl)) {
        const normalized = oldUrl.replace(/^\//, '');
        const oldPath = path.join(__dirname, '../../', normalized);
        // Evitar deletar o mesmo arquivo recém-criado
        if (oldPath !== filePath) {
          await fs.promises.unlink(oldPath).catch(() => {});
        }
      }
    } catch (_) {}

    res.status(200).json({
      success: true,
      foto_perfil: publicUrl,
      user: {
        id: req.user.id,
        nome: req.user.nome,
        sobrenome: req.user.sobrenome,
        email: req.user.email,
        foto_perfil: publicUrl
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar avatar' });
  }
});

// @desc    Remover avatar do usuário e voltar ao padrão
// @route   DELETE /api/users/avatar
// @access  Private
router.delete('/avatar', auth, async (req, res) => {
  try {
    const oldUrl = (typeof req.user.foto_perfil === 'string' ? req.user.foto_perfil.trim() : null);

    // Excluir arquivo anterior apenas se for local em /imagens/avatars
    try {
      if (oldUrl && /^\/?imagens\/avatars\//.test(oldUrl)) {
        const normalized = oldUrl.replace(/^\//, '');
        const oldPath = path.join(__dirname, '../../', normalized);
        await fs.promises.unlink(oldPath).catch(() => {});
      }
    } catch (_) {}

    // Limpar referência no banco
    req.user.foto_perfil = null;
    await req.user.save();

    return res.status(200).json({ success: true, foto_perfil: null });
  } catch (error) {
    console.error('Erro ao remover avatar:', error);
    return res.status(500).json({ success: false, message: 'Erro ao remover avatar' });
  }
});

module.exports = router;

// === Histórico de Buscas do Usuário ===
// @desc    Registrar evento de busca/previsão
// @route   POST /api/users/search-history
// @access  Private
router.post('/search-history', auth, async (req, res) => {
  try {
    let { term, predictedProductId, eventType } = req.body || {}

    term = (typeof term === 'string' ? term.trim().slice(0, 255) : null)
    const tipo = (typeof eventType === 'string' && /^(search|preview)$/i.test(eventType))
      ? eventType.toLowerCase() : 'search'
    const produtoId = (predictedProductId != null && Number.isFinite(Number(predictedProductId)))
      ? Number(predictedProductId) : null

    if (!term && !produtoId) {
      return res.status(400).json({ success: false, message: 'Dados insuficientes para registrar histórico' })
    }

    const item = await SearchHistory.create({
      userId: req.user.id,
      term,
      predictedProductId: produtoId,
      eventType: tipo,
      createdAt: new Date()
    })

    res.status(201).json({ success: true, item })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Erro ao registrar histórico de busca' })
  }
})

// @desc    Obter histórico de buscas do usuário logado
// @route   GET /api/users/search-history
// @access  Private
router.get('/search-history', auth, async (req, res) => {
  try {
    const limitRaw = req.query.limit
    const limit = (limitRaw != null && Number.isFinite(Number(limitRaw))) ? Math.max(1, Math.min(50, Number(limitRaw))) : 10
    const itens = await SearchHistory.findAll({
      where: { userId: req.user.id },
      order: [['id', 'DESC']],
      limit
    })
    res.status(200).json({ success: true, items: itens })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Erro ao obter histórico de busca' })
  }
})
