// Administração: Usuários
(function(){
  let listaUsuarios = [];
  let paginaAtual = 1;
  const itensPorPagina = 10;
  let totalPaginas = 1;
  let usuarioEmEdicaoId = null;
  // Mapa de vendedores por userId para exibir ações de Aceitar/Recusar no status pendente
  const vendedoresPorUserId = new Map();

  function criarLinhaUsuario(u) {
    const tr = document.createElement('tr');
    const tdId = document.createElement('td'); tdId.textContent = String(u.id);
    const tdNome = document.createElement('td'); tdNome.textContent = `${u.nome || ''}${u.sobrenome ? ' ' + u.sobrenome : ''}`.trim();
    const tdEmail = document.createElement('td'); tdEmail.textContent = u.email || '—';
    const tdRole = document.createElement('td'); tdRole.textContent = String(u.role || 'cliente');
    const tdAcoes = document.createElement('td');
    tdAcoes.style.whiteSpace = 'nowrap';
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn btn-secundario';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => abrirModalEdicaoUsuario(u));
    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'btn btn-perigo';
    btnExcluir.style.marginLeft = '8px';
    btnExcluir.textContent = 'Excluir';
    btnExcluir.addEventListener('click', () => confirmarExcluirUsuario(u));
    tdAcoes.appendChild(btnEditar);
    // Oculta o botão de excluir para a conta Admin Roxinho Shop (ID 1 / email roxinhoshop@gmail.com)
    const isAdminRoxinho = String(u?.id) === '1' || String(u?.email || '').toLowerCase() === 'roxinhoshop@gmail.com';
    if (!isAdminRoxinho) {
      tdAcoes.appendChild(btnExcluir);
    }

    // Se usuário é vendedor e tem status 'pendente', exibir botões Aceitar/Recusar
    const roleLower = String(u.role || 'cliente').toLowerCase();
    const vendInfo = vendedoresPorUserId.get(Number(u.id));
    const vendStatus = String(vendInfo?.status || '').toLowerCase();
    if (roleLower === 'vendedor' && vendInfo && vendStatus === 'pendente') {
      const btnAceitar = document.createElement('button');
      btnAceitar.className = 'btn btn-primario';
      btnAceitar.style.marginLeft = '8px';
      btnAceitar.textContent = 'Aceitar';
      btnAceitar.addEventListener('click', () => aprovarCadastroVendedor(vendInfo));
      const btnRecusar = document.createElement('button');
      btnRecusar.className = 'btn btn-perigo';
      btnRecusar.style.marginLeft = '8px';
      btnRecusar.textContent = 'Recusar';
      btnRecusar.addEventListener('click', () => rejeitarCadastroVendedor(vendInfo));
      tdAcoes.appendChild(btnAceitar);
      tdAcoes.appendChild(btnRecusar);
    }
    tr.appendChild(tdId);
    tr.appendChild(tdNome);
    tr.appendChild(tdEmail);
    tr.appendChild(tdRole);
    tr.appendChild(tdAcoes);
    return tr;
  }

  function renderTabelaUsuarios() {
    const tbody = document.getElementById('tabelaUsuariosBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!Array.isArray(listaUsuarios) || listaUsuarios.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5; td.textContent = 'Nenhum usuário encontrado';
      tr.appendChild(td); tbody.appendChild(tr);
      const pag = document.getElementById('paginacaoUsuarios');
      if (pag) pag.style.display = 'none';
      return;
    }
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const pagina = listaUsuarios.slice(inicio, fim);
    pagina.forEach(u => tbody.appendChild(criarLinhaUsuario(u)));
  }

  function renderPaginacaoUsuarios() {
    const cont = document.getElementById('paginacaoUsuarios');
    if (!cont) return;
    cont.innerHTML = '';
    totalPaginas = Math.max(1, Math.ceil((listaUsuarios?.length || 0) / itensPorPagina));
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
        renderTabelaUsuarios();
        renderPaginacaoUsuarios();
      }
    }, paginaAtual === 1, false);
    cont.appendChild(btnPrev);

    function addPageButton(p) {
      cont.appendChild(mkBtn(String(p), () => {
        paginaAtual = p;
        renderTabelaUsuarios();
        renderPaginacaoUsuarios();
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
        renderTabelaUsuarios();
        renderPaginacaoUsuarios();
      }
    }, paginaAtual === totalPaginas, false);
    cont.appendChild(btnNext);
  }

  async function carregarUsuariosAdmin() {
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
        throw new Error(json?.message || 'Falha ao carregar usuários');
      }
      listaUsuarios = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);

      // Carregar vendedores para saber status por userId (somente Admin ID1 tem acesso)
      vendedoresPorUserId.clear();
      try {
        const rVend = await fetch('/api/vendors', { credentials: 'include', headers });
        const ct = (rVend.headers.get('content-type') || '').toLowerCase();
        const dataVend = ct.includes('application/json') ? await rVend.json().catch(() => ({})) : {};
        if (rVend.ok && dataVend && dataVend.success && Array.isArray(dataVend.data)) {
          dataVend.data.forEach(v => {
            const uid = Number(v.userId);
            if (!isNaN(uid)) {
              vendedoresPorUserId.set(uid, { id: Number(v.id), status: String(v.status || 'ativo'), nomeLoja: String(v.nomeLoja || '') });
            }
          });
        }
      } catch (eVend) {
        console.warn('Não foi possível carregar vendedores para mapear pendências:', eVend);
      }

      paginaAtual = 1;
      totalPaginas = Math.max(1, Math.ceil(listaUsuarios.length / itensPorPagina));
      renderTabelaUsuarios();
      renderPaginacaoUsuarios();
    } catch (e) {
      console.warn('Erro ao carregar usuários:', e);
      const tbody = document.getElementById('tabelaUsuariosBody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5">Erro ao carregar usuários ou acesso restrito.</td></tr>';
      }
      const pag = document.getElementById('paginacaoUsuarios');
      if (pag) pag.style.display = 'none';
    }
  }

  // ===== Modal de edição de usuário =====
  function abrirModalEdicaoUsuario(u) {
    usuarioEmEdicaoId = u.id;
    const modal = document.getElementById('modalEditarUsuario');
    if (!modal) return;
    const nome = document.getElementById('editarUsuarioNome');
    const sobrenome = document.getElementById('editarUsuarioSobrenome');
    const email = document.getElementById('editarUsuarioEmail');
    const role = document.getElementById('editarUsuarioRole');
    if (nome) nome.value = u.nome || '';
    if (sobrenome) sobrenome.value = u.sobrenome || '';
    if (email) email.value = u.email || '';
    if (role) role.value = (u.role || 'cliente').toLowerCase();
    modal.classList.add('visivel');
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-modal', 'true');
    try { document.body.classList.add('modal-aberto'); } catch (_) {}
  }

  async function salvarEdicaoUsuario() {
    if (!usuarioEmEdicaoId) return;
    const nome = document.getElementById('editarUsuarioNome')?.value || '';
    const sobrenome = document.getElementById('editarUsuarioSobrenome')?.value || '';
    const email = document.getElementById('editarUsuarioEmail')?.value || '';
    const role = document.getElementById('editarUsuarioRole')?.value || '';
    try {
      const headers = { 'Content-Type': 'application/json' };
      try {
        if (typeof window.createDevAdminToken === 'function') {
          const tok = await window.createDevAdminToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      const resp = await fetch(`/api/users/${usuarioEmEdicaoId}` , {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ nome, sobrenome, email, role })
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json?.success) {
        throw new Error(json?.message || 'Falha ao salvar alterações');
      }
      fecharModalEdicaoUsuario();
      await carregarUsuariosAdmin();
    } catch (e) {
      alert('Erro ao salvar usuário: ' + (e?.message || e));
    }
  }

  function fecharModalEdicaoUsuario() {
    const modal = document.getElementById('modalEditarUsuario');
    if (modal) {
      modal.classList.remove('visivel');
      modal.setAttribute('aria-hidden', 'true');
      modal.setAttribute('aria-modal', 'false');
    }
    usuarioEmEdicaoId = null;
    try { document.body.classList.remove('modal-aberto'); } catch (_) {}
  }

  async function confirmarExcluirUsuario(u) {
    if (!u?.id) return;
    let ok = false;
    if (window.sitePopup && typeof window.sitePopup.confirm === 'function') {
      ok = await window.sitePopup.confirm(`Excluir usuário #${u.id} (${u.email})?`, 'Confirmar');
    } else {
      ok = window.confirm(`Excluir usuário #${u.id} (${u.email})?`);
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
        throw new Error(json?.message || 'Falha ao excluir usuário');
      }
      try { window.sitePopup && window.sitePopup.alert('Usuário excluído com sucesso!', 'Sucesso'); } catch {}
      await carregarUsuariosAdmin();
    } catch (e) {
      try { window.sitePopup && window.sitePopup.alert('Erro ao excluir usuário: ' + (e?.message || e), 'Erro'); } catch { alert('Erro ao excluir usuário: ' + (e?.message || e)); }
    }
  }

  // ===== Aprovar/Recusar cadastro de vendedor (Admin ID 1) =====
  async function aprovarCadastroVendedor(info) {
    if (!info || !info.id) return;
    const confirmar = window.sitePopup
      ? await window.sitePopup.confirm('Aceitar cadastro deste vendedor?', 'Confirmar')
      : window.confirm('Aceitar cadastro deste vendedor?');
    if (!confirmar) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      try {
        if (typeof window.createDevAdminToken === 'function') {
          const tok = await window.createDevAdminToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      const resp = await fetch(`/api/vendors/${encodeURIComponent(info.id)}`, {
        method: 'PUT', credentials: 'include', headers, body: JSON.stringify({ status: 'ativo' })
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json?.success) {
        // Fallback: aprovar cadastro pendente órfão
        if (resp.status === 404) {
          const r2 = await fetch(`/api/vendors/pending/${encodeURIComponent(info.id)}/approve`, { method: 'POST', credentials: 'include', headers });
          const j2 = await r2.json().catch(() => ({}));
          if (!r2.ok || !j2?.success) {
            throw new Error(j2?.message || json?.message || 'Falha ao aceitar vendedor');
          }
        } else {
          throw new Error(json?.message || 'Falha ao aceitar vendedor');
        }
      }
      await carregarUsuariosAdmin();
    } catch (e) {
      alert('Erro ao aceitar vendedor: ' + (e?.message || e));
    }
  }

  async function rejeitarCadastroVendedor(info) {
    if (!info || !info.id) return;
    const confirmar = window.sitePopup
      ? await window.sitePopup.confirm('Recusar cadastro deste vendedor?', 'Confirmar')
      : window.confirm('Recusar cadastro deste vendedor?');
    if (!confirmar) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      try {
        if (typeof window.createDevAdminToken === 'function') {
          const tok = await window.createDevAdminToken();
          if (tok) headers['Authorization'] = 'Bearer ' + tok;
        }
      } catch (_) {}
      const resp = await fetch(`/api/vendors/${encodeURIComponent(info.id)}`, {
        method: 'PUT', credentials: 'include', headers, body: JSON.stringify({ status: 'inativo' })
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json?.success) {
        // Fallback: remover cadastro pendente
        if (resp.status === 404) {
          const r2 = await fetch(`/api/vendors/pending/${encodeURIComponent(info.id)}`, { method: 'DELETE', credentials: 'include', headers: { Authorization: headers.Authorization } });
          const j2 = await r2.json().catch(() => ({}));
          if (!r2.ok || !j2?.success) {
            throw new Error(j2?.message || json?.message || 'Falha ao recusar vendedor');
          }
        } else {
          throw new Error(json?.message || 'Falha ao recusar vendedor');
        }
      }
      // Após recusar, efetua exclusão soft para remover linha e pendência
      try {
        const headersDel = {};
        try {
          if (typeof window.createDevAdminToken === 'function') {
            const tok = await window.createDevAdminToken();
            if (tok) headersDel['Authorization'] = 'Bearer ' + tok;
          }
        } catch (_) {}
        const rDel = await fetch(`/api/vendors/${encodeURIComponent(info.id)}?hard=false`, { method: 'DELETE', credentials: 'include', headers: headersDel });
        const jDel = await rDel.json().catch(() => ({}));
        if (!rDel.ok || !jDel?.success) {
          // Se não conseguir excluir o vendedor, garante remoção da pendência
          if (rDel.status === 404) {
            try {
              const r2 = await fetch(`/api/vendors/pending/${encodeURIComponent(info.id)}`, { method: 'DELETE', credentials: 'include', headers: headersDel });
              const j2 = await r2.json().catch(() => ({}));
              if (!r2.ok || !j2?.success) {
                console.warn('Falha ao excluir vendedor após recusa:', jDel?.message || rDel.status);
              }
            } catch (e2) {
              console.warn('Erro ao excluir pendência após recusa:', e2);
            }
          } else {
            console.warn('Falha ao excluir vendedor após recusa:', jDel?.message || rDel.status);
          }
        }
      } catch (eDel) {
        console.warn('Erro ao excluir vendedor após recusa:', eDel);
      }
      await carregarUsuariosAdmin();
    } catch (e) {
      alert('Erro ao recusar vendedor: ' + (e?.message || e));
    }
  }

  // Bind botões do modal
  document.addEventListener('DOMContentLoaded', () => {
    const btnFechar = document.getElementById('fecharModalUsuario');
    const btnCancelar = document.getElementById('cancelarEdicaoUsuario');
    const btnSalvar = document.getElementById('salvarEdicaoUsuario');
    if (btnFechar) btnFechar.addEventListener('click', fecharModalEdicaoUsuario);
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalEdicaoUsuario);
    if (btnSalvar) btnSalvar.addEventListener('click', salvarEdicaoUsuario);
  });

  // Expor para controle de abas
  window.carregarUsuariosAdmin = carregarUsuariosAdmin;
})();
