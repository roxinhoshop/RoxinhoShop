// ===== Roxinho Shop - PÁGINA DO PRODUTO ATUALIZADA =====
// Desenvolvido por Gabriel (gabwvr)
// Sistema de avaliações da página do produto integrado com carrinho unificado
// Comentários didáticos para facilitar o entendimento

class SistemaAvaliacoes {
  constructor() {
    this.produtoAtual = null;
    this.avaliacoes = [];
    this.filtroAtivo = 'todas';
    this.ordenacaoAtiva = 'mais-recentes';
    this.paginaAtual = 1;
    this.itensPorPagina = 5;
    this.notaSelecionadaModal = 0;
    this.fotosUpload = [];
    
    this.inicializar();
  }

  // Inicialização do sistema
  inicializar() {
    this.carregarProdutoDaURL();
    this.configurarEventListeners();
    this.gerarAvaliacoesFalsas(); // Simula dados até implementar BD
  }

  // Carrega produto baseado no ID da URL
  carregarProdutoDaURL() {
    const params = new URLSearchParams(window.location.search);
    const idProduto = parseInt(params.get("id")) || 1;
    
    // Verifica se a variável produtos existe
    if (typeof produtos === 'undefined') {
      console.error('Array produtos não encontrado. Certifique-se de que produtos.js está carregado.');
      return;
    }
    
    this.produtoAtual = produtos.find(p => p.id === idProduto);
    
    if (this.produtoAtual) {
      this.renderizarProduto();
      this.carregarProdutosRelacionados();
    } else {
      console.error('Produto não encontrado:', idProduto);
      this.exibirErroProduto();
    }
  }

  // Exibe mensagem de erro quando produto não é encontrado
  exibirErroProduto() {
    const container = document.querySelector('.container-produto');
    if (container) {
      container.innerHTML = `
        <div class="erro-produto">
          <h2>Produto não encontrado</h2>
          <p>O produto que você está procurando não existe ou foi removido.</p>
          <a href="produtos.html" class="btn-voltar">Voltar aos produtos</a>
        </div>
      `;
    }
  }

  // Renderiza informações básicas do produto
  renderizarProduto() {
    const produto = this.produtoAtual;
    
    // Breadcrumb - com verificação de elemento
    const breadcrumb = document.getElementById("breadcrumb");
    if (breadcrumb) {
      breadcrumb.innerHTML = `
        <b class="texto-voce-esta-em">Você está em:</b>
        <a href="home.html" class="item-caminho">Home</a>
        <span class="separador">></span>
        <a href="produtos.html?categoria=${encodeURIComponent(produto.categoria || '')}" class="item-caminho">${produto.categoria || 'Categoria'}</a>
        <span class="separador">></span>
        <a href="produtos.html?categoria=${encodeURIComponent(produto.subcategoria || '')}" class="item-caminho">${produto.subcategoria || 'Subcategoria'}</a>
        <span class="separador">></span>
        <span class="codigo-prod">Código PROD${produto.id.toString().padStart(5,"0")}</span>
      `;
    }

    // Informações básicas - com verificações de elementos
    this.definirElementoTexto("imagemProduto", produto.imagem, 'src');
    this.definirElementoTexto("imagemProduto", produto.nome, 'alt');
    this.definirElementoTexto("marcaProduto", produto.marca || '');
    this.definirElementoTexto("nomeProduto", produto.nome || '');
    this.definirElementoTexto("descricaoProduto", produto.descricao || '');
    
    // Status de estoque
    this.definirElementoTexto("estoqueStatus", produto.emEstoque ? "● Em estoque" : "● Indisponível");
    this.definirElementoTexto("skuProduto", "SKU: PROD" + produto.id.toString().padStart(5,"0"));

    // Preços
    this.definirElementoTexto("precoProduto", "R$ " + produto.preco.toFixed(2).replace('.', ','));
    
    const precoOriginal = document.getElementById("precoOriginal");
    if (precoOriginal && produto.precoOriginal) {
      precoOriginal.textContent = "De R$ " + produto.precoOriginal.toFixed(2).replace('.', ',');
      precoOriginal.style.display = 'block';
    }
    
    const descontoProduto = document.getElementById("descontoProduto");
    if (descontoProduto && produto.desconto && produto.desconto > 0) {
      descontoProduto.textContent = "-" + produto.desconto + "%";
      descontoProduto.style.display = 'inline-block';
    }

    this.definirElementoTexto("parcelamentoProduto", `ou em até ${produto.parcelamento || "12x sem juros"}`);
    this.definirElementoTexto("freteProduto", produto.freteGratis ? "Grátis" : "Consultar valor");
    
    // Título da página
    document.title = `${produto.nome} | Roxinho Shop`;
  }

