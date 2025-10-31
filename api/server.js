const express = require('express')
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')
const cors = require('cors')
require('dotenv').config()
const { connectDB, sequelize } = require('./config/db')
const { DataTypes } = require('sequelize')
require('./models/Product')

const app = express()

// CORS com credenciais habilitado (para suportar cookies cross-origin)
// Permite localhost/127.0.0.1 em qualquer porta no desenvolvimento
// e origens configuradas para produção.
const DEFAULT_ORIGINS = [
  'http://localhost:5526',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3010',
  'http://localhost:3011',
  'http://localhost:3012',
  'http://localhost:3017',
  'http://127.0.0.1:5526',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3010',
  'http://127.0.0.1:3011',
  'http://127.0.0.1:3012',
  'http://127.0.0.1:3017',
  'https://roxinhoshop.vercel.app'
]
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://roxinhoshop.vercel.app'
const ALLOWED_ORIGINS = Array.from(new Set([...DEFAULT_ORIGINS, FRONTEND_ORIGIN].filter(Boolean)))

const LOCAL_DEV_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\\d+)?$/

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    if (LOCAL_DEV_REGEX.test(origin)) return callback(null, true)
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    const alt = origin.replace('localhost', '127.0.0.1')
    if (ALLOWED_ORIGINS.includes(alt)) return callback(null, true)
    return callback(new Error(`CORS: Origin não permitido: ${origin}`))
  },
  credentials: true
}))

// Preflight OPTIONS
app.options('*', cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
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
// Rota de contato inline para garantir funcionamento (evita 404 inesperado)
app.post('/api/contact', async (req, res) => {
  try {
    let { nome, email, mensagem, telefone } = req.body || {}
    nome = typeof nome === 'string' ? nome.trim() : ''
    email = typeof email === 'string' ? email.trim() : ''
    mensagem = typeof mensagem === 'string' ? mensagem.trim() : ''
    telefone = typeof telefone === 'string' ? telefone.trim() : null

    if (!nome || !email || !mensagem) {
      return res.status(400).json({ ok: false, message: 'Campos obrigatórios: nome, email, mensagem.' })
    }

    const sql = `
      INSERT INTO contato_cliente (nome, email, mensagem, telefone, created_at)
      VALUES (:nome, :email, :mensagem, :telefone, CURRENT_TIMESTAMP)
    `
    await sequelize.query(sql, { replacements: { nome, email, mensagem, telefone } })

    return res.status(201).json({ ok: true, message: 'Contato registrado com sucesso.' })
  } catch (e) {
    return res.status(500).json({ ok: false, message: 'Erro interno ao registrar contato.', error: String(e && e.message || e) })
  }
})

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
      // Converter charset/collation da tabela principal para utf8mb4 (MySQL)
      await ensureUtf8mb4ProdutoCharset()
      // Garantir que tabela principal de produtos exista em dev (SQLite)
      await ensureProductTable()
      await dropObsoleteTables()
      await ensureProductMarcaColumn()
      await ensureProductCategoryColumns()
      await ensureLegacyEnglishRenames()
      await ensureProductManualFields()
  await ensureUserSobrenomeColumn()
  await ensureUserRoleColumn()
  await migrateUserAvatarColumnToFotoPerfil()
  await ensureVendorTable()
  await ensureVendorNomeVendedorColumn()
  await ensureProductVendorIdColumn()
  await ensureVendorStoresTable()
  await ensureContactClienteTable()
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

// Garante que a tabela "produto" exista (criação mínima para desenvolvimento SQLite)
const ensureProductTable = async () => {
  const qi = sequelize.getQueryInterface()
  try {
    await qi.describeTable('produto')
    // já existe
  } catch (e) {
    console.log('Criando tabela "produto"...')
    await qi.createTable('produto', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      titulo: { type: DataTypes.STRING(255), allowNull: false },
      precoMercadoLivre: { type: DataTypes.DECIMAL(10,2), allowNull: true },
      precoAmazon: { type: DataTypes.DECIMAL(10,2), allowNull: true },
      descricao: { type: DataTypes.TEXT },
      descricaoDetalhada: { type: DataTypes.TEXT },
      categoria: { type: DataTypes.STRING(100), allowNull: true },
      subcategoria: { type: DataTypes.STRING(100), allowNull: true },
      marca: { type: DataTypes.STRING(100), allowNull: true },
      avaliacao: { type: DataTypes.FLOAT, allowNull: true },
      imagens: { type: DataTypes.TEXT },
      link: { type: DataTypes.TEXT },
      linkMercadoLivre: { type: DataTypes.TEXT },
      linkAmazon: { type: DataTypes.TEXT },
      parcelamentoMercadoLivre: { type: DataTypes.TEXT },
      parcelamentoAmazon: { type: DataTypes.TEXT },
      mercadoLivreId: { type: DataTypes.STRING(100), allowNull: true },
      amazonAsin: { type: DataTypes.STRING(50), allowNull: true },
      data_coleta: { type: DataTypes.DATE, allowNull: true },
      ativo: { type: DataTypes.BOOLEAN, allowNull: true },
      destaque: { type: DataTypes.BOOLEAN, allowNull: true },
      vendedorId: { type: DataTypes.INTEGER, allowNull: true }
    })
    console.log('Tabela "produto" criada.')
  }
}

