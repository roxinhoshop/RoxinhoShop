const express = require('express')
const fs = require('fs')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
require('dotenv').config()
const { connectDB, sequelize } = require('./config/db')
const { DataTypes } = require('sequelize')
require('./models/Product')
require('./models/SearchHistory')
require('./models/ContactMessage')

const app = express()

// Configura CORS com credenciais para permitir cookies do frontend
// Permite múltiplos origins locais comuns em desenvolvimento e o origin configurado via env
const DEFAULT_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:3010',
  'http://localhost:3011',
  'http://localhost:3012',
  'http://localhost:3017',
  'http://localhost:38095',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3010',
  'http://127.0.0.1:3011',
  'http://127.0.0.1:3012',
  'http://127.0.0.1:3017',
  'http://127.0.0.1:38095'
]
// Origem do frontend em produção (Vercel)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://roxinhoshop.vercel.app'
const ALLOWED_ORIGINS = Array.from(new Set([
  ...DEFAULT_ORIGINS,
  FRONTEND_ORIGIN
].filter(Boolean)))

app.use(cors({
  origin: function (origin, callback) {
    // Permite requests sem origin (ex.: curl)
    if (!origin) return callback(null, true)
    // Permite qualquer localhost/127.0.0.1 com qualquer porta em desenvolvimento
    const LOCAL_DEV_REGEX = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
    if (LOCAL_DEV_REGEX.test(origin)) return callback(null, true)
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    // Permite variações localhost/127.0.0.1
    const alt = origin.replace('localhost', '127.0.0.1')
    if (ALLOWED_ORIGINS.includes(alt)) return callback(null, true)
    return callback(new Error(`CORS: Origin não permitido: ${origin}`))
  },
  credentials: true
}))

// Responder preflight (OPTIONS) com os mesmos cabeçalhos CORS
app.options('*', cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    const LOCAL_DEV_REGEX = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
    if (LOCAL_DEV_REGEX.test(origin)) return callback(null, true)
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    const alt = origin.replace('localhost', '127.0.0.1')
    if (ALLOWED_ORIGINS.includes(alt)) return callback(null, true)
    return callback(new Error(`CORS: Origin não permitido: ${origin}`))
  },
  credentials: true
}))

// Aumenta o limite do corpo para suportar imagens base64 de avatar (~6-8MB)
app.use(express.json({ limit: '12mb' }))
app.use(express.urlencoded({ extended: true, limit: '12mb' }))
app.use(morgan('dev'))

// Parsing simples de cookies (evita dependência externa)
app.use((req, res, next) => {
  req.parsedCookies = {}
  const cookieHeader = req.headers.cookie
  if (cookieHeader) {
    cookieHeader.split(';').forEach(pair => {
      const [name, ...rest] = pair.split('=')
      if (name) {
        req.parsedCookies[name.trim()] = decodeURIComponent(rest.join('='))
      }
    })
  }
  next()
})

// Produção: backend não serve assets estáticos do frontend

// Rotas
app.use('/api/products', require('./routes/products'))
app.use('/api/auth', require('./routes/auth'))
app.use('/api/reviews', require('./routes/reviews'))
app.use('/api/users', require('./routes/users'))
app.use('/api/price-history', require('./routes/price-history'))
app.use('/api/vendors', require('./routes/vendors'))
app.use('/api/contact', require('./routes/contact'))

// Raiz e saúde do serviço (JSON)
app.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'RoxinhoShop Backend',
    env: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  })
})

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, status: 'healthy' })
})

// Rota de saúde também sob /api para facilitar testes via proxy do frontend
app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, status: 'healthy' })
})

