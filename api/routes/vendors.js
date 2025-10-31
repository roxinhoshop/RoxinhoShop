const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
const { sequelize } = require('../config/db')
const User = require('../models/User')

// Middleware de autenticação (reaproveita lógica de users.js)
const auth = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.split(' ')[1]
    const token = bearer || req.parsedCookies?.token
    if (!token) {
      return res.status(401).json({ success: false, message: 'Não autorizado' })
    }
    const secrets = [process.env.JWT_SECRET, 'devsecret'].filter(Boolean)
    let decoded = null
    for (const s of secrets) {
      try { decoded = jwt.verify(token, s); break } catch (e) {}
    }
    if (!decoded) return res.status(401).json({ success: false, message: 'Não autorizado' })
    const user = await User.findByPk(decoded.id)
    if (!user) return res.status(401).json({ success: false, message: 'Usuário não encontrado' })
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Não autorizado' })
  }
}

const requireAdmin = (req, res, next) => {
  if (!req.user || String(req.user.role).toLowerCase() !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso negado' })
  }
  next()
}

// Util: salva arquivo base64 em /imagens/vendors e retorna caminho relativo
async function salvarArquivoBase64(base64Str, prefix = 'doc') {
  try {
    if (!base64Str || typeof base64Str !== 'string') return null
    const match = base64Str.match(/^data:(.+);base64,(.*)$/)
    const data = match ? match[2] : base64Str
    const ext = match ? (match[1].split('/')[1] || 'bin') : 'bin'
    const buffer = Buffer.from(data, 'base64')
    const dir = path.join(__dirname, '../../imagens/vendors')
    fs.mkdirSync(dir, { recursive: true })
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const fullPath = path.join(dir, filename)
    fs.writeFileSync(fullPath, buffer)
    return `/imagens/vendors/${filename}`
  } catch (_) {
    return null
  }
}

// POST /api/vendors/register - cria usuário com role vendedor e registro de vendedor
router.post('/register', async (req, res) => {
  try {
    let { nome, sobrenome, email, senha, foto_perfil, nomeLoja, documento, arquivoBase64 } = req.body || {}

    nome = (typeof nome === 'string' ? nome.trim() : '')
    sobrenome = (typeof sobrenome === 'string' ? sobrenome.trim() : '')
    email = (typeof email === 'string' ? email.trim().toLowerCase() : '')
    senha = (typeof senha === 'string' ? senha : '')
    nomeLoja = (typeof nomeLoja === 'string' ? nomeLoja.trim() : '')
    documento = (typeof documento === 'string' ? documento.trim() : '')

    if (!nome || !email || !senha || !nomeLoja) {
      return res.status(400).json({ success: false, message: 'Nome, email, senha e nome da loja são obrigatórios.' })
    }

    const jaExiste = await User.findOne({ where: { email } })
    if (jaExiste) {
      return res.status(400).json({ success: false, message: 'Email já cadastrado.' })
    }

    const user = await User.create({ nome, sobrenome, email, senha, foto_perfil: foto_perfil || null, role: 'vendedor' })

    let arquivoDocumento = null
    if (arquivoBase64) {
      arquivoDocumento = await salvarArquivoBase64(arquivoBase64, 'vendedor')
    }

    // Insere registro na tabela vendedor
    await sequelize.query(
      `INSERT INTO vendedor (userId, nomeLoja, documento, arquivoDocumento, status, criadoEm)
       VALUES (:userId, :nomeLoja, :documento, :arquivoDocumento, :status, :criadoEm)`,
      {
        replacements: {
          userId: user.id,
          nomeLoja,
          documento: documento || null,
          arquivoDocumento: arquivoDocumento || null,
          status: 'ativo',
          criadoEm: new Date()
        }
      }
    )

    const [rows] = await sequelize.query(
      `SELECT * FROM vendedor WHERE userId = :uid LIMIT 1`,
      { replacements: { uid: user.id } }
    )
    const vend = Array.isArray(rows) ? rows[0] : rows

    return res.status(201).json({
      success: true,
      user: { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, foto_perfil: user.foto_perfil, role: user.role },
      vendor: vend || null
    })
  } catch (err) {
    console.error('Erro ao registrar vendedor:', err)
    return res.status(500).json({ success: false, message: 'Erro ao registrar vendedor' })
  }
})