// Converte tabela produto para utf8mb4 quando usando MySQL (evita caracteres como "numÃ©rico")
const ensureUtf8mb4ProdutoCharset = async () => {
  try {
    if ((sequelize.getDialect && sequelize.getDialect()) !== 'mysql') return;
    await sequelize.query("ALTER TABLE produto CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    console.log('Tabela "produto" convertida para utf8mb4_unicode_ci.');
  } catch (e) {
    // Se falhar (sem permissão ou já convertido), apenas loga e segue
    console.warn('Falha ao converter tabela "produto" para utf8mb4:', e && e.message ? e.message : e);
  }
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
    // Reverter nomes em português para inglês quando presentes
    if (desc.id_mercado_livre && !desc.mercadoLivreId) {
      await qi.renameColumn('produto', 'id_mercado_livre', 'mercadoLivreId')
      console.log('Coluna "id_mercado_livre" renomeada para "mercadoLivreId" em "produto".')
    }
    if (desc.asin_amazon && !desc.amazonAsin) {
      await qi.renameColumn('produto', 'asin_amazon', 'amazonAsin')
      console.log('Coluna "asin_amazon" renomeada para "amazonAsin" em "produto".')
    }
    // Garantir que as colunas em inglês existam
    const desc2 = await qi.describeTable('produto')
    if (!desc2.mercadoLivreId) {
      await qi.addColumn('produto', 'mercadoLivreId', { type: DataTypes.STRING(100), allowNull: true })
      console.log('Coluna "mercadoLivreId" adicionada à tabela "produto".')
    }
    if (!desc2.amazonAsin) {
      await qi.addColumn('produto', 'amazonAsin', { type: DataTypes.STRING(50), allowNull: true })
      console.log('Coluna "amazonAsin" adicionada à tabela "produto".')
    }
  } catch (e) {
    console.log('Tabela "produto" não existe; pulando criação/renomeação de colunas manuais (mercadoLivreId, amazonAsin).')
  }
}

// Garante colunas de classificação de produto: categoria e subcategoria
const ensureProductCategoryColumns = async () => {
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('produto')
    if (!desc.categoria) {
      await qi.addColumn('produto', 'categoria', { type: DataTypes.STRING(100), allowNull: true })
      console.log('Coluna "categoria" adicionada à tabela "produto".')
    }
    if (!desc.subcategoria) {
      await qi.addColumn('produto', 'subcategoria', { type: DataTypes.STRING(100), allowNull: true })
      console.log('Coluna "subcategoria" adicionada à tabela "produto".')
    }
  } catch (e) {
    console.log('Tabela "produto" não existe; pulando criação de colunas "categoria" e "subcategoria".')
  }
}

