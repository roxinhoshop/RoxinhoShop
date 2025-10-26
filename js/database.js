// ===== Roxinho Shop - E-COMMERCE DE ELETRÔNICOS =====
// Desenvolvido por Gabriel (gabwvr)
// Este arquivo contém funções para gerenciar [FUNCIONALIDADE]
// Comentários didáticos para facilitar o entendimento


const produtos = [
  {
    id: 1,
    nome: 'Placa de Vídeo RTX 4070 Super 12GB GDDR6X',
    marca: 'NVIDIA',
    preco: 3299.99,
    precoOriginal: 3699.99,
    avaliacao: 0,
    avaliacoes: 0,
    imagem: './imagens/thumbs/produto1.webp',
    categoria: 'Hardware',
    subcategoria: 'Placas de Vídeo',
    emEstoque: true,
    freteGratis: true,
    parcelamento: '12x de R$ 274,99',
    desconto: 11,
    destaque: true,
    tags: ['Gamer', 'Ray Tracing', '12GB VRAM'],
    condicao: 'Novo',
    garantia: '3 anos',
    descricao: 'Placa de vídeo de alto desempenho para games e criação de conteúdo com tecnologia Ray Tracing e 12GB de memória GDDR6X.',
    especificacoes: [
      { nome: 'Memória', valor: '12GB GDDR6X' },
      { nome: 'Interface', valor: 'PCI Express 4.0' },
      { nome: 'Conectores', valor: 'HDMI 2.1, 3x DisplayPort 1.4a' },
      { nome: 'Refrigeração', valor: 'Dual Fan' }
    ]
  },
  {
    id: 2,
    nome: 'Processador AMD Ryzen 7 7700X 4.5GHz',
    marca: 'AMD',
    preco: 1899.99,
    precoOriginal: 2199.99,
    avaliacao: 0, 
    avaliacoes: 0,
    imagem: './imagens/thumbs/produto2.webp',
    categoria: 'Hardware',
    subcategoria: 'Processadores',
    emEstoque: true,
    freteGratis: true,
    parcelamento: '10x de R$ 189,99',
    desconto: 14,
    destaque: true,
    tags: ['8 Cores', 'AM5', 'Gaming'],
    condicao: 'Novo',
    garantia: '3 anos',
    descricao: 'Processador de 8 núcleos e 16 threads para alto desempenho em jogos e tarefas intensivas, com socket AM5 e frequência de 4.5 GHz.',
    especificacoes: [
      { nome: 'Cores/Threads', valor: '8/16' },
      { nome: 'Frequência Base', valor: '4.5 GHz' },
      { nome: 'Socket', valor: 'AM5' },
      { nome: 'TDP', valor: '105W' }
    ]
  },
  {
    id: 3,
    nome: 'Smartphone Samsung Galaxy S24 Ultra 256GB',
    marca: 'Samsung',
    preco: 4999.99,
    precoOriginal: 5499.99,
    avaliacao: 0,
    avaliacoes: 0,
    imagem: './imagens/thumbs/produto3.jpg',
    imagemFallback: 'gradiente-azul',
    categoria: 'Celular & Smartphone',
    subcategoria: 'Smartphones',
    emEstoque: true,
    freteGratis: true,
    parcelamento: '12x de R$ 416,66',
    desconto: 9,
    destaque: true,
    tags: ['5G', '256GB', 'S Pen'],
    condicao: 'Novo',
    garantia: '1 ano',
    descricao: 'Smartphone premium com tela grande, 256GB de armazenamento, suporte 5G e S Pen para produtividade avançada.',
    especificacoes: [
      { nome: 'Armazenamento', valor: '256GB' },
      { nome: 'Conectividade', valor: '5G' },
      { nome: 'Caneta', valor: 'S Pen integrada' },
      { nome: 'Tela', valor: 'Dynamic AMOLED, 6.8 polegadas' }
    ]
  },
  {
    id: 4,
    nome: 'Notebook Gamer ASUS ROG Strix G15',
    marca: 'ASUS',
    preco: 6799.99,
    avaliacao: 0,
    avaliacoes: 0,
    imagem: './imagens/thumbs/produto4.jpg',
    categoria: 'Computadores',
    subcategoria: 'Notebooks',
    emEstoque: true,
    freteGratis: true,
    parcelamento: '12x de R$ 566,66',
    desconto: 0,
    destaque: true,
    tags: ['RTX 4060', '16GB RAM', '144Hz'],
    condicao: 'Novo',
    garantia: '1 ano',
    descricao: 'Notebook gamer com placa RTX 4060, 16GB RAM e tela 144Hz para alta performance em jogos.',
    especificacoes: [
      { nome: 'Placa de Vídeo', valor: 'NVIDIA RTX 4060' },
      { nome: 'Memória RAM', valor: '16GB' },
      { nome: 'Tela', valor: '15.6" Full HD 144Hz' },
      { nome: 'Processador', valor: 'AMD Ryzen 7' }
    ]
  },
  {
    id: 5,
    nome: 'Teclado Mecânico Logitech G Pro X',
    marca: 'Logitech',
    preco: 599.99,
    precoOriginal: 799.99,
    avaliacao: 0,
    avaliacoes: 0,
    imagem: './imagens/thumbs/produto5.jpg',
    categoria: 'Periféricos',
    subcategoria: 'Teclados',
    emEstoque: true,
    freteGratis: false,
    parcelamento: '6x de R$ 99,99',
    desconto: 25,
    destaque: true,
    tags: ['Mecânico', 'RGB', 'TKL'],
    condicao: 'Novo',
    garantia: '2 anos',
    descricao: 'Teclado mecânico compacto (TKL) com iluminação RGB personalizável e switches de alta performance.',
    especificacoes: [
      { nome: 'Tipo de Teclado', valor: 'Mecânico TKL' },
      { nome: 'Iluminação', valor: 'RGB personalizável' },
      { nome: 'Switches', valor: 'Hot-swappable' },
      { nome: 'Conectividade', valor: 'USB' }
    ]
  },
  {
    id: 6,
    nome: 'Console PlayStation 5 825GB',
    marca: 'Sony',
    preco: 3999.99,
    avaliacao: 0,
    avaliacoes: 0,
    imagem: './imagens/thumbs/produto6.webp',
    categoria: 'Games',
    subcategoria: 'Consoles',
    emEstoque: false,
    freteGratis: true,
    parcelamento: '12x de R$ 333,33',
    desconto: 0,
    tags: ['4K', 'SSD', 'Ray Tracing'],
    condicao: 'Novo',
    garantia: '1 ano',
    descricao: 'Console de nova geração com SSD ultra rápido, suporte a 4K e tecnologia Ray Tracing para gráficos realistas.',
    especificacoes: [
      { nome: 'Armazenamento', valor: '825GB SSD' },
      { nome: 'Resolução', valor: '4K UHD' },
      { nome: 'Tecnologia Gráfica', valor: 'Ray Tracing' },
      { nome: 'Formato', valor: 'Digital e físico (modelo padrão)' }
    ]
  },
  {
    id: 7,
    nome: 'Smart TV LG 65" 4K OLED',
    marca: 'LG',
    preco: 8999.99,
    precoOriginal: 10999.99,
    avaliacao: 0,
    avaliacoes: 0,
    imagem: './imagens/thumbs/produto7.webp',
    categoria: 'TV & Áudio',
    subcategoria: 'Smart TVs',
    emEstoque: true,
    freteGratis: true,
    parcelamento: '12x de R$ 749,99',
    desconto: 18,
    tags: ['OLED', '4K', 'WebOS'],
    condicao: 'Novo',
    garantia: '1 ano',
    descricao: 'Smart TV com tela OLED de 65 polegadas, resolução 4K e sistema WebOS para streaming e apps.',
    especificacoes: [
      { nome: 'Tela', valor: '65" OLED 4K UHD' },
      { nome: 'Sistema Operacional', valor: 'WebOS' },
      { nome: 'Conectividade', valor: 'Wi-Fi, Bluetooth' },
      { nome: 'HDR', valor: 'Dolby Vision, HDR10' }
    ]
  },
  {
    id: 8,
    nome: 'Cadeira Gamer DXRacer Formula Series',
    marca: 'DXRacer',
    preco: 1299.99,
    precoOriginal: 1599.99,
    avaliacao: 0,
    avaliacoes: 0,
    imagem: './imagens/thumbs/produto8.png',
    categoria: 'Espaço Gamer',
    subcategoria: 'Cadeiras Gamer',
    emEstoque: true,
    freteGratis: true,
    parcelamento: '10x de R$ 129,99',
    desconto: 19,
    tags: ['Ergonômica', 'Couro PU', 'Reclinável'],
    condicao: 'Novo',
    garantia: '2 anos',
    descricao: 'Cadeira gamer ergonômica com revestimento em couro PU, ajuste reclinável e suporte para longas sessões de uso.',
    especificacoes: [
      { nome: 'Material', valor: 'Couro PU' },
      { nome: 'Ergonomia', valor: 'Apoio lombar e cervical ajustável' },
      { nome: 'Reclinável', valor: 'Até 135 graus' },
      { nome: 'Base', valor: 'Metal reforçado' }
    ]
  },
  {
    id: 9,
    nome: 'Alexa Echo Dot 5ª Geração',
    marca: 'Amazon',
    preco: 299.99,
    precoOriginal: 399.99,
    avaliacao: 0,
    avaliacoes: 0,
    imagem: './imagens/thumbs/produto9.webp',
    categoria: 'Casa Inteligente',
    subcategoria: 'Assistentes Virtuais',
    emEstoque: true,
    freteGratis: true,
    parcelamento: '5x de R$ 59,99',
    desconto: 25,
    tags: ['Alexa', 'Smart Home', 'Bluetooth'],
    condicao: 'Novo',
    garantia: '1 ano',
    descricao: 'Assistente virtual Alexa para controle de casa inteligente, música e informação por comando de voz.',
    especificacoes: [
      { nome: 'Conectividade', valor: 'Wi-Fi e Bluetooth' },
      { nome: 'Compatibilidade', valor: 'Alexa Smart Home' },
      { nome: 'Áudio', valor: 'Alto-falante integrado HD' },
      { nome: 'Controle por Voz', valor: 'Suporte Alexa' }
    ]
  },
  {
    id: 10,
    nome: 'Mouse Gamer Razer DeathAdder V3',
    marca: 'Razer',
    preco: 349.99,
    precoOriginal: 449.99,
    avaliacao: 4.5,
    avaliacoes: 127,
    imagem: './imagens/thumbs/produto1.webp',
    categoria: 'Periféricos',
    subcategoria: 'Mouses',
    emEstoque: true,
    freteGratis: false,
    parcelamento: '6x de R$ 58,33',
    desconto: 22,
    destaque: false,
    tags: ['Gaming', 'RGB', 'Ergonômico'],
    condicao: 'Novo',
    garantia: '2 anos',
    descricao: 'Mouse gamer de alta precisão com sensor óptico avançado e design ergonômico.',
    especificacoes: [
      { nome: 'DPI', valor: '30.000 DPI' },
      { nome: 'Conectividade', valor: 'USB' },
      { nome: 'Iluminação', valor: 'RGB Chroma' },
      { nome: 'Botões', valor: '8 botões programáveis' }
    ]
  },
  {
    id: 11,
    nome: 'Headset HyperX Cloud II',
    marca: 'HyperX',
    preco: 599.99,
    precoOriginal: 799.99,
    avaliacao: 4.7,
    avaliacoes: 89,
    imagem: './imagens/thumbs/produto2.webp',
    categoria: 'Periféricos',
    subcategoria: 'Headsets',
    emEstoque: true,
    freteGratis: true,
    parcelamento: '8x de R$ 74,99',
    desconto: 25,
    destaque: false,
    tags: ['Gaming', '7.1 Surround', 'Confortável'],
    condicao: 'Novo',
    garantia: '2 anos',
    descricao: 'Headset gamer com som surround 7.1 virtual e microfone removível.',
    especificacoes: [
      { nome: 'Drivers', valor: '53mm' },
      { nome: 'Conectividade', valor: 'USB e P2' },
      { nome: 'Som Surround', valor: '7.1 Virtual' },
      { nome: 'Microfone', valor: 'Removível com cancelamento de ruído' }
    ]
  },
  {
    id: 12,
    nome: 'Monitor Gamer AOC 24" 144Hz',
    marca: 'AOC',
    preco: 899.99,
    precoOriginal: 1199.99,
    avaliacao: 4.3,
    avaliacoes: 156,
    imagem: './imagens/thumbs/produto3.jpg',
    categoria: 'Periféricos',
    subcategoria: 'Monitores',
    emEstoque: true,
    freteGratis: true,
    parcelamento: '10x de R$ 89,99',
    desconto: 25,
    destaque: false,
    tags: ['144Hz', 'Full HD', 'FreeSync'],
    condicao: 'Novo',
    garantia: '3 anos',
    descricao: 'Monitor gamer de 24 polegadas com taxa de atualização de 144Hz e tecnologia FreeSync.',
    especificacoes: [
      { nome: 'Tamanho', valor: '24 polegadas' },
      { nome: 'Resolução', valor: '1920x1080 Full HD' },
      { nome: 'Taxa de Atualização', valor: '144Hz' },
      { nome: 'Tecnologia', valor: 'AMD FreeSync' }
    ]
  },
  {
    id: 13,
    nome: 'SSD Kingston NV2 1TB',
    marca: 'Kingston',
    preco: 299.99,
    precoOriginal: 399.99,
    avaliacao: 4.4,
    avaliacoes: 203,
    imagem: './imagens/thumbs/produto4.jpg',
    categoria: 'Hardware',
    subcategoria: 'Armazenamento',
    emEstoque: true,
    freteGratis: false,
    parcelamento: '5x de R$ 59,99',
    desconto: 25,
    destaque: false,
    tags: ['NVMe', '1TB', 'PCIe 4.0'],
    condicao: 'Novo',
    garantia: '3 anos',
    descricao: 'SSD NVMe de 1TB com interface PCIe 4.0 para alta velocidade de transferência.',
    especificacoes: [
      { nome: 'Capacidade', valor: '1TB' },
      { nome: 'Interface', valor: 'PCIe 4.0 NVMe' },
      { nome: 'Velocidade Leitura', valor: 'Até 3.500 MB/s' },
      { nome: 'Formato', valor: 'M.2 2280' }
    ]
  },
  {
    id: 14,
    nome: 'Memória RAM Corsair 16GB DDR4',
    marca: 'Corsair',
    preco: 449.99,
    precoOriginal: 599.99,
    avaliacao: 4.6,
    avaliacoes: 178,
    imagem: './imagens/thumbs/produto5.jpg',
    categoria: 'Hardware',
    subcategoria: 'Memórias RAM',
    emEstoque: true,
    freteGratis: false,
    parcelamento: '6x de R$ 74,99',
    desconto: 25,
    destaque: false,
    tags: ['16GB', 'DDR4', '3200MHz'],
    condicao: 'Novo',
    garantia: 'Vitalícia',
    descricao: 'Kit de memória RAM DDR4 de 16GB (2x8GB) com frequência de 3200MHz.',
    especificacoes: [
      { nome: 'Capacidade', valor: '16GB (2x8GB)' },
      { nome: 'Tipo', valor: 'DDR4' },
      { nome: 'Frequência', valor: '3200MHz' },
      { nome: 'Latência', valor: 'CL16' }
    ]
  },
  {
    id: 15,
    nome: 'Fonte Seasonic 650W 80+ Gold',
    marca: 'Seasonic',
    preco: 699.99,
    precoOriginal: 899.99,
    avaliacao: 4.8,
    avaliacoes: 92,
    imagem: './imagens/thumbs/produto6.webp',
    categoria: 'Hardware',
    subcategoria: 'Fontes',
    emEstoque: true,
    freteGratis: true,
    parcelamento: '8x de R$ 87,49',
    desconto: 22,
    destaque: false,
    tags: ['650W', '80+ Gold', 'Modular'],
    condicao: 'Novo',
    garantia: '10 anos',
    descricao: 'Fonte de alimentação modular de 650W com certificação 80+ Gold.',
    especificacoes: [
      { nome: 'Potência', valor: '650W' },
      { nome: 'Certificação', valor: '80+ Gold' },
      { nome: 'Modularidade', valor: 'Totalmente modular' },
      { nome: 'Ventilador', valor: '120mm silencioso' }
    ]
  }
];

