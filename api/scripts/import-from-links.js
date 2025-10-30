// Importador genérico: coleta dados de Amazon e Mercado Livre e persiste no banco
// Uso:
//   node api/scripts/import-from-links.js --amazon "<URL>" --ml "<URL>" --titulo "<opcional>"

require('dotenv').config();
const fetch = require('node-fetch');
const { withRetry } = require('../utils/retry');
const AbortControllerRef = typeof AbortController !== 'undefined' ? AbortController : null;
const { connectDB, sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');
const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');

function getArg(name) {
  const idx = process.argv.findIndex(a => a === `--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
}

function getFlag(name) {
  return process.argv.includes(`--${name}`);
}

function normalizePriceToNumber(price) {
  if (price == null) return null;
  if (typeof price === 'number') {
    if (price >= 10000) return Math.round(price) / 100;
    return price;
  }
  const s = String(price).replace(/[^0-9.,]/g, '').trim();
  if (!s) return null;
  const clean = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(clean);
  if (Number.isFinite(n) && n >= 10000 && clean.indexOf('.') === -1) return Math.round(n) / 100;
  return Number.isFinite(n) ? n : null;
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch (_) {
      const sanitized = raw.replace(/\s*\/\*[^*]*\*\/\s*/g, '');
      try {
        const parsed2 = JSON.parse(sanitized);
        if (Array.isArray(parsed2)) blocks.push(...parsed2);
        else blocks.push(parsed2);
      } catch { /* ignore */ }
    }
  }
  return blocks;
}

function findProductFromJsonLd(blocks) {
  for (const b of blocks) {
    if (!b) continue;
    const type = b['@type'] || b['@graph']?.[0]?.['@type'];
    const isProduct = (typeof type === 'string' && type.toLowerCase().includes('product'))
      || (Array.isArray(type) && type.some(t => String(t).toLowerCase().includes('product')));
    if (isProduct) return b;
    if (Array.isArray(b['@graph'])) {
      const p = b['@graph'].find(n => {
        const t = n['@type'];
        return (typeof t === 'string' && t.toLowerCase().includes('product'))
          || (Array.isArray(t) && t.some(x => String(x).toLowerCase().includes('product')));
      });
      if (p) return p;
    }
  }
  return null;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  // Se AbortController existir, usamos cancelamento real; caso contrário, fazemos race com timeout
  if (AbortControllerRef) {
    const controller = new AbortControllerRef();
    const id = setTimeout(() => {
      try { controller.abort(); } catch (_) {}
    }, timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      return resp;
    } finally {
      clearTimeout(id);
    }
  } else {
    return await Promise.race([
      fetch(url, { ...options }),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs))
    ]);
  }
}

async function scrapeMercadoLivre(url) {
  const resp = await withRetry(() => fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  }, 20000), { retries: 2, delayMs: 800 });
  const html = await resp.text();
  const blocks = extractJsonLdBlocks(html);
  const product = findProductFromJsonLd(blocks);

  let price = null;
  let images = [];
  let title = null;
  let description = null;
  let installments = [];
  let mlbId = null;
  let brand = null;

  if (product) {
    const offers = product.offers || (Array.isArray(product['@graph']) ? product['@graph'].find(n => n.offers)?.offers : null);
    if (offers) {
      if (Array.isArray(offers)) price = normalizePriceToNumber(offers[0]?.price || offers[0]?.priceSpecification?.price);
      else price = normalizePriceToNumber(offers.price || offers.priceSpecification?.price);
    }
    const imgField = product.image || product.images || product.photo || product.thumbnailUrl;
    if (Array.isArray(imgField)) images = imgField.filter(x => typeof x === 'string');
    else if (typeof imgField === 'string') images = [imgField];
    title = product.name || product.title || null;
    description = product.description || null;
    // Marca (brand) pode ser string ou objeto com name
    const b = product.brand || product.marca || (Array.isArray(product['@graph']) ? product['@graph'].find(n => n.brand)?.brand : null);
    if (b) {
      if (typeof b === 'string') brand = b;
      else if (typeof b === 'object') brand = b.name || b.brand || null;
    }
  }

  // Parcelamento: padrões comuns "em 10x de R$ 299,90 sem juros"
  try {
    const regex = /em\s*(\d{1,2})x\s*(?:de\s*)?R\$\s*([0-9\.\,]+)\s*(sem juros|com juros)?/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const parcelas = parseInt(m[1], 10);
      const valorParcela = normalizePriceToNumber(m[2]);
      const juros = (m[3] || '').trim() || 'desconhecido';
      if (parcelas && valorParcela) {
        installments.push({ parcelas, valorParcela, juros, total: Number((valorParcela * parcelas).toFixed(2)) });
      }
    }
    // de-duplicar por numero de parcelas
    const byParc = {};
    for (const i of installments) { byParc[i.parcelas] = byParc[i.parcelas] || i; }
    installments = Object.values(byParc).sort((a,b) => a.parcelas - b.parcelas);
  } catch (_) {}

  // Fallback de imagens: og:image, preloads e galeria
  if (images.length === 0) {
    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i);
    if (ogMatch) images.push(ogMatch[1]);
    const preloadImgs = Array.from(html.matchAll(/<link[^>]+rel=["']preload["'][^>]+as=["']image["'][^>]+href=["']([^"']+)["'][^>]*>/gi)).map(m => m[1]);
    images.push(...preloadImgs);
    const zoomImgs = Array.from(html.matchAll(/data-zoom=["']([^"']+)["']/gi)).map(m => m[1]);
    const srcImgs = Array.from(html.matchAll(/class=["']ui-pdp-gallery__figure__image["'][^>]*src=["']([^"']+)["']/gi)).map(m => m[1]);
    images.push(...zoomImgs, ...srcImgs);
  }
  images = images.filter((u, i, arr) => typeof u === 'string' && u && arr.indexOf(u) === i);
  if (images.length > 4) images = images.slice(0, 4);
  if (images.length > 0) { while (images.length < 4) images.push(images[0]); }

  // Extrai ID MLB
  try {
    const u = new URL(url);
    const m = u.pathname.match(/MLB\w{5,}/i);
    if (m) mlbId = m[0];
  } catch {}

  return { price, images, title, description, installments, mlbId, url, brand };
}

async function scrapeAmazon(url) {
  const resp = await withRetry(() => fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  }, 20000), { retries: 2, delayMs: 800 });
  const html = await resp.text();
  const blocks = extractJsonLdBlocks(html);
  const product = findProductFromJsonLd(blocks);

  let price = null;
  let images = [];
  let title = null;
  let description = null;
  let installments = [];
  let asin = null;
  let brand = null;

  if (product) {
    const offers = product.offers;
    if (offers) {
      if (Array.isArray(offers)) price = normalizePriceToNumber(offers[0]?.price || offers[0]?.priceSpecification?.price);
      else price = normalizePriceToNumber(offers.price || offers.priceSpecification?.price);
    }
    const imgField = product.image || product.images || product.photo || product.thumbnailUrl;
    if (Array.isArray(imgField)) images = imgField.filter(x => typeof x === 'string');
    else if (typeof imgField === 'string') images = [imgField];
    title = product.name || product.title || null;
    description = product.description || null;
    const b = product.brand || (Array.isArray(product['@graph']) ? product['@graph'].find(n => n.brand)?.brand : null);
    if (b) {
      if (typeof b === 'string') brand = b;
      else if (typeof b === 'object') brand = b.name || b.brand || null;
    }
  }

  // Preço direto do HTML (a-offscreen / price-whole + fraction)
  const priceFromHtml = (() => {
    try {
      const offscreenMatch = html.match(/<span[^>]*class=["'][^"']*a-offscreen[^"']*["'][^>]*>([^<]+)<\/span>/i);
      if (offscreenMatch) {
        const n = normalizePriceToNumber(offscreenMatch[1]);
        if (n != null && n > 0) return n;
      }
      const wholeMatch = html.match(/class=["']a-price-whole["'][^>]*>([^<]+)/i);
      const fracMatch = html.match(/class=["']a-price-fraction["'][^>]*>([^<]+)/i);
      if (wholeMatch) {
        const whole = String(wholeMatch[1]).replace(/[^0-9]/g, '');
        const frac = fracMatch ? String(fracMatch[1]).replace(/[^0-9]/g, '') : '00';
        const composed = `${whole}.${frac}`;
        const n = normalizePriceToNumber(composed);
        if (n != null && n > 0) return n;
      }
      const ogAmt = html.match(/<meta[^>]+property=["']og:price:amount["'][^>]+content=["']([^"']+)["']/i);
      if (ogAmt) {
        const n = normalizePriceToNumber(ogAmt[1]);
        if (n != null && n > 0) return n;
      }
    } catch (_) {}
    return null;
  })();
  if (priceFromHtml != null) price = priceFromHtml;

  // Parcelamento: padrões "Em 12x R$ 199,99 sem juros" e "até 12x de R$ 199,99"
  try {
    const pat1 = /Em\s*(\d{1,2})x\s*R\$\s*([0-9\.\,]+)\s*(sem juros|com juros)?/gi;
    const pat2 = /em\s*até\s*(\d{1,2})x\s*de\s*R\$\s*([0-9\.\,]+)\s*(sem juros|com juros)?/gi;
    let m;
    while ((m = pat1.exec(html)) !== null) {
      const parcelas = parseInt(m[1], 10);
      const valorParcela = normalizePriceToNumber(m[2]);
      const juros = (m[3] || '').trim() || 'desconhecido';
      if (parcelas && valorParcela) installments.push({ parcelas, valorParcela, juros, total: Number((valorParcela * parcelas).toFixed(2)) });
    }
    while ((m = pat2.exec(html)) !== null) {
      const parcelas = parseInt(m[1], 10);
      const valorParcela = normalizePriceToNumber(m[2]);
      const juros = (m[3] || '').trim() || 'desconhecido';
      if (parcelas && valorParcela) installments.push({ parcelas, valorParcela, juros, total: Number((valorParcela * parcelas).toFixed(2)) });
    }
    const byParc = {};
    for (const i of installments) { byParc[i.parcelas] = byParc[i.parcelas] || i; }
    installments = Object.values(byParc).sort((a,b) => a.parcelas - b.parcelas);
  } catch (_) {}

  // Fallback imagens: og + galeria _AC_*.jpg
  if (images.length === 0) {
    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i);
    if (ogMatch) images.push(ogMatch[1]);
  }
  if (images.length === 0) {
    const galleryMatches = Array.from(html.matchAll(/https?:[^"']+?\._AC_\d+_\.jpg/gi)).map(m => m[0]);
    if (galleryMatches.length) images = Array.from(new Set(galleryMatches)).slice(0, 6);
  }
  images = images.filter((u, i, arr) => typeof u === 'string' && u && arr.indexOf(u) === i);
  if (images.length > 4) images = images.slice(0, 4);
  if (images.length > 0) { while (images.length < 4) images.push(images[0]); }

  // ASIN
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
    if (m) asin = m[1];
  } catch {}

  // Tenta marca via bylineInfo se JSON-LD não tiver
  if (!brand) {
    try {
      const byline = html.match(/id=["']bylineInfo["'][^>]*>\s*([^<]+)\s*</i);
      if (byline) brand = byline[1].trim();
    } catch (_) {}
  }
  return { price, images, title, description, installments, asin, url, brand };
}

async function upsertProduct({ tituloPadrao, ml, amz }) {
  // Tenta achar por ASIN ou MLB ID
  let registro = null;
  if (amz.asin) registro = await Product.findOne({ where: { amazonAsin: amz.asin } });
  if (!registro && ml.mlbId) registro = await Product.findOne({ where: { mercadoLivreId: ml.mlbId } });
  // Opcional: tentar por título informado para substituir produto existente
  if (!registro && tituloPadrao) {
    try {
      const existentePorTitulo = await Product.findOne({ where: { titulo: tituloPadrao } });
      if (existentePorTitulo) registro = existentePorTitulo;
    } catch (_) {}
  }

  const agora = new Date();
  let imagens = (ml.images.length ? ml.images : amz.images);
  // garantir exatamente 4 imagens
  if (Array.isArray(imagens)) {
    imagens = imagens.filter((u, i, arr) => typeof u === 'string' && u && arr.indexOf(u) === i);
    if (imagens.length > 4) imagens = imagens.slice(0, 4);
    if (imagens.length > 0 && imagens.length < 4) {
      const primeira = imagens[0];
      while (imagens.length < 4) imagens.push(primeira);
    }
  } else {
    imagens = [];
  }
  const titulo = amz.title || ml.title || tituloPadrao || 'Produto';
  const descricao = ml.description || amz.description || null;
  const descricaoDetalhada = descricao;
  const marcaDetectada = (ml.brand || amz.brand || null) || (() => {
    const t = (titulo || '').trim();
    // heurística simples: primeira palavra relevante
    const firstWord = t.split(' ').find(w => /[A-Za-zÁ-ú0-9]+/.test(w)) || null;
    return firstWord;
  })();

  if (!registro) {
    registro = await Product.create({
      titulo,
      descricao,
      descricaoDetalhada,
      marca: marcaDetectada || null,
      imagens: imagens.length ? JSON.stringify(imagens) : null,
      linkMercadoLivre: ml.url || null,
      linkAmazon: amz.url || null,
      mercadoLivreId: ml.mlbId || null,
      amazonAsin: amz.asin || null,
      precoMercadoLivre: ml.price || null,
      precoAmazon: amz.price || null,
      parcelamentoMercadoLivre: ml.installments.length ? JSON.stringify(ml.installments) : null,
      parcelamentoAmazon: amz.installments.length ? JSON.stringify(amz.installments) : null,
      data_coleta: agora,
      ativo: true,
      emEstoque: true,
      destaque: false,
    });
  } else {
    registro.titulo = titulo || registro.titulo;
    registro.descricao = descricao || registro.descricao;
    registro.descricaoDetalhada = descricaoDetalhada || registro.descricaoDetalhada;
    if (marcaDetectada) registro.marca = marcaDetectada;
    registro.imagens = imagens.length ? JSON.stringify(imagens) : registro.imagens;
    registro.linkMercadoLivre = ml.url || registro.linkMercadoLivre;
    registro.linkAmazon = amz.url || registro.linkAmazon;
    registro.mercadoLivreId = ml.mlbId || registro.mercadoLivreId;
    registro.amazonAsin = amz.asin || registro.amazonAsin;
    registro.precoMercadoLivre = (ml.price != null ? ml.price : registro.precoMercadoLivre);
    registro.precoAmazon = (amz.price != null ? amz.price : registro.precoAmazon);
    registro.parcelamentoMercadoLivre = ml.installments.length ? JSON.stringify(ml.installments) : registro.parcelamentoMercadoLivre;
    registro.parcelamentoAmazon = amz.installments.length ? JSON.stringify(amz.installments) : registro.parcelamentoAmazon;
    registro.data_coleta = agora;
    registro.ativo = registro.ativo !== false; // mantém ativo
    await registro.save();
  }

  // Inserir histórico de preços
  try {
    if (ml.price != null) {
      await PriceHistory.create({ produto_id: registro.id, plataforma: 'Mercado Livre', preco: ml.price, emEstoque: true, data_coleta: agora });
    }
    if (amz.price != null) {
      await PriceHistory.create({ produto_id: registro.id, plataforma: 'Amazon', preco: amz.price, emEstoque: true, data_coleta: agora });
    }
  } catch (_) {}

  return registro;
}

(async () => {
  try {
    const amazonUrl = getArg('amazon');
    const mlUrl = getArg('ml');
    const tituloArg = getArg('titulo');
    const imagensAmazonOnly = getFlag('imagensAmazonOnly');
    if (!amazonUrl && !mlUrl) {
      console.error('Uso: node api/scripts/import-from-links.js --amazon "<url>" --ml "<url>" --titulo "<opcional>"');
      process.exit(1);
      return;
    }

    await connectDB();

    console.log('Coletando dados...');
    const ml = mlUrl ? await scrapeMercadoLivre(mlUrl) : { price: null, images: [], installments: [], mlbId: null, url: null };
    const amz = amazonUrl ? await scrapeAmazon(amazonUrl) : { price: null, images: [], installments: [], asin: null, url: null };

    // Combina imagens: por padrão ML+Amazon; opção para apenas Amazon
    const mlImgs = Array.isArray(ml.images) ? ml.images : [];
    const amzImgs = Array.isArray(amz.images) ? amz.images : [];
    let base = imagensAmazonOnly ? amzImgs : [...mlImgs, ...amzImgs];
    let combinadas = base.filter((u, i, arr) => typeof u === 'string' && u && arr.indexOf(u) === i);
    const imagensFinal = combinadas.slice(0, 4);
    if (imagensFinal.length > 0) {
      while (imagensFinal.length < 4) imagensFinal.push(imagensFinal[0]);
    }
    // Substitui arrays nas estruturas
    if (imagensFinal.length) {
      ml.images = imagensFinal;
      if (!ml.price && amz.price) { /* se preço do ML ausente, mantemos as imagens combinadas */ }
    }

    const registro = await upsertProduct({ tituloPadrao: tituloArg, ml, amz });
    const plain = registro.get({ plain: true });
    console.log('Produto importado/atualizado:', {
      id: plain.id,
      titulo: plain.titulo,
      precoMercadoLivre: plain.precoMercadoLivre,
      precoAmazon: plain.precoAmazon,
      linkMercadoLivre: plain.linkMercadoLivre,
      linkAmazon: plain.linkAmazon,
      mercadoLivreId: plain.mercadoLivreId,
      amazonAsin: plain.amazonAsin,
    });
    process.exit(0);
  } catch (err) {
    console.error('Erro ao importar:', err);
    process.exit(1);
  }
})();