// Garante coluna de associação do produto ao vendedor
const ensureProductVendorIdColumn = async () => {
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('produto')
    if (!desc.vendedorId) {
      await qi.addColumn('produto', 'vendedorId', { type: DataTypes.INTEGER, allowNull: true })
      console.log('Coluna "vendedorId" adicionada à tabela "produto".')
    }
  } catch (e) {
    console.log('Tabela "produto" não existe; pulando criação de coluna "vendedorId".')
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

// Migração: renomear avatar_base64 -> foto_perfil (LONGTEXT) e remover foto_perfil antiga
const migrateUserAvatarColumnToFotoPerfil = async () => {
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('usuario')

    const hasFotoPerfil = !!desc.foto_perfil
    const hasAvatarBase64 = !!desc.avatar_base64

    // Se existe uma coluna foto_perfil anterior, removê-la primeiro
    if (hasFotoPerfil && hasAvatarBase64) {
      try {
        await qi.removeColumn('usuario', 'foto_perfil')
        console.log('Coluna "foto_perfil" antiga removida da tabela "usuario".')
      } catch (e) {
        console.warn('Falha ao remover coluna "foto_perfil" antiga:', e.message)
      }
    }

    // Se existe avatar_base64, renomear para foto_perfil
    if (hasAvatarBase64) {
      try {
        await qi.renameColumn('usuario', 'avatar_base64', 'foto_perfil')
        console.log('Coluna "avatar_base64" renomeada para "foto_perfil" em "usuario".')
      } catch (e) {
        console.warn('renameColumn falhou, aplicando migração alternativa:', e.message)
        // Fallback: criar foto_perfil e copiar dados
        try {
          const d2 = await qi.describeTable('usuario')
          if (!d2.foto_perfil) {
            await qi.addColumn('usuario', 'foto_perfil', { type: DataTypes.TEXT('long'), allowNull: true })
            console.log('Coluna "foto_perfil" adicionada à tabela "usuario" (fallback).')
          }
          await sequelize.query('UPDATE usuario SET foto_perfil = avatar_base64 WHERE avatar_base64 IS NOT NULL')
          console.log('Dados de "avatar_base64" copiados para "foto_perfil".')
          await qi.removeColumn('usuario', 'avatar_base64')
          console.log('Coluna "avatar_base64" removida após migração.')
        } catch (err) {
          console.warn('Falha na migração alternativa de avatar -> foto_perfil:', err.message)
        }
      }
      // Garantir tipo LONGTEXT
      try {
        await qi.changeColumn('usuario', 'foto_perfil', { type: DataTypes.TEXT('long'), allowNull: true })
      } catch (_) {}
    } else {
      // Se avatar_base64 não existe, garantir que foto_perfil exista
      try {
        const d3 = await qi.describeTable('usuario')
        if (!d3.foto_perfil) {
          await qi.addColumn('usuario', 'foto_perfil', { type: DataTypes.TEXT('long'), allowNull: true })
          console.log('Coluna "foto_perfil" adicionada à tabela "usuario".')
        } else {
          await qi.changeColumn('usuario', 'foto_perfil', { type: DataTypes.TEXT('long'), allowNull: true })
        }
      } catch (e) {
        console.warn('Falha ao garantir coluna "foto_perfil":', e.message)
      }
    }
  } catch (e) {
    console.log('Tabela "usuario" não existe; pulando migração avatar_base64 -> foto_perfil.')
  }
}

