// Painel do Vendedor - JS de abas, tabela de vendedores e MVP local de produtos

(function () {
  const STORAGE_KEYS = {
    historico: 'vendor:historico',
    config: 'vendor:config',
    vendedores: 'vendor:vendedores',
  };
  let vendorProdutos = []

  // Mapa de categorias e subcategorias (espelhado de js/produtos.js)
  const sistemaCategorias = {
    'Hardware': {
      subcategorias: ['Processadores', 'Placas de Vídeo', 'Memórias RAM', 'Placas Mãe', 'Fontes', 'Coolers', 'Gabinetes', 'Armazenamento', 'Placas de Som'],
    },
    'Periféricos': {
      subcategorias: ['Teclados', 'Mouses', 'Headsets', 'Webcams', 'Microfones', 'Mousepads', 'Controles', 'Caixas de Som', 'Monitores'],
    },
    'Computadores': {
      subcategorias: ['PCs Gamer', 'Workstations', 'All-in-One', 'Mini PCs', 'Notebooks', 'Chromebooks', 'Ultrabooks', 'Tablets'],
    },
    'Games': {
      subcategorias: ['Consoles', 'Jogos PC', 'Jogos Console', 'Acessórios Gaming', 'Cadeiras Gamer', 'Mesas Gamer', 'Controles', 'Volantes'],
    },
    'Celular & Smartphone': {
      subcategorias: ['Smartphones', 'Capas e Películas', 'Carregadores', 'Fones de Ouvido', 'Power Banks', 'Suportes', 'Smartwatches'],
    },
    'TV & Áudio': {
      subcategorias: ['Smart TVs', 'TVs 4K', 'TVs 8K', 'Suportes TV', 'Conversores', 'Antenas', 'Soundbars', 'Home Theater'],
    },
    'Áudio': {
      subcategorias: ['Fones de Ouvido', 'Caixas de Som', 'Soundbars', 'Amplificadores', 'Microfones', 'Interfaces de Áudio', 'Monitores de Referência'],
    },
    'Espaço Gamer': {
      subcategorias: ['Cadeiras Gamer', 'Mesas Gamer', 'Suportes Monitor', 'Iluminação RGB', 'Decoração', 'Organização', 'Tapetes'],
    },
    'Casa Inteligente': {
      subcategorias: ['Assistentes Virtuais', 'Câmeras Segurança', 'Lâmpadas Smart', 'Tomadas Smart', 'Sensores', 'Fechaduras Digitais', 'Termostatos'],
    },
    'Giftcards': {
      subcategorias: ['Mais populares','Serviços', 'Jogos', 'Xbox', 'Nintendo'],
    }
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
    const produtos = Array.isArray(vendorProdutos) ? vendorProdutos : [];
    const total = produtos.length;
    const ativos = produtos.filter(p => String(p.status || '').toLowerCase() !== 'inativo').length;
    const vendas = getJSON('vendor:falso:vendas30', 0);
    const aguardando = produtos.filter(p => String(p.status || '').toLowerCase() === 'aguardando').length;
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

  async function refreshProdutos() {
    try {
      const r = await fetch('/api/vendors/products/me', { credentials: 'include' })
      const data = await r.json()
      vendorProdutos = (data && data.success && Array.isArray(data.data)) ? data.data : []
      if (!data || !data.success) {
        mostrarToast(data?.message || 'Não autorizado. Faça login como vendedor.', 'error')
      }
      renderProdutos()
      updateStats()
    } catch (e) {
      console.warn('Falha ao obter produtos do vendedor:', e)
      mostrarToast('Erro ao obter produtos do vendedor.', 'error')
    }
  }

  function initProdutos() {
    const form = document.getElementById('formProduto');
    const tbody = document.getElementById('tbodyProdutos');
    const btnLimpar = document.getElementById('btnLimparForm');
    if (!form || !tbody) return;

    // Inicializar selects de Categoria/Subcategoria
    initCategoriaSubcategoria();

    // Formatação de preço (preview em BRL nos inputs de preço)
    const precoMLEl = document.getElementById('produtoPrecoML');
    const precoAZEl = document.getElementById('produtoPrecoAmazon');
    const fmtMLEl = document.getElementById('precoMLFormatado');
    const fmtAZEl = document.getElementById('precoAmazonFormatado');
    const updateFmt = (el, out) => {
      if (!el || !out) return;
      const val = parseFloat(el.value);
      out.textContent = !isNaN(val) ? formatBRL(val) : '';
    };
    ['input','change','blur'].forEach(ev => {
      if (precoMLEl && fmtMLEl) precoMLEl.addEventListener(ev, () => updateFmt(precoMLEl, fmtMLEl));
      if (precoAZEl && fmtAZEl) precoAZEl.addEventListener(ev, () => updateFmt(precoAZEl, fmtAZEl));
    });
    // Atualizar previews iniciais se houver valores preenchidos
    updateFmt(precoMLEl, fmtMLEl);
    updateFmt(precoAZEl, fmtAZEl);

    form.addEventListener('reset', () => {
      if (fmtMLEl) fmtMLEl.textContent = '';
      if (fmtAZEl) fmtAZEl.textContent = '';
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const nome = document.getElementById('produtoNome').value.trim();
      const descricao = (document.getElementById('produtoDescricao')?.value || '').trim();
      const precoML = parseFloat(document.getElementById('produtoPrecoML').value);
      const precoAZRaw = document.getElementById('produtoPrecoAmazon')?.value;
      const precoAZ = precoAZRaw !== undefined && precoAZRaw !== '' ? parseFloat(precoAZRaw) : NaN;
      const fotoUrl = (document.getElementById('produtoFoto')?.value || '').trim();
      const linkML = (document.getElementById('produtoLinkML')?.value || '').trim();
      const linkAmazon = (document.getElementById('produtoLinkAmazon')?.value || '').trim();
      const categoria = (document.getElementById('produtoCategoria')?.value || '').trim();
      const subcategoria = (document.getElementById('produtoSubcategoria')?.value || '').trim();
      if (!nome || isNaN(precoML)) return;
      try {
        const r = await fetch('/api/vendors/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            nome,
            descricao,
            fotoUrl,
            linkMercadoLivre: linkML,
            linkAmazon,
            categoria,
            subcategoria,
            precoMercadoLivre: precoML,
            precoAmazon: isNaN(precoAZ) ? undefined : precoAZ
          })
        })
        const data = await r.json()
        if (data && data.success) {
          logHistorico(`Produto importado: ${nome}`)
          form.reset()
          await refreshProdutos()
        } else {
          logHistorico('Falha ao importar produto')
        }
      } catch (e) {
        console.warn('Erro ao importar produto:', e)
        logHistorico('Erro ao importar produto')
      }
    });

    btnLimpar?.addEventListener('click', () => form.reset());
    refreshProdutos();
  }

  function initCategoriaSubcategoria() {
    const catSel = document.getElementById('produtoCategoria');
    const subSel = document.getElementById('produtoSubcategoria');
    if (!catSel || !subSel) return;
    const categorias = Object.keys(sistemaCategorias);
    catSel.innerHTML = ['<option value="">Selecione...</option>', ...categorias.map(c => `<option value="${c}">${c}</option>`)].join('');
    const atualizarSubcategorias = () => {
      const cat = catSel.value;
      const subs = cat ? (sistemaCategorias[cat]?.subcategorias || []) : [];
      subSel.innerHTML = ['<option value="">Selecione...</option>', ...subs.map(s => `<option value="${s}">${s}</option>`)].join('');
    };
    catSel.addEventListener('change', atualizarSubcategorias);
    atualizarSubcategorias();
  }

  function renderProdutos() {
    const tbody = document.getElementById('tbodyProdutos');
    if (!tbody) return;
    const produtos = Array.isArray(vendorProdutos) ? vendorProdutos : [];
    tbody.innerHTML = produtos.map(p => {
      let img = ''
      try {
        const arr = JSON.parse(p.imagens || '[]')
        img = Array.isArray(arr) && arr.length ? arr[0] : ''
      } catch { img = '' }
      const precoML = p.precoMercadoLivre !== undefined ? Number(p.precoMercadoLivre) : Number(p.precoML ?? 0)
      const precoAZ = p.precoAmazon !== undefined ? Number(p.precoAmazon) : Number(p.precoAZ ?? 0)
      const preco = Number(!isNaN(precoML) && precoML > 0 ? precoML : (!isNaN(precoAZ) && precoAZ > 0 ? precoAZ : 0))
      const statusLower = String(p.status || '').toLowerCase()
      const statusClass = statusLower === 'ativo' ? 'ativo' : 'inativo'
      const toggleText = statusLower === 'ativo' ? 'Desativar' : 'Ativar'
      return `
      <tr data-id="${p.id}">
        <td>${img ? `<img src="${img}" alt="${p.titulo || ''}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;"/>` : ''}</td>
        <td class="col-nome">${p.titulo || ''}</td>
        <td class="col-preco">${formatBRL(preco)}</td>
        <td><span class="badge ${statusClass}">${p.status || 'inativo'}</span></td>
        <td class="acoes">
          <button class="btn editar" data-acao="editar"><i class="fa-solid fa-pen"></i> Editar</button>
          <button class="btn desativar" data-acao="toggle"><i class="fa-solid fa-power-off"></i> ${toggleText}</button>
        </td>
      </tr>
      <tr class="detalhes-produto" data-id="${p.id}">
        <td colspan="5">
          <div class="conteudo">
            <span class="preco">Preço ML: ${precoML > 0 ? formatBRL(precoML) : '—'}</span>
            <span class="preco">Preço Amazon: ${precoAZ > 0 ? formatBRL(precoAZ) : '—'}</span>
            <div class="acoes">
              <button class="btn desativar" data-acao="excluir"><i class="fa-solid fa-trash"></i> Excluir</button>
            </div>
          </div>
        </td>
      </tr>`
    }).join('');
    tbody.querySelectorAll('button').forEach(btn => btn.addEventListener('click', onAcaoProduto));
  }

  function onAcaoProduto(e) {
    const btn = e.currentTarget;
    const acao = btn.dataset.acao;
    const id = btn.closest('tr')?.dataset.id;
    if (!id) return;
    const idx = vendorProdutos.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return;
    const atual = vendorProdutos[idx]
    if (acao === 'toggle') {
      const novo = String(atual.status || '').toLowerCase() === 'ativo' ? 'inativo' : 'ativo'
      ;(async () => {
        try {
          const r = await fetch(`/api/vendors/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: novo })
          })
          const data = await r.json()
          if (data && data.success) {
            logHistorico(`Produto ${novo === 'ativo' ? 'ativado' : 'desativado'}: ${atual.titulo || ''}`)
            mostrarToast(`Produto ${novo === 'ativo' ? 'ativado' : 'desativado'} com sucesso.`, 'success')
            await refreshProdutos()
          } else {
            logHistorico('Falha ao atualizar status do produto')
            mostrarToast(data?.message || 'Falha ao atualizar status do produto.', 'error')
          }
        } catch (e) {
          console.warn('Erro ao atualizar produto:', e)
          logHistorico('Erro ao atualizar status do produto')
          mostrarToast('Erro ao atualizar status do produto.', 'error')
        }
      })()
    }
    if (acao === 'editar') {
      ;(async () => {
        try {
          const promptFn = (window.sitePopup && window.sitePopup.prompt)
            ? window.sitePopup.prompt
            : async (msg) => {
                const val = prompt(msg)
                return val === null ? null : val
              }
          const mlStr = await promptFn('Novo preço Mercado Livre (deixe em branco para não alterar):', 'Entrada', 'Ex.: 199.90')
          const azStr = await promptFn('Novo preço Amazon (deixe em branco para não alterar):', 'Entrada', 'Ex.: 209.90')
          const precoMLNum = (mlStr === null || mlStr === '') ? NaN : Number(mlStr)
          const precoAZNum = (azStr === null || azStr === '') ? NaN : Number(azStr)
          if (isNaN(precoMLNum) && isNaN(precoAZNum)) return
          const payload = {}
          if (!isNaN(precoMLNum)) payload.precoMercadoLivre = precoMLNum
          if (!isNaN(precoAZNum)) payload.precoAmazon = precoAZNum
          const r = await fetch(`/api/vendors/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
          })
          const data = await r.json()
          if (data && data.success) {
            logHistorico(`Produto editado: ${atual.titulo || ''}`)
            mostrarToast('Produto editado com sucesso.', 'success')
            await refreshProdutos()
          } else {
            logHistorico('Falha ao editar produto')
            mostrarToast(data?.message || 'Falha ao editar produto.', 'error')
          }
        } catch (e) {
          console.warn('Erro ao editar produto:', e)
          logHistorico('Erro ao editar produto')
          mostrarToast('Erro ao editar produto.', 'error')
        }
      })()
    }

    if (acao === 'excluir') {
      ;(async () => {
        const confirmFn = (window.sitePopup && window.sitePopup.confirm)
          ? window.sitePopup.confirm
          : async (msg) => confirm(msg)
        const ok = await confirmFn('Tem certeza que deseja excluir este produto?', 'Confirmar')
        if (!ok) return
        try {
          const r = await fetch(`/api/vendors/products/${id}`, {
            method: 'DELETE',
            credentials: 'include'
          })
          const data = await r.json()
          if (data && data.success) {
            logHistorico(`Produto excluído: ${atual.titulo || ''}`)
            mostrarToast('Produto excluído com sucesso.', 'success')
            await refreshProdutos()
          } else {
            logHistorico('Falha ao excluir produto')
            mostrarToast(data?.message || 'Falha ao excluir produto.', 'error')
          }
        } catch (e) {
          console.warn('Erro ao excluir produto:', e)
          logHistorico('Erro ao excluir produto')
          mostrarToast('Erro ao excluir produto.', 'error')
        }
      })()
    }
  }

  // Toast simples para feedback ao usuário
  function mostrarToast(msg, tipo = 'info') {
    const cont = document.getElementById('toastContainer')
    if (!cont) { try { window.sitePopup && window.sitePopup.alert(String(msg), tipo === 'error' ? 'Erro' : 'Aviso') } catch {} return }
    const el = document.createElement('div')
    el.className = `toast ${tipo}`
    el.innerHTML = `<span>${msg}</span><span class="acao">Fechar</span>`
    const remover = () => { try { el.remove() } catch {} }
    el.querySelector('.acao')?.addEventListener('click', remover)
    cont.appendChild(el)
    setTimeout(remover, 4000)
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
      (async () => {
        const promptFn = (window.sitePopup && window.sitePopup.prompt)
          ? window.sitePopup.prompt
          : async (msg) => {
              const val = prompt(msg)
              return val === null ? null : val
            }
        const nomeRes = await promptFn('Informe o nome do vendedor:', 'Editar vendedor', String(lista[idx].nome || ''))
        const emailRes = await promptFn('Informe o e-mail do vendedor:', 'Editar vendedor', String(lista[idx].email || ''))
        const cpfRes = await promptFn('Informe o CPF do vendedor:', 'Editar vendedor', String(lista[idx].cpf || ''))
        const nome = nomeRes ?? lista[idx].nome
        const email = emailRes ?? lista[idx].email
        const cpf = cpfRes ?? lista[idx].cpf
        if (String(nome).trim() && String(email).trim() && String(cpf).trim()) {
          lista[idx].nome = String(nome).trim()
          lista[idx].email = String(email).trim()
          lista[idx].cpf = String(cpf).trim()
          setJSON(STORAGE_KEYS.vendedores, lista)
          renderVendedores()
          logHistorico(`Vendedor editado: ${nome}`)
        }
      })()
    }
  }

  // Config
  function initConfig() {
    const form = document.getElementById('formConfig');
    if (!form) return;
    const cfg = getJSON(STORAGE_KEYS.config, {});
    const nomeEl = document.getElementById('configNomeLoja');
    const telEl = document.getElementById('configTelefone');
    const sobreEl = document.getElementById('configSobre');
    if (nomeEl) nomeEl.value = cfg.nomeLoja ?? '';
    if (telEl) telEl.value = cfg.telefone ?? '';
    if (sobreEl) sobreEl.value = cfg.sobre ?? '';

    // Máscara de telefone BR (celular e fixo)
    const formatTelefoneBR = (v) => {
      const d = String(v || '').replace(/\D/g, '').slice(0, 11);
      if (d.length <= 10) {
        // (11) 2345-6789
        return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (m, a, b, c) => {
          let out = '';
          if (a) out += `(${a}` + (a.length === 2 ? ')' : '') + ' ';
          if (b) out += b + (b.length === 4 ? '-' : '');
          if (c) out += c;
          return out.trim();
        });
      }
      // (11) 91234-5678
      return d.replace(/(\d{0,2})(\d{0,5})(\d{0,4}).*/, (m, a, b, c) => {
        let out = '';
        if (a) out += `(${a}` + (a.length === 2 ? ')' : '') + ' ';
        if (b) out += b + (b.length === 5 ? '-' : '');
        if (c) out += c;
        return out.trim();
      });
    };
    if (telEl) {
      const applyMask = () => { telEl.value = formatTelefoneBR(telEl.value); };
      ['input','change','blur','paste'].forEach(ev => telEl.addEventListener(ev, applyMask));
      // Aplicar máscara ao valor inicial (prefill/local)
      applyMask();
    }

    // Prefetch do servidor (se autenticado) para preencher dados
    (async () => {
      try {
        const r = await fetch('/api/vendors/store/me', { credentials: 'include' });
        const data = await r.json();
        if (data && data.success && data.data) {
          const s = data.data;
          if (nomeEl) nomeEl.value = s.nomeLoja || '';
          if (telEl) { telEl.value = s.telefone || ''; telEl.dispatchEvent(new Event('input')); }
          if (sobreEl) sobreEl.value = s.sobre || '';
          setJSON(STORAGE_KEYS.config, { nomeLoja: s.nomeLoja || '', telefone: s.telefone || '', sobre: s.sobre || '' });
        }
      } catch (e) {
        console.warn('Falha ao obter dados da loja:', e);
      }
    })();

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const novo = {
        nomeLoja: (nomeEl?.value || '').trim(),
        telefone: (telEl?.value || '').trim(),
        sobre: (sobreEl?.value || '').trim(),
      };
      try {
        const r = await fetch('/api/vendors/store/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(novo)
        });
        const data = await r.json();
        if (data && data.success) {
          setJSON(STORAGE_KEYS.config, novo);
          logHistorico('Configurações salvas no servidor');
        } else {
          logHistorico('Falha ao salvar configurações no servidor');
        }
      } catch (e) {
        console.warn('Erro ao salvar loja do vendedor:', e);
        logHistorico('Erro ao salvar configurações no servidor');
      }
    });
  }

  let historicoPaginaAtual = 1;
  let historicoItensPorPagina = (() => {
    const raw = localStorage.getItem('vendor:historico:perPage');
    const n = parseInt(raw || '10', 10);
    return isNaN(n) ? 10 : n;
  })();

  function renderHistorico() {
    const ul = document.getElementById('listaHistorico');
    if (!ul) return;
    const historico = getJSON(STORAGE_KEYS.historico, []);
    const total = historico.length;
    const porPagina = historicoItensPorPagina || 10;
    const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
    if (historicoPaginaAtual > totalPaginas) historicoPaginaAtual = totalPaginas;
    if (historicoPaginaAtual < 1) historicoPaginaAtual = 1;

    const inicio = (historicoPaginaAtual - 1) * porPagina;
    const fim = inicio + porPagina;
    const itensPagina = historico.slice(inicio, fim);

    ul.innerHTML = itensPagina.map(h => `
      <li>
        <i class="fa-solid fa-circle-dot" style="color:#883fd8"></i>
        <span>${h.msg}</span>
        <time>— ${new Date(h.at).toLocaleString('pt-BR')}</time>
      </li>
    `).join('');

    const pagEl = document.getElementById('paginacaoHistorico');
    const infoEl = document.getElementById('histPageInfo');
    const prevBtn = document.getElementById('btnHistPrev');
    const nextBtn = document.getElementById('btnHistNext');
    const sel = document.getElementById('historicoItensPorPagina');
    if (sel) sel.value = String(porPagina);
    if (pagEl) {
      pagEl.style.display = totalPaginas > 1 ? '' : 'none';
      if (infoEl) infoEl.textContent = `${historicoPaginaAtual} / ${totalPaginas}`;
      if (prevBtn) prevBtn.disabled = historicoPaginaAtual <= 1;
      if (nextBtn) nextBtn.disabled = historicoPaginaAtual >= totalPaginas;
    }
  }

  function initHistoricoControls() {
    const sel = document.getElementById('historicoItensPorPagina');
    const prevBtn = document.getElementById('btnHistPrev');
    const nextBtn = document.getElementById('btnHistNext');
    if (sel) {
      sel.addEventListener('change', (e) => {
        const n = parseInt(e.target.value, 10);
        historicoItensPorPagina = isNaN(n) ? 10 : n;
        localStorage.setItem('vendor:historico:perPage', String(historicoItensPorPagina));
        historicoPaginaAtual = 1;
        renderHistorico();
      });
    }
    if (prevBtn) prevBtn.addEventListener('click', () => {
      if (historicoPaginaAtual > 1) {
        historicoPaginaAtual--;
        renderHistorico();
      }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      const historico = getJSON(STORAGE_KEYS.historico, []);
      const totalPaginas = Math.max(1, Math.ceil(historico.length / (historicoItensPorPagina || 10)));
      if (historicoPaginaAtual < totalPaginas) {
        historicoPaginaAtual++;
        renderHistorico();
      }
    });
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
    initHistoricoControls();
    renderHistorico();
    updateStats();
    aplicarBoasVindas();
  });
})();
