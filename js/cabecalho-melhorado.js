// ======================= CABEÇALHO MELHORADO ======================= 
// Desenvolvido por Gabriel (gabwvr)

document.addEventListener('DOMContentLoaded', function() {
  
  // ==================== CORREÇÃO DOS DEPARTAMENTOS ====================
  function corrigirDepartamentos() {
    const dropdownPrincipal = document.querySelector('.barra-categorias li.dropdown');
    const linkDepartamentos = document.querySelector('.barra-categorias li.dropdown > a');
    const submenuPrincipal = document.querySelector('.barra-categorias li.dropdown .submenu');
    
    if (dropdownPrincipal && linkDepartamentos && submenuPrincipal) {
      // Remover eventos anteriores
      linkDepartamentos.removeEventListener('click', preventDefault);
      
      let timeoutId = null;
      
      // Função para mostrar o submenu
      function mostrarSubmenu() {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        dropdownPrincipal.classList.add('open');
        submenuPrincipal.style.opacity = '1';
        submenuPrincipal.style.visibility = 'visible';
        submenuPrincipal.style.transform = 'translateY(0)';
      }
      
      // Função para esconder o submenu com delay
      function esconderSubmenu() {
        timeoutId = setTimeout(() => {
          dropdownPrincipal.classList.remove('open');
          submenuPrincipal.style.opacity = '0';
          submenuPrincipal.style.visibility = 'hidden';
          submenuPrincipal.style.transform = 'translateY(10px)';
        }, 150); // Delay de 150ms para permitir transição suave
      }
      
      // Hover no item principal (li.dropdown)
      dropdownPrincipal.addEventListener('mouseenter', mostrarSubmenu);
      dropdownPrincipal.addEventListener('mouseleave', esconderSubmenu);
      
      // Hover no submenu (garantir que continue visível)
      submenuPrincipal.addEventListener('mouseenter', mostrarSubmenu);
      submenuPrincipal.addEventListener('mouseleave', esconderSubmenu);
      
      // Clique no mobile/tablet
      linkDepartamentos.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isOpen = dropdownPrincipal.classList.contains('open');
        
        // Fechar todos os outros dropdowns
        document.querySelectorAll('.barra-categorias li.dropdown').forEach(item => {
          if (item !== dropdownPrincipal) {
            item.classList.remove('open');
            const submenu = item.querySelector('.submenu');
            if (submenu) {
              submenu.style.opacity = '0';
              submenu.style.visibility = 'hidden';
              submenu.style.transform = 'translateY(10px)';
            }
          }
        });
        
        // Toggle do dropdown atual
        if (isOpen) {
          esconderSubmenu();
        } else {
          mostrarSubmenu();
        }
      });
    }
  }
  
  // ==================== CORREÇÃO DOS LINKS DE CATEGORIAS ====================
  function corrigirLinksCategoria() {
    // Corrigir todos os links de categoria
    const linksCategoria = document.querySelectorAll('.barra-categorias .submenu a');
    
    linksCategoria.forEach(link => {
      // Verificar se o link tem href válido
      const href = link.getAttribute('href');
      
      if (href && href !== '#' && href !== '') {
        // Link válido - garantir que funcione
        link.addEventListener('click', function(e) {
          // Permitir navegação normal
          console.log('Navegando para:', href);
        });
      } else {
        // Link inválido - corrigir
        const textoLink = link.textContent.trim();
        const novoHref = `produtos.html?categoria=${encodeURIComponent(textoLink)}`;
        link.setAttribute('href', novoHref);
        
        console.log(`Link corrigido: "${textoLink}" -> ${novoHref}`);
      }
    });
    
    // Corrigir links principais de categoria
    const linksPrincipais = document.querySelectorAll('.barra-categorias > ul > li > a');
    
    linksPrincipais.forEach(link => {
      const href = link.getAttribute('href');
      
      if (href && href !== '#' && !href.includes('produtos.html')) {
        const textoLink = link.textContent.trim().replace(/\s+/g, ' ');
        const novoHref = `produtos.html?categoria=${encodeURIComponent(textoLink)}`;
        link.setAttribute('href', novoHref);
        
        console.log(`Link principal corrigido: "${textoLink}" -> ${novoHref}`);
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
        
        // Hover para mostrar/esconder submenu
        item.addEventListener('mouseenter', mostrarSubmenuItem);
        item.addEventListener('mouseleave', esconderSubmenuItem);
        
        // Hover no submenu (garantir que continue ativo)
        submenu.addEventListener('mouseenter', mostrarSubmenuItem);
        submenu.addEventListener('mouseleave', esconderSubmenuItem);
        
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
        document.querySelectorAll('.barra-categorias li.dropdown').forEach(dropdown => {
          dropdown.classList.remove('open');
          const submenu = dropdown.querySelector('.submenu');
          if (submenu) {
            submenu.style.opacity = '0';
            submenu.style.visibility = 'hidden';
            submenu.style.transform = 'translateY(10px)';
          }
        });
        
        // Fechar todos os submenus
        document.querySelectorAll('.barra-categorias .tem-submenu').forEach(submenu => {
          submenu.classList.remove('active');
        });
      }
    });
    
    // Fechar menu ao pressionar ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        // Fechar todos os dropdowns
        document.querySelectorAll('.barra-categorias li.dropdown').forEach(dropdown => {
          dropdown.classList.remove('open');
          const submenu = dropdown.querySelector('.submenu');
          if (submenu) {
            submenu.style.opacity = '0';
            submenu.style.visibility = 'hidden';
            submenu.style.transform = 'translateY(10px)';
          }
        });
        
        // Fechar todos os submenus
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
    const dropdowns = document.querySelectorAll('.barra-categorias li.dropdown');
    dropdowns.forEach(dropdown => {
      dropdown.addEventListener('touchstart', function(e) {
        // Prevenir que outros eventos de touch interfiram
        e.stopPropagation();
      });
    });
  }
  
  // ==================== INICIALIZAÇÃO ====================
  function inicializar() {
    console.log('Inicializando melhorias do cabeçalho...');
    
    // Aguardar um pouco para garantir que o DOM esteja completamente carregado
    setTimeout(() => {
      corrigirDepartamentos();
      corrigirLinksCategoria();
      melhorarSubmenus();
      adicionarEventoFecharMenus();
      adicionarSuporteTouch();
      
      console.log('Melhorias do cabeçalho aplicadas com sucesso!');
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
        // Verificar se foi adicionada a barra de categorias
        const barraAdicionada = Array.from(mutation.addedNodes).some(node => 
          node.classList && node.classList.contains('barra-categorias')
        );
        
        if (barraAdicionada) {
          console.log('Barra de categorias carregada dinamicamente, reaplicando melhorias...');
          setTimeout(inicializar, 100);
        }
      }
    });
  });
  
  // Observar mudanças no body
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// ==================== FUNÇÃO AUXILIAR ====================
function preventDefault(e) {
  e.preventDefault();
}