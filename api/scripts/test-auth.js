/*
 End-to-end tests for registration and login flows (API + UI)
 Requirements:
 - Backend available at http://127.0.0.1:3000
 - Static dev server available at http://localhost:3013
 The script will try to start the servers if they aren't running.
*/

const { spawn } = require('child_process');
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');

let API_BASE = process.env.API_BASE || null;
const UI_BASE = process.env.UI_BASE || 'http://localhost:3013';

async function waitForApi(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      // Consider available only if it looks like our API (JSON)
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

async function waitForHttp(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok || res.status === 404) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

function startNodeProcess(entry, args = [], extraEnv = {}) {
  const child = spawn(process.execPath, [entry, ...args], {
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', d => process.stdout.write(`[${entry}] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[${entry}][err] ${d}`));
  return child;
}

function randomEmail() {
  const ts = Date.now();
  return `teste_${ts}@exemplo.com`;
}

async function runApiTests() {
  console.log('--- API tests ---');
  const email = randomEmail();
  const senha = 'SenhaForte123!';

  // Missing fields
  let res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  let body = await res.json();
  if (res.status !== 400 || body.error !== 'MISSING_FIELDS') {
    throw new Error('Register: expected MISSING_FIELDS');
  }

  // Invalid email
  res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Usuário Teste', email: 'invalido', senha })
  });
  body = await res.json();
  if (res.status !== 400 || body.error !== 'INVALID_EMAIL_FORMAT') {
    throw new Error('Register: expected INVALID_EMAIL_FORMAT');
  }

  // Weak password
  res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Usuário Teste', email: randomEmail(), senha: '123' })
  });
  body = await res.json();
  if (res.status !== 400 || body.error !== 'WEAK_PASSWORD') {
    throw new Error('Register: expected WEAK_PASSWORD');
  }

  // Successful register
  res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Usuário Teste', email, senha })
  });
  body = await res.json();
  if (res.status !== 201 || !body.success) {
    throw new Error('Register: expected success 201');
  }
  // Ensure no auth cookie set on register
  const setCookie = res.headers.get('set-cookie') || '';
  if (/token=/.test(setCookie)) {
    throw new Error('Register: should not set auth cookie');
  }

  // Duplicate email should fail
  res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Usuário Teste', email, senha })
  });
  body = await res.json();
  if (res.status !== 400 || body.error !== 'EMAIL_ALREADY_REGISTERED') {
    throw new Error('Register: expected EMAIL_ALREADY_REGISTERED');
  }

  // Login success
  res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
    redirect: 'manual'
  });
  body = await res.json();
  if (res.status !== 200 || !body.success) {
    throw new Error('Login: expected success 200');
  }
  const cookie = res.headers.get('set-cookie');
  if (!cookie || !/token=/.test(cookie)) {
    throw new Error('Login: missing auth cookie');
  }

  // Login invalid password
  res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha: 'senha_errada' })
  });
  body = await res.json();
  if (res.status !== 401 || body.error !== 'INCORRECT_PASSWORD') {
    throw new Error('Login: expected INCORRECT_PASSWORD');
  }

  // Verify session via /me using cookie
  res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Cookie: cookie }
  });
  body = await res.json();
  if (!body.success || !body.user || body.user.email !== email) {
    throw new Error('Me: expected authenticated user');
  }

  console.log('API tests passed.');
  return { email, senha };
}

