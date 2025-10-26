// ===== Roxinho Shop - PÁGINA HOME ATUALIZADA =====
// Desenvolvido por Gabriel (gabwvr)
// Sistema da página home integrado com carrinho unificado
// Comentários didáticos para facilitar o entendimento

// ======================= BANNER CAROUSEL ======================= //

let slideAtual = 0;
let slides, indicadores;

function inicializarBanner() {
  slides = document.querySelectorAll('.banner-slide');
  indicadores = document.querySelectorAll('.banner-indicadores span');
  
  if (slides.length > 0) {
    mostrarSlide(0);
  }
}

function mostrarSlide(indice) {
  if (!slides || !indicadores) return;
  
  // Remover classe ativo de todos os slides e indicadores
  slides.forEach(slide => slide.classList.remove('ativo'));
  indicadores.forEach(indicador => indicador.classList.remove('ativo'));
  
  // Adicionar classe ativo ao slide e indicador atual
  if (slides[indice]) slides[indice].classList.add('ativo');
  if (indicadores[indice]) indicadores[indice].classList.add('ativo');
}

function proximoSlide() {
  if (!slides) return;
  slideAtual = (slideAtual + 1) % slides.length;
  mostrarSlide(slideAtual);
}

function slideAnterior() {
  if (!slides) return;
  slideAtual = (slideAtual - 1 + slides.length) % slides.length;
  mostrarSlide(slideAtual);
}

// ======================= PRODUTOS EM DESTAQUE ======================= //

// Função para renderizar produtos em destaque
function renderizarProdutosDestaque() {
  console.log('Renderizando produtos em destaque...');
  
  const container = document.getElementById('grade-produtos-home');
  
  if (!container) {
    console.error('Container grade-produtos-home não encontrado');
    return;
  }
  
  // Verificar se produtos está disponível
  if (typeof produtos === 'undefined' || !produtos || produtos.length === 0) {
    console.error('Array de produtos não encontrado ou vazio');
    container.innerHTML = `
      <div class="erro-produtos">
        <p>Produtos não disponíveis no momento.</p>
        <button onclick="location.reload()" class="btn-recarregar">Recarregar</button>
      </div>
    `;
    return;
  }
  
  // Filtrar apenas produtos em destaque
  const produtosDestaque = produtos.filter(produto => produto.destaque === true);
  
  // Se não houver produtos em destaque, usar os primeiros 8 produtos
  const produtosParaExibir = produtosDestaque.length > 0 ? produtosDestaque.slice(0, 8) : produtos.slice(0, 8);
  
  container.innerHTML = produtosParaExibir.map(produto => {
    const ehFavorito = false; // Sistema de favoritos pode ser implementado depois

    // Determinar como renderizar a imagem
    let imagemHTML = '';
    if (produto.imagem && ehURLImagem(produto.imagem)) {
      // Usar imagem real com fallback para gradiente
      imagemHTML = `
        <img src="${produto.imagem}" alt="${produto.nome}" class="imagem-produto-real" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="fundo-gradiente ${produto.imagemFallback || 'gradiente-roxo'}" style="display: none;"></div>
      `;
    } else {
      // Usar gradiente
      imagemHTML = `<div class="fundo-gradiente ${produto.imagemFallback || produto.imagem || 'gradiente-roxo'}"></div>`;
    }

    return `
      <a href="paginaproduto.html?id=${produto.id}" class="cartao-link">
        <div class="card-produto-home" data-produto-id="${produto.id}">
          <div class="produto-imagem">
            ${imagemHTML}
            <div class="badges-produto">
              ${!produto.emEstoque ? '<span class="badge indisponivel">Indisponível</span>' : ''}
            </div>
            <button class="botao-favorito ${ehFavorito ? 'ativo' : ''}" onclick="event.preventDefault(); event.stopPropagation(); alternarFavorito(${produto.id})">
              <i class="fas fa-heart"></i>
            </button>
          </div>
          
          <div class="produto-info">
            <div class="produto-marca">${produto.marca}</div>
            
            <h3 class="produto-nome">${produto.nome}</h3>
            
            <div class="produto-avaliacao">
              <div class="estrelas">
                ${gerarEstrelas(produto.avaliacao || 0)}
              </div>
              <span class="avaliacoes">(${produto.avaliacoes || 0})</span>
            </div>
            
            <div class="produto-precos">
              ${produto.precoOriginal ? `<span class="preco-original">R$ ${produto.precoOriginal.toFixed(2).replace('.', ',')}</span>` : ''}
              <div class="preco-atual">R$ ${produto.preco.toFixed(2).replace('.', ',')}</div>
              ${produto.desconto > 0 ? `<div class="percentual-desconto">-${produto.desconto}%</div>` : ''}
            </div>
            
            <div class="produto-parcelas">
              <span>12x de R$ ${(produto.preco / 12).toFixed(2).replace('.', ',')} sem juros</span>
            </div>
            
            <div class="produto-status">
              ${produto.emEstoque ? '<div class="status-item em-estoque"><i class="fas fa-check"></i> Em estoque</div>' : ''}
            </div>
          </div>

          <!-- Botões de Ação -->
          <div class="botoes-produto-home">
            <button class="btn-comprar-direto ${!produto.emEstoque ? 'disabled' : ''}" 
                    onclick="event.preventDefault(); event.stopPropagation(); ${produto.emEstoque ? `comprarDireto(${produto.id})` : 'mostrarNotificacao(\'Produto indisponível\', \'aviso\')'}"
                    ${!produto.emEstoque ? 'disabled' : ''}>
              <i class="fas fa-bolt"></i>
              Comprar
            </button>
            <button class="btn-adicionar-carrinho ${!produto.emEstoque ? 'disabled' : ''}" 
                    onclick="event.preventDefault(); event.stopPropagation(); ${produto.emEstoque ? `adicionarProdutoAoCarrinho(${produto.id})` : 'mostrarNotificacao(\'Produto indisponível\', \'aviso\')'}"
                    ${!produto.emEstoque ? 'disabled' : ''}>
              <i class="fas fa-cart-plus"></i>
              Carrinho
            </button>
          </div>
        </div>
      </a>
    `;
  }).join('');
  
  console.log(`${produtosDestaque.length} produtos em destaque renderizados`);
}

