// Configuração global de API com fallback automático e variável central
(function(){
  // Ajuste dinâmico: em desenvolvimento local, se o frontend não estiver na porta 3000,
  // direciona a API para http://localhost:3000 (onde o backend roda por padrão).
  const CONFIG_API_BASE = (() => {
    try {
      const loc = window.location || {};
      const host = String(loc.hostname || '').toLowerCase();
      const port = String(loc.port || '');
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      if (isLocal && port !== '3000') return 'http://localhost:3000';
    } catch (_) {}
    return '';
  })();

  try {
    // Respeita valor já definido externamente, senão usa a constante acima
    const pre = (typeof window.API_BASE === 'string' && window.API_BASE.trim()) ? window.API_BASE.trim() : null;
    const origin = (pre || CONFIG_API_BASE || (window.location && window.location.origin) || '').replace(/\/+$/,'');
    Object.defineProperty(window, 'API_BASE', { value: origin, configurable: true });
  } catch {
    try { window.API_BASE = (CONFIG_API_BASE || window.location.origin || '').replace(/\/+$/,''); } catch {}
  }

  // Patch global de fetch: quando chamado com caminho relativo '/api',
  // prefixa automaticamente com API_BASE para centralizar a configuração
  try {
    const origFetch = window.fetch;
    if (typeof origFetch === 'function' && !window.__fetchApiPatched) {
      window.fetch = function(input, init) {
        try {
          if (typeof input === 'string' && input.startsWith('/api')) {
            const url = `${window.API_BASE}${input}`;
            return origFetch.call(this, url, init);
          }
        } catch {}
        return origFetch.call(this, input, init);
      };
      window.__fetchApiPatched = true;
    }
  } catch {}
})();

// ===== Helper global para ícone da Amazon conforme tema =====
(function(){
  try {
    // Define função global que retorna o caminho do ícone da Amazon de acordo com o tema atual
    window.getAmazonIconByTheme = function() {
      const isDark = document.documentElement.classList.contains('dark');
      // Em dark, preferir versão clara; em light, versão padrão
      return isDark ? '/imagens/logos/amazon-icon.png' : '/imagens/logos/Amazon_icon.png';
    };

    // Atualiza ícones já renderizados quando o tema mudar
    window.updateAmazonIconsOnTheme = function() {
      const src = window.getAmazonIconByTheme();
      document.querySelectorAll('img.icone-plataforma[alt="Amazon"], img[data-store="amazon"], img[data-amazon-icon="1"]').forEach(img => {
        try { img.src = src; } catch(_) {}
      });
    };

    // Ouvir mudanças de tema (evento customizado)
    document.addEventListener('themechange', function(){
      try { window.updateAmazonIconsOnTheme(); } catch(_) {}
    });

    // Ajuste inicial após carregamento
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){
        try { window.updateAmazonIconsOnTheme(); } catch(_) {}
      });
    } else {
      try { window.updateAmazonIconsOnTheme(); } catch(_) {}
    }
  } catch(_) {}
})();

// ===== Utilitário: criar token JWT de admin para desenvolvimento local =====
(function(){
  // Gera um JWT HS256 assinado com 'devsecret' para o usuário ID 1
  async function createDevAdminToken() {
    try {
      const loc = window.location || {};
      const host = String(loc.hostname || '').toLowerCase();
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      if (!isLocal) return null;
      const header = { alg: 'HS256', typ: 'JWT' };
      const now = Math.floor(Date.now() / 1000);
      const payload = { id: 1, role: 'admin', iat: now, exp: now + 6 * 3600 };

      const enc = new TextEncoder();
      const toB64Url = (strOrBytes) => {
        let bytes = strOrBytes instanceof Uint8Array ? strOrBytes : enc.encode(String(strOrBytes));
        let b64 = btoa(String.fromCharCode.apply(null, Array.from(bytes))).replace(/=+$/,'');
        return b64.replace(/\+/g, '-').replace(/\//g, '_');
      };
      const headerB64 = toB64Url(JSON.stringify(header));
      const payloadB64 = toB64Url(JSON.stringify(payload));
      const data = `${headerB64}.${payloadB64}`;
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode('devsecret'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
      const sigB64 = toB64Url(new Uint8Array(sig));
      const token = `${data}.${sigB64}`;
      // Define cookie de sessão (httpOnly não é possível via JS)
      document.cookie = `token=${token}; path=/; max-age=${6 * 3600}; samesite=lax`;
      return token;
    } catch (e) {
      console.warn('Falha ao criar token de desenvolvimento:', e && e.message || e);
      return null;
    }
  }
  try { window.createDevAdminToken = createDevAdminToken; } catch(_) { window.createDevAdminToken = createDevAdminToken; }
})();
