// Tabela de Vendedores (MVP: localStorage)
(function () {
  const EL = {};
  const state = {
    todos: [],
    filtrados: [],
    paginaAtual: 1,
    itensPorPagina: 10,
    sort: { campo: 'criadoEm', dir: 'desc' },
    filtros: { texto: '', status: 'todos', atividadeDias: 'todos' },
    readonly: false,
    backend: false
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    mapElements();
    bindEvents();
    // Inicializa itens por página a partir do seletor (padrão 10)
    if (EL.itensPorPagina) {
      const v = parseInt(EL.itensPorPagina.value, 10);
      state.itensPorPagina = isNaN(v) || v < 1 ? 10 : v;
    } else {
      state.itensPorPagina = 10;
    }
    await carregarVendedores();
    aplicarFiltrosOrdenacao();
    render();
  }

  function mapElements() {
    EL.busca = document.getElementById('filtroBusca');
    EL.status = document.getElementById('filtroStatus');
    EL.atividade = document.getElementById('filtroAtividade');
    EL.itensPorPagina = document.getElementById('itensPorPagina');
    EL.tbody = document.getElementById('tabelaVendedoresBody');
    EL.paginacao = document.getElementById('paginacao');
    EL.modal = document.getElementById('modalEditar');
    EL.btnFecharModal = document.getElementById('fecharModal');
    EL.btnSalvarEdicao = document.getElementById('salvarEdicao');
    EL.btnCancelarEdicao = document.getElementById('cancelarEdicao');
    EL.editarNome = document.getElementById('editarNome');
    EL.editarNomeLoja = document.getElementById('editarNomeLoja');
    EL.editarCPF = document.getElementById('editarCPF');
    EL.editarStatus = document.getElementById('editarStatus');
    EL.linkDocumento = document.getElementById('linkDocumento');
    EL.bannerCadastro = document.getElementById('bannerCadastroLoja');
  }

  function bindEvents() {
    if (EL.busca) EL.busca.addEventListener('input', () => {
      state.filtros.texto = (EL.busca.value || '').trim().toLowerCase();
      state.paginaAtual = 1;
      aplicarFiltrosOrdenacao();
      render();
    });
    if (EL.status) EL.status.addEventListener('change', () => {
      state.filtros.status = EL.status.value;
      state.paginaAtual = 1;
      aplicarFiltrosOrdenacao();
      render();
    });
    if (EL.atividade) EL.atividade.addEventListener('change', () => {
      state.filtros.atividadeDias = EL.atividade.value; // 'todos' | '7' | '30'
      state.paginaAtual = 1;
      aplicarFiltrosOrdenacao();
      render();
    });
    if (EL.itensPorPagina) EL.itensPorPagina.addEventListener('change', () => {
      const val = parseInt(EL.itensPorPagina.value, 10);
      state.itensPorPagina = isNaN(val) || val < 1 ? 10 : val;
      state.paginaAtual = 1;
      render();
    });

    // Sort por cabeçalho
    document.querySelectorAll('.tabela-vendedores thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const campo = th.getAttribute('data-sort');
        if (!campo) return;
        if (state.sort.campo === campo) {
          state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sort.campo = campo;
          state.sort.dir = 'asc';
        }
        aplicarFiltrosOrdenacao();
        render();
      });
    });

    // Modal
    if (EL.btnFecharModal) EL.btnFecharModal.addEventListener('click', fecharModal);
    if (EL.btnCancelarEdicao) EL.btnCancelarEdicao.addEventListener('click', fecharModal);
    if (EL.btnSalvarEdicao) EL.btnSalvarEdicao.addEventListener('click', salvarEdicaoAtual);

    // Máscara CPF no modal
    if (EL.editarCPF) {
      EL.editarCPF.addEventListener('input', () => {
        const limpo = (EL.editarCPF.value.match(/\d+/g) || []).join('').slice(0, 11);
        EL.editarCPF.value = mascaraCPF(limpo);
      });
    }
  }

  async function carregarVendedores() {
    const API_BASE = window.API_BASE || window.location.origin;
    // Tenta carregar do backend (requer admin autenticado)
    try {
      const headers = {};
      try {
        if (typeof window.createDevAdminToken === 'function') {
          const tok = await window.createDevAdminToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      // Lista de vendedores (todos os status)
      const r = await fetch(`${API_BASE}/api/vendors`, { credentials: 'include', headers });
      const ct = (r.headers.get('content-type') || '').toLowerCase();
      const data = ct.includes('application/json') ? await r.json().catch(() => ({})) : {};
      if (r.ok && data && data.success && Array.isArray(data.data)) {
        const arrRemote = data.data.map(v => {
          const nome = [v.nome, v.sobrenome].filter(Boolean).join(' ').trim();
          const criadoTs = v.criadoEm ? new Date(v.criadoEm).getTime() : Date.now();
          const extras = {
            nomeLoja: String(v.store_nomeLoja || v.nomeLoja || ''),
            telefone: v.store_telefone || null,
            sobre: v.store_sobre || null,
            atualizadoEm: v.store_atualizadoEm || null,
            criadoEm: v.store_criadoEm || null
          };
          return {
            id: String(v.id),
            nome: nome || '—',
            cpf: String(v.documento || ''),
            email: String(v.email || ''),
            status: String(v.status || 'ativo'),
            criadoEm: Number(criadoTs),
            nomeLoja: String(v.nomeLoja || extras.nomeLoja || ''),
            arquivoDocumento: v.arquivoDocumento || null,
            extras
          };
        });
        // Lista de cadastros pendentes do backend
        let arrPend = [];
        try {
          const rPend = await fetch(`${API_BASE}/api/vendors/pending`, { credentials: 'include', headers });
          const ctPend = (rPend.headers.get('content-type') || '').toLowerCase();
          const dataPend = ctPend.includes('application/json') ? await rPend.json().catch(() => ({})) : {};
          if (rPend.ok && dataPend && dataPend.success && Array.isArray(dataPend.data)) {
            arrPend = dataPend.data.map(p => {
              const nome = [p.nome, p.sobrenome].filter(Boolean).join(' ').trim();
              const criadoTs = p.criadoEm
                ? new Date(p.criadoEm).getTime()
                : (p.criadoEmVendor ? new Date(p.criadoEmVendor).getTime() : Date.now());
              const extras = {
                nomeLoja: String(p.store_nomeLoja || p.nomeLoja || ''),
                telefone: p.store_telefone || null,
                sobre: p.store_sobre || null,
                atualizadoEm: p.store_atualizadoEm || null
              };
              return {
                id: String(p.id || p.vendedorId || ''),
                nome: nome || (p.nomeVendedor || '—'),
                cpf: String(p.documento || ''),
                email: String(p.email || ''),
                status: 'pendente',
                criadoEm: Number(criadoTs),
                nomeLoja: String(extras.nomeLoja || ''),
                arquivoDocumento: p.arquivoDocumento || null,
                extras
              };
            });
          }
        } catch (_) {}
        // Mesclar com dados locais (pendentes) para que "Todos" mostre tudo
        const locais = obterVendedoresLocal();
        // Chave robusta para mesclagem quando e-mail não existe
        const mkKey = (v) => {
          try {
            const id = String(v.id || '').trim(); if (id) return 'id:' + id;
            const email = String(v.email || '').toLowerCase().trim(); if (email) return 'email:' + email;
            const cpf = String(v.cpf || '').replace(/\D+/g, ''); if (cpf) return 'cpf:' + cpf;
            const nome = String(v.nome || '').toLowerCase().trim();
            const ts = Number(v.criadoEm || 0) || 0;
            return `nome:${nome}:ts:${ts}`;
          } catch (_) { return 'rand:' + Math.random().toString(36).slice(2); }
        };
        const byKey = new Map();
        // Prefira dados de pendentes do backend quando existir
        arrPend.forEach(v => { const k = mkKey(v); if (!byKey.has(k)) byKey.set(k, v); });
        // Em seguida, mescle vendedores gerais do backend
        arrRemote.forEach(v => { const k = mkKey(v); if (!byKey.has(k)) byKey.set(k, v); });
        // Por último, pendentes locais (fallback) sem sobrescrever já existentes
        locais.forEach(v => { const k = mkKey(v); if (!byKey.has(k)) byKey.set(k, v); });
        const merged = Array.from(byKey.values());
        state.todos = merged.sort((a, b) => b.criadoEm - a.criadoEm);
        state.readonly = false; // vindo do servidor: permitir ações via API
        state.backend = true;
        return;
      }
      // Falha ou não autorizado: fallback local
      carregarVendedoresLocal();
    } catch (_) {
      carregarVendedoresLocal();
    }
  }

  // Obtém dados locais de vendedores (pendentes) sem alterar o estado
  function obterVendedoresLocal() {
    const arr = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('vendor:pending:')) continue;
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        try {
          const extras = JSON.parse(raw);
          if (!extras || !extras.email) continue;
          const email = String(extras.email).toLowerCase();
          const nome = (extras.nome || '').trim();
          const sobrenome = (extras.sobrenome || '').trim();
          const nomeExibicao = nome || sobrenome ? `${nome}${sobrenome ? ' ' + sobrenome : ''}` : '—';
          const status = extras.status || 'ativo';
          arr.push({
            id: email,
            nome: nomeExibicao,
            cpf: String(extras.documento || ''),
            email: email,
            status: status,
            criadoEm: Number(extras.criadoEm || Date.now()),
            nomeLoja: String(extras.nomeLoja || ''),
            arquivoDocumento: extras.arquivoDocumento || null,
            extras
          });
        } catch (_) { }
      }
    } catch (_) { }
    return arr.sort((a, b) => b.criadoEm - a.criadoEm);
  }

  function carregarVendedoresLocal() {
    const arr = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('vendor:pending:')) continue;
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        try {
          const extras = JSON.parse(raw);
          if (!extras || !extras.email) continue;
          const email = String(extras.email).toLowerCase();
          const nome = (extras.nome || '').trim();
          const sobrenome = (extras.sobrenome || '').trim();
          const nomeExibicao = nome || sobrenome ? `${nome}${sobrenome ? ' ' + sobrenome : ''}` : '—';
          const status = extras.status || 'ativo';
          arr.push({
            id: email,
            nome: nomeExibicao,
            cpf: String(extras.documento || ''),
            email: email,
            status: status,
            criadoEm: Number(extras.criadoEm || Date.now()),
            nomeLoja: String(extras.nomeLoja || ''),
            arquivoDocumento: extras.arquivoDocumento || null,
            extras
          });
        } catch (_) { }
      }
    } catch (_) { }
    state.todos = arr.sort((a, b) => b.criadoEm - a.criadoEm);
    state.readonly = false;
  }

  function aplicarFiltrosOrdenacao() {
    let txt = state.filtros.texto;
    const st = state.filtros.status;
    const ad = state.filtros.atividadeDias;
    let out = state.todos.slice();

    // Tratamento: quando usuário digita "todos" na busca, não filtra
    if (txt && (txt === 'todos' || txt === 'all' || txt === '*')) {
      txt = '';
    }
    if (txt) {
      out = out.filter(v =>
        (v.nome || '').toLowerCase().includes(txt) ||
        (v.email || '').toLowerCase().includes(txt) ||
        mascaraCPF(String(v.cpf || '')).includes(txt)
      );
    }
    if (st && st !== 'todos') {
      out = out.filter(v => (v.status || 'ativo') === st);
    }
    if (ad && ad !== 'todos') {
      const dias = Number(ad);
      const lim = Date.now() - dias * 86400000;
      out = out.filter(v => Number(v.criadoEm || 0) >= lim);
    }

    // Ordenação
    const { campo, dir } = state.sort;
    out.sort((a, b) => cmp(a[campo], b[campo], dir));

    state.filtrados = out;
  }

  function cmp(a, b, dir) {
    const va = normalizar(a);
    const vb = normalizar(b);
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  }
  function normalizar(v) {
    if (v == null) return '';
    if (typeof v === 'number') return v;
    if (!isNaN(Number(v))) return Number(v);
    return String(v).toLowerCase();
  }

  function render() {
    renderBannerCadastro();
    renderTabela();
    renderPaginacao();
  }

  function renderTabela() {
    if (!EL.tbody) return;
    const start = (state.paginaAtual - 1) * state.itensPorPagina;
    const end = start + state.itensPorPagina;
    const page = state.filtrados.slice(start, end);
    EL.tbody.innerHTML = page.map(v => `
      <tr>
        <td>${escapeHTML(v.nome || '—')}</td>
        <td>${escapeHTML(mascaraCPF(String(v.cpf || '')) || '—')}</td>
        <td>${escapeHTML(v.email || '—')}</td>
        <td>${formatarData(v.criadoEm)}</td>
        <td>
          ${state.readonly ? '<span class="muted">—</span>' : `
          <div class="acoes">
            <button class="btn btn-secundario" data-acao="inspecionar" data-id="${encodeURIComponent(v.id)}">
              <i class="fa-solid fa-eye"></i> Inspecionar
            </button>
            <button class="btn btn-secundario" data-acao="editar" data-id="${encodeURIComponent(v.id)}">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            ${v.status === 'pendente'
              ? `
                <button class="btn btn-primario" data-acao="aprovar" data-id="${encodeURIComponent(v.id)}"><i class="fa-solid fa-check"></i> Aprovar</button>
                <button class="btn btn-perigo" data-acao="rejeitar" data-id="${encodeURIComponent(v.id)}"><i class="fa-solid fa-xmark"></i> Rejeitar</button>
              `
              : (v.status === 'inativo'
                  ? `<button class="btn btn-primario" data-acao="ativar" data-id="${encodeURIComponent(v.id)}"><i class="fa-solid fa-toggle-on"></i> Ativar</button>`
                  : `<button class="btn btn-perigo" data-acao="desativar" data-id="${encodeURIComponent(v.id)}"><i class="fa-solid fa-toggle-off"></i> Desativar</button>`
                )
            }
            ${(() => {
              const isAdmin = String(v.id) === '1' || String(v.email || '').toLowerCase() === 'roxinhoshop@gmail.com';
              return state.backend && !isAdmin
                ? `<button class="btn btn-perigo" data-acao="excluir" data-id="${encodeURIComponent(v.id)}"><i class="fa-solid fa-trash"></i> Excluir</button>`
                : ''
            })()}
          </div>`}
        </td>
      </tr>
    `).join('');

    // Delegação para ações
    if (!state.readonly) {
      EL.tbody.querySelectorAll('button[data-acao]').forEach(btn => {
        btn.addEventListener('click', onAcao);
      });
    }
  }

