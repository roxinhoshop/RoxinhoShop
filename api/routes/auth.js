const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Opções padrão de cookie para o token
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
};

// @desc    Registrar usuário
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    let { nome, sobrenome, email, senha, foto_perfil, role } = req.body || {};

    // Normalização básica
    nome = (typeof nome === 'string' ? nome.trim() : '');
    sobrenome = (typeof sobrenome === 'string' ? sobrenome.trim() : '');
    email = (typeof email === 'string' ? email.trim().toLowerCase() : '');
    senha = (typeof senha === 'string' ? senha : '');

    // Campos obrigatórios
    if (!nome || !email || !senha) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Nome, email e senha são obrigatórios.'
      });
    }

    // Validação de nome
    if (nome.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_NAME',
        message: 'Nome deve ter pelo menos 2 caracteres.'
      });
    }

    // Validação de formato de email
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
    if (!emailValido) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL_FORMAT',
        message: 'Formato de email inválido. Por favor, insira um email válido.'
      });
    }

    // Validação de senha
    if (senha.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: 'Senha deve ter pelo menos 8 caracteres.'
      });
    }

    // Verificar se o usuário já existe
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_ALREADY_REGISTERED',
        message: 'Email já cadastrado.'
      });
    }

    // Normaliza role básica; só aceita valores conhecidos
    const ROLE_PADRAO = 'cliente';
    const roleNormalizado = (typeof role === 'string' && /^(cliente|vendedor|admin)$/i.test(role))
      ? role.toLowerCase()
      : ROLE_PADRAO;

    // Criar usuário (hash de senha no model)
    const user = await User.create({
      nome,
      sobrenome,
      email,
      senha,
      foto_perfil,
      role: roleNormalizado
    });

    // Importante: não autentica automaticamente após cadastro (fluxo exige login)
    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso. Faça login para continuar.',
      user: {
        id: user.id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        email: user.email,
        foto_perfil: user.foto_perfil,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro ao registrar usuário' });
  }
});

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body || {};

    // Campos obrigatórios
    if (!email || !senha) {
      return res.status(400).json({ success: false, message: 'Por favor, informe email e senha' });
    }

    // Validação de formato de email (frontend + backend)
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
    if (!emailValido) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL_FORMAT',
        message: 'Formato de email inválido. Por favor, insira um email válido.'
      });
    }

    // Verificar existência do usuário
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'EMAIL_NOT_REGISTERED',
        message: 'Email não cadastrado. Verifique o email ou cadastre-se.'
      });
    }

    // Verificar senha
    const isMatch = await user.matchPassword(senha);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'INCORRECT_PASSWORD',
        message: 'Senha incorreta. Tente novamente ou recupere sua senha.'
      });
    }

    const token = user.getSignedJwtToken();

    // Define cookie httpOnly
    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        email: user.email,
        foto_perfil: user.foto_perfil,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro ao fazer login' });
  }
});

// @desc    Logout de usuário
// @route   POST /api/auth/logout
// @access  Public (limpa cookie)
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.status(200).json({ success: true, message: 'Logout realizado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao fazer logout' });
  }
});

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // Verificar token via Bearer ou Cookie
    const bearer = req.headers.authorization?.split(' ')[1];
    const token = bearer || req.parsedCookies?.token;
    if (!token) {
      return res.status(200).json({ success: false, message: 'Não autenticado', user: null });
    }

    // Verifica com segredo principal e fallback de desenvolvimento
    const secrets = [process.env.JWT_SECRET, 'devsecret'].filter(Boolean);
    let decoded = null;
    for (const s of secrets) {
      try {
        decoded = jwt.verify(token, s);
        break;
      } catch (e) {
        // tenta próximo segredo
      }
    }
    if (!decoded) {
      return res.status(200).json({ success: false, message: 'Não autenticado', user: null });
    }
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        email: user.email,
        foto_perfil: user.foto_perfil,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({ success: false, message: 'Não autenticado', user: null });
  }
});

module.exports = router;