// Função auxiliar para verificar se é URL de imagem
function ehURLImagem(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Verifica se é uma URL válida
  if (url.startsWith('http') || url.startsWith('./') || url.startsWith('/')) {
    // Verifica extensões de imagem comuns
    const extensoesImagem = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return extensoesImagem.some(ext => url.toLowerCase().includes(ext));
  }
  
  return false;
}

// Sistema de favoritos (placeholder)
function alternarFavorito(produtoId) {
  // Implementação do sistema de favoritos pode ser adicionada aqui
  console.log(`Favorito alternado para produto ${produtoId}`);
  
  // Exemplo de implementação simples com localStorage
  let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
  const index = favoritos.indexOf(produtoId);
  
  if (index > -1) {
    favoritos.splice(index, 1);
  } else {
    favoritos.push(produtoId);
  }
  
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
  
  // Atualizar UI
  renderizarProdutosDestaque();
}

// Função para gerar estrelas de avaliação
function gerarEstrelas(nota) {
  let estrelas = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= nota) {
      estrelas += '<i class="fas fa-star"></i>';
    } else {
      estrelas += '<i class="far fa-star"></i>';
    }
  }
  return estrelas;
}

// Função para tentar carregar produtos várias vezes
function tentarCarregarProdutos(tentativas = 0) {
  const maxTentativas = 10;
  
  if (typeof produtos !== 'undefined' && produtos && produtos.length > 0) {
    renderizarProdutosDestaque();
    return;
  }
  
  if (tentativas < maxTentativas) {
    console.log(`Tentativa ${tentativas + 1} de carregar produtos...`);
    setTimeout(() => {
      tentarCarregarProdutos(tentativas + 1);
    }, 200);
  } else {
    console.error('Não foi possível carregar os produtos após', maxTentativas, 'tentativas');
    const container = document.getElementById('grade-produtos-home');
    if (container) {
      container.innerHTML = `
        <div class="erro-produtos">
          <p>Erro ao carregar produtos. Tente recarregar a página.</p>
          <button onclick="location.reload()" class="btn-recarregar">Recarregar</button>
        </div>
      `;
    }
  }
}

// ======================= INICIALIZAÇÃO ======================= //

// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  console.log('Home page carregada');
  
  // Inicializar banner
  inicializarBanner();
  
  // Event listeners para os botões do banner
  const btnProximo = document.getElementById('nextBtn');
  const btnAnterior = document.getElementById('prevBtn');
  
  if (btnProximo) btnProximo.addEventListener('click', proximoSlide);
  if (btnAnterior) btnAnterior.addEventListener('click', slideAnterior);
  
  // Event listeners para os indicadores
  setTimeout(() => {
    const indicadoresAtuais = document.querySelectorAll('.banner-indicadores span');
    indicadoresAtuais.forEach((indicador, indice) => {
      indicador.addEventListener('click', () => {
        slideAtual = indice;
        mostrarSlide(slideAtual);
      });
    });
  }, 100);
  
  // Auto-play do banner (opcional)
  setInterval(() => {
    if (slides && slides.length > 0) {
      proximoSlide();
    }
  }, 5000); // Muda slide a cada 5 segundos
  
  // Tentar carregar produtos
  tentarCarregarProdutos();
  
  // Event listeners para os botões da home
  document.addEventListener('click', function(e) {
    // Botão adicionar ao carrinho
    if (e.target.closest('.btn-adicionar-carrinho')) {
      e.preventDefault();
      const botao = e.target.closest('.btn-adicionar-carrinho');
      const produtoId = parseInt(botao.getAttribute('data-id'));
      
      if (produtoId && typeof adicionarAoCarrinho === 'function') {
        adicionarAoCarrinho(produtoId);
      } else {
        if (typeof mostrarNotificacao === 'function') {
          mostrarNotificacao('Função de carrinho não disponível', 'erro');
        }
      }
    }
    
    // Botão comprar direto
    if (e.target.closest('.btn-comprar-direto')) {
      e.preventDefault();
      const botao = e.target.closest('.btn-comprar-direto');
      const produtoId = parseInt(botao.getAttribute('data-id'));
      
      if (produtoId) {
        comprarDireto(produtoId);
      }
    }
  });
});

// Também tentar renderizar quando a janela carregar completamente
window.addEventListener('load', function() {
  setTimeout(() => {
    tentarCarregarProdutos();
  }, 300);
});

// Verificar periodicamente se os produtos foram carregados
const intervaloProdutos = setInterval(() => {
  if (typeof produtos !== 'undefined' && produtos && produtos.length > 0) {
    renderizarProdutosDestaque();
    clearInterval(intervaloProdutos);
  }
}, 500);

// Limpar o intervalo após 10 segundos para evitar loop infinito
setTimeout(() => {
  clearInterval(intervaloProdutos);
}, 10000);

// ======================= INICIALIZAÇÃO ======================= //

// Função para inicializar a página home
function inicializarHome() {
  console.log('Inicializando página home...');
  
  // Renderizar produtos em destaque
  if (typeof renderizarProdutosDestaque === 'function') {
    renderizarProdutosDestaque();
  }
  
  // Inicializar banner se existir
  if (typeof inicializarBanner === 'function') {
    inicializarBanner();
  }
  
  // Atualizar contador do carrinho
  if (typeof atualizarContadorCarrinho === 'function') {
    atualizarContadorCarrinho();
  }
  
  console.log('Página home inicializada com sucesso!');
}

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  // Aguardar um pouco para garantir que todos os scripts foram carregados
  setTimeout(inicializarHome, 100);
});

// Executar também quando a página for totalmente carregada
window.addEventListener('load', function() {
  // Verificar se os produtos já foram renderizados
  const container = document.getElementById('grade-produtos-home');
  if (container && container.children.length === 0) {
    console.log('Produtos não foram renderizados, tentando novamente...');
    setTimeout(inicializarHome, 200);
  }
});

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.inicializarHome = inicializarHome;
  window.renderizarProdutosDestaque = renderizarProdutosDestaque;
  window.alternarFavorito = alternarFavorito;
  window.gerarEstrelas = gerarEstrelas;
  window.tentarCarregarProdutos = tentarCarregarProdutos;
  window.ehURLImagem = ehURLImagem;
  window.proximoSlide = proximoSlide;
  window.slideAnterior = slideAnterior;
  window.mostrarSlide = mostrarSlide;
  window.inicializarBanner = inicializarBanner;
}