function onAcao(e) {
  if (state.readonly) return;
  const btn = e.currentTarget;
  const acao = btn.getAttribute('data-acao');
  const id = decodeURIComponent(btn.getAttribute('data-id') || '');
  const item = state.todos.find(v => v.id === id);
  if (!item) return;
  if (acao === 'editar') abrirModal(item, 'editar');
  else if (acao === 'inspecionar') abrirModal(item, 'inspecionar');
  else if (acao === 'desativar') (state.backend && isNumericId(item.id) ? atualizarStatusAPI(item, 'inativo') : atualizarStatusLocal(item, 'inativo'));
  else if (acao === 'ativar') (state.backend && isNumericId(item.id) ? atualizarStatusAPI(item, 'ativo') : atualizarStatusLocal(item, 'ativo'));
  else if (acao === 'aprovar') (state.backend && isNumericId(item.id) ? atualizarStatusAPI(item, 'ativo') : atualizarStatusLocal(item, 'ativo'));
  else if (acao === 'rejeitar') {
    const confirmar = window.sitePopup
      ? window.sitePopup.confirm('Tem certeza que deseja rejeitar este vendedor?', 'Confirmar')
      : Promise.resolve(window.confirm('Tem certeza que deseja rejeitar este vendedor?'));
    confirmar.then(ok => {
      if (!ok) return;
      if (state.backend && isNumericId(item.id)) {
        // Marca como inativo para remover a pendência e depois exclui o vendedor
        atualizarStatusAPI(item, 'inativo').then(() => excluirVendorAPIDirect(item));
      } else {
        recusarCadastroLocal(item);
      }
    });
  }
  else if (acao === 'excluir') { if (state.backend && isNumericId(item.id)) excluirVendorAPI(item); else recusarCadastroLocal(item); }
}

  function atualizarStatusLocal(item, novo) {
    if (state.readonly) return;
    const extras = obterExtras(item.id);
    if (!extras) return;
    extras.status = novo;
    salvarExtras(item.id, extras);
    carregarVendedores();
    aplicarFiltrosOrdenacao();
    render();
  }