// 404 JSON para rotas /api não mapeadas
app.use('/api', (req, res) => {
  return res.status(404).json({
    ok: false,
    error: 'not_found',
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`
  })
})

// Middleware global de tratamento de erros com resposta JSON consistente
// Garante formato padronizado para quaisquer erros em rotas da API
// Inclui stack apenas em desenvolvimento
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = Number(err?.status || err?.statusCode || 500)
  const payload = {
    ok: false,
    error: String(err?.code || err?.name || 'internal_error'),
    message: String(err?.message || 'Erro interno do servidor')
  }
  if (process.env.NODE_ENV !== 'production' && err?.stack) {
    payload.stack = String(err.stack)
  }
  if (String(req.originalUrl || '').startsWith('/api/')) {
    return res.status(status).json(payload)
  }
  // Para rotas não API, retorna JSON também para facilitar debugar
  return res.status(status).json(payload)
})

// 404 JSON para rotas não-API não mapeadas
app.use((req, res, next) => {
  if (String(req.originalUrl || '').startsWith('/api/')) return next()
  return res.status(404).json({
    ok: false,
    error: 'not_found',
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`
  })
})
// Inicialização única para ambiente serverless/local
let readyPromise = null
const initOnce = () => {
  if (!readyPromise) {
    readyPromise = (async () => {
      await connectDB()
      await ensureProductMarcaColumn()
      await ensureProductManualFields()
      await ensureUserSobrenomeColumn()
      await ensureUserRoleColumn()
      await ensureUserAvatarColumn()
      await ensureVendorTable()
      await ensureVendorProductsTable()
      await ensureSearchHistoryTable()
      await ensureContactMessageTable()
    })()
  }
  return readyPromise
}

// Garante init antes de rotas da API (serverless)
// Inicializa banco e migrações apenas para rotas da API
app.use('/api', async (req, res, next) => {
  try {
    await initOnce()
  } catch (err) {
    return next(err)
  }
  next()
})

