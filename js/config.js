// Configuração global de API com fallback automático e variável central
(function(){
  // Base fixa: todas as rotas de API vão para o backend em produção
  const CONFIG_API_BASE = 'https://backend.roxinhoshopoficial.workers.dev';

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
