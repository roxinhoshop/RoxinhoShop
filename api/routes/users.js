const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/db');
// saveBase64 utilities não são necessários para avatar em base64 no banco
// SearchHistory removido: funcionalidades de histórico de busca foram descontinuadas

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

// Middleware admin (somente Admin Roxinho Shop ID 1)
const requireAdmin = (req, res, next) => {
  const isAdminRole = req.user && String(req.user.role).toLowerCase() === 'admin';
  const isRoxinhoShop = req.user && Number(req.user.id) === 1;
  if (!req.user || !isAdminRole || !isRoxinhoShop) {
    return res.status(403).json({ success: false, message: 'Acesso restrito ao Admin Roxinho Shop (ID 1)' });
  }
  next();
};

// @desc    Listar todos os usuários (admin)
// @route   GET /api/users
// @access  Admin
router.get('/', auth, requireAdmin, async (_req, res) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT id, nome, sobrenome, email, role, foto_perfil
      FROM usuario
      ORDER BY id DESC
    `);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ success: false, message: 'Erro ao listar usuários' });
  }
});

// @desc    Atualizar usuário (admin)
// @route   PUT /api/users/:id
// @access  Admin
// rotas específicas primeiro; rotas paramétricas devem vir depois para evitar capturar caminhos como 
// "/profile" em "/:id"

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

    // Armazenar imagem diretamente em foto_perfil (base64)
    req.user.foto_perfil = imageBase64;
    await req.user.save();

    res.status(200).json({
      success: true,
      foto_perfil: req.user.foto_perfil,
      user: {
        id: req.user.id,
        nome: req.user.nome,
        sobrenome: req.user.sobrenome,
        email: req.user.email,
        foto_perfil: req.user.foto_perfil
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
    // Limpar referência no banco
    req.user.foto_perfil = null;
    await req.user.save();

    return res.status(200).json({ success: true, foto_perfil: null });
  } catch (error) {
    console.error('Erro ao remover avatar:', error);
    return res.status(500).json({ success: false, message: 'Erro ao remover avatar' });
  }
});

// @desc    Atualizar usuário (admin)
// @route   PUT /api/users/:id
// @access  Admin
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const { nome, sobrenome, email, role } = req.body || {};

    // Permitir atualização parcial
    const [userRows] = await sequelize.query(`SELECT * FROM usuario WHERE id = :id LIMIT 1`, { replacements: { id } });
    const u = Array.isArray(userRows) ? userRows[0] : userRows;
    if (!u) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

    const novo = {
      nome: typeof nome === 'string' ? nome.trim() : u.nome,
      sobrenome: typeof sobrenome === 'string' ? sobrenome.trim() : u.sobrenome,
      email: typeof email === 'string' ? email.trim().toLowerCase() : u.email,
      role: typeof role === 'string' ? role.trim().toLowerCase() : u.role
    };

    await sequelize.query(`
      UPDATE usuario
      SET nome = :nome, sobrenome = :sobrenome, email = :email, role = :role
      WHERE id = :id
    `, { replacements: { ...novo, id } });

    const [rows] = await sequelize.query(`SELECT id, nome, sobrenome, email, role, foto_perfil FROM usuario WHERE id = :id LIMIT 1`, { replacements: { id } });
    const updated = Array.isArray(rows) ? rows[0] : rows;
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ success: false, message: 'Erro ao atualizar usuário' });
  }
});

// @desc    Excluir usuário (admin)
// @route   DELETE /api/users/:id
// @access  Admin
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    await sequelize.query(`DELETE FROM usuario WHERE id = :id`, { replacements: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({ success: false, message: 'Erro ao excluir usuário' });
  }
});

module.exports = router;

// === Histórico de Buscas do Usuário ===
// @desc    Registrar evento de busca/previsão
// @route   POST /api/users/search-history
// @access  Private
router.post('/search-history', auth, async (_req, res) => {
  return res.status(410).json({ success: false, message: 'Funcionalidade removida' })
})

// @desc    Obter histórico de buscas do usuário logado
// @route   GET /api/users/search-history
// @access  Private
router.get('/search-history', auth, async (_req, res) => {
  return res.status(410).json({ success: false, message: 'Funcionalidade removida' })
})
