const fs = require('fs')
const path = require('path')

function parseBase64(base64Str) {
  if (!base64Str || typeof base64Str !== 'string') return { data: null, ext: null }
  const match = base64Str.match(/^data:(.+);base64,(.*)$/)
  if (match) {
    const mime = match[1] || 'application/octet-stream'
    const ext = (mime.split('/')[1] || 'bin').toLowerCase()
    return { data: match[2], ext }
  }
  return { data: base64Str, ext: 'bin' }
}

async function saveBase64Image(base64Str, subdir = 'uploads', prefix = 'file') {
  try {
    const { data, ext } = parseBase64(base64Str)
    if (!data) return null
    const buffer = Buffer.from(data, 'base64')
    const dir = path.join(__dirname, '../../imagens', subdir)
    await fs.promises.mkdir(dir, { recursive: true })
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const fullPath = path.join(dir, filename)
    await fs.promises.writeFile(fullPath, buffer)
    return `/imagens/${subdir}/${filename}`
  } catch (_) {
    return null
  }
}

async function removeLocalImage(urlPath) {
  try {
    if (!urlPath || typeof urlPath !== 'string') return
    const isLocal = /^\/?imagens\//.test(urlPath)
    if (!isLocal) return
    const normalized = urlPath.replace(/^\//, '')
    const target = path.join(__dirname, '../../', normalized)
    await fs.promises.unlink(target).catch(() => {})
  } catch (_) {
    // silencioso
  }
}

module.exports = { saveBase64Image, removeLocalImage }

