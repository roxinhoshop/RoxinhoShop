// ======================= CABEÇALHO MELHORADO ======================= 
// Desenvolvido por Gabriel (gabwvr)

// Executa mesmo se o script for injetado após DOMContentLoaded
(function() {
  // ===== Aplicar tema escuro salvo (fallback global) =====
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      document.body && document.body.classList && document.body.classList.add('dark');
    }
  } catch (_) {}

  // ===== Suporte global ao toggle de tema (quando scripts do cabeçalho não são injetados) =====
  function aplicarTemaInterno(tema) {
    const isDark = tema === 'dark';
    const root = document.documentElement;
    const body = document.body;
    try {
      root.classList.toggle('dark', isDark);
      if (body && body.classList) body.classList.toggle('dark', isDark);
    } catch (_) {}
    // Atualizar ícone/aria do botão se existir
    try {
      const btn = document.getElementById('btnDarkMode');
      if (btn) {
        btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        const icone = btn.querySelector('i');
        if (icone) {
          icone.classList.toggle('fa-sun', isDark);
          icone.classList.toggle('fa-moon', !isDark);
        }
      }
    } catch (_) {}
    try { localStorage.setItem('theme', tema); } catch (_) {}
    // Disparar evento global para que UI reaja (ícones, gráficos, etc.)
    try {
      const ev = new CustomEvent('themechange', { detail: { theme: tema } });
      document.dispatchEvent(ev);
    } catch (_) {}
  }

  function carregarTemaInterno() {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (_) {}
    aplicarTemaInterno(saved === 'dark' ? 'dark' : 'light');
  }

  function configurarToggleTemaSeNecessario() {
    // Se o script do cabeçalho já definiu funções globais, não duplicar
    if (typeof window.aplicarTema === 'function' || typeof window.carregarTemaPreferido === 'function') {
      return;
    }
    const btn = document.getElementById('btnDarkMode');
    if (!btn || btn.dataset.darkInit === '1') return;
    btn.dataset.darkInit = '1';
    try {
      btn.addEventListener('click', function() {
        const atual = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        aplicarTemaInterno(atual === 'dark' ? 'light' : 'dark');
      });
      // Garantir estado inicial coerente
      carregarTemaInterno();
    } catch (_) {}
  }
  
  // ===== Garantir carregamento do Chatbot globalmente =====
  function ensureChatbotLoaded() {
    try {
      if (document.querySelector('.chatbot-fab')) return;
      if (!document.querySelector('link[href*="/css/chatbot.css"]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = '/css/chatbot.css';
        document.head.appendChild(l);
      }
      if (window.__CHATBOT_LOADING) return;
      window.__CHATBOT_LOADING = true;
      const s = document.createElement('script');
      s.src = '/js/chatbot.js';
      s.defer = true;
      s.onload = () => { window.__CHATBOT_LOADING = false; };
      s.onerror = () => { window.__CHATBOT_LOADING = false; };
      document.body.appendChild(s);
    } catch (_) {}
  }
  
  // ==================== CORREÇÃO DOS DEPARTAMENTOS ====================
  function corrigirDepartamentos() {
    const dropdownPrincipal = document.querySelector('.barra-categorias li.mega-dropdown') || document.querySelector('.barra-categorias li.dropdown');
    // Seleciona de forma robusta o link principal (evita problemas com :scope)
    let linkDepartamentos = dropdownPrincipal ? dropdownPrincipal.querySelector('a') : null;
    if (!linkDepartamentos) {
      // Fallback para seleção direta por combinador de filho
      linkDepartamentos = document.querySelector('.barra-categorias li.mega-dropdown > a') || document.querySelector('.barra-categorias li.dropdown > a');
    }
    const megaMenu = dropdownPrincipal ? dropdownPrincipal.querySelector('.mega-menu') : null;

    if (dropdownPrincipal && linkDepartamentos && megaMenu && !dropdownPrincipal.dataset.departamentosInit) {
      // Evita múltiplos handlers quando o cabeçalho é reinserido dinamicamente
      dropdownPrincipal.dataset.departamentosInit = '1';
      let timeoutId = null;

      // ARIA: preparar atributos de acessibilidade no trigger e no painel
      try {
        linkDepartamentos.setAttribute('aria-haspopup', 'true');
        linkDepartamentos.setAttribute('aria-expanded', 'false');
        if (!megaMenu.id) {
          megaMenu.id = 'megaMenuDepartamentos';
        }
        linkDepartamentos.setAttribute('aria-controls', megaMenu.id);
        megaMenu.setAttribute('aria-hidden', 'true');
      } catch (_) {}

      // Garante que o mega-menu não saia da página (viewport clamp)
      function clampMegaMenuToViewport() {
        try {
          requestAnimationFrame(() => {
            const rect = megaMenu.getBoundingClientRect();
            const padding = 8; // margem interna da viewport
            let shiftX = 0;
            if (rect.left < padding) {
              shiftX = padding - rect.left;
            } else if (rect.right > window.innerWidth - padding) {
              shiftX = (window.innerWidth - padding) - rect.right;
            }
            if (shiftX !== 0) {
              megaMenu.style.transform = `translateY(0) translateX(${shiftX}px)`;
            } else {
              megaMenu.style.transform = 'translateY(0)';
            }
          });
        } catch (_) {}
      }

      function focusPrimeiroItemMegaMenu() {
        try {
          const primeiroFoco = megaMenu.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
          if (primeiroFoco && typeof primeiroFoco.focus === 'function') {
            primeiroFoco.focus({ preventScroll: true });
          }
        } catch (_) {}
      }

      function abrirMegaMenu() {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        dropdownPrincipal.classList.add('open');
        try {
          linkDepartamentos.setAttribute('aria-expanded', 'true');
          megaMenu.setAttribute('aria-hidden', 'false');
        } catch (_) {}
        clampMegaMenuToViewport();
        // Inicializar comportamento de categorias com toggle (uma vez)
        try {
          if (!megaMenu.dataset.toggleInit) {
            inicializarToggleMegaCategorias();
            megaMenu.dataset.toggleInit = '1';
          }
          // Expansão inicial: garantir que pelo menos uma coluna esteja visível
          if (!megaMenu.dataset.expandedInit) {
            const primeiraColuna = megaMenu.querySelector('.categoria-coluna');
            if (primeiraColuna) {
              primeiraColuna.classList.add('expandida');
              const header = primeiraColuna.querySelector('h4');
              const grid = primeiraColuna.querySelector('.subcategorias-grid');
              try {
                if (header) header.setAttribute('aria-expanded', 'true');
                if (grid) {
                  grid.style.display = 'block';
                  grid.style.opacity = '1';
                  // Remover limite para evitar truncamento ao abrir inicialmente
                  grid.style.maxHeight = 'none';
                }
              } catch (_) {}
            }
            megaMenu.dataset.expandedInit = '1';
          }
          // Focar no primeiro elemento interativo do mega-menu
          focusPrimeiroItemMegaMenu();
        } catch (_) {}
      }

      function fecharMegaMenuComDelay() {
        timeoutId = setTimeout(() => {
          dropdownPrincipal.classList.remove('open');
          // Resetar transform aplicado dinamicamente
          try { megaMenu.style.transform = ''; } catch (_) {}
          try {
            linkDepartamentos.setAttribute('aria-expanded', 'false');
            megaMenu.setAttribute('aria-hidden', 'true');
          } catch (_) {}
        }, 150);
      }

      // Garantir inicialização do toggle mesmo antes de abrir (corrige dispositivos que não disparam a abertura inicialmente)
      try {
        if (megaMenu && !megaMenu.dataset.toggleInit) {
          inicializarToggleMegaCategorias();
          megaMenu.dataset.toggleInit = '1';
          // Expansão inicial antecipada (quando o menu é inicializado fora da abertura)
          if (!megaMenu.dataset.expandedInit) {
            const primeiraColuna = megaMenu.querySelector('.categoria-coluna');
            if (primeiraColuna) {
              primeiraColuna.classList.add('expandida');
              const header = primeiraColuna.querySelector('h4');
              const grid = primeiraColuna.querySelector('.subcategorias-grid');
              try {
                if (header) header.setAttribute('aria-expanded', 'true');
                if (grid) {
                  grid.style.display = 'block';
                  grid.style.opacity = '1';
                  grid.style.maxHeight = 'none';
                }
              } catch (_) {}
            }
            megaMenu.dataset.expandedInit = '1';
          }
        }
      } catch (_) {}

      // Abrir/fechar por clique no mobile e suporte a hover no desktop

      // Click: toggle e fechar outros
      linkDepartamentos.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const isOpen = dropdownPrincipal.classList.contains('open');

        document.querySelectorAll('.barra-categorias li.mega-dropdown, .barra-categorias li.dropdown').forEach(item => {
          if (item !== dropdownPrincipal) {
            item.classList.remove('open');
          }
        });

        if (isOpen) {
          dropdownPrincipal.classList.remove('open');
          try { megaMenu.style.transform = ''; } catch (_) {}
        } else {
          abrirMegaMenu();
        }
      });

      // Removido suporte por hover no desktop: abrir/fechar apenas por clique para consistência

      // Reposicionar/clamp ao redimensionar ou mudar orientação
      try {
        ['resize', 'orientationchange'].forEach(evt => {
          window.addEventListener(evt, () => {
            if (dropdownPrincipal.classList.contains('open')) {
              clampMegaMenuToViewport();
            }
          });
        });
      } catch (_) {}

      // Acessibilidade: abrir com Enter/Espaço
      linkDepartamentos.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          linkDepartamentos.click();
        }
      });

      // Inicializa colapso/toggle das subcategorias no mega-menu
      function inicializarToggleMegaCategorias() {
        const colunas = megaMenu.querySelectorAll('.categoria-coluna');
        colunas.forEach(coluna => {
          const header = coluna.querySelector('h4');
          const grid = coluna.querySelector('.subcategorias-grid');
          if (!header || !grid) return;

          // Adiciona ícone de seta, se não existir
          if (!header.querySelector('.toggle-icon')) {
            const toggleIcon = document.createElement('i');
            toggleIcon.className = 'fa-solid fa-chevron-down toggle-icon';
            header.appendChild(toggleIcon);
          }

          // Acessibilidade
          header.setAttribute('role', 'button');
          header.setAttribute('tabindex', '0');
          header.setAttribute('aria-expanded', 'false');

          // Estado inicial: oculto
          coluna.classList.remove('expandida');
          try {
            grid.style.maxHeight = '0px';
            grid.style.opacity = '0';
            grid.style.overflow = 'hidden';
            grid.style.transition = 'max-height 300ms ease, opacity 300ms ease';
          } catch (_) {}

          const toggleGrid = () => {
            const expandindo = !coluna.classList.contains('expandida');

            // Accordion: fechar outras categorias ao expandir esta
            if (expandindo) {
              colunas.forEach(outra => {
                if (outra !== coluna) {
                  outra.classList.remove('expandida');
                  const h = outra.querySelector('h4');
                  const g = outra.querySelector('.subcategorias-grid');
                  if (h) h.setAttribute('aria-expanded', 'false');
                  if (g) {
                    try {
                      if (getComputedStyle(g).maxHeight === 'none') {
                        g.style.maxHeight = g.scrollHeight + 'px';
                      }
                      g.style.maxHeight = '0px';
                      g.style.opacity = '0';
                    } catch (_) {}
                  }
                }
              });
            }

            coluna.classList.toggle('expandida');
            header.setAttribute('aria-expanded', expandindo ? 'true' : 'false');
            try {
              if (expandindo) {
                // Expande suavemente e garante ver todas as subcategorias
                grid.style.display = 'block';
                const fullHeight = grid.scrollHeight;
                grid.style.maxHeight = fullHeight + 'px';
                grid.style.opacity = '1';
                setTimeout(() => {
                  // Remover limite para acomodar mudanças dinâmicas sem truncar
                  grid.style.maxHeight = 'none';
                }, 310);
              } else {
                // Se estava sem limite, define a altura atual para animar recolhimento
                if (getComputedStyle(grid).maxHeight === 'none') {
                  grid.style.maxHeight = grid.scrollHeight + 'px';
                  // Forçar reflow antes de colapsar
                  void grid.offsetHeight;
                }
                grid.style.maxHeight = '0px';
                grid.style.opacity = '0';
              }
            } catch (_) {}
          };

          header.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            toggleGrid();
          });
          header.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              toggleGrid();
            }
          });
        });
      }
    }
  }
  
  // ==================== CORREÇÃO DOS LINKS DE CATEGORIAS ====================
  function corrigirLinksCategoria() {
    // Reescrever globalmente quaisquer âncoras com "/produtos" ou "produtos" para rotas limpas (sem .html)
    document.querySelectorAll('a[href^="/produtos"]').forEach(a => {
      const hrefAtual = a.getAttribute('href') || '';
      const novo = hrefAtual
        .replace(/^\/produtos\?/, '/produtos?')
        .replace(/^\/produtos$/i, '/produtos');
      a.setAttribute('href', novo);
    });
    document.querySelectorAll('a[href^="produtos"]').forEach(a => {
      const hrefAtual = a.getAttribute('href') || '';
      if (/^produtos(\?|$)/i.test(hrefAtual)) {
        const novo = hrefAtual
          .replace(/^produtos\?/, 'produtos?')
          .replace(/^produtos$/i, 'produtos');
        a.setAttribute('href', novo);
      }
    });
    // Reescrever rotas antigas "/produtos" para "produtos.html" nas categorias e submenus
    document.querySelectorAll('.barra-categorias a[href*="/produtos"]').forEach(a => {
      const hrefAtual = a.getAttribute('href') || '';
      if (/^\/produtos(\?|$)/i.test(hrefAtual)) {
        const novo = hrefAtual
          .replace(/^\/produtos\?/, '/produtos?')
          .replace(/^\/produtos$/i, '/produtos');
        a.setAttribute('href', novo);
      }
    });
    // Corrigir todos os links de categoria
    const linksCategoria = document.querySelectorAll('.barra-categorias .submenu a');
    
    linksCategoria.forEach(link => {
      // Verificar se o link tem href válido
      const href = link.getAttribute('href');
      
      if (href && href !== '#' && href !== '') {
        // Link válido - garantir que funcione
        link.addEventListener('click', function(e) {
          // Permitir navegação normal sem logs
        });
      } else {
        // Link inválido - corrigir
        const textoLink = link.textContent.trim();
        const novoHref = `produtos?categoria=${encodeURIComponent(textoLink)}`;
        link.setAttribute('href', novoHref);
      }
    });
    
    // Corrigir links principais de categoria
    const linksPrincipais = document.querySelectorAll('.barra-categorias > ul > li > a');
    
    linksPrincipais.forEach(link => {
      const href = link.getAttribute('href');
      
      if (href && href !== '#' && !/produtos(\.html)?(\?|$)/i.test(href)) {
        const textoLink = link.textContent.trim().replace(/\s+/g, ' ');
        const novoHref = `produtos?categoria=${encodeURIComponent(textoLink)}`;
        link.setAttribute('href', novoHref);
      }
    });
  }
  
  // ==================== MELHORIAS DOS SUBMENUS ====================
  function melhorarSubmenus() {
    const itensComSubmenu = document.querySelectorAll('.barra-categorias .tem-submenu');
    
    itensComSubmenu.forEach(item => {
      const linkPrincipal = item.querySelector('a');
      const submenu = item.querySelector('.submenu');
      
      if (linkPrincipal && submenu) {
        let timeoutSubmenu = null;
        
        // Função para mostrar submenu
        function mostrarSubmenuItem() {
          if (timeoutSubmenu) {
            clearTimeout(timeoutSubmenu);
            timeoutSubmenu = null;
          }
          
          // Fechar outros submenus no mesmo nível
          const irmãos = item.parentElement.querySelectorAll('.tem-submenu');
          irmãos.forEach(irmão => {
            if (irmão !== item) {
              irmão.classList.remove('active');
            }
          });
          
          item.classList.add('active');
        }
        
        // Função para esconder submenu com delay
        function esconderSubmenuItem() {
          timeoutSubmenu = setTimeout(() => {
            item.classList.remove('active');
          }, 150);
        }
        
        // Mostrar/esconder submenu apenas por clique
        
        // Clique no mobile
        linkPrincipal.addEventListener('click', function(e) {
          const temSubmenuFilho = submenu && submenu.children.length > 0;
          
          if (temSubmenuFilho) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle do submenu
            item.classList.toggle('active');
          }
          // Se não tem submenu, permite navegação normal
        });
      }
    });
  }
  
  // ==================== FECHAR MENUS AO CLICAR FORA ====================
  function adicionarEventoFecharMenus() {
    document.addEventListener('click', function(e) {
      // Verificar se o clique foi fora da barra de categorias
      if (!e.target.closest('.barra-categorias')) {
        // Fechar todos os dropdowns
        document.querySelectorAll('.barra-categorias li.mega-dropdown, .barra-categorias li.dropdown').forEach(dropdown => {
          dropdown.classList.remove('open');
          // Atualizar ARIA ao fechar
          try {
            const trigger = dropdown.querySelector('> a');
            const panel = dropdown.querySelector('.mega-menu');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
            if (panel) panel.setAttribute('aria-hidden', 'true');
          } catch (_) {}
        });
        // Fechar submenus antigos, se existirem
        document.querySelectorAll('.barra-categorias .tem-submenu').forEach(submenu => {
          submenu.classList.remove('active');
        });
      }
    });

    // Fechar menu ao pressionar ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        // Fechar todos os dropdowns
        document.querySelectorAll('.barra-categorias li.mega-dropdown, .barra-categorias li.dropdown').forEach(dropdown => {
          const estavaAberto = dropdown.classList.contains('open');
          dropdown.classList.remove('open');
          // Atualizar ARIA ao fechar
          try {
            const trigger = dropdown.querySelector('> a');
            const panel = dropdown.querySelector('.mega-menu');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
            if (panel) panel.setAttribute('aria-hidden', 'true');
            // Retornar foco ao trigger se estava aberto
            if (estavaAberto && trigger && typeof trigger.focus === 'function') {
              trigger.focus({ preventScroll: true });
            }
          } catch (_) {}
        });
        // Fechar submenus antigos, se existirem
        document.querySelectorAll('.barra-categorias .tem-submenu').forEach(submenu => {
          submenu.classList.remove('active');
        });
      }
    });
  }
  
  // ==================== SUPORTE PARA TOUCH/MOBILE ====================
  function adicionarSuporteTouch() {
    const links = document.querySelectorAll('.barra-categorias a');
    
    links.forEach(link => {
      // Adicionar classe para feedback visual no touch
      link.addEventListener('touchstart', function() {
        this.classList.add('touch-active');
      });
      
      link.addEventListener('touchend', function() {
        setTimeout(() => {
          this.classList.remove('touch-active');
        }, 150);
      });
      
      link.addEventListener('touchcancel', function() {
        this.classList.remove('touch-active');
      });
    });
    
    // Melhorar experiência touch para dropdowns
    const dropdowns = document.querySelectorAll('.barra-categorias li.mega-dropdown, .barra-categorias li.dropdown');
    dropdowns.forEach(dropdown => {
      dropdown.addEventListener('touchstart', function(e) {
        // Prevenir que outros eventos de touch interfiram
        e.stopPropagation();
      });
    });
  }
  
  // ==================== INICIALIZAÇÃO ====================
  function inicializar() {
    // Aguardar um pouco para garantir que o DOM esteja completamente carregado
    setTimeout(() => {
      ensureChatbotLoaded();
      corrigirDepartamentos();
      corrigirLinksCategoria();
      melhorarSubmenus();
      adicionarEventoFecharMenus();
      adicionarSuporteTouch();
      // Configurar toggle do tema se necessário (páginas que não injetam scripts do cabeçalho)
      try { configurarToggleTemaSeNecessario(); } catch (_) {}
      try {
        inicializarLoginBox();
      } catch (e) {
        // silencioso se login box não disponível
      }
    }, 100);
  }
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }
  
  // Reinicializar se o conteúdo for carregado dinamicamente
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Verificar se foram adicionados elementos relevantes
        const nodes = Array.from(mutation.addedNodes);
        const barraAdicionada = nodes.some(node => node.classList && node.classList.contains('barra-categorias'));
        const headerAdicionado = nodes.some(node => (node.tagName === 'NAV' && node.classList && node.classList.contains('cabecalho')) || (node.querySelector && node.querySelector('#btnDarkMode')));

        if (barraAdicionada) {
          console.log('Barra de categorias carregada dinamicamente, reaplicando melhorias...');
          setTimeout(inicializar, 100);
        }
        if (headerAdicionado) {
          // Quando o cabeçalho/toggle aparece, configurar o toggle de tema se necessário
          setTimeout(() => { try { configurarToggleTemaSeNecessario(); } catch (_) {} }, 50);
        }
      }
    });
  });
  
  // Observar mudanças no body
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();

