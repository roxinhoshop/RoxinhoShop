// Configuração global de API com fallback automático
(function(){
  try {
    // Se já estiver definida externamente, respeite
    if (typeof window.API_BASE === 'string' && window.API_BASE) return;

    const origin = window.location.origin;
    const host = window.location.hostname || '';
    // Em produção, usar sempre same-origin com caminho /api,
    // o vercel.json do frontend faz o proxy para o backend.
    // Isso elimina CORS no navegador.
    const isProdFrontend = /roxinhoshop\.(?:vercel\.app)$/i.test(host);
    window.API_BASE = origin;
  } catch {
    try { window.API_BASE = window.location.origin; } catch {}
  }
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