async function runUiTests({ email, senha }) {
  console.log('--- UI tests (Puppeteer) ---');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Garante que o frontend use a mesma API_BASE detectada, harmonizando host com o da UI para cookies same-site
  if (API_BASE) {
    let uiApiBase = API_BASE;
    try {
      const apiUrl = new URL(API_BASE);
      const uiUrl = new URL(UI_BASE);
      // Se UI usa localhost, force API a usar localhost para evitar third-party cookie (127.0.0.1 vs localhost)
      if (uiUrl.hostname === 'localhost' && apiUrl.hostname === '127.0.0.1') {
        uiApiBase = `${apiUrl.protocol}//localhost:${apiUrl.port || ''}`.replace(/:$/,'');
      }
      // Se UI usa 127.0.0.1 e API usa localhost, alinhar também
      if (uiUrl.hostname === '127.0.0.1' && apiUrl.hostname === 'localhost') {
        uiApiBase = `${apiUrl.protocol}//127.0.0.1:${apiUrl.port || ''}`.replace(/:$/,'');
      }
    } catch {}
    await page.evaluateOnNewDocument((apiBase) => {
      try { Object.defineProperty(window, 'API_BASE', { value: apiBase, configurable: true }); }
      catch (_) { window.API_BASE = apiBase; }
    }, uiApiBase);
  }

  // Register via UI flow and expect redirect to /login
  await page.goto(`${UI_BASE}/cadastro`, { waitUntil: 'domcontentloaded' });
  // Header deve carregar e a caixa de login deve estar oculta nesta página
  // Espera até a inicialização do cabeçalho aplicar o hide
  await page.waitForFunction(() => {
    const el = document.getElementById('caixa-login');
    return !!el && getComputedStyle(el).display === 'none';
  }, { timeout: 5000 });
  await page.type('#nome', 'Teste');
  await page.type('#sobrenome', 'Automático');
  const uiEmail = randomEmail();
  await page.type('#email', uiEmail);
  await page.type('#senha', senha);
  await page.type('#confirmarSenha', senha);
  // Clicar e checar estado de carregamento visível antes da navegação
  await page.click('#botaoCadastro');
  await page.waitForSelector('#botaoCadastro.carregando', { timeout: 1500 });
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  if (!/\/login$/.test(page.url())) {
    throw new Error('Cadastro UI: expected redirect to /login');
  }

  // Na página de login, a caixa também deve estar oculta
  await page.waitForFunction(() => {
    const el = document.getElementById('caixa-login');
    return !!el && getComputedStyle(el).display === 'none';
  }, { timeout: 5000 });

  // Login via UI and expect redirect to / and greeting
  await page.type('#email', email);
  await page.type('#senha', senha);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'domcontentloaded' })
  ]);
  if (!/\/$/.test(page.url())) {
    throw new Error('Login UI: expected redirect to /');
  }
  // Wait header injection and greeting with retries (até 5s)
  await page.waitForSelector('#status-login', { timeout: 5000 });
  let okGreeting = false;
  const start = Date.now();
  while (Date.now() - start < 5000) {
    const statusText = await page.$eval('#status-login', el => el.textContent.trim()).catch(() => '');
    if (/Olá,\s*/.test(statusText)) { okGreeting = true; break; }
    await new Promise(r => setTimeout(r, 200));
  }
  if (!okGreeting) throw new Error('UI pós-login: saudação não exibida');

  // Após login, a caixa deve estar visível
  await page.waitForFunction(() => {
    const el = document.getElementById('caixa-login');
    return !!el && getComputedStyle(el).display !== 'none';
  }, { timeout: 5000 });

  // Dropdown should open
  await page.click('#caixa-login');
  await page.waitForSelector('#dropdown-usuario', { visible: true, timeout: 3000 });

  await browser.close();
  console.log('UI tests passed.');
}

