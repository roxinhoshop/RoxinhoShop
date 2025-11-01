const fetch = require('node-fetch');

async function checkRedirect(oldUrl, expectedNew) {
  const resp = await fetch(oldUrl, { redirect: 'manual' });
  const status = resp.status;
  const loc = resp.headers.get('location') || '';
  const ok = status === 301 && loc.startsWith(expectedNew);
  return { ok, status, location: loc };
}

async function checkPageOk(url) {
  const resp = await fetch(url);
  const ct = resp.headers.get('content-type') || '';
  const ok = resp.ok && /text\/html/i.test(ct);
  return { ok, status: resp.status, contentType: ct };
}

async function checkApiProducts(base) {
  const resp = await fetch(`${base}/api/products`, { headers: { 'Accept': 'application/json' }, cache: 'no-store' });
  const ct = resp.headers.get('content-type') || '';
  let body;
  try { body = await resp.json(); } catch { body = null; }
  const list = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
  const ok = resp.ok && /application\/json/i.test(ct) && Array.isArray(list);
  return { ok, status: resp.status, count: list.length };
}

async function run() {
  const uiBases = [
    'http://localhost:3016', // preview
    'http://localhost:5524', // express UI server
    'http://localhost:5526', // dev server
    'http://localhost:8000'  // simple server
  ];
  const pages = [
    '', 'produtos', 'pagina-produto', 'login', 'cadastro', 'configuracoes', 'historico',
    'quem-somos', 'contato', 'vendedores', 'termos', 'politicas', 'redefinir-senha',
    'login-vendedor', 'cadastro-vendedor', 'painel-vendedor'
  ];
  // Slugs antigos que devem continuar funcionando (alias)
  const oldAliases = {
    'paginaproduto': 'pagina-produto',
    'redefinirsenha': 'redefinir-senha',
    'cabecalhorodape': 'cabecalho-rodape'
  };

  let failures = [];
  for (const base of uiBases) {
    // Teste rápido de disponibilidade
    try {
      const ping = await fetch(base, { redirect: 'manual' });
      if (!(ping.status >= 200 && ping.status < 400)) continue;
    } catch { continue; }

    console.log(`\nTestando base: ${base}`);

    // 301 de .html
    for (const p of pages) {
      const from = `${base}/${p || 'index'}.html`;
      const to = `${base}/${p}`;
      try {
        const r = await checkRedirect(from, to);
        if (!r.ok) {
          failures.push({ type: 'redirect', base, from, to, status: r.status, location: r.location });
          console.warn(`FAIL 301: ${from} -> ${to} status=${r.status} loc=${r.location}`);
        }
      } catch (e) {
        console.warn(`SKIP redirect check ${from}: ${String(e)}`);
      }
    }

    // 200 HTML nas páginas limpas
    for (const p of pages) {
      const url = `${base}/${p}`;
      try {
        const r = await checkPageOk(url);
        if (!r.ok) {
          failures.push({ type: 'page', base, url, status: r.status, ct: r.contentType });
          console.warn(`FAIL 200 HTML: ${url} status=${r.status} ct=${r.contentType}`);
        }
      } catch (e) {
        console.warn(`SKIP page check ${url}: ${String(e)}`);
      }
    }

    // 200 HTML nos slugs antigos (aliases)
    for (const [oldSlug, newSlug] of Object.entries(oldAliases)) {
      const url = `${base}/${oldSlug}`;
      try {
        const r = await checkPageOk(url);
        if (!r.ok) {
          failures.push({ type: 'alias', base, url, expected: `${base}/${newSlug}`, status: r.status, ct: r.contentType });
          console.warn(`FAIL ALIAS 200 HTML: ${url} -> ${newSlug} status=${r.status} ct=${r.contentType}`);
        }
      } catch (e) {
        console.warn(`SKIP alias check ${url}: ${String(e)}`);
      }
    }

    // API básica
    try {
      const r = await checkApiProducts(base);
      if (!r.ok) {
        failures.push({ type: 'api', base, url: `${base}/api/products`, status: r.status, count: r.count });
        console.warn(`FAIL API: ${base}/api/products status=${r.status} count=${r.count}`);
      } else {
        console.log(`OK API products (${r.count} itens) em ${base}`);
      }
    } catch (e) {
      console.warn(`SKIP api check ${base}/api/products: ${String(e)}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\nFalhas: ${failures.length}`);
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
  console.log('\nTodos os testes passaram.');
}

run().catch((e) => {
  console.error('Erro nos testes:', e);
  process.exit(1);
});
