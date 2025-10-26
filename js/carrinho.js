// ===== Roxinho Shop - SISTEMA DE CARRINHO UNIFICADO =====
// Desenvolvido por Gabriel (gabwvr) 
// Sistema unificado de carrinho de compras e notificações
// Compatível com todas as páginas do website

/**
 * Configuração do Sistema de Carrinho
 */
const CONFIG_CARRINHO = {
  limiteFreteGratis: 99.0,
  custoFrete: 15.99,
  chaveArmazenamento: 'rooxyce-carrinho',
  cuponsDisponiveis: {
    'DESCONTO10': { codigo: 'DESCONTO10', desconto: 10, tipo: 'porcentagem', valorMinimo: 100 },
    'WELCOME50': { codigo: 'WELCOME50', desconto: 50, tipo: 'valor', valorMinimo: 200 },
    'FRETE15': { codigo: 'FRETE15', desconto: 15.99, tipo: 'frete', valorMinimo: 0 }
  }
};

/**
 * Estado Global do Carrinho
 */
let carrinho = [];
let produtosSelecionados = new Set();
let cupomAplicado = null;

/**
 * Inicialização do Sistema
 */
document.addEventListener('DOMContentLoaded', function() {
  carregarCarrinho();
  inicializarEventListeners();
  atualizarInterfaceCarrinho();
  atualizarContadorCarrinho();
  inicializarNotificacoes();
});

/**
 * Event Listeners
 */
function inicializarEventListeners() {
  // Checkbox selecionar todos
  const selecionarTodos = document.getElementById('selecionar-todos');
  if (selecionarTodos) {
    selecionarTodos.addEventListener('change', alternarSelecionarTodos);
  }

  // Botão selecionar todos
  const botaoSelecionarTodos = document.getElementById('botao-selecionar-todos');
  if (botaoSelecionarTodos) {
    botaoSelecionarTodos.addEventListener('click', alternarSelecionarTodos);
  }

  // Campo de cupom
  const inputCupom = document.getElementById('input-cupom');
  if (inputCupom) {
    inputCupom.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        aplicarCupomDoInput();
      }
    });
  }

  // Botão aplicar cupom
  const botaoAplicarCupom = document.getElementById('aplicar-cupom');
  if (botaoAplicarCupom) {
    botaoAplicarCupom.addEventListener('click', aplicarCupomDoInput);
  }

  // Botão remover cupom
  const botaoRemoverCupom = document.getElementById('remover-cupom');
  if (botaoRemoverCupom) {
    botaoRemoverCupom.addEventListener('click', removerCupom);
  }

  // Botões de cupons disponíveis
  document.querySelectorAll('.botao-cupom-disponivel').forEach(botao => {
    botao.addEventListener('click', () => {
      const codigo = botao.getAttribute('data-cupom');
      if (inputCupom) {
        inputCupom.value = codigo;
      }
    });
  });

  // Botão finalizar compra
  const botaoFinalizar = document.getElementById('finalizar-compra');
  if (botaoFinalizar) {
    botaoFinalizar.addEventListener('click', processarCheckout);
  }
}

/**
 * Funções de Gerenciamento do Carrinho
 */
function adicionarAoCarrinho(idProduto, quantidade = 1) {
  const produto = buscarProdutoPorId(idProduto);
  if (!produto) {
    mostrarNotificacao('Produto não encontrado!', 'erro');
    return false;
  }

  if (!produto.emEstoque) {
    mostrarNotificacao('Produto fora de estoque!', 'aviso');
    return false;
  }

  const itemExistente = carrinho.find(item => item.id === idProduto);
  
  if (itemExistente) {
    itemExistente.quantidade += quantidade;
  } else {
    carrinho.push({
      id: produto.id,
      nome: produto.nome,
      marca: produto.marca,
      preco: produto.preco,
      precoOriginal: produto.precoOriginal,
      imagem: produto.imagem,
      descricao: produto.descricao,
      quantidade: quantidade,
      desconto: produto.desconto || 0,
      freteGratis: produto.freteGratis || false
    });
    produtosSelecionados.add(idProduto);
  }

  salvarCarrinho();
  atualizarInterfaceCarrinho();
  atualizarContadorCarrinho();
  
  mostrarNotificacao(`${produto.nome} adicionado ao carrinho!`, 'sucesso');
  return true;
}