// No Vercel, exportamos o handler; em dev local, iniciamos servidor
const isVercel = !!process.env.VERCEL
if (!isVercel) {
  const PORT = process.env.PORT || 3000
  initOnce().then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`)
      console.log(`CORS habilitado para origens: ${ALLOWED_ORIGINS.join(', ')} (credenciais: true)`)      
    })
  }).catch(err => {
    console.error('Falha ao iniciar servidor:', err)
    process.exit(1)
  })
}

// Garante que a coluna "marca" exista na tabela produto
const ensureProductMarcaColumn = async () => {
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('produto')
    if (!desc.marca) {
      await qi.addColumn('produto', 'marca', { type: DataTypes.STRING(100), allowNull: true })
      console.log('Coluna "marca" adicionada à tabela "produto".')
    }
  } catch (e) {
    console.log('Tabela "produto" não existe; pulando criação de coluna "marca".')
  }
}

// Garante colunas para IDs manuais (Mercado Livre e Amazon)
const ensureProductManualFields = async () => {
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('produto')
    if (!desc.mercadoLivreId) {
      await qi.addColumn('produto', 'mercadoLivreId', { type: DataTypes.STRING(100), allowNull: true })
      console.log('Coluna "mercadoLivreId" adicionada à tabela "produto".')
    }
    if (!desc.amazonAsin) {
      await qi.addColumn('produto', 'amazonAsin', { type: DataTypes.STRING(50), allowNull: true })
      console.log('Coluna "amazonAsin" adicionada à tabela "produto".')
    }
  } catch (e) {
    console.log('Tabela "produto" não existe; pulando criação de colunas manuais (mercadoLivreId, amazonAsin).')
  }
}

// Garante que a coluna "sobrenome" exista na tabela usuario
const ensureUserSobrenomeColumn = async () => {
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('usuario')
    if (!desc.sobrenome) {
      await qi.addColumn('usuario', 'sobrenome', { type: DataTypes.STRING, allowNull: true })
      console.log('Coluna "sobrenome" adicionada à tabela "usuario".')
    }
  } catch (e) {
    console.log('Tabela "usuario" não existe; pulando criação de coluna "sobrenome".')
  }
}

// Garante que a coluna "role" exista na tabela usuario
const ensureUserRoleColumn = async () => {
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('usuario')
    if (!desc.role) {
      await qi.addColumn('usuario', 'role', { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'cliente' })
      console.log('Coluna "role" adicionada à tabela "usuario".')
    }
  } catch (e) {
    console.log('Tabela "usuario" não existe; pulando criação de coluna "role".')
  }
}

// Garante que a coluna "avatar_base64" exista na tabela usuario (LONGTEXT)
const ensureUserAvatarColumn = async () => {
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('usuario')
    if (!desc.avatar_base64) {
      await qi.addColumn('usuario', 'avatar_base64', { type: DataTypes.TEXT('long'), allowNull: true })
      console.log('Coluna "avatar_base64" adicionada à tabela "usuario".')
    }
  } catch (e) {
    console.log('Tabela "usuario" não existe; pulando criação de coluna "avatar_base64".')
  }
}

// Garante que a tabela vendedor exista
const ensureVendorTable = async () => {
  const qi = sequelize.getQueryInterface()
  try {
    await qi.describeTable('vendedor')
    // Se não lançar erro, a tabela existe
  } catch (e) {
    console.log('Criando tabela "vendedor"...')
    await qi.createTable('vendedor', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      nomeLoja: { type: DataTypes.STRING(255), allowNull: false },
      documento: { type: DataTypes.STRING(50), allowNull: true },
      arquivoDocumento: { type: DataTypes.STRING(500), allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ativo' },
      criadoEm: { type: DataTypes.DATE, allowNull: true }
    })
    console.log('Tabela "vendedor" criada.')
  }
}

// Garante que a tabela de produtos importados por vendedores exista
const ensureVendorProductsTable = async () => {
  const qi = sequelize.getQueryInterface()
  try {
    await qi.describeTable('produtos_vendedor')
    // Se não lançar erro, a tabela existe
  } catch (e) {
    console.log('Criando tabela "produtos_vendedor"...')
    await qi.createTable('produtos_vendedor', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      vendedorId: { type: DataTypes.INTEGER, allowNull: false },
      produtoId: { type: DataTypes.INTEGER, allowNull: false },
      origem: { type: DataTypes.STRING(30), allowNull: true },
      link: { type: DataTypes.TEXT, allowNull: true },
      amazonAsin: { type: DataTypes.STRING(50), allowNull: true },
      mercadoLivreId: { type: DataTypes.STRING(100), allowNull: true },
      importadoEm: { type: DataTypes.DATE, allowNull: true },
      observacoes: { type: DataTypes.TEXT, allowNull: true }
    })
    console.log('Tabela "produtos_vendedor" criada.')
  }
}

// Garante que a tabela de histórico de buscas exista
const ensureSearchHistoryTable = async () => {
  const qi = sequelize.getQueryInterface()
  try {
    await qi.describeTable('search_history')
  } catch (e) {
    console.log('Criando tabela "search_history"...')
    await qi.createTable('search_history', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      term: { type: DataTypes.STRING(255), allowNull: true },
      predictedProductId: { type: DataTypes.INTEGER, allowNull: true },
      eventType: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'search' },
      created_at: { type: DataTypes.DATE, allowNull: true }
    })
    console.log('Tabela "search_history" criada.')
  }
}

// Garante que a tabela de mensagens de contato exista
const ensureContactMessageTable = async () => {
  const qi = sequelize.getQueryInterface()
  try {
    await qi.describeTable('contact_message')
  } catch (e) {
    console.log('Criando tabela "contact_message"...')
    await qi.createTable('contact_message', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: DataTypes.STRING(150), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false },
      mensagem: { type: DataTypes.TEXT, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true }
    })
    console.log('Tabela "contact_message" criada.')
  }
}
// 301 permanente: *.html -> caminho sem extensão (compatibilidade quando UI é servida aqui)
// Removido roteamento de páginas HTML do frontend

// Exporta app para Vercel (@vercel/node)
module.exports = app