// GET /api/vendors - lista vendedores (admin)
router.get('/', auth, requireAdmin, async (_req, res) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT v.*, u.nome, u.sobrenome, u.email, u.foto_perfil, u.role
      FROM vendedor v
      INNER JOIN usuario u ON u.id = v.userId
      ORDER BY v.id DESC
    `)
    return res.json({ success: true, data: rows })
  } catch (err) {
    console.error('Erro ao listar vendedores:', err)
    return res.status(500).json({ success: false, message: 'Erro ao listar vendedores' })
  }
})

// PUT /api/vendors/:id - editar vendedor (admin)
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' })
    }

    // Busca o registro atual
    const [vendRows] = await sequelize.query(`SELECT * FROM vendedor WHERE id = :id LIMIT 1`, { replacements: { id } })
    const vend = Array.isArray(vendRows) ? vendRows[0] : vendRows
    if (!vend) return res.status(404).json({ success: false, message: 'Vendedor não encontrado' })

    let { status, documento, nomeLoja, arquivoBase64, nome, sobrenome, removeArquivoDocumento } = req.body || {}

    status = typeof status === 'string' ? status.trim() : undefined
    documento = typeof documento === 'string' ? documento.trim() : undefined
    nomeLoja = typeof nomeLoja === 'string' ? nomeLoja.trim() : undefined
    removeArquivoDocumento = Boolean(removeArquivoDocumento)

    let arquivoDocumento = null
    if (arquivoBase64) {
      arquivoDocumento = await salvarArquivoBase64(arquivoBase64, 'vendedor')
    }

    // Se um novo arquivo foi enviado ou se foi sinalizado para remover, apaga o arquivo anterior do vendedor
    try {
      const prev = typeof vend.arquivoDocumento === 'string' ? vend.arquivoDocumento.trim() : null
      const shouldDeletePrev = removeArquivoDocumento || Boolean(arquivoDocumento)
      if (shouldDeletePrev && prev && /^\/?imagens\/vendors\//.test(prev)) {
        const normalized = prev.replace(/^\//, '')
        const oldPath = path.join(__dirname, '../../', normalized)
        await fs.promises.unlink(oldPath).catch(() => {})
      }
    } catch (_) {}

    // Calcula novos valores preservando os existentes quando não enviados
    const novo = {
      status: status || vend.status,
      documento: documento !== undefined ? documento || null : vend.documento,
      nomeLoja: nomeLoja || vend.nomeLoja,
      arquivoDocumento: removeArquivoDocumento ? null : (arquivoDocumento || vend.arquivoDocumento)
    }

    await sequelize.query(`
      UPDATE vendedor
      SET status = :status,
          documento = :documento,
          nomeLoja = :nomeLoja,
          arquivoDocumento = :arquivoDocumento
      WHERE id = :id
    `, { replacements: { ...novo, id } })

    // Atualiza dados do usuário se enviados
    if (typeof nome === 'string' || typeof sobrenome === 'string') {
      const nomeVal = typeof nome === 'string' ? nome.trim() : undefined
      const sobrenomeVal = typeof sobrenome === 'string' ? sobrenome.trim() : undefined
      const [userRows] = await sequelize.query(`SELECT * FROM usuario WHERE id = :uid LIMIT 1`, { replacements: { uid: vend.userId } })
      const u = Array.isArray(userRows) ? userRows[0] : userRows
      if (u) {
        await sequelize.query(`
          UPDATE usuario
          SET nome = :nome, sobrenome = :sobrenome
          WHERE id = :uid
        `, { replacements: { nome: nomeVal !== undefined ? nomeVal : u.nome, sobrenome: sobrenomeVal !== undefined ? sobrenomeVal : u.sobrenome, uid: vend.userId } })
      }
    }

    const [rows] = await sequelize.query(`
      SELECT v.*, u.nome, u.sobrenome, u.email, u.foto_perfil, u.role
      FROM vendedor v
      INNER JOIN usuario u ON u.id = v.userId
      WHERE v.id = :id
      LIMIT 1
    `, { replacements: { id } })
    const updated = Array.isArray(rows) ? rows[0] : rows
    return res.json({ success: true, data: updated })
  } catch (err) {
    console.error('Erro ao editar vendedor:', err)
    return res.status(500).json({ success: false, message: 'Erro ao editar vendedor' })
  }
})

// DELETE /api/vendors/:id - excluir vendedor (admin)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' })
    }
    const hard = String(req.query.hard || '').toLowerCase() === 'true'

    const [vendRows] = await sequelize.query(`SELECT * FROM vendedor WHERE id = :id LIMIT 1`, { replacements: { id } })
    const vend = Array.isArray(vendRows) ? vendRows[0] : vendRows
    if (!vend) return res.status(404).json({ success: false, message: 'Vendedor não encontrado' })

    // Remove o registro de vendedor
    await sequelize.query(`DELETE FROM vendedor WHERE id = :id`, { replacements: { id } })

    if (hard) {
      // Deleta o usuário vinculado
      await sequelize.query(`DELETE FROM usuario WHERE id = :uid`, { replacements: { uid: vend.userId } })
    } else {
      // Mantém usuário e rebaixa a role para 'cliente'
      await sequelize.query(`UPDATE usuario SET role = 'cliente' WHERE id = :uid`, { replacements: { uid: vend.userId } })
    }

    return res.json({ success: true })
  } catch (err) {
    console.error('Erro ao excluir vendedor:', err)
    return res.status(500).json({ success: false, message: 'Erro ao excluir vendedor' })
  }
})

module.exports = router