function removerDoCarrinho(idProduto) {
  const index = carrinho.findIndex(item => item.id === idProduto);
  if (index > -1) {
    const produto = carrinho[index];
    carrinho.splice(index, 1);
    produtosSelecionados.delete(idProduto);
    
    salvarCarrinho();
    atualizarInterfaceCarrinho();
    atualizarContadorCarrinho();
    
    mostrarNotificacao(`${produto.nome} removido do carrinho!`, 'sucesso');
  }
}

function atualizarQuantidade(idProduto, novaQuantidade) {
  if (novaQuantidade <= 0) {
    removerDoCarrinho(idProduto);
    return;
  }

  const item = carrinho.find(item => item.id === idProduto);
  if (item) {
    item.quantidade = novaQuantidade;
    salvarCarrinho();
    atualizarInterfaceCarrinho();
    atualizarContadorCarrinho();
  }
}

function alternarSelecaoProduto(idProduto) {
  if (produtosSelecionados.has(idProduto)) {
    produtosSelecionados.delete(idProduto);
  } else {
    produtosSelecionados.add(idProduto);
  }
  
  salvarCarrinho();
  atualizarInterfaceCarrinho();
}

function alternarSelecionarTodos() {
  const todosSelecionados = carrinho.every(item => produtosSelecionados.has(item.id));
  
  if (todosSelecionados) {
    produtosSelecionados.clear();
  } else {
    carrinho.forEach(item => produtosSelecionados.add(item.id));
  }
  
  salvarCarrinho();
  atualizarInterfaceCarrinho();
}

/**
 * Funções de Cálculo
 */
function calcularSubtotal() {
  return carrinho
    .filter(item => produtosSelecionados.has(item.id))
    .reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

function calcularDesconto() {
  if (!cupomAplicado) return 0;

  const subtotal = calcularSubtotal();
  const { desconto, tipo } = cupomAplicado;

  switch (tipo) {
    case 'porcentagem':
      return (subtotal * desconto) / 100;
    case 'valor':
      return Math.min(desconto, subtotal);
    case 'frete':
      return 0; // Desconto de frete é tratado separadamente
    default:
      return 0;
  }
}

function calcularFrete() {
  if (cupomAplicado && cupomAplicado.tipo === 'frete') {
    return 0;
  }
  
  const subtotal = calcularSubtotal();
  return subtotal >= CONFIG_CARRINHO.limiteFreteGratis ? 0 : CONFIG_CARRINHO.custoFrete;
}

function calcularTotal() {
  return calcularSubtotal() - calcularDesconto() + calcularFrete();
}

function obterTotalItens() {
  return carrinho.reduce((total, item) => total + item.quantidade, 0);
}

function obterItensSelecionados() {
  return carrinho
    .filter(item => produtosSelecionados.has(item.id))
    .reduce((total, item) => total + item.quantidade, 0);
}

/**
 * Funções de Interface
 */
function atualizarInterfaceCarrinho() {
  const temProdutos = carrinho.length > 0;
  
  // Mostrar/ocultar seções
  const carrinhoVazio = document.getElementById('carrinho-vazio');
  const conteudoCarrinho = document.getElementById('conteudo-carrinho');
  
  if (carrinhoVazio) carrinhoVazio.style.display = temProdutos ? 'none' : 'flex';
  if (conteudoCarrinho) conteudoCarrinho.style.display = temProdutos ? 'block' : 'none';

  if (!temProdutos) return;

  // Atualizar contadores
  atualizarContadores();
  
  // Renderizar produtos
  renderizarProdutos();
  
  // Atualizar checkbox selecionar todos
  atualizarCheckboxSelecionarTodos();
  
  // Atualizar resumo
  atualizarResumo();
  
  // Atualizar cupom
  atualizarSecaoCupom();
}

function atualizarContadores() {
  const totalItens = obterTotalItens();
  const itensSelecionados = obterItensSelecionados();
  
  // Elementos de contagem
  const elementos = {
    'total-itens': totalItens,
    'total-itens-subtitulo': totalItens,
    'itens-selecionados': itensSelecionados,
    'status-selecao': `${itensSelecionados} de ${totalItens} selecionados`
  };
  
  Object.entries(elementos).forEach(([id, valor]) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
  });
}