async function atualizarStatusAPI(item, novo) {
  const API_BASE = window.API_BASE || window.location.origin;
  // IDs não numéricos representam cadastros locais; roteia para fluxo local
  if (!isNumericId(item.id)) {
    atualizarStatusLocal(item, novo);
    return;
  }
  try {
    const headers = { 'Content-Type': 'application/json' };
      try {
        if (typeof window.createDevAdminToken === 'function') {
          const tok = await window.createDevAdminToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      const r = await fetch(`${API_BASE}/api/vendors/${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: novo })
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data && data.success) {
        await carregarVendedores();
        aplicarFiltrosOrdenacao();
        render();
      } else {
        // Fallback para pendências órfãs: aprovar ou remover diretamente em cadastros_pendentes
        if (r.status === 404) {
          try {
            if (String(novo).toLowerCase() === 'ativo') {
              const ok = await approvePending(item.id);
              if (ok) {
                await carregarVendedores();
                aplicarFiltrosOrdenacao();
                render();
                return;
              }
            } else if (String(novo).toLowerCase() === 'inativo') {
              const okDel = await removePending(item.id);
              if (okDel) {
                await carregarVendedores();
                aplicarFiltrosOrdenacao();
                render();
                return;
              }
            }
          } catch (_) {}
        }
        window.sitePopup && window.sitePopup.alert('Falha ao atualizar status: ' + (data.message || r.status), 'Erro');
      }
    } catch (err) {
      window.sitePopup && window.sitePopup.alert('Erro ao atualizar status. Verifique sua sessão da Loja.', 'Erro');
    }
  }

  async function approvePending(id) {
    const API_BASE = window.API_BASE || window.location.origin;
    try {
      const headers = { 'Content-Type': 'application/json' };
      try {
        if (typeof window.createDevAdminToken === 'function') {
          const tok = await window.createDevAdminToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      const r = await fetch(`${API_BASE}/api/vendors/pending/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers
      });
      const data = await r.json().catch(() => ({}));
      return Boolean(r.ok && data && data.success);
    } catch (_) {
      return false;
    }
  }

  async function removePending(id) {
    const API_BASE = window.API_BASE || window.location.origin;
    try {
      const headers = {};
      try {
        if (typeof window.createDevAdminToken === 'function') {
          const tok = await window.createDevAdminToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      const r = await fetch(`${API_BASE}/api/vendors/pending/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers
      });
      const data = await r.json().catch(() => ({}));
      return Boolean(r.ok && data && data.success);
    } catch (_) {
      return false;
    }
  }

  // Paginação
  function renderPaginacao() {
    if (!EL.paginacao) return;
    const total = state.filtrados.length;
    const paginas = Math.max(1, Math.ceil(total / state.itensPorPagina));
    const atual = Math.min(state.paginaAtual, paginas);
    state.paginaAtual = atual;

    const mkBtn = (label, page, disabled, ativo) => `<button ${disabled ? 'disabled' : ''} data-p="${page}" class="${ativo ? 'ativo' : ''}">${label}</button>`;

    const parts = [];
    parts.push(mkBtn('«', Math.max(1, atual - 1), atual === 1, false));
    for (let p = 1; p <= paginas; p++) {
      if (p === 1 || p === paginas || Math.abs(p - atual) <= 1) {
        parts.push(mkBtn(String(p), p, false, p === atual));
      } else if (Math.abs(p - atual) === 2) {
        parts.push('<span style="padding:0 4px">…</span>');
      }
    }
    parts.push(mkBtn('»', Math.min(paginas, atual + 1), atual === paginas, false));
    EL.paginacao.innerHTML = parts.join('');
    EL.paginacao.querySelectorAll('button[data-p]').forEach(b => b.addEventListener('click', () => {
      const p = Number(b.getAttribute('data-p')) || 1;
      state.paginaAtual = p;
      render();
    }));
  }

  // Modal edição
  let idEditando = null;
  function abrirModal(item, modo = 'editar') {
    idEditando = item.id;
    const somenteLeitura = modo === 'inspecionar';
    if (EL.editarNome) {
      EL.editarNome.value = item.nome && item.nome !== '—' ? item.nome : '';
      EL.editarNome.disabled = !!somenteLeitura;
    }
    if (EL.editarNomeLoja) {
      EL.editarNomeLoja.value = String(item.nomeLoja || '').trim();
      // Campo informativo: manter desabilitado
      EL.editarNomeLoja.disabled = true;
    }
    if (EL.editarCPF) {
      EL.editarCPF.value = mascaraCPF(String(item.cpf || ''));
      EL.editarCPF.disabled = !!somenteLeitura;
    }
    if (EL.editarStatus) {
      EL.editarStatus.value = item.status || 'ativo';
      EL.editarStatus.disabled = !!somenteLeitura;
    }
    if (EL.linkDocumento) {
      const doc = item.arquivoDocumento;
      if (doc) {
        EL.linkDocumento.href = doc;
        EL.linkDocumento.style.display = '';
        try { EL.linkDocumento.setAttribute('download', 'documento-vendedor'); } catch (_) {}
        EL.linkDocumento.textContent = 'Abrir documento';
      } else {
        EL.linkDocumento.removeAttribute('href');
        EL.linkDocumento.style.display = '';
        EL.linkDocumento.textContent = 'Documento não disponível';
      }
    }
    if (EL.modal) {
      // Atualiza título do modal conforme o modo
      const titulo = EL.modal.querySelector('.modal-cabecalho h3');
      if (titulo) {
        titulo.innerHTML = somenteLeitura
          ? '<i class="fa-solid fa-eye"></i> Inspecionar vendedor'
          : '<i class="fa-solid fa-pen-to-square"></i> Editar vendedor';
      }
      // Exibe/oculta botão salvar em modo leitura
      if (EL.btnSalvarEdicao) EL.btnSalvarEdicao.style.display = somenteLeitura ? 'none' : '';
      EL.modal.classList.add('visivel');
      EL.modal.setAttribute('aria-hidden', 'false');
      EL.modal.setAttribute('aria-modal', 'true');
      try { document.body.classList.add('modal-aberto'); } catch (_) {}
    }
  }

  // Banner simples no topo: mostrar cadastro de loja pendente com ações
  function ensureBannerContainer() {
    try {
      if (EL.bannerCadastro && EL.bannerCadastro.parentNode) return;
      const sec = document.querySelector('#sec-vendedores');
      if (!sec) return;
      const div = document.createElement('section');
      div.id = 'bannerCadastroLoja';
      div.setAttribute('aria-label', 'Cadastro de loja pendente');
      div.style.margin = '12px 0';
      div.style.padding = '12px';
      div.style.border = '1px solid var(--cinza-300)';
      div.style.borderRadius = '12px';
      div.style.background = '#fff';
      div.innerHTML = `
        <div class="conteudo-banner">
          <strong id="bannerTitulo" style="color:#000"><i class="fa-solid fa-bell" style="color:#000"></i> Cadastro de loja pendente</strong>
          <span id="bannerNomeLoja" style="margin-left:8px; color:#344054"></span>
          <div class="acoes-banner" style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
            <button id="bannerAceitar" class="btn btn-primario"><i class="fa-solid fa-check"></i> Aceitar</button>
            <button id="bannerRecusar" class="btn btn-perigo"><i class="fa-solid fa-xmark"></i> Recusar</button>
          </div>
        </div>`;
      const anchor = sec.querySelector('.cabecalho-secao');
      if (anchor && anchor.nextSibling) {
        sec.insertBefore(div, anchor.nextSibling);
      } else {
        sec.insertBefore(div, sec.firstChild);
      }
      EL.bannerCadastro = div;
    } catch (_) {}
  }

function renderBannerCadastro() {
  try {
    ensureBannerContainer();
    const cont = EL.bannerCadastro;
    if (!cont) return;
    const pend = state.todos.find(v => (v.status || 'ativo') === 'pendente');
    if (!pend) { cont.style.display = 'none'; return; }
    const nomeLoja = (pend.nomeLoja || (pend.extras && pend.extras.nomeLoja) || '') || (pend.nome || '—');
    const nameEl = cont.querySelector('#bannerNomeLoja');
    if (nameEl) nameEl.textContent = nomeLoja ? `— ${nomeLoja}` : '';
    cont.style.display = '';
    const btnAceitar = cont.querySelector('#bannerAceitar');
    const btnRecusar = cont.querySelector('#bannerRecusar');
    if (btnAceitar && !btnAceitar.__bound) {
      btnAceitar.__bound = true;
      btnAceitar.addEventListener('click', () => {
        (state.backend && isNumericId(pend.id) ? atualizarStatusAPI(pend, 'ativo') : atualizarStatusLocal(pend, 'ativo'));
      });
    }
    if (btnRecusar && !btnRecusar.__bound) {
      btnRecusar.__bound = true;
      btnRecusar.addEventListener('click', () => {
        const confirmar = window.sitePopup
          ? window.sitePopup.confirm('Tem certeza que deseja recusar este cadastro?', 'Confirmar')
          : Promise.resolve(window.confirm('Tem certeza que deseja recusar este cadastro?'));
        confirmar.then(ok => {
          if (!ok) return;
          if (state.backend && isNumericId(pend.id)) {
            atualizarStatusAPI(pend, 'inativo').then(() => excluirVendorAPIDirect(pend));
          } else {
            recusarCadastroLocal(pend);
          }
        });
      });
    }
  } catch (_) {}
}
  function fecharModal() {
    idEditando = null;
    if (EL.modal) {
      EL.modal.classList.remove('visivel');
      EL.modal.setAttribute('aria-hidden', 'true');
      EL.modal.setAttribute('aria-modal', 'false');
    }
    try { document.body.classList.remove('modal-aberto'); } catch (_) {}
  }
function salvarEdicaoAtual() {
  if (state.readonly) return;
  if (!idEditando) return;
  const nomeExib = (EL.editarNome && EL.editarNome.value || '').trim();
  const cpf = (EL.editarCPF && EL.editarCPF.value || '').replace(/\D+/g, '');
  const status = EL.editarStatus ? EL.editarStatus.value : undefined;
  if (state.backend && isNumericId(idEditando)) {
    salvarEdicaoAPI(idEditando, { nomeExib, cpf, status });
  } else {
    const extras = obterExtras(idEditando);
    if (!extras) return;
    if (nomeExib) { extras.nome = nomeExib; } else { delete extras.nome; }
      if (cpf) { extras.documento = cpf; }
      if (typeof status !== 'undefined') { extras.status = status; }
      salvarExtras(idEditando, extras);
      fecharModal();
      carregarVendedores();
      aplicarFiltrosOrdenacao();
      render();
    }
  }

  async function salvarEdicaoAPI(id, { nomeExib, cpf, status }) {
    const API_BASE = window.API_BASE || window.location.origin;
    try {
      // Quebra nome exibido em nome/sobrenome para a tabela usuario
      let nome = undefined, sobrenome = undefined;
      if (nomeExib) {
        const parts = nomeExib.split(/\s+/);
        nome = parts.shift() || '';
        sobrenome = parts.length ? parts.join(' ') : '';
      }
      const payload = {
        documento: cpf || undefined,
        nome,
        sobrenome
      };
      if (typeof status !== 'undefined') payload.status = status;
      const headers = { 'Content-Type': 'application/json' };
      try {
        if (typeof window.createDevAdminToken === 'function') {
          const tok = await window.createDevAdminToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      const r = await fetch(`${API_BASE}/api/vendors/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data && data.success) {
        fecharModal();
        await carregarVendedores();
        aplicarFiltrosOrdenacao();
        render();
      } else {
        window.sitePopup && window.sitePopup.alert('Falha ao salvar edição: ' + (data.message || r.status), 'Erro');
      }
    } catch (err) {
      window.sitePopup && window.sitePopup.alert('Erro ao salvar edição. Verifique sua sessão da Loja.', 'Erro');
    }
  }

async function excluirVendorAPI(item) {
  const API_BASE = window.API_BASE || window.location.origin;
  const confirmar = window.sitePopup
    ? window.sitePopup.confirm('Tem certeza que deseja excluir este vendedor?', 'Confirmar')
    : Promise.resolve(window.confirm('Tem certeza que deseja excluir este vendedor?'));
  const ok = await confirmar;
  if (!ok) return;
  // IDs não numéricos: tratar como pendência local
  if (!isNumericId(item.id)) {
    recusarCadastroLocal(item);
    return;
  }
  try {
    const headers = {};
      try {
        if (typeof window.createDevAdminToken === 'function') {
          const tok = await window.createDevAdminToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      const r = await fetch(`${API_BASE}/api/vendors/${encodeURIComponent(item.id)}?hard=false`, {
        method: 'DELETE',
        credentials: 'include',
        headers
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data && data.success) {
        await carregarVendedores();
        aplicarFiltrosOrdenacao();
        render();
      } else {
        // Se o vendedor não existe, tenta remover a pendência diretamente
        if (r.status === 404) {
          const okDel = await removePending(item.id);
          if (okDel) {
            await carregarVendedores();
            aplicarFiltrosOrdenacao();
            render();
            return;
          }
        }
        window.sitePopup && window.sitePopup.alert('Falha ao excluir vendedor: ' + (data.message || r.status), 'Erro');
      }
    } catch (err) {
      window.sitePopup && window.sitePopup.alert('Erro ao excluir vendedor. Verifique sua sessão da Loja.', 'Erro');
    }
  }

  // Exclusão direta sem confirmação (usada na recusa)
async function excluirVendorAPIDirect(item) {
  const API_BASE = window.API_BASE || window.location.origin;
  // IDs não numéricos: tratar como pendência local
  if (!isNumericId(item.id)) {
    recusarCadastroLocal(item);
    return;
  }
  try {
    const headers = {};
      try {
        if (typeof window.createDevAdminToken === 'function') {
          const tok = await window.createDevAdminToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      const r = await fetch(`${API_BASE}/api/vendors/${encodeURIComponent(item.id)}?hard=false`, {
        method: 'DELETE',
        credentials: 'include',
        headers
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data && data.success) {
        await carregarVendedores();
        aplicarFiltrosOrdenacao();
        render();
      } else {
        // Fallback: remove pendência quando vendedor não existe
        if (r.status === 404) {
          const okDel = await removePending(item.id);
          if (okDel) {
            await carregarVendedores();
            aplicarFiltrosOrdenacao();
            render();
            return;
          }
        }
        window.sitePopup && window.sitePopup.alert('Falha ao excluir vendedor: ' + (data.message || r.status), 'Erro');
      }
    } catch (err) {
      window.sitePopup && window.sitePopup.alert('Erro ao excluir vendedor. Verifique sua sessão da Loja.', 'Erro');
    }
  }

  // Recusa local: remove do storage e atualiza UI
  function recusarCadastroLocal(item) {
    try { localStorage.removeItem('vendor:pending:' + item.id); } catch (_) {}
    carregarVendedores();
    aplicarFiltrosOrdenacao();
    render();
  }

  function obterExtras(email) {
    try {
      const raw = localStorage.getItem('vendor:pending:' + email);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }
  function salvarExtras(email, extras) {
    try { localStorage.setItem('vendor:pending:' + email, JSON.stringify(extras)); } catch (_) {}
  }

  // Helper: verifica se ID é numérico para chamadas de API
  function isNumericId(id) {
    const s = String(id || '').trim();
    return /^\d+$/.test(s);
  }

  // Utils
  function mascaraCPF(v) {
    const s = String(v || '').replace(/\D+/g, '').slice(0, 11);
    if (s.length <= 3) return s;
    if (s.length <= 6) return `${s.slice(0,3)}.${s.slice(3)}`;
    if (s.length <= 9) return `${s.slice(0,3)}.${s.slice(3,6)}.${s.slice(6)}`;
    return `${s.slice(0,3)}.${s.slice(3,6)}.${s.slice(6,9)}-${s.slice(9,11)}`;
  }
  function formatarData(ts) {
    const d = new Date(Number(ts || Date.now()));
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
           ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function badgeStatus(status) {
    const st = (status || 'ativo');
    const cls = st === 'inativo' ? 'status-inativo' : (st === 'pendente' ? 'status-pendente' : 'status-ativo');
    const icon = st === 'inativo' ? 'fa-toggle-off' : (st === 'pendente' ? 'fa-hourglass-half' : 'fa-toggle-on');
    const txt = st === 'inativo' ? 'Inativo' : (st === 'pendente' ? 'Pendente' : 'Ativo');
    return `<span class="status-badge ${cls}"><i class="fa-solid ${icon}"></i>${txt}</span>`;
  }
  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