// Garante que a tabela vendedor exista
const ensureVendorTable = async () => {
  const qi = sequelize.getQueryInterface()
  try {
    await qi.describeTable('vendedor')
    // Se não lançar erro, a tabela existe; garantir default "pendente"
    try {
      await qi.changeColumn('vendedor', 'status', { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pendente' })
      console.log('Coluna "status" em "vendedor" atualizada para default "pendente".')
    } catch (_) {
      // Pode falhar em alguns dialetos; silencioso
    }
  } catch (e) {
    console.log('Criando tabela "vendedor"...')
    await qi.createTable('vendedor', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      nomeVendedor: { type: DataTypes.STRING(255), allowNull: true },
      nomeLoja: { type: DataTypes.STRING(255), allowNull: false },
      documento: { type: DataTypes.STRING(50), allowNull: true },
      arquivoDocumento: { type: DataTypes.STRING(500), allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pendente' },
      criadoEm: { type: DataTypes.DATE, allowNull: true }
    })
    console.log('Tabela "vendedor" criada.')
  }
}

// Garante que a coluna nomeVendedor exista na tabela vendedor
const ensureVendorNomeVendedorColumn = async () => {
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('vendedor')
    if (!desc.nomeVendedor) {
      await qi.addColumn('vendedor', 'nomeVendedor', { type: DataTypes.STRING(255), allowNull: true })
      console.log('Coluna "nomeVendedor" adicionada à tabela "vendedor".')
    }
  } catch (e) {
    console.log('Tabela "vendedor" não existe; pulando criação de coluna "nomeVendedor".')
  }
}


// Garante que a tabela de cadastros pendentes (informações da loja) exista
const ensureVendorStoresTable = async () => {
  const qi = sequelize.getQueryInterface()
  try {
    await qi.describeTable('cadastros_pendentes')
    // Se não lançar erro, a tabela existe
  } catch (e) {
    console.log('Criando tabela "cadastros_pendentes"...')
    await qi.createTable('cadastros_pendentes', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      vendedorId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      nomeLoja: { type: DataTypes.STRING(255), allowNull: false },
      telefone: { type: DataTypes.STRING(30), allowNull: true },
      sobre: { type: DataTypes.TEXT, allowNull: true },
      criadoEm: { type: DataTypes.DATE, allowNull: true },
      atualizadoEm: { type: DataTypes.DATE, allowNull: true }
    })
    console.log('Tabela "cadastros_pendentes" criada.')
  }
}

// Garante que a tabela de contato do cliente exista
const ensureContactClienteTable = async () => {
  const qi = sequelize.getQueryInterface()
  try {
    await qi.describeTable('contato_cliente')
    // Já existe, não faz nada
  } catch (e) {
    console.log('Criando tabela "contato_cliente"...')
    await qi.createTable('contato_cliente', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nome: { type: DataTypes.STRING(255), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false },
      mensagem: { type: DataTypes.TEXT, allowNull: false },
      telefone: { type: DataTypes.STRING(50), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    })
    console.log('Tabela "contato_cliente" criada.')
  }
}

// Remoção de tabelas obsoletas (search_history/contact_message e variantes em português)
const dropObsoleteTables = async () => {
  const qi = sequelize.getQueryInterface()
  const exists = async (table) => qi.describeTable(table).then(() => true).catch(() => false)
  try {
    if (await exists('search_history')) {
      await qi.dropTable('search_history')
      console.log('Tabela "search_history" removida.')
    }
  } catch (e) {
    console.warn('Falha ao remover "search_history" (pode não existir):', e.message)
  }
  try {
    if (await exists('historico_buscas')) {
      await qi.dropTable('historico_buscas')
      console.log('Tabela "historico_buscas" removida.')
    }
  } catch (e) {
    console.warn('Falha ao remover "historico_buscas" (pode não existir):', e.message)
  }
  try {
    if (await exists('contact_message')) {
      await qi.dropTable('contact_message')
      console.log('Tabela "contact_message" removida.')
    }
  } catch (e) {
    console.warn('Falha ao remover "contact_message" (pode não existir):', e.message)
  }
  try {
    if (await exists('mensagem_contato')) {
      await qi.dropTable('mensagem_contato')
      console.log('Tabela "mensagem_contato" removida.')
    }
  } catch (e) {
    console.warn('Falha ao remover "mensagem_contato" (pode não existir):', e.message)
  }
  try {
    if (await exists('produtos_vendedor')) {
      await qi.dropTable('produtos_vendedor')
      console.log('Tabela "produtos_vendedor" removida.')
    }
  } catch (e) {
    console.warn('Falha ao remover "produtos_vendedor" (pode não existir):', e.message)
  }
}

