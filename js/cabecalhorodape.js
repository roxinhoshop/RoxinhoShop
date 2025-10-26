// ==================== FUNCIONALIDADES DO CABEÇALHO MELHORADO ====================
document.addEventListener('DOMContentLoaded', function() {
  
  // ==================== SISTEMA DE LOGIN ====================
  function verificarStatusLogin() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    const caixaLogin = document.getElementById('caixa-login');
    const statusLogin = document.getElementById('status-login');
    const subtextoLogin = document.getElementById('subtexto-login');
    const avatarUsuario = document.getElementById('avatar-usuario');
    const setaLogin = document.getElementById('seta-login');
    const dropdownUsuario = document.getElementById('dropdown-usuario');
    
    if (usuarioLogado) {
      const dadosUsuario = JSON.parse(usuarioLogado);
      statusLogin.textContent = `Olá, ${dadosUsuario.nome}`;
      subtextoLogin.textContent = 'Minha conta';
      
      // Atualizar avatar se disponível
      if (dadosUsuario.avatar) {
        avatarUsuario.src = dadosUsuario.avatar;
      }
      
      // Trocar seta por ícone de dropdown
      setaLogin.className = 'fa-solid fa-chevron-down seta';
      
      // Adicionar evento de clique para mostrar dropdown
      caixaLogin.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropdownUsuario.style.display = dropdownUsuario.style.display === 'none' ? 'block' : 'none';
      });
      
      // Fechar dropdown ao clicar fora
      document.addEventListener('click', function(e) {
        if (!caixaLogin.contains(e.target)) {
          dropdownUsuario.style.display = 'none';
        }
      });
      
    } else {
      // Usuário não logado - redirecionar para login
      caixaLogin.addEventListener('click', function() {
        window.location.href = 'login.html';
      });
    }
  }
  
  // Função de logout
  const botaoLogout = document.getElementById('botao-logout');
  if (botaoLogout) {
    botaoLogout.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('usuarioLogado');
      localStorage.removeItem('listaDesejos');
      window.location.reload();
    });
  }
  
  // ==================== LISTA DE DESEJOS ====================
  function inicializarListaDesejos() {
    const botaoDesejos = document.getElementById('botao-desejos');
    const dropdownDesejos = document.getElementById('dropdown-desejos');
    const contadorDesejos = document.getElementById('contador-desejos');
    const totalDesejos = document.getElementById('total-desejos');
    const listaDesejosConteudo = document.getElementById('lista-desejos-conteudo');
    
    if (!botaoDesejos || !dropdownDesejos) return;
    
    // Carregar lista de desejos do localStorage
    function carregarListaDesejos() {
      const desejos = JSON.parse(localStorage.getItem('listaDesejos') || '[]');
      contadorDesejos.textContent = desejos.length;
      totalDesejos.textContent = `${desejos.length} ${desejos.length === 1 ? 'item' : 'itens'}`;
      
      if (desejos.length === 0) {
        listaDesejosConteudo.innerHTML = '<p class="lista-vazia">Sua lista de desejos está vazia</p>';
      } else {
        listaDesejosConteudo.innerHTML = desejos.map(item => `
          <div class="item-desejo">
            <img src="${item.imagem}" alt="${item.nome}" class="thumb-desejo">
            <div class="info-desejo">
              <h5>${item.nome}</h5>
              <p class="preco-desejo">R$ ${item.preco}</p>
            </div>
            <button class="remover-desejo" data-id="${item.id}">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
        `).join('');
        
        // Adicionar eventos de remoção
        document.querySelectorAll('.remover-desejo').forEach(btn => {
          btn.addEventListener('click', function() {
            const id = this.dataset.id;
            removerDosDesejos(id);
          });
        });
      }
    }
    
    // Função para remover item dos desejos
    function removerDosDesejos(id) {
      let desejos = JSON.parse(localStorage.getItem('listaDesejos') || '[]');
      desejos = desejos.filter(item => item.id !== id);
      localStorage.setItem('listaDesejos', JSON.stringify(desejos));
      carregarListaDesejos();
    }
    
    // Evento de clique no botão de desejos
    botaoDesejos.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropdownDesejos.style.display = dropdownDesejos.style.display === 'none' ? 'block' : 'none';
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
      if (!document.querySelector('.caixa-desejos').contains(e.target)) {
        dropdownDesejos.style.display = 'none';
      }
    });
    
    carregarListaDesejos();
  }
  
  // ==================== CONTADOR DO CARRINHO ====================
  function atualizarContadorCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
    const contador = document.getElementById('contadorCarrinho');
    if (contador) {
      const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
      contador.textContent = totalItens;
    }
  }
  
  // ==================== TEMA ESCURO ====================
  function inicializarTemaEscuro() {
    const temaAtual = localStorage.getItem('tema') || 'light';
    document.documentElement.setAttribute('data-theme', temaAtual);
    
    // Botão de alternância de tema (será adicionado posteriormente)
    const botaoTema = document.getElementById('botao-tema');
    if (botaoTema) {
      botaoTema.addEventListener('click', function() {
        const temaAtual = document.documentElement.getAttribute('data-theme');
        const novoTema = temaAtual === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', novoTema);
        localStorage.setItem('tema', novoTema);
      });
    }
  }
  

  
  // ==================== BUSCA GLOBAL ====================
  function inicializarBuscaGlobal() {
    const campoBusca = document.getElementById('campo-busca-global');
    const botaoBusca = document.getElementById('botao-busca-global');
    const sugestoesBusca = document.getElementById('sugestoes-busca');
    
    // Produtos para sugestões (simulado)
    const produtosSugestoes = [
      'iPhone 15', 'Samsung Galaxy S24', 'PlayStation 5', 'Xbox Series X',
      'RTX 4090', 'Ryzen 7 7800X3D', 'MacBook Pro', 'Dell XPS',
      'Logitech MX Master', 'Razer DeathAdder', 'HyperX Cloud',
      'Monitor Gamer', 'Teclado Mecânico', 'SSD NVMe'
    ];
    
    if (campoBusca && botaoBusca) {
      // Busca ao digitar
      campoBusca.addEventListener('input', function() {
        const termo = this.value.toLowerCase().trim();
        
        if (termo.length >= 2) {
          const sugestoesFiltradas = produtosSugestoes.filter(produto => 
            produto.toLowerCase().includes(termo)
          ).slice(0, 5);
          
          if (sugestoesFiltradas.length > 0) {
            sugestoesBusca.innerHTML = sugestoesFiltradas.map(produto => 
              `<div class="sugestao-item" data-produto="${produto}">${produto}</div>`
            ).join('');
            sugestoesBusca.style.display = 'block';
            
            // Adicionar eventos de clique nas sugestões
            document.querySelectorAll('.sugestao-item').forEach(item => {
              item.addEventListener('click', function() {
                campoBusca.value = this.dataset.produto;
                sugestoesBusca.style.display = 'none';
                realizarBusca(this.dataset.produto);
              });
            });
          } else {
            sugestoesBusca.style.display = 'none';
          }
        } else {
          sugestoesBusca.style.display = 'none';
        }
      });
      
      // Busca ao clicar no botão
      botaoBusca.addEventListener('click', function() {
        realizarBusca(campoBusca.value);
      });
      
      // Busca ao pressionar Enter
      campoBusca.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          realizarBusca(this.value);
        }
      });
      
      // Fechar sugestões ao clicar fora
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.caixa-pesquisa-centralizada')) {
          sugestoesBusca.style.display = 'none';
        }
      });
    }
    
    function realizarBusca(termo) {
      if (termo.trim()) {
        window.location.href = `produtos.html?busca=${encodeURIComponent(termo)}`;
      }
    }
  }
  
  // ==================== CALCULADOR DE CEP ====================
  function inicializarCalculadorCEP() {
    const inputCep = document.getElementById('input-cep');
    const resultadoCep = document.getElementById('resultado-cep');
    
    if (inputCep && resultadoCep) {
      // Máscara para CEP
      inputCep.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
          value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = value;
        
        // Consultar CEP quando tiver 8 dígitos
        if (value.replace(/\D/g, '').length === 8) {
          consultarCEP(value.replace(/\D/g, ''));
        } else if (value.length === 0) {
          resultadoCep.textContent = 'Consultar frete';
          resultadoCep.className = 'resultado-cep';
        }
      });
      
      // Consultar CEP ao pressionar Enter
      inputCep.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          const cep = e.target.value.replace(/\D/g, '');
          if (cep.length === 8) {
            consultarCEP(cep);
          }
        }
      });
    }
    
    function consultarCEP(cep) {
      if (!resultadoCep) return;
      
      resultadoCep.textContent = 'Consultando...';
      resultadoCep.className = 'resultado-cep loading';
      
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
          if (data.erro) {
            resultadoCep.textContent = 'CEP não encontrado';
            resultadoCep.className = 'resultado-cep error';
          } else {
            resultadoCep.textContent = `${data.localidade} - ${data.uf}`;
            resultadoCep.className = 'resultado-cep success';
            
            // Calcular frete simulado
            setTimeout(() => {
              const freteGratis = Math.random() > 0.5;
              if (freteGratis) {
                resultadoCep.textContent = 'Frete grátis!';
              } else {
                const valorFrete = (Math.random() * 20 + 5).toFixed(2);
                resultadoCep.textContent = `Frete: R$ ${valorFrete}`;
              }
            }, 1500);
          }
        })
        .catch(error => {
          console.error('Erro ao consultar CEP:', error);
          resultadoCep.textContent = 'Erro na consulta';
          resultadoCep.className = 'resultado-cep error';
        });
    }
  }
  
  // Inicializar todas as funcionalidades
  verificarStatusLogin();
  inicializarListaDesejos();
  atualizarContadorCarrinho();
  inicializarTemaEscuro();
  inicializarMenuHamburguer();
  inicializarBuscaGlobal();
  inicializarCalculadorCEP();

  // ==================== MENU HAMBÚRGUER ====================
  function inicializarMenuHamburguer() {
    const dropdownParent = document.querySelector('.barra-categorias .dropdown');
    if (dropdownParent) {
      dropdownParent.addEventListener('click', function(e) {
        // Previne o comportamento padrão do link
        e.preventDefault();
        // Alterna a classe 'open' no elemento pai do dropdown
        this.classList.toggle('open');
      });

      // Fecha o dropdown se clicar fora dele
      document.addEventListener('click', function(e) {
        if (!dropdownParent.contains(e.target)) {
          dropdownParent.classList.remove('open');
        }
      });
    }

    // Lógica para submenus de segundo nível (Hardware, Periféricos, etc.)
    document.querySelectorAll('.barra-categorias .tem-submenu').forEach(item => {
      item.addEventListener('click', function(e) {
        // Previne o comportamento padrão do link do submenu
        e.preventDefault();
        e.stopPropagation(); // Impede que o clique se propague para o dropdown principal
        this.classList.toggle('open');
      });
    });
  };
  
  // Atualizar contador do carrinho quando houver mudanças
  window.addEventListener('storage', function(e) {
    if (e.key === 'carrinho') {
      atualizarContadorCarrinho();
    }
    if (e.key === 'listaDesejos') {
      inicializarListaDesejos();
    }
  });
});

// ==================== FUNÇÕES GLOBAIS PARA LISTA DE DESEJOS ====================
window.adicionarAosDesejos = function(produto) {
  let desejos = JSON.parse(localStorage.getItem('listaDesejos') || '[]');
  
  // Verificar se já existe
  const jaExiste = desejos.find(item => item.id === produto.id);
  if (jaExiste) {
    alert('Este produto já está na sua lista de desejos!');
    return;
  }
  
  desejos.push(produto);
  localStorage.setItem('listaDesejos', JSON.stringify(desejos));
  
  // Atualizar contador
  const contador = document.getElementById('contador-desejos');
  if (contador) {
    contador.textContent = desejos.length;
  }
  
  alert('Produto adicionado à lista de desejos!');
};

window.removerDosDesejos = function(produtoId) {
  let desejos = JSON.parse(localStorage.getItem('listaDesejos') || '[]');
  desejos = desejos.filter(item => item.id !== produtoId);
  localStorage.setItem('listaDesejos', JSON.stringify(desejos));
  
  // Atualizar contador
  const contador = document.getElementById('contador-desejos');
  if (contador) {
    contador.textContent = desejos.length;
  }
};