  // Função auxiliar para definir texto em elementos com verificação
  definirElementoTexto(id, valor, atributo = 'textContent') {
    const elemento = document.getElementById(id);
    if (elemento) {
      if (atributo === 'textContent') {
        elemento.textContent = valor;
      } else {
        elemento.setAttribute(atributo, valor);
      }
    }
  }

  // Carrega produtos relacionados usando o novo sistema de cartões
  carregarProdutosRelacionados() {
    if (typeof produtos === 'undefined') return;
    
    const relacionados = produtos
      .filter(p => p.id !== this.produtoAtual.id && p.categoria === this.produtoAtual.categoria)
      .slice(0, 4);

    const gradeRelacionados = document.getElementById('gradeRelacionados');
    if (!gradeRelacionados) return;

    gradeRelacionados.innerHTML = relacionados.map(produto => {
      const ehFavorito = this.verificarFavorito(produto.id);

      // Determinar como renderizar a imagem
      let imagemHTML = '';
      if (produto.imagem && this.ehURLImagem(produto.imagem)) {
        imagemHTML = `
          <img src="${produto.imagem}" alt="${produto.nome}" class="imagem-produto-real" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="fundo-gradiente ${produto.imagemFallback || 'gradiente-roxo'}" style="display: none;"></div>
        `;
      } else {
        imagemHTML = `<div class="fundo-gradiente ${produto.imagemFallback || produto.imagem || 'gradiente-roxo'}"></div>`;
      }

      return `
        <a href="paginaproduto.html?id=${produto.id}" class="cartao-link">
          <div class="cartao-produto" data-produto-id="${produto.id}">
            <div class="imagem-produto">
              ${imagemHTML}
              <button class="botao-favorito ${ehFavorito ? 'ativo' : ''}" 
                      onclick="event.preventDefault(); event.stopPropagation(); sistemaAvaliacoes.alternarFavorito(${produto.id})">
                <i class="fas fa-heart"></i>
              </button>
            </div>
            
            <div class="conteudo-produto">
              <div class="marca-produto">${produto.marca || ''}</div>
              
              <h3 class="nome-produto">${produto.nome}</h3>
              
              <div class="avaliacao-produto">
                <div class="estrelas">
                  ${this.gerarEstrelasCartao(produto.avaliacao || 0)}
                </div>
                <span class="numero-avaliacoes">(${produto.avaliacoes || 0})</span>
              </div>
              
              <div class="preco-produto">
                ${produto.precoOriginal ? `<span class="preco-original">R$ ${produto.precoOriginal.toFixed(2).replace('.', ',')}</span>` : ''}
                <div class="preco-atual">R$ ${produto.preco.toFixed(2).replace('.', ',')}</div>
                ${produto.desconto && produto.desconto > 0 ? `<span class="desconto-percentual">${produto.desconto}% OFF</span>` : ''}
              </div>
              
              <div class="parcelamento">${produto.parcelamento || '12x sem juros'}</div>
              
              <div class="status-produto">
                ${produto.emEstoque ? '<div class="status-item em-estoque2"><i class="fas fa-check"></i> Em estoque</div>' : ''}
                ${produto.freteGratis ? '<div class="status-item frete-gratis"><i class="fas fa-check"></i> Frete grátis</div>' : ''}
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
  }

  // Verifica se produto está nos favoritos
  verificarFavorito(produtoId) {
    try {
      const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
      return favoritos.includes(produtoId);
    } catch (error) {
      console.error('Erro ao verificar favoritos:', error);
      return false;
    }
  }

  // Função auxiliar para verificar se é URL de imagem
  ehURLImagem(url) {
    if (!url || typeof url !== 'string') return false;
    
    if (url.startsWith('http') || url.startsWith('./') || url.startsWith('/')) {
      const extensoesImagem = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      return extensoesImagem.some(ext => url.toLowerCase().includes(ext));
    }
    
    return false;
  }

  // Gera estrelas para cartão de produto
  gerarEstrelasCartao(nota) {
    let html = '';
    const notaArredondada = Math.round(nota);
    
    for (let i = 1; i <= 5; i++) {
      if (i <= notaArredondada) {
        html += '<i class="fas fa-star estrela"></i>';
      } else {
        html += '<i class="fas fa-star estrela vazia"></i>';
      }
    }
    
    return html;
  }

  // Sistema de favoritos
  alternarFavorito(produtoId) {
    try {
      let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
      const index = favoritos.indexOf(produtoId);
      
      if (index > -1) {
        favoritos.splice(index, 1);
      } else {
        favoritos.push(produtoId);
      }
      
      localStorage.setItem('favoritos', JSON.stringify(favoritos));
      
      // Atualizar UI
      const botao = document.querySelector(`[data-produto-id="${produtoId}"] .botao-favorito`);
      if (botao) {
        botao.classList.toggle('ativo');
      }

      // Mostrar feedback
      const produto = produtos.find(p => p.id === produtoId);
      const acao = favoritos.includes(produtoId) ? 'adicionado aos' : 'removido dos';
      if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao(`${produto?.nome || 'Produto'} ${acao} favoritos!`, 'info');
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
    }
  }

  // Gera avaliações falsas para demonstração
  gerarAvaliacoesFalsas() {
    const nomes = ['Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Costa', 'Luciana Ferreira', 'Roberto Lima', 'Patricia Souza', 'Diego Alves'];
    const comentarios = [
      'Excelente produto! Superou minhas expectativas. Entrega rápida e bem embalado.',
      'Muito bom, recomendo. Qualidade excelente pelo preço pago.',
      'Produto conforme descrito. Funciona perfeitamente, estou satisfeito com a compra.',
      'Ótimo custo-benefício. Chegou no prazo e veio bem protegido.',
      'Adorei! Já é a segunda vez que compro este produto. Sempre de boa qualidade.',
      'Bom produto, mas demorou um pouco para chegar. No mais, tudo ok.',
      'Perfeito! Exatamente como esperava. Recomendo para todos.',
      'Produto de qualidade, porém achei um pouco caro. Mas vale a pena.'
    ];

    this.avaliacoes = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      usuarioNome: nomes[Math.floor(Math.random() * nomes.length)],
      usuarioAvatar: nomes[Math.floor(Math.random() * nomes.length)].split(' ').map(n => n[0]).join(''),
      nota: Math.floor(Math.random() * 2) + 4, // Notas entre 4 e 5
      titulo: `Avaliação do ${nomes[Math.floor(Math.random() * nomes.length)].split(' ')[0]}`,
      comentario: comentarios[Math.floor(Math.random() * comentarios.length)],
      data: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
      compraVerificada: Math.random() > 0.3,
      fotos: Math.random() > 0.7 ? [this.produtoAtual?.imagem || ''] : [],
      uteis: Math.floor(Math.random() * 25),
      utilMarcado: false
    }));

    this.atualizarResumoAvaliacoes();
    this.renderizarAvaliacoes();
  }

  // Atualiza o resumo de avaliações (média, distribuição)
  atualizarResumoAvaliacoes() {
    const notaMediaEl = document.getElementById('notaMedia');
    const estrelasMediaEl = document.getElementById('estrelasMedia');
    const totalAvaliacoesEl = document.getElementById('totalAvaliacoes');

    if (this.avaliacoes.length === 0) {
      if (notaMediaEl) notaMediaEl.textContent = '0.0';
      if (estrelasMediaEl) estrelasMediaEl.innerHTML = '';
      if (totalAvaliacoesEl) totalAvaliacoesEl.textContent = 'Nenhuma avaliação ainda';
      return;
    }

    // Calcula média
    const soma = this.avaliacoes.reduce((acc, av) => acc + av.nota, 0);
    const media = soma / this.avaliacoes.length;
    
    if (notaMediaEl) notaMediaEl.textContent = media.toFixed(1);
    if (estrelasMediaEl) estrelasMediaEl.innerHTML = this.gerarEstrelas(Math.round(media));
    if (totalAvaliacoesEl) totalAvaliacoesEl.textContent = `${this.avaliacoes.length} avaliações`;

    // Distribuição por estrelas
    for (let i = 1; i <= 5; i++) {
      const count = this.avaliacoes.filter(av => av.nota === i).length;
      const percent = this.avaliacoes.length > 0 ? (count / this.avaliacoes.length) * 100 : 0;
      
      const barra = document.getElementById(`barra${i}`);
      const percentual = document.getElementById(`percentual${i}`);
      
      if (barra) barra.style.width = `${percent}%`;
      if (percentual) percentual.textContent = `${Math.round(percent)}%`;
    }
  }

  // Gera HTML das estrelas
  gerarEstrelas(nota) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += `<i class="fa-solid fa-star${i <= nota ? '' : ' estrela-inativa'}"></i>`;
    }
    return html;
  }

  // Renderiza lista de avaliações
  renderizarAvaliacoes() {
    const avaliacoesFiltradas = this.filtrarAvaliacoes();
    const avaliacoesOrdenadas = this.ordenarAvaliacoes(avaliacoesFiltradas);
    
    // Paginação
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    const avaliacoesPaginadas = avaliacoesOrdenadas.slice(inicio, fim);

    const listaAvaliacoes = document.getElementById('listaAvaliacoes');
    if (!listaAvaliacoes) return;
    
    if (avaliacoesPaginadas.length === 0) {
      listaAvaliacoes.innerHTML = `
        <div class="estado-vazio">
          <i class="fa-solid fa-star"></i>
          <h3>Nenhuma avaliação encontrada</h3>
          <p>Seja o primeiro a avaliar este produto!</p>
        </div>
      `;
    } else {
      listaAvaliacoes.innerHTML = avaliacoesPaginadas.map(avaliacao => `
        <div class="avaliacao-item">
          <div class="cabecalho-avaliacao">
            <div class="avatar-usuario">${avaliacao.usuarioAvatar}</div>
            <div class="info-usuario">
              <div class="nome-usuario">${avaliacao.usuarioNome}</div>
              <div class="meta-avaliacao">
                <div class="estrelas-avaliacao">${this.gerarEstrelas(avaliacao.nota)}</div>
                <span class="data-avaliacao">${this.formatarData(avaliacao.data)}</span>
                ${avaliacao.compraVerificada ? '<span class="compra-verificada">✓ Compra verificada</span>' : ''}
              </div>
              ${avaliacao.titulo ? `<div class="titulo-avaliacao">${avaliacao.titulo}</div>` : ''}
            </div>
          </div>
          <div class="conteudo-avaliacao">
            <p class="texto-avaliacao">${avaliacao.comentario}</p>
            ${avaliacao.fotos.length > 0 ? `
              <div class="fotos-avaliacao">
                ${avaliacao.fotos.map(foto => `<img src="${foto}" alt="Foto da avaliação" class="foto-avaliacao" onclick="abrirImagemModal('${foto}')">`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="acoes-avaliacao">
            <button class="btn-util ${avaliacao.utilMarcado ? 'ativo' : ''}" onclick="marcarUtil(${avaliacao.id})">
              <i class="fa-solid fa-thumbs-up"></i>
              Útil (${avaliacao.uteis})
            </button>
            <button class="btn-responder" onclick="responderAvaliacao(${avaliacao.id})">
              <i class="fa-solid fa-reply"></i>
              Responder
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  // Filtra avaliações baseado no filtro ativo
  filtrarAvaliacoes() {
    switch (this.filtroAtivo) {
      case 'todas':
        return this.avaliacoes;
      case '5':
      case '4':
      case '3':
      case '2':
      case '1':
        return this.avaliacoes.filter(av => av.nota === parseInt(this.filtroAtivo));
      case 'fotos':
        return this.avaliacoes.filter(av => av.fotos.length > 0);
      default:
        return this.avaliacoes;
    }
  }

  // Ordena avaliações baseado na ordenação ativa
  ordenarAvaliacoes(avaliacoes) {
    switch (this.ordenacaoAtiva) {
      case 'mais-recentes':
        return [...avaliacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
      case 'mais-antigas':
        return [...avaliacoes].sort((a, b) => new Date(a.data) - new Date(b.data));
      case 'maior-nota':
        return [...avaliacoes].sort((a, b) => b.nota - a.nota);
      case 'menor-nota':
        return [...avaliacoes].sort((a, b) => a.nota - b.nota);
      case 'mais-uteis':
        return [...avaliacoes].sort((a, b) => b.uteis - a.uteis);
      default:
        return avaliacoes;
    }
  }

  // Configura event listeners
  configurarEventListeners() {
    // Filtros de avaliação
    document.querySelectorAll('.btn-filtro').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
        e.target.classList.add('ativo');
        this.filtroAtivo = e.target.dataset.filtro;
        this.paginaAtual = 1;
        this.renderizarAvaliacoes();
      });
    });

    // Ordenação
    const selectOrdenacao = document.getElementById('ordenarAvaliacoes');
    if (selectOrdenacao) {
      selectOrdenacao.addEventListener('change', (e) => {
        this.ordenacaoAtiva = e.target.value;
        this.paginaAtual = 1;
        this.renderizarAvaliacoes();
      });
    }

    // Modal de avaliação
    this.configurarModal();

    // Botões de ação do produto
    this.configurarBotoesProduto();
  }

  // Configura modal de avaliação
  configurarModal() {
    const btnAvaliar = document.getElementById('btnAvaliar');
    const modal = document.getElementById('modalAvaliacao');
    const btnFechar = document.getElementById('btnFecharModal');
    const btnCancelar = document.getElementById('btnCancelar');
    const btnEnviar = document.getElementById('btnEnviarAvaliacao');
    const btnAdicionarFoto = document.getElementById('btnAdicionarFoto');
    const inputFotos = document.getElementById('fotosAvaliacao');

    // Abrir modal
    if (btnAvaliar) {
      btnAvaliar.addEventListener('click', () => {
        this.abrirModal();
      });
    }

    // Fechar modal
    [btnFechar, btnCancelar].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          this.fecharModal();
        });
      }
    });

    // Fechar modal clicando fora
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.fecharModal();
        }
      });
    }

    // Seleção de estrelas
    document.querySelectorAll('.estrelas-selecao i').forEach((estrela, index) => {
      estrela.addEventListener('click', (e) => {
        this.selecionarNota(index + 1);
      });

      estrela.addEventListener('mouseenter', (e) => {
        this.highlightEstrelas(index + 1);
      });
    });

    // Reset hover das estrelas
    const containerEstrelas = document.getElementById('estrelasSelecao');
    if (containerEstrelas) {
      containerEstrelas.addEventListener('mouseleave', () => {
        this.highlightEstrelas(this.notaSelecionadaModal);
      });
    }

    // Upload de fotos
    if (btnAdicionarFoto && inputFotos) {
      btnAdicionarFoto.addEventListener('click', () => {
        inputFotos.click();
      });

      inputFotos.addEventListener('change', (e) => {
        this.processarFotos(e.target.files);
      });
    }

    // Enviar avaliação
    if (btnEnviar) {
      btnEnviar.addEventListener('click', () => {
        this.enviarAvaliacao();
      });
    }
  }

  // Abre modal de avaliação
  abrirModal() {
    const modal = document.getElementById('modalAvaliacao');
    const imagemProdutoModal = document.getElementById('imagemProdutoModal');
    const nomeProdutoModal = document.getElementById('nomeProdutoModal');
    
    if (modal && this.produtoAtual) {
      // Preenche dados do produto no modal
      if (imagemProdutoModal) imagemProdutoModal.src = this.produtoAtual.imagem || '';
      if (nomeProdutoModal) nomeProdutoModal.textContent = this.produtoAtual.nome || '';
      
      modal.classList.add('ativo');
      document.body.style.overflow = 'hidden';
    }
  }

  // Fecha modal de avaliação
  fecharModal() {
    const modal = document.getElementById('modalAvaliacao');
    if (modal) {
      modal.classList.remove('ativo');
      document.body.style.overflow = 'auto';
      this.limparModalAvaliacao();
    }
  }

  // Limpa dados do modal
  limparModalAvaliacao() {
    this.notaSelecionadaModal = 0;
    this.fotosUpload = [];
    
    const tituloAvaliacao = document.getElementById('tituloAvaliacao');
    const comentarioAvaliacao = document.getElementById('comentarioAvaliacao');
    const previewFotos = document.getElementById('previewFotos');
    const notaSelecionada = document.getElementById('notaSelecionada');
    
    if (tituloAvaliacao) tituloAvaliacao.value = '';
    if (comentarioAvaliacao) comentarioAvaliacao.value = '';
    if (previewFotos) previewFotos.innerHTML = '';
    if (notaSelecionada) notaSelecionada.textContent = 'Selecione uma nota';
    
    this.highlightEstrelas(0);
  }

  // Seleciona nota no modal
  selecionarNota(nota) {
    this.notaSelecionadaModal = nota;
    this.highlightEstrelas(nota);
    
    const textos = ['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];
    const notaSelecionada = document.getElementById('notaSelecionada');
    if (notaSelecionada) {
      notaSelecionada.textContent = textos[nota] || 'Selecione uma nota';
    }
  }

  // Destaca estrelas no hover/seleção
  highlightEstrelas(nota) {
    document.querySelectorAll('.estrelas-selecao i').forEach((estrela, index) => {
      if (index < nota) {
        estrela.classList.add('ativa');
      } else {
        estrela.classList.remove('ativa');
      }
    });
  }

  // Processa fotos do upload
  processarFotos(arquivos) {
    Array.from(arquivos).forEach(arquivo => {
      if (arquivo.type.startsWith('image/') && this.fotosUpload.length < 5) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.fotosUpload.push({
            arquivo: arquivo,
            url: e.target.result
          });
          this.atualizarPreviewFotos();
        };
        reader.readAsDataURL(arquivo);
      }
    });
  }

  // Atualiza preview das fotos
  atualizarPreviewFotos() {
    const preview = document.getElementById('previewFotos');
    if (!preview) return;
    
    preview.innerHTML = this.fotosUpload.map((foto, index) => `
      <div class="preview-foto">
        <img src="${foto.url}" alt="Preview">
        <button type="button" class="btn-remover-foto" onclick="sistemaAvaliacoes.removerFoto(${index})">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `).join('');
  }

  // Remove foto do upload
  removerFoto(index) {
    this.fotosUpload.splice(index, 1);
    this.atualizarPreviewFotos();
  }

  // Envia avaliação
  enviarAvaliacao() {
    const tituloAvaliacao = document.getElementById('tituloAvaliacao');
    const comentarioAvaliacao = document.getElementById('comentarioAvaliacao');
    
    const titulo = tituloAvaliacao?.value.trim() || '';
    const comentario = comentarioAvaliacao?.value.trim() || '';
    
    if (this.notaSelecionadaModal === 0) {
      if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('Por favor, selecione uma nota para o produto.', 'aviso');
      } else {
        alert('Por favor, selecione uma nota para o produto.');
      }
      return;
    }
    
    if (!comentario) {
      if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('Por favor, escreva um comentário sobre o produto.', 'aviso');
      } else {
        alert('Por favor, escreva um comentário sobre o produto.');
      }
      return;
    }

    // Simula envio (aqui conectaria com o backend)
    const novaAvaliacao = {
      id: this.avaliacoes.length + 1,
      usuarioNome: 'Você',
      usuarioAvatar: 'VO',
      nota: this.notaSelecionadaModal,
      titulo: titulo || 'Minha avaliação',
      comentario: comentario,
      data: new Date(),
      compraVerificada: true,
      fotos: this.fotosUpload.map(f => f.url),
      uteis: 0,
      utilMarcado: false
    };

    this.avaliacoes.unshift(novaAvaliacao);
    this.atualizarResumoAvaliacoes();
    this.paginaAtual = 1;
    this.renderizarAvaliacoes();
    this.fecharModal();
    
    if (typeof mostrarNotificacao === 'function') {
      mostrarNotificacao('Avaliação enviada com sucesso! Obrigado pelo seu feedback.', 'sucesso');
    } else {
      alert('Avaliação enviada com sucesso! Obrigado pelo seu feedback.');
    }
  }

  // Configura botões do produto
  configurarBotoesProduto() {
    const btnComprar = document.querySelector('.btn-comprar');
    const btnCarrinho = document.querySelector('.btn-carrinho');

    if (btnComprar) {
      btnComprar.addEventListener('click', () => {
        this.comprarAgora();
      });
    }

    if (btnCarrinho) {
      btnCarrinho.addEventListener('click', () => {
        this.adicionarAoCarrinhoIndividual(this.produtoAtual.id);
      });
    }
  }

  // Função para adicionar produto ao carrinho
  adicionarAoCarrinho(produtoId) {
    // Verificar se a função global do carrinho existe
    if (typeof adicionarAoCarrinho === 'function') {
      const sucesso = adicionarAoCarrinho(produtoId, 1);
      if (sucesso) {
        const produto = produtos.find(p => p.id === produtoId);
        if (produto) {
          if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao(`${produto.nome} adicionado ao carrinho!`, 'sucesso');
          } else {
            alert(`${produto.nome} adicionado ao carrinho!`);
          }
        }
      }
    } else {
      // Fallback caso o sistema de carrinho não esteja carregado
      const produto = produtos?.find(p => p.id === produtoId);
      if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('Sistema de carrinho não disponível. Redirecionando...', 'aviso');
      } else {
        alert('Sistema de carrinho não disponível. Redirecionando...');
      }
      window.location.href = 'carrinho.html';
    }
  }

  // Função para adicionar produto ao carrinho (individual)
  adicionarAoCarrinhoIndividual(produtoId) {
    this.adicionarAoCarrinho(produtoId);
  }

  // Função para comprar agora
  comprarAgora() {
    if (!this.produtoAtual) return;
    
    const produto = this.produtoAtual;
    
    if (!produto.emEstoque) {
      if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('Produto fora de estoque!', 'erro');
      } else {
        alert('Produto fora de estoque!');
      }
      return;
    }
    
    // Criar dados do pedido para checkout direto
    const dadosCheckout = {
      produtos: [{
        id: produto.id,
        nome: produto.nome,
        marca: produto.marca || '',
        descricao: produto.descricao || `Produto de qualidade da ${produto.marca || 'marca'}`,
        preco: produto.preco,
        quantidade: 1,
        imagem: produto.imagem || 'imagens/default.png'
      }],
      subtotal: produto.preco,
      desconto: 0,
      frete: produto.freteGratis ? 0 : 15.99,
      total: produto.preco + (produto.freteGratis ? 0 : 15.99),
      quantidadeTotal: 1,
      compraDireta: true
    };
    
    try {
      // Salvar no localStorage
      localStorage.setItem('dadosCheckout', JSON.stringify(dadosCheckout));
      
      // Mostrar notificação e redirecionar
      if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('Redirecionando para o checkout...', 'sucesso');
      } else {
        alert('Redirecionando para o checkout...');
      }
      
      setTimeout(() => {
        window.location.href = 'checkout.html';
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar dados do checkout:', error);
      if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('Erro ao processar compra. Tente novamente.', 'erro');
      } else {
        alert('Erro ao processar compra. Tente novamente.');
      }
    }
  }

  // Formata data
  formatarData(data) {
    try {
      return new Date(data).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  }
}

// Funções globais
function navegarParaProduto(id) {
  window.location.href = `paginaproduto.html?id=${id}`;
}

function marcarUtil(avaliacaoId) {
  if (!sistemaAvaliacoes) return;
  
  const avaliacao = sistemaAvaliacoes.avaliacoes.find(av => av.id === avaliacaoId);
  if (avaliacao) {
    if (avaliacao.utilMarcado) {
      avaliacao.uteis = Math.max(0, avaliacao.uteis - 1);
      avaliacao.utilMarcado = false;
    } else {
      avaliacao.uteis++;
      avaliacao.utilMarcado = true;
    }
    sistemaAvaliacoes.renderizarAvaliacoes();
  }
}

function responderAvaliacao(avaliacaoId) {
  if (typeof mostrarNotificacao === 'function') {
    mostrarNotificacao('Funcionalidade de resposta será implementada em breve!', 'info');
  } else {
    alert('Funcionalidade de resposta será implementada em breve!');
  }
}

function abrirImagemModal(imagemUrl) {
  // Verificar se a URL é válida
  if (!imagemUrl || imagemUrl.trim() === '') {
    console.warn('URL da imagem não fornecida');
    return;
  }

  // Implementar modal para visualizar imagem em tamanho maior
  const modal = document.createElement('div');
  modal.className = 'modal-imagem';
  modal.innerHTML = `
    <div class="modal-imagem-conteudo">
      <img src="${imagemUrl}" alt="Imagem ampliada" onerror="this.alt='Erro ao carregar imagem'">
      <button class="btn-fechar-imagem" onclick="this.parentElement.parentElement.remove(); document.body.style.overflow='auto'">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
  `;
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      document.body.style.overflow = 'auto';
    }
  });
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

// Funções globais para os botões da página de produto individual
function adicionarAoCarrinhoIndividual() {
  if (sistemaAvaliacoes && sistemaAvaliacoes.produtoAtual) {
    sistemaAvaliacoes.adicionarAoCarrinhoIndividual(sistemaAvaliacoes.produtoAtual.id);
  }
}

function comprarAgora() {
  if (sistemaAvaliacoes) {
    sistemaAvaliacoes.comprarAgora();
  }
}

// Inicialização
let sistemaAvaliacoes;

document.addEventListener('DOMContentLoaded', function() {
  try {
    sistemaAvaliacoes = new SistemaAvaliacoes();
  } catch (error) {
    console.error('Erro ao inicializar sistema de avaliações:', error);
    
    // Mostrar mensagem de erro para o usuário
    const container = document.querySelector('.container-produto') || document.body;
    const erroDiv = document.createElement('div');
    erroDiv.className = 'erro-sistema';
    erroDiv.innerHTML = `
      <div style="text-align: center; padding: 20px; background: #f8d7da; color: #721c24; border-radius: 8px; margin: 20px;">
        <h3>Erro ao carregar página do produto</h3>
        <p>Ocorreu um erro ao inicializar o sistema. Por favor, recarregue a página.</p>
        <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Recarregar Página
        </button>
      </div>
    `;
    container.appendChild(erroDiv);
  }
});

// CSS adicional para modal de imagem e correções
const estiloModalImagem = document.createElement('style');
estiloModalImagem.textContent = `
  .modal-imagem {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
    box-sizing: border-box;
  }
  
  .modal-imagem-conteudo {
    position: relative;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-imagem-conteudo img {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }
  
  .btn-fechar-imagem {
    position: absolute;
    top: -15px;
    right: -15px;
    background: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    font-size: 16px;
    color: #333;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-fechar-imagem:hover {
    background: #f0f0f0;
    transform: scale(1.1);
  }

  .erro-produto {
    text-align: center;
    padding: 40px 20px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 20px;
  }

  .erro-produto h2 {
    color: #dc3545;
    margin-bottom: 16px;
  }

  .erro-produto p {
    color: #6c757d;
    margin-bottom: 24px;
  }

  .btn-voltar {
    display: inline-block;
    background: #007bff;
    color: white;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    transition: background 0.2s ease;
  }

  .btn-voltar:hover {
    background: #0056b3;
    text-decoration: none;
    color: white;
  }

  .estado-vazio {
    text-align: center;
    padding: 40px 20px;
    color: #6c757d;
  }

  .estado-vazio i {
    font-size: 48px;
    color: #dee2e6;
    margin-bottom: 16px;
  }

  .estado-vazio h3 {
    margin-bottom: 8px;
    color: #495057;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .modal-imagem {
      padding: 10px;
    }
    
    .modal-imagem-conteudo img {
      max-height: 70vh;
    }
    
    .btn-fechar-imagem {
      top: -10px;
      right: -10px;
      width: 35px;
      height: 35px;
      font-size: 14px;
    }
  }
`;

document.head.appendChild(estiloModalImagem);