// ==================== FUNÇÕES DE LOGIN NO CABEÇALHO ====================
function preventDefault(e) { e.preventDefault(); }

function obterPrimeiroNome(nomeCompleto) {
  if (!nomeCompleto || typeof nomeCompleto !== 'string') return '';
  const partes = nomeCompleto.trim().split(/\s+/);
  return partes[0] || '';
}

function inicializarLoginBox() {
  // Evitar múltiplas inicializações (idempotente)
  if (window.__loginBoxInit) {
    return;
  }
  const caixaLogin = document.getElementById('caixa-login');
  const statusLogin = document.getElementById('status-login');
  const subtextoLogin = document.getElementById('subtexto-login');
  const dropdownUsuario = document.getElementById('dropdown-usuario');
  const setaLogin = document.getElementById('seta-login');
  const botaoLogout = document.getElementById('botao-logout');

  if (!caixaLogin || !statusLogin || !subtextoLogin) return;

  // Ocultar completamente a caixinha nas páginas de autenticação (login e cadastro)
  try {
    const path = String(window.location.pathname || '');
    const isAuthPage = /(^|\/)(login|cadastro|login-vendedor|cadastro-vendedor)(\.html)?(\/?|\?|$)/i.test(path);
    if (isAuthPage) {
      caixaLogin.style.display = 'none';
      // Não prosseguir com inicialização de eventos/estado para evitar interferências
      return;
    }
  } catch (_) {}

  // A partir daqui, podemos marcar como iniciado com segurança
  window.__loginBoxInit = true;

  // Remover vestígios de autenticação do localStorage
  try {
    ['token','usuario','emailCadastro','dadosVerificacao','emailVerificado'].forEach(k => localStorage.removeItem(k));
  } catch {}

  let API_BASE = (window.API_BASE || window.location.origin);
  // Removido AbortController para evitar net::ERR_ABORTED no console

  // Utilitários de sessão local do vendedor (fallback)
  const getPerfilVendedorLocal = () => {
    try { return JSON.parse(localStorage.getItem('vendedor:perfil')); } catch { return null; }
  };
  const isVendedorLocal = () => {
    try { return localStorage.getItem('auth:vendor') === '1' || !!localStorage.getItem('vendedor:perfil'); } catch { return false; }
  };
  const limparSessaoVendedorLocal = () => {
    try {
      localStorage.removeItem('auth:vendor');
      localStorage.removeItem('vendedor:perfil');
    } catch {}
  };

  // Utilitários de sessão local do cliente (fallback)
  const getPerfilClienteLocal = () => {
    try { return JSON.parse(localStorage.getItem('cliente:perfil')); } catch { return null; }
  };
  const isClienteLocal = () => {
    try { return localStorage.getItem('auth:customer') === '1' || !!localStorage.getItem('cliente:perfil'); } catch { return false; }
  };
  const limparSessaoClienteLocal = () => {
    try {
      localStorage.removeItem('auth:customer');
      localStorage.removeItem('cliente:perfil');
    } catch {}
  };

  const aplicarNaoLogado = () => {
    statusLogin.textContent = 'Entre';
    subtextoLogin.textContent = 'Iniciar Sessão';
    const dropdownLogin = document.getElementById('dropdown-login');
    if (dropdownUsuario) dropdownUsuario.style.display = 'none';
    if (dropdownLogin) dropdownLogin.style.display = 'none';

    // Clique/toggle do dropdown de login (cliente/vendedor)
    caixaLogin.onclick = function(e) {
      // Permite que cliques em links internos naveguem normalmente
      const clicouEmLink = e.target && e.target.closest('#dropdown-login .opcoes-usuario a');
      if (clicouEmLink) return;
      e.preventDefault();
      if (!dropdownLogin) {
        try { if (authAbortController) authAbortController.abort(); } catch {}
        window.location.href = '/login';
        return;
      }
      const aberto = dropdownLogin.style.display === 'block';
      dropdownLogin.style.display = aberto ? 'none' : 'block';
      if (!aberto) {
        dropdownLogin.classList.add('aberta');
        caixaLogin.classList.add('open');
      } else {
        dropdownLogin.classList.remove('aberta');
        caixaLogin.classList.remove('open');
      }
      if (setaLogin) setaLogin.classList.toggle('aberta', !aberto);
    };
    // Ícone de seta para indicar dropdown
    if (setaLogin) {
      setaLogin.classList.remove('fa-arrow-right');
      setaLogin.classList.add('fa-chevron-down');
    }
    // Fechar dropdown ao clicar fora e dar suporte a teclado
    const fecharDropdownLogin = () => {
      const dropdownLoginEl = document.getElementById('dropdown-login');
      if (dropdownLoginEl) {
        dropdownLoginEl.style.display = 'none';
        dropdownLoginEl.classList.remove('aberta');
      }
      if (caixaLogin) caixaLogin.classList.remove('open');
      if (setaLogin) setaLogin.classList.remove('aberta');
    };
    if (!window.__dropdownLoginOutsideHandlerAdded) {
      document.addEventListener('click', (ev) => {
        if (!ev.target.closest('#caixa-login')) {
          fecharDropdownLogin();
        }
      });
      window.__dropdownLoginOutsideHandlerAdded = true;
    }
    caixaLogin.setAttribute('tabindex', '0');
    caixaLogin.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        caixaLogin.click();
      }
      if (ev.key === 'Escape') {
        fecharDropdownLogin();
      }
    });
    // Ocultar link de Configurações no rodapé para deslogados
    try {
      const linkConfigFooter = document.getElementById('link-configuracoes-footer');
      if (linkConfigFooter) linkConfigFooter.style.display = 'none';
      const linkHistoricoFooter = document.getElementById('link-historico-footer');
      if (linkHistoricoFooter) linkHistoricoFooter.style.display = 'none';
    } catch {}
  };

  // Estado padrão imediato: não logado, para navegação instantânea
  aplicarNaoLogado();

  // Prefetch leve dos assets da página de login para acelerar transição
  try {
    setTimeout(() => {
      const assets = [
        { href: '/login', rel: 'prefetch' },
        { href: 'css/login.css', rel: 'prefetch' },
        { href: 'js/login.js', rel: 'prefetch' },
        { href: '/login-vendedor', rel: 'prefetch' },
        { href: 'js/login-vendedor.js', rel: 'prefetch' }
      ];
      assets.forEach(({ href, rel }) => {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        document.head.appendChild(link);
      });
    }, 100);
  } catch {}

  const aplicarLogado = (usuario) => {
    const dropdownLogin = document.getElementById('dropdown-login');
    // Preferir nome do perfil local do vendedor se existir
    const perfilVend = getPerfilVendedorLocal();
    const perfilCli = getPerfilClienteLocal();
    const nome = perfilVend?.nome || perfilCli?.nome || usuario?.nome || usuario?.name || perfilVend?.email || perfilCli?.email || '';
    const primeiroNome = obterPrimeiroNome(nome) || (usuario?.email ? usuario.email.split('@')[0] : 'Usuário');
    statusLogin.textContent = `Olá, ${primeiroNome}!`;
    subtextoLogin.textContent = 'Minha Conta';
    // Atualizar avatar no cabeçalho, se disponível
    const avatarEl = document.getElementById('avatar-usuario');
    if (avatarEl) {
      let src = '/imagens/logos/avatar-roxo.svg';
      if (usuario && typeof usuario.avatar_base64 === 'string' && usuario.avatar_base64.startsWith('data:image/')) {
        src = usuario.avatar_base64;
      } else if (usuario && typeof usuario.foto_perfil === 'string' && usuario.foto_perfil.trim()) {
        src = usuario.foto_perfil;
      }
      avatarEl.src = src;
    }
    // Alterar seta para baixo indicando dropdown
    if (setaLogin) {
      setaLogin.classList.remove('fa-arrow-right');
      setaLogin.classList.add('fa-chevron-down');
    }

    // Inserir itens por role (vendedor/admin) acima de "Configurações"
    try {
      const opcoes = dropdownUsuario?.querySelector('.opcoes-usuario');
      if (opcoes) {
        const role = String(usuario && usuario.role || '').toLowerCase();
        const ehVendedor = role === 'vendedor' || isVendedorLocal();
        const ehAdmin = role === 'admin';

        // Painel do Vendedor
        const linkVend = opcoes.querySelector('#link-painel-vendedor');
        if (ehVendedor && !linkVend) {
          const aPainel = document.createElement('a');
          aPainel.href = '/painel-vendedor';
          aPainel.id = 'link-painel-vendedor';
          aPainel.innerHTML = '<i class="fa-solid fa-store"></i> Painel do Vendedor';
          const primeiroLink = opcoes.querySelector('a');
          if (primeiroLink) opcoes.insertBefore(aPainel, primeiroLink); else opcoes.appendChild(aPainel);
        } else if (!ehVendedor && linkVend) {
          linkVend.remove();
        }

        // Administração: Vendedores
        const linkAdminVend = opcoes.querySelector('#link-admin-vendedores');
        if (ehAdmin && !linkAdminVend) {
          const aAdmin = document.createElement('a');
          aAdmin.href = '/vendedores';
          aAdmin.id = 'link-admin-vendedores';
          aAdmin.innerHTML = '<i class="fa-solid fa-users-gear"></i> Vendedores';
          const primeiroLink = opcoes.querySelector('a');
          if ( primeiroLink) opcoes.insertBefore(aAdmin, primeiroLink); else opcoes.appendChild(aAdmin);
        } else if (!ehAdmin && linkAdminVend) {
          linkAdminVend.remove();
        }
      }
    } catch {}
    caixaLogin.onclick = function(e) {
      // Permitir navegação nos links do dropdown sem bloquear
      const clicouEmLink = e.target && e.target.closest('#dropdown-usuario .opcoes-usuario a');
      if (clicouEmLink) {
        return; // não prevenir o default, não togglar o dropdown
      }
      e.preventDefault();
      if (dropdownLogin) {
        dropdownLogin.style.display = 'none';
        dropdownLogin.classList.remove('aberta');
      }
      if (!dropdownUsuario) return;
      const aberto = dropdownUsuario.style.display === 'block';
      dropdownUsuario.style.display = aberto ? 'none' : 'block';
      if (!aberto) {
        dropdownUsuario.classList.add('aberta');
        caixaLogin.classList.add('open');
      } else {
        dropdownUsuario.classList.remove('aberta');
        caixaLogin.classList.remove('open');
      }
      if (setaLogin) setaLogin.classList.toggle('aberta', !aberto);
    };

    // Fechar dropdown ao clicar fora
    const fecharDropdownUsuario = () => {
      if (dropdownUsuario) {
        dropdownUsuario.style.display = 'none';
        dropdownUsuario.classList.remove('aberta');
      }
      if (caixaLogin) caixaLogin.classList.remove('open');
      if (setaLogin) setaLogin.classList.remove('aberta');
    };

    if (!window.__dropdownUsuarioOutsideHandlerAdded) {
      document.addEventListener('click', (ev) => {
        if (!ev.target.closest('#caixa-login')) {
          fecharDropdownUsuario();
        }
      });
      window.__dropdownUsuarioOutsideHandlerAdded = true;
    }

    // Suporte a teclado
    caixaLogin.setAttribute('tabindex', '0');
    caixaLogin.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        caixaLogin.click();
      }
      if (ev.key === 'Escape') {
        fecharDropdownUsuario();
      }
    });

    // Feedback visual em itens
    try {
      dropdownUsuario.querySelectorAll('.opcoes-usuario a').forEach(a => {
        a.addEventListener('mousedown', () => a.classList.add('pressed'));
        a.addEventListener('mouseup', () => a.classList.remove('pressed'));
        a.addEventListener('mouseleave', () => a.classList.remove('pressed'));
        a.addEventListener('touchstart', () => a.classList.add('pressed'));
        a.addEventListener('touchend', () => a.classList.remove('pressed'));
        a.addEventListener('click', (evt) => {
          // Impede que o clique borbulhe para o container e cancele a navegação
          evt.stopPropagation();
          fecharDropdownUsuario();
        });
      });
    } catch {}
    if (botaoLogout) {
      botaoLogout.addEventListener('click', async function(e) {
        e.preventDefault();
        try {
          await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch {}
        // limpar sessão local do vendedor
        limparSessaoVendedorLocal();
        limparSessaoClienteLocal();
        try { localStorage.setItem('auth:event', 'logout:' + Date.now()); } catch {}
        if (dropdownUsuario) dropdownUsuario.style.display = 'none';
        aplicarNaoLogado();
        window.location.href = '/login';
      });
    }
    // Mostrar link de Configurações no rodapé para logados
    try {
      const linkConfigFooter = document.getElementById('link-configuracoes-footer');
      if (linkConfigFooter) linkConfigFooter.style.display = '';
      const linkHistoricoFooter = document.getElementById('link-historico-footer');
      if (linkHistoricoFooter) linkHistoricoFooter.style.display = '';
    } catch {}

    // Removido: link do Painel Admin não existe mais
  };

  // Consultar usuário atual via cookie (backend) usando base única
  const checarAuth = async () => {
    if (window.__authCheckInFlight) return;
    window.__authCheckInFlight = true;
    try {
      const resp = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include', keepalive: true, cache: 'no-store' });
      const ok = resp && resp.ok;
      let data = null;
      if (ok) {
        try { data = await resp.json(); } catch { data = null; }
      }
      if (ok && data && data.success && data.user) {
        aplicarLogado(data.user);
      } else {
        // Fallback: vendedor ou cliente local
        const perfilVend = getPerfilVendedorLocal();
        const perfilCli = getPerfilClienteLocal();
        if (perfilVend) {
          aplicarLogado(perfilVend);
        } else if (perfilCli) {
          aplicarLogado(perfilCli);
        } else {
          aplicarNaoLogado();
        }
      }
    } catch (_) {
      // Fallback offline: vendedor ou cliente local
      const perfilVend = getPerfilVendedorLocal();
      const perfilCli = getPerfilClienteLocal();
      if (perfilVend) {
        aplicarLogado(perfilVend);
      } else if (perfilCli) {
        aplicarLogado(perfilCli);
      } else {
        aplicarNaoLogado();
      }
    } finally {
      window.__authCheckInFlight = false;
    }
  };
  // Evita checagem em páginas de autenticação para reduzir latência
  const isAuthPage = /(^|\/)(login|cadastro|login-vendedor|cadastro-vendedor)(\.html)?(\/?|\?|$)/i.test(window.location.pathname);
  if (!isAuthPage) {
    // Executa apenas uma vez imediatamente
    checarAuth();
  }
  // Revalida quando a aba volta ao foco ou quando há eventos de autenticação em outras abas
  try {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !isAuthPage) {
        checarAuth();
      }
    });
    window.addEventListener('storage', (e) => {
      const k = e && e.key ? String(e.key) : '';
      if (/^auth:/i.test(k) && !isAuthPage) {
        checarAuth();
      }
    });
  } catch {}
  // Removida revalidação periódica para evitar logs e requisições desnecessárias
}