function formatarPreco(valor) {
  return valor
    .toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    })
    .replace(/\./g, ''); // remove os pontos de milhar
}

// Função para buscar produto por ID
function buscarProdutoPorId(id) {
  return produtos.find(produto => produto.id === parseInt(id));
}

// Função para obter produtos por categoria
function obterProdutosPorCategoria(categoria) {
  return produtos.filter(produto => produto.categoria === categoria);
}

// Função para renderizar produtos na página de produtos
function renderizarProdutos(produtosParaRenderizar = produtos) {
  const container = document.getElementById('grade-produtos');
  
  if (!container) {
    console.log('Container de produtos não encontrado');
    return;
  }
  
  container.innerHTML = produtosParaRenderizar.map(produto => `
    <div class="card-produto" data-id="${produto.id}">
      <div class="produto-imagem">
        <img src="${produto.imagem}" alt="${produto.nome}" onerror="this.src='img/produto-placeholder.jpg'">
        ${produto.desconto > 0 ? `<span class="badge-desconto">-${produto.desconto}%</span>` : ''}
        ${produto.freteGratis ? '<span class="badge-frete">Frete grátis</span>' : ''}
      </div>
      <div class="produto-info">
        <p class="produto-marca">${produto.marca}</p>
        <h3 class="produto-nome">${produto.nome}</h3>
        <div class="produto-avaliacao">
          <div class="estrelas">
            ${gerarEstrelas(produto.avaliacao)}
          </div>
          <span class="avaliacoes">(${produto.avaliacoes})</span>
        </div>
        <div class="produto-precos">
          ${produto.precoOriginal ? `<span class="preco-original">R$ ${produto.precoOriginal.toFixed(2).replace('.', ',')}</span>` : ''}
          <span class="preco-atual">R$ ${produto.preco.toFixed(2).replace('.', ',')}</span>
          ${produto.desconto > 0 ? `<span class="economia">Economize R$ ${(produto.precoOriginal - produto.preco).toFixed(2).replace('.', ',')}</span>` : ''}
        </div>
        <div class="produto-parcelas">
          <span>${produto.parcelamento}</span>
        </div>
        <div class="produto-status">
          ${produto.emEstoque ? '<span class="em-estoque">✓ Em estoque</span>' : '<span class="sem-estoque">✗ Fora de estoque</span>'}
          ${produto.freteGratis ? '<span class="frete-gratis">✓ Frete grátis</span>' : ''}
        </div>
        <div class="botoes-produto">
          <button class="btn-adicionar-carrinho" data-id="${produto.id}" ${!produto.emEstoque ? 'disabled' : ''}>
            <i class="fas fa-cart-plus"></i>
            Adicionar ao Carrinho
          </button>
          <button class="btn-comprar-direto" data-id="${produto.id}" ${!produto.emEstoque ? 'disabled' : ''}>
            <i class="fas fa-bolt"></i>
            Comprar Agora
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  console.log(`${produtosParaRenderizar.length} produtos renderizados`);
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

// Função para filtrar produtos por categoria
function filtrarPorCategoria(categoria) {
  if (categoria === 'todos') {
    renderizarProdutos(produtos);
  } else {
    const produtosFiltrados = produtos.filter(produto => 
      produto.categoria.toLowerCase() === categoria.toLowerCase()
    );
    renderizarProdutos(produtosFiltrados);
  }
  
  // Atualizar contador
  const contador = document.getElementById('contador-produtos');
  if (contador) {
    const total = categoria === 'todos' ? produtos.length : produtos.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase()).length;
    contador.textContent = `${total} produtos`;
  }
}

// Função para buscar produtos
function buscarProdutos(termo) {
  const termoLower = termo.toLowerCase();
  const produtosFiltrados = produtos.filter(produto => 
    produto.nome.toLowerCase().includes(termoLower) ||
    produto.marca.toLowerCase().includes(termoLower) ||
    produto.categoria.toLowerCase().includes(termoLower)
  );
  
  renderizarProdutos(produtosFiltrados);
  
  // Atualizar contador
  const contador = document.getElementById('contador-produtos');
  if (contador) {
    contador.textContent = `${produtosFiltrados.length} produtos encontrados`;
  }
}

// Função para ordenar produtos
function ordenarProdutos(criterio) {
  let produtosOrdenados = [...produtos];
  
  switch (criterio) {
    case 'menor-preco':
      produtosOrdenados.sort((a, b) => a.preco - b.preco);
      break;
    case 'maior-preco':
      produtosOrdenados.sort((a, b) => b.preco - a.preco);
      break;
    case 'nome-a-z':
      produtosOrdenados.sort((a, b) => a.nome.localeCompare(b.nome));
      break;
    case 'nome-z-a':
      produtosOrdenados.sort((a, b) => b.nome.localeCompare(a.nome));
      break;
    case 'maior-desconto':
      produtosOrdenados.sort((a, b) => b.desconto - a.desconto);
      break;
    default:
      // Manter ordem original
      break;
  }
  
  renderizarProdutos(produtosOrdenados);
}

// Função para comprar direto (vai para checkout)
function comprarDireto(produtoId) {
  const produto = produtos.find(p => p.id === produtoId);
  
  if (!produto) {
    alert('Produto não encontrado!');
    return;
  }
  
  if (!produto.emEstoque) {
    alert('Produto fora de estoque!');
    return;
  }
  
  // Criar dados do pedido para checkout
  const dadosCheckout = {
    produtos: [{
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco,
      quantidade: 1,
      imagem: produto.imagem || 'https://via.placeholder.com/60x60/7c3aed/ffffff?text=Produto'
    }],
    subtotal: produto.preco,
    desconto: 0,
    total: produto.preco,
    quantidadeTotal: 1
  };
  
  // Salvar no localStorage
  localStorage.setItem('dadosCheckout', JSON.stringify(dadosCheckout));
  
  // Redirecionar para checkout
  window.location.href = 'checkout.html';
}

// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  console.log('Produtos carregados:', produtos.length);
  
  // Se estiver na página de produtos, renderizar todos
  if (window.location.pathname.includes('produtos.html')) {
    renderizarProdutos();
    
    // Configurar busca
    const campoBusca = document.getElementById('busca-produtos');
    if (campoBusca) {
      campoBusca.addEventListener('input', function(e) {
        buscarProdutos(e.target.value);
      });
    }
    
    // Configurar ordenação
    const selectOrdenacao = document.getElementById('ordenacao');
    if (selectOrdenacao) {
      selectOrdenacao.addEventListener('change', function(e) {
        ordenarProdutos(e.target.value);
      });
    }
    
    // Configurar filtros de categoria
    const filtrosCategoria = document.querySelectorAll('[data-categoria]');
    filtrosCategoria.forEach(filtro => {
      filtro.addEventListener('click', function(e) {
        e.preventDefault();
        const categoria = this.getAttribute('data-categoria');
        filtrarPorCategoria(categoria);
        
        // Atualizar classe ativa
        filtrosCategoria.forEach(f => f.classList.remove('ativo'));
        this.classList.add('ativo');
      });
    });
  }
  
  // Event listeners para os novos botões
  document.addEventListener('click', function(e) {
    // Botão adicionar ao carrinho
    if (e.target.closest('.btn-adicionar-carrinho')) {
      e.preventDefault();
      const botao = e.target.closest('.btn-adicionar-carrinho');
      const produtoId = parseInt(botao.getAttribute('data-id'));
      
      if (produtoId && typeof adicionarAoCarrinho === 'function') {
        adicionarAoCarrinho(produtoId);
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

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.produtos = produtos;
  window.formatarPreco = formatarPreco;
  window.buscarProdutoPorId = buscarProdutoPorId;
  window.obterProdutosPorCategoria = obterProdutosPorCategoria;
  window.comprarDireto = comprarDireto;
}