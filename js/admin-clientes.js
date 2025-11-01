// Administração: Clientes
(function(){
  let listaClientes = [];
  let paginaAtual = 1;
  const itensPorPagina = 10;
  let totalPaginas = 1;

  function criarLinhaCliente(u) {
    const tr = document.createElement('tr');
    const tdId = document.createElement('td'); tdId.textContent = String(u.id);
    const tdNome = document.createElement('td'); tdNome.textContent = `${u.nome || ''}${u.sobrenome ? ' ' + u.sobrenome : ''}`.trim();
    const tdEmail = document.createElement('td'); tdEmail.textContent = u.email || '—';
    const tdAcoes = document.createElement('td');
    tdAcoes.style.whiteSpace = 'nowrap';
    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'btn btn-perigo';
    btnExcluir.textContent = 'Excluir';
    btnExcluir.addEventListener('click', () => confirmarExcluirCliente(u));
    tdAcoes.appendChild(btnExcluir);
    tr.appendChild(tdId);
    tr.appendChild(tdNome);
    tr.appendChild(tdEmail);
    tr.appendChild(tdAcoes);
    return tr;
  }

  function renderTabelaClientes() {
    const tbody = document.getElementById('tabelaClientesBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!Array.isArray(listaClientes) || listaClientes.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4; td.textContent = 'Nenhum cliente encontrado';
      tr.appendChild(td); tbody.appendChild(tr);
      const pag = document.getElementById('paginacaoClientes');
      if (pag) pag.style.display = 'none';
      return;
    }
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const pagina = listaClientes.slice(inicio, fim);
    pagina.forEach(u => tbody.appendChild(criarLinhaCliente(u)));
  }

  function renderPaginacaoClientes() {
    const cont = document.getElementById('paginacaoClientes');
    if (!cont) return;
    cont.innerHTML = '';
    totalPaginas = Math.max(1, Math.ceil((listaClientes?.length || 0) / itensPorPagina));
    if (totalPaginas <= 1) { cont.style.display = 'none'; return; }
    cont.style.display = 'flex';

    const info = document.createElement('span');
    info.className = 'info-pagina';
    info.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    cont.appendChild(info);
    const mkBtn = (label, onClick, disabled, ativo) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.disabled = !!disabled;
      if (ativo) b.className = 'ativo';
      b.addEventListener('click', onClick);
      return b;
    };

    const btnPrev = mkBtn('‹ Anterior', () => {
      if (paginaAtual > 1) {
        paginaAtual -= 1;
        renderTabelaClientes();
        renderPaginacaoClientes();
      }
    }, paginaAtual === 1, false);
    cont.appendChild(btnPrev);

    function addPageButton(p) {
      cont.appendChild(mkBtn(String(p), () => {
        paginaAtual = p;
        renderTabelaClientes();
        renderPaginacaoClientes();
      }, false, p === paginaAtual));
    }
    function addEllipsis() {
      const s = document.createElement('span');
      s.className = 'pontos'; s.textContent = '...';
      cont.appendChild(s);
    }

    const start = Math.max(1, paginaAtual - 2);
    const end = Math.min(totalPaginas, paginaAtual + 2);
    if (start > 1) { addPageButton(1); if (start > 2) addEllipsis(); }
    for (let p = start; p <= end; p++) addPageButton(p);
    if (end < totalPaginas) { if (end < totalPaginas - 1) addEllipsis(); addPageButton(totalPaginas); }

    const btnNext = mkBtn('Próxima ›', () => {
      if (paginaAtual < totalPaginas) {
        paginaAtual += 1;
        renderTabelaClientes();
        renderPaginacaoClientes();
      }
    }, paginaAtual === totalPaginas, false);
    cont.appendChild(btnNext);
  }

  async function carregarClientesAdmin() {
    try {
      const headers = {};
      try {
        if (typeof window.createDevAdminToken === 'function') {
          const tok = await window.createDevAdminToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      const resp = await fetch('/api/users', { credentials: 'include', headers });
      const json = await resp.json();
      if (!resp.ok || !json?.success) {
        throw new Error(json?.message || 'Falha ao carregar clientes');
      }
      const todos = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      listaClientes = todos.filter(u => String(u.role || 'cliente').toLowerCase() === 'cliente');
      paginaAtual = 1;
      totalPaginas = Math.max(1, Math.ceil(listaClientes.length / itensPorPagina));
      renderTabelaClientes();
      renderPaginacaoClientes();
    } catch (e) {
      console.warn('Erro ao carregar clientes:', e);
      const tbody = document.getElementById('tabelaClientesBody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar clientes ou acesso restrito.</td></tr>';
      }
      const pag = document.getElementById('paginacaoClientes');
      if (pag) pag.style.display = 'none';
    }
  }

  async function confirmarExcluirCliente(u) {
    if (!u?.id) return;
    let ok = false;
    if (window.sitePopup && typeof window.sitePopup.confirm === 'function') {
      ok = await window.sitePopup.confirm(`Excluir cliente #${u.id} (${u.email})?`, 'Confirmar');
    } else {
      ok = window.confirm(`Excluir cliente #${u.id} (${u.email})?`);
    }
    if (!ok) return;
    try {
      const headers = {};
      try {
        if (typeof window.createDevAdminToken === 'function') {
          const tok = await window.createDevAdminToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      const resp = await fetch(`/api/users/${u.id}`, { method: 'DELETE', credentials: 'include', headers });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json?.success) {
        throw new Error(json?.message || 'Falha ao excluir cliente');
      }
      try { window.sitePopup && window.sitePopup.alert('Cliente excluído com sucesso!', 'Sucesso'); } catch {}
      await carregarClientesAdmin();
    } catch (e) {
      try { window.sitePopup && window.sitePopup.alert('Erro ao excluir cliente: ' + (e?.message || e), 'Erro'); } catch { alert('Erro ao excluir cliente: ' + (e?.message || e)); }
    }
  }

  // Expor para controle de abas
  window.carregarClientesAdmin = carregarClientesAdmin;
})();

