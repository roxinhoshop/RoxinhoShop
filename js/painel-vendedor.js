// Painel do Vendedor - JS de abas, tabela de vendedores e MVP local de produtos

(function () {
  const STORAGE_KEYS = {
    produtos: 'vendor:produtos',
    historico: 'vendor:historico',
    config: 'vendor:config',
    vendedores: 'vendor:vendedores',
  };

  function getJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function logHistorico(msg) {
    const historico = getJSON(STORAGE_KEYS.historico, []);
    historico.unshift({ msg, at: new Date().toISOString() });
    setJSON(STORAGE_KEYS.historico, historico.slice(0, 200));
    renderHistorico();
  }

  function formatBRL(n) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));
  }

  // Abas
  function initAbas() {
    const botoes = document.querySelectorAll('.abas .aba');
    const conteudos = document.querySelectorAll('.conteudo-aba');
    botoes.forEach(btn => {
      btn.addEventListener('click', () => {
        botoes.forEach(b => b.classList.remove('ativa'));
        conteudos.forEach(c => c.classList.remove('visivel'));
        btn.classList.add('ativa');
        const alvo = document.querySelector(btn.dataset.alvo);
        if (alvo) alvo.classList.add('visivel');
      });
    });
  }

  // Dashboard stats dummy a partir do estoque
  function updateStats() {
    const produtos = getJSON(STORAGE_KEYS.produtos, []);
    const total = produtos.length;
    const ativos = produtos.filter(p => p.status !== 'inativo').length;
    const vendas = getJSON('vendor:falso:vendas30', 0);
    const aguardando = produtos.filter(p => p.status === 'aguardando').length;
    const ids = {
      total: 'stat-total-produtos',
      ativos: 'stat-produtos-ativos',
      vendas: 'stat-vendas',
      aguardando: 'stat-aguardando',
    };
    const el = id => document.getElementById(id);
    if (el(ids.total)) el(ids.total).textContent = total;
    if (el(ids.ativos)) el(ids.ativos).textContent = ativos;
    if (el(ids.vendas)) el(ids.vendas).textContent = vendas;
    if (el(ids.aguardando)) el(ids.aguardando).textContent = aguardando;
  }

  // Produtos & inventário (MVP local)
  function initProdutos() {
    const form = document.getElementById('formProduto');
    const tbody = document.getElementById('tbodyProdutos');
    const btnLimpar = document.getElementById('btnLimparForm');
    if (!form || !tbody) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const nome = document.getElementById('produtoNome').value.trim();
      const preco = parseFloat(document.getElementById('produtoPreco').value);
      const qtd = parseInt(document.getElementById('produtoQtd').value, 10);
      if (!nome || isNaN(preco) || isNaN(qtd)) return;
      const produtos = getJSON(STORAGE_KEYS.produtos, []);
      produtos.push({ id: crypto.randomUUID(), nome, preco, qtd, status: 'ativo' });
      setJSON(STORAGE_KEYS.produtos, produtos);
      renderProdutos();
      updateStats();
      logHistorico(`Produto adicionado: ${nome}`);
      form.reset();
    });

    btnLimpar?.addEventListener('click', () => form.reset());
    renderProdutos();
  }

  function renderProdutos() {
    const tbody = document.getElementById('tbodyProdutos');
    if (!tbody) return;
    const produtos = getJSON(STORAGE_KEYS.produtos, []);
    tbody.innerHTML = produtos.map(p => `
      <tr data-id="${p.id}">
        <td>${p.nome}</td>
        <td>${formatBRL(p.preco)}</td>
        <td>${p.qtd}</td>
        <td><span class="badge ${p.status === 'ativo' ? 'ativo' : (p.status || 'inativo')}">${p.status || 'inativo'}</span></td>
        <td class="acoes">
          <button class="btn editar" data-acao="editar"><i class="fa-solid fa-pen"></i> Editar</button>
          <button class="btn desativar" data-acao="toggle"><i class="fa-solid fa-power-off"></i> Ativar/Desativar</button>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('button').forEach(btn => btn.addEventListener('click', onAcaoProduto));
  }

  function onAcaoProduto(e) {
    const btn = e.currentTarget;
    const acao = btn.dataset.acao;
    const id = btn.closest('tr')?.dataset.id;
    if (!id) return;
    const produtos = getJSON(STORAGE_KEYS.produtos, []);
    const idx = produtos.findIndex(p => p.id === id);
    if (idx === -1) return;
    if (acao === 'toggle') {
      const novo = produtos[idx].status === 'ativo' ? 'inativo' : 'ativo';
      produtos[idx].status = novo;
      setJSON(STORAGE_KEYS.produtos, produtos);
      renderProdutos();
      updateStats();
      logHistorico(`Produto ${novo === 'ativo' ? 'ativado' : 'desativado'}: ${produtos[idx].nome}`);
    }
    if (acao === 'editar') {
      const nome = prompt('Novo nome', produtos[idx].nome) ?? produtos[idx].nome;
      const preco = Number(prompt('Novo preço', produtos[idx].preco));
      const qtd = Number(prompt('Nova quantidade', produtos[idx].qtd));
      if (!isNaN(preco) && !isNaN(qtd) && nome.trim()) {
        produtos[idx].nome = nome.trim();
        produtos[idx].preco = preco;
        produtos[idx].qtd = qtd;
        setJSON(STORAGE_KEYS.produtos, produtos);
        renderProdutos();
        logHistorico(`Produto editado: ${nome}`);
      }
    }
  }

  // Vendedores - tabela integrada
  function initVendedores() {
    // Dados seed locais se não existir
    const seed = [
      { id: crypto.randomUUID(), nome: 'João Silva', cpf: '111.222.333-44', email: 'joao@example.com', status: 'ativo', criadoEm: new Date().toISOString() },
      { id: crypto.randomUUID(), nome: 'Maria Souza', cpf: '555.666.777-88', email: 'maria@example.com', status: 'inativo', criadoEm: new Date().toISOString() },
    ];
    const existentes = getJSON(STORAGE_KEYS.vendedores, null);
    if (!existentes) setJSON(STORAGE_KEYS.vendedores, seed);
    renderVendedores();
    initVendedoresEventos();
  }

  function renderVendedores() {
    const body = document.getElementById('tabelaVendedoresBody');
    if (!body) return;
    const busca = document.getElementById('filtroBusca')?.value?.toLowerCase() ?? '';
    const status = document.getElementById('filtroStatus')?.value ?? 'todos';
    let vendedores = getJSON(STORAGE_KEYS.vendedores, []);
    if (busca) {
      vendedores = vendedores.filter(v =>
        v.nome.toLowerCase().includes(busca) || v.email.toLowerCase().includes(busca) || v.cpf.toLowerCase().includes(busca)
      );
    }
    if (status !== 'todos') vendedores = vendedores.filter(v => v.status === status);
    body.innerHTML = vendedores.map(v => `
      <tr data-id="${v.id}">
        <td>${v.nome}</td>
        <td>${v.cpf}</td>
        <td>${v.email}</td>
        <td><span class="badge ${v.status}">${v.status}</span></td>
        <td>${new Date(v.criadoEm).toLocaleDateString('pt-BR')}</td>
        <td class="acoes">
          <button class="btn editar" data-acao="editar"><i class="fa-solid fa-pen"></i> Editar</button>
          <button class="btn desativar" data-acao="toggle"><i class="fa-solid fa-power-off"></i> ${v.status === 'ativo' ? 'Desativar' : 'Ativar'}</button>
        </td>
      </tr>
    `).join('');
    body.querySelectorAll('button').forEach(b => b.addEventListener('click', onAcaoVendedor));
  }

  function initVendedoresEventos() {
    document.getElementById('filtroBusca')?.addEventListener('input', renderVendedores);
    document.getElementById('filtroStatus')?.addEventListener('change', renderVendedores);
    document.getElementById('itensPorPagina')?.addEventListener('change', renderVendedores); // MVP sem paginação real
  }

  function onAcaoVendedor(e) {
    const btn = e.currentTarget;
    const acao = btn.dataset.acao;
    const id = btn.closest('tr')?.dataset.id;
    if (!id) return;
    const lista = getJSON(STORAGE_KEYS.vendedores, []);
    const idx = lista.findIndex(v => v.id === id);
    if (idx === -1) return;
    if (acao === 'toggle') {
      const novo = lista[idx].status === 'ativo' ? 'inativo' : 'ativo';
      lista[idx].status = novo;
      setJSON(STORAGE_KEYS.vendedores, lista);
      renderVendedores();
      logHistorico(`Vendedor ${novo === 'ativo' ? 'ativado' : 'desativado'}: ${lista[idx].nome}`);
    }
    if (acao === 'editar') {
      const nome = prompt('Nome', lista[idx].nome) ?? lista[idx].nome;
      const email = prompt('E-mail', lista[idx].email) ?? lista[idx].email;
      const cpf = prompt('CPF', lista[idx].cpf) ?? lista[idx].cpf;
      if (nome.trim() && email.trim() && cpf.trim()) {
        lista[idx].nome = nome.trim();
        lista[idx].email = email.trim();
        lista[idx].cpf = cpf.trim();
        setJSON(STORAGE_KEYS.vendedores, lista);
        renderVendedores();
        logHistorico(`Vendedor editado: ${nome}`);
      }
    }
  }

  // Config
  function initConfig() {
    const form = document.getElementById('formConfig');
    if (!form) return;
    const cfg = getJSON(STORAGE_KEYS.config, {});
    document.getElementById('configNomeLoja').value = cfg.nomeLoja ?? '';
    document.getElementById('configTelefone').value = cfg.telefone ?? '';
    document.getElementById('configSobre').value = cfg.sobre ?? '';
    form.addEventListener('submit', e => {
      e.preventDefault();
      const novo = {
        nomeLoja: document.getElementById('configNomeLoja').value.trim(),
        telefone: document.getElementById('configTelefone').value.trim(),
        sobre: document.getElementById('configSobre').value.trim(),
      };
      setJSON(STORAGE_KEYS.config, novo);
      logHistorico('Configurações salvas');
    });
  }

  function renderHistorico() {
    const ul = document.getElementById('listaHistorico');
    if (!ul) return;
    const historico = getJSON(STORAGE_KEYS.historico, []);
    ul.innerHTML = historico.map(h => `
      <li>
        <i class="fa-solid fa-circle-dot" style="color:#883fd8"></i>
        <span>${h.msg}</span>
        <time>— ${new Date(h.at).toLocaleString('pt-BR')}</time>
      </li>
    `).join('');
  }

  function aplicarBoasVindas() {
    const nome = (() => {
      try {
        const raw = localStorage.getItem('auth:user');
        if (raw) {
          const u = JSON.parse(raw);
          return u?.nome || u?.name || u?.email || 'Vendedor(a)';
        }
      } catch {}
      try {
        const raw2 = localStorage.getItem('vendedor:perfil');
        if (raw2) {
          const u2 = JSON.parse(raw2);
          return u2?.nome || u2?.name || u2?.email || 'Vendedor(a)';
        }
      } catch {}
      return 'Vendedor(a)';
    })();
    const el = document.getElementById('boas-vindas-vendedor');
    if (el) el.textContent = `Bem-vindo(a), ${nome}.`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAbas();
    initProdutos();
    initVendedores();
    initConfig();
    renderHistorico();
    updateStats();
    aplicarBoasVindas();
  });
})();

