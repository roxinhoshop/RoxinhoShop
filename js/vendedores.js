// Tabela de Vendedores (MVP: localStorage)
(function () {
  const EL = {};
  const state = {
    todos: [],
    filtrados: [],
    paginaAtual: 1,
    itensPorPagina: Infinity,
    sort: { campo: 'criadoEm', dir: 'desc' },
    filtros: { texto: '', status: 'todos', atividadeDias: 'todos' },
    readonly: false,
    backend: false
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    mapElements();
    bindEvents();
    // Inicia com "Todos" os itens por página para exibir toda a lista
    if (EL.itensPorPagina) { try { EL.itensPorPagina.value = 'todos'; } catch (_) {} }
    carregarVendedores();
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
      const val = EL.itensPorPagina.value;
      if (String(val) === 'todos') {
        state.itensPorPagina = Infinity;
      } else {
        state.itensPorPagina = Math.max(1, Number(val || 10));
      }
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
      const r = await fetch(`${API_BASE}/api/vendors`, { credentials: 'include' });
      const ct = (r.headers.get('content-type') || '').toLowerCase();
      const data = ct.includes('application/json') ? await r.json().catch(() => ({})) : {};
      if (r.ok && data && data.success && Array.isArray(data.data)) {
        const arr = data.data.map(v => {
          const nome = [v.nome, v.sobrenome].filter(Boolean).join(' ').trim();
          const criadoTs = v.criadoEm ? new Date(v.criadoEm).getTime() : Date.now();
          return {
            id: String(v.id),
            nome: nome || '—',
            cpf: String(v.documento || ''),
            email: String(v.email || ''),
            status: String(v.status || 'ativo'),
            criadoEm: Number(criadoTs),
            nomeLoja: String(v.nomeLoja || ''),
            arquivoDocumento: v.arquivoDocumento || null,
            extras: null
          };
        });
        state.todos = arr.sort((a, b) => b.criadoEm - a.criadoEm);
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
    const txt = state.filtros.texto;
    const st = state.filtros.status;
    const ad = state.filtros.atividadeDias;
    let out = state.todos.slice();

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
        <td>${badgeStatus(v.status || 'ativo')}</td>
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
            ${state.backend ? `<button class="btn btn-perigo" data-acao="excluir" data-id="${encodeURIComponent(v.id)}"><i class="fa-solid fa-trash"></i> Excluir</button>` : ''}
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
    else if (acao === 'desativar') (state.backend ? atualizarStatusAPI(item, 'inativo') : atualizarStatusLocal(item, 'inativo'));
    else if (acao === 'ativar') (state.backend ? atualizarStatusAPI(item, 'ativo') : atualizarStatusLocal(item, 'ativo'));
    else if (acao === 'aprovar') (state.backend ? atualizarStatusAPI(item, 'ativo') : atualizarStatusLocal(item, 'ativo'));
    else if (acao === 'rejeitar') {
      const confirmar = window.sitePopup
        ? window.sitePopup.confirm('Tem certeza que deseja rejeitar este vendedor?', 'Confirmar')
        : Promise.resolve(window.confirm('Tem certeza que deseja rejeitar este vendedor?'));
      confirmar.then(ok => {
        if (!ok) return;
        (state.backend ? atualizarStatusAPI(item, 'inativo') : atualizarStatusLocal(item, 'inativo'));
      });
    }
    else if (acao === 'excluir' && state.backend) excluirVendorAPI(item);
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
    try {
      const r = await fetch(`${API_BASE}/api/vendors/${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novo })
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data && data.success) {
        await carregarVendedores();
        aplicarFiltrosOrdenacao();
        render();
      } else {
        window.sitePopup && window.sitePopup.alert('Falha ao atualizar status: ' + (data.message || r.status), 'Erro');
      }
    } catch (err) {
      window.sitePopup && window.sitePopup.alert('Erro ao atualizar status. Verifique sua sessão da Loja.', 'Erro');
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
    }
  }
  function fecharModal() {
    idEditando = null;
    if (EL.modal) {
      EL.modal.classList.remove('visivel');
      EL.modal.setAttribute('aria-hidden', 'true');
      EL.modal.setAttribute('aria-modal', 'false');
    }
  }
  function salvarEdicaoAtual() {
    if (state.readonly) return;
    if (!idEditando) return;
    const nomeExib = (EL.editarNome && EL.editarNome.value || '').trim();
    const cpf = (EL.editarCPF && EL.editarCPF.value || '').replace(/\D+/g, '');
    const status = (EL.editarStatus && EL.editarStatus.value) || 'ativo';
    if (state.backend) {
      salvarEdicaoAPI(idEditando, { nomeExib, cpf, status });
    } else {
      const extras = obterExtras(idEditando);
      if (!extras) return;
      if (nomeExib) { extras.nome = nomeExib; } else { delete extras.nome; }
      if (cpf) { extras.documento = cpf; }
      extras.status = status;
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
        status,
        documento: cpf || undefined,
        nome,
        sobrenome
      };
      const r = await fetch(`${API_BASE}/api/vendors/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    try {
      const r = await fetch(`${API_BASE}/api/vendors/${encodeURIComponent(item.id)}?hard=false`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data && data.success) {
        await carregarVendedores();
        aplicarFiltrosOrdenacao();
        render();
      } else {
        window.sitePopup && window.sitePopup.alert('Falha ao excluir vendedor: ' + (data.message || r.status), 'Erro');
      }
    } catch (err) {
      window.sitePopup && window.sitePopup.alert('Erro ao excluir vendedor. Verifique sua sessão da Loja.', 'Erro');
    }
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