function renderizarProdutos() {
  const listaProdutos = document.getElementById('lista-produtos');
  if (!listaProdutos) return;
  
  listaProdutos.innerHTML = carrinho.map(item => criarHTMLProduto(item)).join('');
}

function obterImagemProduto(item) {
  // Tentar usar a imagem original primeiro
  if (item.imagem && (item.imagem.startsWith('http') || item.imagem.startsWith('./'))) {
    return item.imagem;
  }
  
  // Fallback para placeholder baseado no ID do produto
  const cores = ['7c3aed', '3b82f6', '10b981', 'f59e0b', 'ef4444', '8b5cf6'];
  const cor = cores[item.id % cores.length];
  const nomeEncoded = encodeURIComponent(item.nome.substring(0, 8));
  
  return `https://via.placeholder.com/96x96/${cor}/ffffff?text=${nomeEncoded}`;
}

function criarHTMLProduto(item) {
  const estaSelecionado = produtosSelecionados.has(item.id);
  const precoOriginal = item.precoOriginal || item.preco * 1.2;
  const imagemSrc = obterImagemProduto(item);
  
  return `
    <div class="item-produto ${estaSelecionado ? 'selecionado' : ''}" id="produto-${item.id}">
      <div class="conteudo-item">
        <div class="checkbox-item">
          <input type="checkbox" 
                 ${estaSelecionado ? 'checked' : ''} 
                 onchange="alternarSelecaoProduto(${item.id})">
        </div>

        <div class="container-imagem">
          <img src="${imagemSrc}" 
               alt="${item.nome}" 
               class="imagem-produto"
               loading="lazy"
               onerror="this.src='https://via.placeholder.com/96x96/7c3aed/ffffff?text=Produto'">
          ${item.desconto > 0 ? `<div class="selo-desconto">-${item.desconto}%</div>` : ''}
        </div>

        <div class="detalhes-produto">
          <div class="cabecalho-produto">
            <div class="info-produto">
              <h3 class="nome-produto">${item.nome}</h3>
              <p class="descricao-produto">${item.descricao || 'Produto de qualidade da ' + item.marca}</p>
              
              <div class="caracteristicas-produto">
                <span class="caracteristica disponivel">✓ Disponível</span>
                ${item.freteGratis ? '<span class="caracteristica">🚚 Frete Grátis</span>' : ''}
                <span class="caracteristica">${item.marca}</span>
              </div>
            </div>

            <div class="acoes-produto">
              <button class="botao-acao botao-favoritar" title="Favoritar">
                <i class="fas fa-heart"></i>
              </button>
              <button class="botao-acao botao-remover" 
                      onclick="removerDoCarrinho(${item.id})" 
                      title="Remover">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div class="secao-preco-quantidade">
            <div class="container-precos">
              <div class="linha-precos">
                <span class="preco-atual">${formatarPreco(item.preco)}</span>
                ${item.precoOriginal ? 
                  `<span class="preco-original">${formatarPreco(precoOriginal)}</span>` : ''
                }
              </div>
              ${item.quantidade > 1 ? 
                `<div class="preco-unitario">${formatarPreco(item.preco)} por unidade</div>` : ''
              }
            </div>

            <div class="controles-quantidade">
              <button class="botao-quantidade" 
                      onclick="atualizarQuantidade(${item.id}, ${item.quantidade - 1})"
                      ${item.quantidade <= 1 ? 'disabled' : ''}>
                <i class="fas fa-minus"></i>
              </button>
              
              <span class="quantidade-atual">${item.quantidade}</span>
              
              <button class="botao-quantidade" 
                      onclick="atualizarQuantidade(${item.id}, ${item.quantidade + 1})">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>

          ${item.quantidade > 1 ? `
            <div class="subtotal-item">
              <span class="texto-subtotal">Subtotal (${item.quantidade} itens):</span>
              <span class="valor-subtotal">${formatarPreco(item.preco * item.quantidade)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function atualizarCheckboxSelecionarTodos() {
  const checkboxSelecionarTodos = document.getElementById('selecionar-todos');
  const botaoSelecionarTodos = document.getElementById('botao-selecionar-todos');
  const textoSelecionar = document.getElementById('texto-selecionar');

  if (!checkboxSelecionarTodos || !botaoSelecionarTodos || !textoSelecionar) return;

  const todosSelecionados = carrinho.every(item => produtosSelecionados.has(item.id));

  checkboxSelecionarTodos.checked = todosSelecionados;

  if (todosSelecionados) {
    textoSelecionar.textContent = 'Desmarcar Todos';
    botaoSelecionarTodos.innerHTML = `
      <i class="fas fa-check-circle"></i>
      Desmarcar Todos
    `;
  } else {
    textoSelecionar.textContent = 'Selecionar Todos';
    botaoSelecionarTodos.innerHTML = `
      <i class="fas fa-check-circle"></i>
      Selecionar Todos
    `;
  }
}

function atualizarResumo() {
  const subtotal = calcularSubtotal();
  const desconto = calcularDesconto();
  const frete = calcularFrete();
  const total = calcularTotal();
  const itensSelecionados = obterItensSelecionados();

  // Atualizar valores
  const elementos = {
    'subtotal-itens': itensSelecionados,
    'subtotal-texto': itensSelecionados === 1 ? 'item' : 'itens',
    'valor-subtotal': formatarPreco(subtotal),
    'valor-total': formatarPreco(total)
  };

  Object.entries(elementos).forEach(([id, valor]) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
  });

  // Atualizar desconto
  const linhaDesconto = document.getElementById('linha-desconto');
  const valorDesconto = document.getElementById('valor-desconto');
  if (linhaDesconto && valorDesconto) {
    if (desconto > 0) {
      linhaDesconto.style.display = 'flex';
      valorDesconto.textContent = `-${formatarPreco(desconto)}`;
    } else {
      linhaDesconto.style.display = 'none';
    }
  }

  // Atualizar frete
  const valorFrete = document.getElementById('valor-frete');
  if (valorFrete) {
    if (frete === 0) {
      valorFrete.textContent = 'Grátis';
      valorFrete.className = 'valor-frete gratis';
    } else {
      valorFrete.textContent = formatarPreco(frete);
      valorFrete.className = 'valor-frete';
    }
  }

  // Atualizar alerta de seleção
  atualizarAlertaSelecao(itensSelecionados);

  // Atualizar progresso de frete
  atualizarProgressoFrete(subtotal);

  // Atualizar botão finalizar
  const botaoFinalizar = document.getElementById('finalizar-compra');
  if (botaoFinalizar) {
    botaoFinalizar.disabled = itensSelecionados === 0;
  }
}

function atualizarAlertaSelecao(itensSelecionados) {
  const alerta = document.getElementById('alerta-selecao');
  const textoAlerta = document.getElementById('texto-alerta');
  const totalItens = obterTotalItens();

  if (!alerta || !textoAlerta) return;

  if (itensSelecionados === 0) {
    alerta.style.display = 'block';
    textoAlerta.textContent = 'Nenhum item selecionado';
  } else if (itensSelecionados !== totalItens) {
    alerta.style.display = 'block';
    textoAlerta.textContent = `${totalItens - itensSelecionados} itens não selecionados`;
  } else {
    alerta.style.display = 'none';
  }
}

function atualizarProgressoFrete(subtotal) {
  const progressoFrete = document.getElementById('progresso-frete');
  
  if (!progressoFrete) return;

  if (subtotal > 0) {
    progressoFrete.style.display = 'block';

    const porcentagem = Math.min((subtotal / CONFIG_CARRINHO.limiteFreteGratis) * 100, 100);
    const restante = Math.max(CONFIG_CARRINHO.limiteFreteGratis - subtotal, 0);

    const porcentagemFrete = document.getElementById('porcentagem-frete');
    const progressoBarra = document.getElementById('progresso-barra');
    const textoFrete = document.getElementById('texto-frete');

    if (porcentagemFrete) porcentagemFrete.textContent = `${Math.round(porcentagem)}%`;
    if (progressoBarra) progressoBarra.style.width = `${porcentagem}%`;

    if (textoFrete) {
      if (restante > 0) {
        textoFrete.textContent = `Faltam ${formatarPreco(restante)} para frete grátis!`;
      } else {
        textoFrete.textContent = 'Parabéns! Você ganhou frete grátis!';
      }
    }
  } else {
    progressoFrete.style.display = 'none';
  }
}

/**
 * Funções de Cupom
 */
function atualizarSecaoCupom() {
  const cupomAplicadoDiv = document.getElementById('cupom-aplicado');
  const formularioCupom = document.getElementById('formulario-cupom');
  const itensSelecionados = obterItensSelecionados();

  if (!cupomAplicadoDiv || !formularioCupom) return;

  // Desabilitar seção se nenhum item selecionado
  const secaoCupom = document.getElementById('secao-cupom');
  if (secaoCupom) {
    secaoCupom.style.opacity = itensSelecionados === 0 ? '0.5' : '1';
    secaoCupom.style.pointerEvents = itensSelecionados === 0 ? 'none' : 'auto';
  }

  if (cupomAplicado) {
    cupomAplicadoDiv.style.display = 'flex';
    formularioCupom.style.display = 'none';
    
    const codigoAplicado = document.getElementById('codigo-aplicado');
    if (codigoAplicado) {
      codigoAplicado.textContent = cupomAplicado.codigo;
    }
  } else {
    cupomAplicadoDiv.style.display = 'none';
    formularioCupom.style.display = 'block';
    
    const inputCupom = document.getElementById('input-cupom');
    if (inputCupom) {
      inputCupom.value = '';
    }
  }
}

async function aplicarCupomDoInput() {
  const inputCupom = document.getElementById('input-cupom');
  if (!inputCupom) return;

  const codigo = inputCupom.value.trim().toUpperCase();
  if (!codigo) return;

  await aplicarCupom(codigo);
}

async function aplicarCupom(codigoCupom) {
  const botaoAplicar = document.getElementById('aplicar-cupom');
  if (!botaoAplicar) return false;

  // Mostrar carregamento
  mostrarCarregamentoCupom(true);

  // Simular validação
  await new Promise(resolve => setTimeout(resolve, 800));

  const cupom = CONFIG_CARRINHO.cuponsDisponiveis[codigoCupom];
  
  if (!cupom) {
    mostrarCarregamentoCupom(false);
    mostrarNotificacao('Cupom inválido!', 'erro');
    return false;
  }

  const subtotal = calcularSubtotal();
  if (cupom.valorMinimo && subtotal < cupom.valorMinimo) {
    mostrarCarregamentoCupom(false);
    mostrarNotificacao(`Valor mínimo de ${formatarPreco(cupom.valorMinimo)} não atingido!`, 'aviso');
    return false;
  }

  cupomAplicado = cupom;
  salvarCarrinho();
  mostrarCarregamentoCupom(false);
  atualizarInterfaceCarrinho();
  mostrarNotificacao('Cupom aplicado com sucesso!', 'sucesso');
  
  return true;
}

function removerCupom() {
  cupomAplicado = null;
  salvarCarrinho();
  atualizarInterfaceCarrinho();
  mostrarNotificacao('Cupom removido!', 'sucesso');
}

function mostrarCarregamentoCupom(mostrar) {
  const botao = document.getElementById('aplicar-cupom');
  if (!botao) return;

  const textoSpan = botao.querySelector('.texto-botao');
  const carregamentoDiv = botao.querySelector('.carregamento');

  if (textoSpan && carregamentoDiv) {
    if (mostrar) {
      textoSpan.style.display = 'none';
      carregamentoDiv.style.display = 'block';
      carregamentoDiv.classList.add('ativo');
      botao.disabled = true;
    } else {
      textoSpan.style.display = 'block';
      carregamentoDiv.style.display = 'none';
      carregamentoDiv.classList.remove('ativo');
      botao.disabled = false;
    }
  }
}

/**
 * Funções de Armazenamento
 */
function salvarCarrinho() {
  try {
    const dados = {
      carrinho: carrinho,
      produtosSelecionados: Array.from(produtosSelecionados),
      cupomAplicado: cupomAplicado
    };
    localStorage.setItem(CONFIG_CARRINHO.chaveArmazenamento, JSON.stringify(dados));
  } catch (erro) {
    console.warn('Erro ao salvar carrinho:', erro);
  }
}

function carregarCarrinho() {
  try {
    const dados = localStorage.getItem(CONFIG_CARRINHO.chaveArmazenamento);
    if (dados) {
      const carrinhoSalvo = JSON.parse(dados);
      carrinho = carrinhoSalvo.carrinho || [];
      produtosSelecionados = new Set(carrinhoSalvo.produtosSelecionados || []);
      cupomAplicado = carrinhoSalvo.cupomAplicado || null;
    }
  } catch (erro) {
    console.warn('Erro ao carregar carrinho:', erro);
    carrinho = [];
    produtosSelecionados = new Set();
    cupomAplicado = null;
  }
}

function limparCarrinho() {
  carrinho = [];
  produtosSelecionados.clear();
  cupomAplicado = null;
  salvarCarrinho();
  atualizarInterfaceCarrinho();
  atualizarContadorCarrinho();
}

/**
 * Funções de Navegação
 */
function continuarComprando() {
  // Voltar para a página anterior ou home
  if (document.referrer && document.referrer !== window.location.href) {
    window.history.back();
  } else {
    window.location.href = 'home.html';
  }
}

function processarCheckout() {
  const itensSelecionados = obterItensSelecionados();
  
  if (itensSelecionados === 0) {
    mostrarNotificacao('Selecione pelo menos um item para continuar!', 'aviso');
    return;
  }

  // Preparar dados do checkout
  const produtosSelecionadosArray = carrinho.filter(item => produtosSelecionados.has(item.id));
  const subtotal = calcularSubtotal();
  const desconto = calcularDesconto();
  const frete = calcularFrete();
  const total = calcularTotal();

  const dadosCheckout = {
    produtos: produtosSelecionadosArray,
    subtotal: subtotal,
    desconto: desconto,
    frete: frete,
    total: total,
    quantidadeTotal: itensSelecionados,
    cupomAplicado: cupomAplicado,
    compraDireta: false // Flag para indicar que veio do carrinho
  };

  // Salvar dados do checkout
  localStorage.setItem('dadosCheckout', JSON.stringify(dadosCheckout));

  mostrarNotificacao('Redirecionando para o checkout...', 'sucesso');
  
  setTimeout(() => {
    window.location.href = 'checkout.html';
  }, 1000);
}

/**
 * SISTEMA DE NOTIFICAÇÕES UNIFICADO
 */
function inicializarNotificacoes() {
  // Criar container de notificações se não existir
  if (!document.getElementById('container-notificacoes')) {
    criarContainerNotificacoes();
  }
  
  // Adicionar estilos CSS se não existirem
  if (!document.getElementById('estilos-notificacoes')) {
    adicionarEstilosNotificacoes();
  }
}

function criarContainerNotificacoes() {
  const container = document.createElement('div');
  container.id = 'container-notificacoes';
  container.className = 'container-notificacoes';
  document.body.appendChild(container);
  return container;
}

function adicionarEstilosNotificacoes() {
  const style = document.createElement('style');
  style.id = 'estilos-notificacoes';
  style.textContent = `
    .container-notificacoes {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
    }

    .notificacao {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      animation: deslizarEntrada 0.3s ease-out;
      position: relative;
      overflow: hidden;
    }

    .notificacao::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background-color: #7c3aed;
    }

    .notificacao.sucesso::before {
      background-color: #10b981;
    }

    .notificacao.erro::before {
      background-color: #ef4444;
    }

    .notificacao.aviso::before {
      background-color: #f59e0b;
    }

    .icone-notificacao {
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .notificacao.sucesso .icone-notificacao {
      color: #10b981;
    }

    .notificacao.erro .icone-notificacao {
      color: #ef4444;
    }

    .notificacao.aviso .icone-notificacao {
      color: #f59e0b;
    }

    .notificacao.info .icone-notificacao {
      color: #7c3aed;
    }

    .conteudo-notificacao {
      flex: 1;
    }

    .titulo-notificacao {
      font-weight: 600;
      font-size: 0.875rem;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .descricao-notificacao {
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.4;
    }

    .botao-fechar-notificacao {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 0.375rem;
      transition: all 0.15s ease-in-out;
      flex-shrink: 0;
    }

    .botao-fechar-notificacao:hover {
      color: #64748b;
      background-color: #f8fafc;
    }

    @keyframes deslizarEntrada {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes deslizarSaida {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    @media (max-width: 768px) {
      .container-notificacoes {
        left: 1rem;
        right: 1rem;
        max-width: none;
      }
    }
  `;
  document.head.appendChild(style);
}

function mostrarNotificacao(mensagem, tipo = 'info') {
  const container = document.getElementById('container-notificacoes') || criarContainerNotificacoes();
  
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao ${tipo}`;
  
  const icones = {
    sucesso: 'check-circle',
    erro: 'times-circle',
    aviso: 'exclamation-triangle',
    info: 'info-circle'
  };
  
  notificacao.innerHTML = `
    <i class="fas fa-${icones[tipo]} icone-notificacao"></i>
    <div class="conteudo-notificacao">
      <div class="titulo-notificacao">${mensagem}</div>
    </div>
    <button class="botao-fechar-notificacao" onclick="fecharNotificacao(this)">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  container.appendChild(notificacao);
  
  // Auto remover após 4 segundos
  setTimeout(() => {
    if (notificacao.parentNode) {
      notificacao.style.animation = 'deslizarSaida 0.3s ease-out forwards';
      setTimeout(() => {
        if (notificacao.parentNode) {
          notificacao.remove();
        }
      }, 300);
    }
  }, 4000);
}

function fecharNotificacao(botao) {
  const notificacao = botao.closest('.notificacao');
  if (notificacao) {
    notificacao.style.animation = 'deslizarSaida 0.3s ease-out forwards';
    setTimeout(() => {
      if (notificacao.parentNode) {
        notificacao.remove();
      }
    }, 300);
  }
}

/**
 * Função para atualizar contador do carrinho no cabeçalho
 */
function atualizarContadorCarrinho() {
  const contador = document.getElementById('contador-carrinho-cabecalho');
  const totalItens = obterTotalItens();
  
  if (contador) {
    contador.textContent = totalItens;
    contador.style.display = totalItens > 0 ? 'inline-block' : 'none';
  }
}

/**
 * Função para formatar preço
 */
function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Função para buscar produto por ID
 */
function buscarProdutoPorId(id) {
  // Verificar se a variável produtos existe
  if (typeof produtos !== 'undefined' && produtos) {
    return produtos.find(produto => produto.id === id);
  }
  
  // Fallback: criar produto básico se não encontrar
  return {
    id: id,
    nome: `Produto ${id}`,
    marca: 'Marca',
    preco: 99.99,
    imagem: '',
    descricao: 'Produto não encontrado',
    emEstoque: true,
    freteGratis: false,
    desconto: 0
  };
}

/**
 * Funções para compra direta (integração com outras páginas)
 */
function comprarDireto(produtoId) {
  const produto = buscarProdutoPorId(produtoId);
  
  if (!produto) {
    mostrarNotificacao('Produto não encontrado!', 'erro');
    return;
  }
  
  if (!produto.emEstoque) {
    mostrarNotificacao('Produto fora de estoque!', 'aviso');
    return;
  }
  
  // Criar dados do pedido para checkout direto
  const dadosCheckout = {
    produtos: [{
      id: produto.id,
      nome: produto.nome,
      marca: produto.marca,
      descricao: produto.descricao || `Produto de qualidade da ${produto.marca}`,
      preco: produto.preco,
      quantidade: 1,
      imagem: produto.imagem || 'imagens/default.png'
    }],
    subtotal: produto.preco,
    desconto: 0,
    frete: produto.freteGratis ? 0 : 15.99,
    total: produto.preco + (produto.freteGratis ? 0 : 15.99),
    quantidadeTotal: 1,
    compraDireta: true // Flag para indicar compra direta
  };
  
  // Salvar no localStorage
  localStorage.setItem('dadosCheckout', JSON.stringify(dadosCheckout));
  
  // Mostrar notificação e redirecionar
  mostrarNotificacao('Redirecionando para o checkout...', 'sucesso');
  
  setTimeout(() => {
    window.location.href = 'checkout.html';
  }, 1000);
}

/**
 * Função para adicionar produto ao carrinho (para uso em outras páginas)
 */
function adicionarProdutoAoCarrinho(idProduto) {
  const sucesso = adicionarAoCarrinho(idProduto, 1);
  if (sucesso) {
    // Produto adicionado com sucesso
    const produto = buscarProdutoPorId(idProduto);
    if (produto) {
      // Mostrar barra de confirmação se estivermos na home
      if (window.location.pathname.includes('home') || window.location.pathname === '/') {
        mostrarBarraConfirmacao(produto);
      }
    }
  }
}

/**
 * Função para mostrar barra de confirmação (para home)
 */
function mostrarBarraConfirmacao(produtoAdicionado) {
  // Remover barra existente se houver
  const barraExistente = document.getElementById('barra-confirmacao');
  if (barraExistente) {
    barraExistente.remove();
  }
  
  // Verificar se produtos está disponível para produtos relacionados
  let produtosRelacionados = [];
  if (typeof produtos !== 'undefined' && produtos) {
    produtosRelacionados = produtos
      .filter(p => p.categoria === produtoAdicionado.categoria && p.id !== produtoAdicionado.id && p.emEstoque)
      .slice(0, 3);
  }
  
  // Criar barra de confirmação
  const barra = document.createElement('div');
  barra.id = 'barra-confirmacao';
  barra.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    color: white;
    padding: 15px 20px;
    z-index: 10001;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    animation: slideDown 0.3s ease-out;
  `;
  
  let htmlRelacionados = '';
  if (produtosRelacionados.length > 0) {
    htmlRelacionados = `
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">
        <p style="margin-bottom: 8px; font-size: 14px;">Produtos relacionados:</p>
        <div style="display: flex; gap: 15px; flex-wrap: wrap;">
          ${produtosRelacionados.map(p => `
            <div style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); padding: 5px 10px; border-radius: 5px; cursor: pointer;" onclick="window.location.href='paginaproduto.html?id=${p.id}'">
              <span style="font-size: 12px;">${p.nome.substring(0, 30)}...</span>
              <span style="font-size: 12px; font-weight: bold;">R$ ${p.preco.toFixed(2).replace('.', ',')}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  barra.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; max-width: 1200px; margin: 0 auto;">
      <div style="display: flex; align-items: center; gap: 15px;">
        <i class="fas fa-check-circle" style="font-size: 20px; color: #10b981;"></i>
        <div>
          <p style="margin: 0; font-weight: bold;">Produto adicionado ao carrinho!</p>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">${produtoAdicionado.nome}</p>
          ${htmlRelacionados}
        </div>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button onclick="window.location.href='carrinho.html'" style="background: #eab308; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: bold;">
          Ver Carrinho
        </button>
        <button onclick="document.getElementById('barra-confirmacao').remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(barra);
  
  // Adicionar estilos para animações se não existirem
  if (!document.getElementById('barra-confirmacao-styles')) {
    const style = document.createElement('style');
    style.id = 'barra-confirmacao-styles';
    style.textContent = `
      @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
      }
      @keyframes slideUp {
        from { transform: translateY(0); }
        to { transform: translateY(-100%); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Auto remover após 8 segundos
  setTimeout(() => {
    if (barra.parentNode) {
      barra.style.animation = 'slideUp 0.3s ease-out forwards';
      setTimeout(() => {
        if (barra.parentNode) {
          barra.remove();
        }
      }, 300);
    }
  }, 8000);
}

/**
 * Exportar funções para uso global
 */
if (typeof window !== 'undefined') {
  window.adicionarAoCarrinho = adicionarAoCarrinho;
  window.removerDoCarrinho = removerDoCarrinho;
  window.atualizarQuantidade = atualizarQuantidade;
  window.alternarSelecaoProduto = alternarSelecaoProduto;
  window.alternarSelecionarTodos = alternarSelecionarTodos;
  window.aplicarCupom = aplicarCupom;
  window.removerCupom = removerCupom;
  window.continuarComprando = continuarComprando;
  window.processarCheckout = processarCheckout;
  window.limparCarrinho = limparCarrinho;
  window.atualizarContadorCarrinho = atualizarContadorCarrinho;
  window.fecharNotificacao = fecharNotificacao;
  window.formatarPreco = formatarPreco;
  window.mostrarNotificacao = mostrarNotificacao;
  window.comprarDireto = comprarDireto;
  window.adicionarProdutoAoCarrinho = adicionarProdutoAoCarrinho;
  window.mostrarBarraConfirmacao = mostrarBarraConfirmacao;
  window.buscarProdutoPorId = buscarProdutoPorId;
}
