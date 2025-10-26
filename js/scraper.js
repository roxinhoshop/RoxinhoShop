const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function scrapeKabum(termoBusca) {

let browser;
try {
// Iniciar navegador
browser = await puppeteer.launch({
headless: true,
args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
// Navegar até KaBuM
const urlBusca =
`https://www.kabum.com.br/busca/${encodeURIComponent(termoBusca)}`;
console.log(`🔍 Buscando: ${termoBusca}`);
await page.goto(urlBusca, { waitUntil: 'networkidle2' });
// Aguardar carregamento dos produtos
await page.waitForSelector('[data-testid="product-card"]', { timeout:
5000 });
// Extrair dados dos produtos
const produtos = await page.evaluate(() => {

const items = document.querySelectorAll('[data-testid="product-
card"]');

const dados = [];
items.forEach(item => {
try {

const titulo = item.querySelector('[data-testid="product-
name"]')?.textContent?.trim();

const preco = item.querySelector('[data-testid="product-
price"]')?.textContent?.trim();

const link = item.querySelector('a')?.href;
const imagem = item.querySelector('img')?.src;
if (titulo && preco) {
// Limpar preço
const precoLimpo = parseFloat(
preco.replace(/[^\d,]/g, '').replace(',', '.')
);
dados.push({
titulo,
preco: precoLimpo,
link: link || '',
imagem: imagem || '',

descricao: titulo,
avaliacao: 0
});
}
} catch (erro) {
console.error('Erro ao extrair produto:', erro);
}
});
return dados;
});
console.log(`✓ ${produtos.length} produtos encontrados`);
// Inserir no banco de dados
for (const produto of produtos) {
try {
await prisma.produto.create({
data: produto
});
} catch (erro) {
console.error('Erro ao inserir produto:', erro);
}
}
console.log('✓ Produtos inseridos no banco de dados');
} catch (erro) {
console.error('❌ Erro no scraping:', erro);
} finally {
if (browser) {
await browser.close();
}
await prisma.$disconnect();
}
}
// Executar scraper
scrapeKabum('notebook');