// Renomeações inversas: reverter nomes em português para inglês
const ensureLegacyEnglishRenames = async () => {
  const qi = sequelize.getQueryInterface()
  // vendedor: usuarioId -> userId
  try {
    const vendDesc = await qi.describeTable('vendedor')
    if (vendDesc.usuarioId && !vendDesc.userId) {
      await qi.renameColumn('vendedor', 'usuarioId', 'userId')
      console.log('Coluna "usuarioId" renomeada para "userId" na tabela "vendedor".')
    }
  } catch (e) {
    // tabela não existe ainda
  }

  // produtos_vendedor: asin_amazon -> amazonAsin; id_mercado_livre -> mercadoLivreId
  try {
    const pvDesc = await qi.describeTable('produtos_vendedor')
    if (pvDesc.asin_amazon && !pvDesc.amazonAsin) {
      await qi.renameColumn('produtos_vendedor', 'asin_amazon', 'amazonAsin')
      console.log('Coluna "asin_amazon" renomeada para "amazonAsin" em "produtos_vendedor".')
    }
    if (pvDesc.id_mercado_livre && !pvDesc.mercadoLivreId) {
      await qi.renameColumn('produtos_vendedor', 'id_mercado_livre', 'mercadoLivreId')
      console.log('Coluna "id_mercado_livre" renomeada para "mercadoLivreId" em "produtos_vendedor".')
    }
  } catch (e) {
    // tabela não existe ainda
  }

  // historico_buscas -> search_history com colunas em inglês
  try {
    const existsHb = await qi.describeTable('historico_buscas').then(() => true).catch(() => false)
    const existsSh = await qi.describeTable('search_history').then(() => true).catch(() => false)
    if (existsHb && !existsSh) {
      await qi.renameTable('historico_buscas', 'search_history')
      console.log('Tabela "historico_buscas" renomeada para "search_history".')
    }
    const shDesc = await qi.describeTable('search_history')
    if (shDesc.usuarioId && !shDesc.userId) {
      await qi.renameColumn('search_history', 'usuarioId', 'userId')
      console.log('Coluna "usuarioId" renomeada para "userId" em "search_history".')
    }
    if (shDesc.termo && !shDesc.term) {
      await qi.renameColumn('search_history', 'termo', 'term')
      console.log('Coluna "termo" renomeada para "term" em "search_history".')
    }
    if (shDesc.produtoPrevistoId && !shDesc.predictedProductId) {
      await qi.renameColumn('search_history', 'produtoPrevistoId', 'predictedProductId')
      console.log('Coluna "produtoPrevistoId" renomeada para "predictedProductId" em "search_history".')
    }
    if (shDesc.tipo_evento && !shDesc.eventType) {
      await qi.renameColumn('search_history', 'tipo_evento', 'eventType')
      console.log('Coluna "tipo_evento" renomeada para "eventType" em "search_history".')
    }
    if (shDesc.criadoEm && !shDesc.created_at) {
      await qi.renameColumn('search_history', 'criadoEm', 'created_at')
      console.log('Coluna "criadoEm" renomeada para "created_at" em "search_history".')
    }
  } catch (e) {
    // tabelas não existem ainda
  }

  // mensagem_contato -> contact_message com colunas em inglês
  try {
    const existsMc = await qi.describeTable('mensagem_contato').then(() => true).catch(() => false)
    const existsCm = await qi.describeTable('contact_message').then(() => true).catch(() => false)
    if (existsMc && !existsCm) {
      await qi.renameTable('mensagem_contato', 'contact_message')
      console.log('Tabela "mensagem_contato" renomeada para "contact_message".')
    }
    const cmDesc = await qi.describeTable('contact_message')
    if (cmDesc.usuarioId && !cmDesc.userId) {
      await qi.renameColumn('contact_message', 'usuarioId', 'userId')
      console.log('Coluna "usuarioId" renomeada para "userId" em "contact_message".')
    }
    if (cmDesc.criadoEm && !cmDesc.created_at) {
      await qi.renameColumn('contact_message', 'criadoEm', 'created_at')
      console.log('Coluna "criadoEm" renomeada para "created_at" em "contact_message".')
    }
  } catch (e) {
    // tabelas não existem ainda
  }
}
// 301 permanente: *.html -> caminho sem extensão (compatibilidade quando UI é servida aqui)
// Removido roteamento de páginas HTML do frontend

// Exporta app para Vercel (@vercel/node)
module.exports = app
// Servir imagens salvas localmente (avatares, documentos, reviews)
// Disponível em desenvolvimento e em ambientes onde o filesystem é persistente
app.use('/imagens', express.static(path.join(__dirname, '..', 'imagens')))