async function runUiInvalidTests({ email }) {
  console.log('--- UI invalid tests (Puppeteer) ---');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Força mesma API_BASE detectada (melhora consistência em dev)
  if (API_BASE) {
    let uiApiBase = API_BASE;
    try {
      const apiUrl = new URL(API_BASE);
      const uiUrl = new URL(UI_BASE);
      if (uiUrl.hostname === 'localhost' && apiUrl.hostname === '127.0.0.1') {
        uiApiBase = `${apiUrl.protocol}//localhost:${apiUrl.port || ''}`.replace(/:$/,'');
      }
      if (uiUrl.hostname === '127.0.0.1' && apiUrl.hostname === 'localhost') {
        uiApiBase = `${apiUrl.protocol}//127.0.0.1:${apiUrl.port || ''}`.replace(/:$/,'');
      }
    } catch {}
    await page.evaluateOnNewDocument((apiBase) => {
      try { Object.defineProperty(window, 'API_BASE', { value: apiBase, configurable: true }); }
      catch (_) { window.API_BASE = apiBase; }
    }, uiApiBase);
  }

  // Cadastro: submeter vazio deve exibir erros e NÃO entrar em carregamento
  await page.goto(`${UI_BASE}/cadastro`, { waitUntil: 'domcontentloaded' });
  await page.click('#botaoCadastro');
  await page.waitForSelector('#erro-nome.mensagem-erro.visivel', { timeout: 2000 });
  await page.waitForSelector('#erro-sobrenome.mensagem-erro.visivel', { timeout: 2000 });
  await page.waitForSelector('#erro-email.mensagem-erro.visivel', { timeout: 2000 });
  await page.waitForSelector('#erro-senha.mensagem-erro.visivel', { timeout: 2000 });
  await page.waitForSelector('#erro-confirmar-senha.mensagem-erro.visivel', { timeout: 2000 });
  // Botão não deve estar em estado de carregamento
  const isLoading = await page.$('#botaoCadastro.carregando');
  if (isLoading) throw new Error('Cadastro UI inválido: botão não deveria estar carregando');

  // Cadastro: dados inválidos (email ruim, senha curta, confirmação divergente)
  await page.type('#nome', 'A'); // invalido (<2)
  await page.click('#botaoCadastro');
  await page.waitForSelector('#erro-nome.mensagem-erro.visivel', { timeout: 2000 });

  await page.$eval('#nome', el => el.value = 'Teste');
  await page.$eval('#sobrenome', el => el.value = 'Automático');
  await page.$eval('#email', el => el.value = 'invalido');
  await page.$eval('#senha', el => el.value = '123');
  await page.$eval('#confirmarSenha', el => el.value = '456');
  await page.click('#botaoCadastro');
  await page.waitForSelector('#erro-email.mensagem-erro.visivel', { timeout: 2000 });
  await page.waitForSelector('#erro-senha.mensagem-erro.visivel', { timeout: 2000 });
  await page.waitForSelector('#erro-confirmar-senha.mensagem-erro.visivel', { timeout: 2000 });

  // Login: email inválido
  await page.goto(`${UI_BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.type('#email', 'inválido');
  await page.type('#senha', 'qualquer');
  await page.click('button[type="submit"]');
  await page.waitForSelector('#erro-email.error-message.ativo', { timeout: 2000 });

  // Login: senha incorreta
  await page.$eval('#email', el => el.value = '');
  await page.$eval('#senha', el => el.value = '');
  await page.type('#email', email);
  await page.type('#senha', 'senha_errada');
  await page.click('button[type="submit"]');
  await page.waitForSelector('#erro-senha.error-message.ativo', { timeout: 4000 });

  await browser.close();
  console.log('UI invalid tests passed.');
}

(async () => {
  let apiProc = null;
  let uiProc = null;
  try {
    // Descobrir/garantir backend
    const candidates = [];
    if (process.env.API_BASE) {
      candidates.push(process.env.API_BASE);
    } else {
      // Preferir 3001 primeiro para evitar instâncias antigas em 3000
      candidates.push('http://127.0.0.1:3001', 'http://127.0.0.1:3000');
    }

    let found = false;
    for (const base of candidates) {
      if (await waitForApi(`${base}/api/auth/me`)) {
        // Verificar semântica do /register com payload vazio
        try {
          const r = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
          const ct = (r.headers.get('content-type') || '').toLowerCase();
          let b = null; if (ct.includes('application/json')) { try { b = await r.json(); } catch { b = null; }
          } else { try { b = JSON.parse(await r.text()); } catch { b = null; } }
          if (r.status === 400 && b && b.error === 'MISSING_FIELDS') {
            API_BASE = base;
            found = true;
            break;
          }
        } catch {}
      }
    }

    if (!found) {
      // Preferimos iniciar na 3000 para alinhar com js/config.js em dev
      API_BASE = 'http://127.0.0.1:3000';
      apiProc = startNodeProcess('api/server.js', [], { PORT: '3000' });
      const ok = await waitForApi(`${API_BASE}/api/auth/me`, 20000);
      // Se subiu, mas semântica não bate, tentar 3001
      let semanticsOk = false;
      if (ok) {
        try {
          const r = await fetch(`${API_BASE}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
          const b = await r.json().catch(() => ({}));
          semanticsOk = (r.status === 400 && b && b.error === 'MISSING_FIELDS');
        } catch {}
      }
      if (!ok || !semanticsOk) {
        // Tentar fallback para 3001
        if (apiProc) { try { apiProc.kill(); } catch {} }
        API_BASE = 'http://127.0.0.1:3001';
        apiProc = startNodeProcess('api/server.js', [], { PORT: '3001' });
        const ok2 = await waitForApi(`${API_BASE}/api/auth/me`, 20000);
        if (!ok2) throw new Error('Backend não iniciou a tempo');
        try {
          const r2 = await fetch(`${API_BASE}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
          const b2 = await r2.json().catch(() => ({}));
          if (!(r2.status === 400 && b2 && b2.error === 'MISSING_FIELDS')) {
            throw new Error('Backend ativo, mas /register não retorna MISSING_FIELDS');
          }
        } catch (e) {
          throw e;
        }
      }
    }

    // Ensure static server at 3013
    if (!(await waitForHttp(`${UI_BASE}/index.html`))) {
      uiProc = startNodeProcess('dev-server.js');
      const ok = await waitForHttp(`${UI_BASE}/index.html`, 15000);
      if (!ok) throw new Error('Servidor estático não iniciou a tempo');
    }

    const creds = await runApiTests();
    await runUiInvalidTests(creds);
    await runUiTests(creds);
    console.log('\n✅ Todos os testes passaram.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Falha nos testes:', err.message || err);
    process.exit(1);
  } finally {
    if (apiProc) apiProc.kill();
    if (uiProc) uiProc.kill();
  }
})();
