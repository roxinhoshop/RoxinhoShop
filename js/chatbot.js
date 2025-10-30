// Chatbot Roxinho - UI minimalista com opções numeradas e integração API
(function() {
  const STORAGE_KEY = 'roxinho_chatbot_history_v1';

  function el(tag, cls, children) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (Array.isArray(children)) children.forEach(c => e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = JSON.parse(raw || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch(_) { return []; }
  }
  function saveHistory(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-200))); } catch(_) {}
  }

  function avatarPaths() {
    return {
      roxinho: 'imagens/chatbot/roxinho.png',
      roxFallback: 'imagens/logos/avatar-roxo.svg',
      user: 'imagens/logos/avatar-roxo.svg'
    };
  }

  function buildMenu() {
    const wrap = el('div');
    wrap.appendChild(el('div', null, [document.createTextNode('Olá! Eu sou o Roxinho 🐧. Como posso ajudar?')]))
    const list = el('div', 'chat-options');
    list.appendChild(optionItem('1', 'Catálogos: ver itens mais baratos'));
    list.appendChild(optionItem('2', 'Catálogos: ver itens mais caros'));
    list.appendChild(optionItem('3', 'Produtos mais pesquisados'));
    list.appendChild(optionItem('4', 'Políticas e contato'));
    list.appendChild(optionItem('5', 'Minha conta'));
    wrap.appendChild(list);
    const back = el('div', null, [document.createTextNode('Digite o número ou toque na opção. Você pode voltar ao menu a qualquer momento digitando "menu".')]);
    wrap.appendChild(back);
    return wrap;
  }

  function optionItem(number, text) {
    const it = el('div', 'chat-option');
    it.appendChild(el('span', 'number', [document.createTextNode(number)]));
    it.appendChild(el('span', null, [document.createTextNode(text)]));
    it.dataset.number = number;
    return it;
  }

  function send(url, opts) {
    return fetch(url, opts).then(r => r.json()).catch(e => ({ ok: false, error: 'network_error', message: String(e) }));
  }

  function formatProducts(items) {
    if (!Array.isArray(items) || items.length === 0) return 'Nenhum produto encontrado para este critério.';
    return items.map((p, i) => `${i+1}. ${p.titulo} — ${p.categoria}${p.subcategoria ? ' / '+p.subcategoria : ''} • R$ ${Number(p.preco).toFixed(2)}`).join('\n');
  }

  function policiesText() {
    return 'Resumo: Mantemos transparência de preços e histórico para ajudar você a decidir melhor. Para dúvidas ou suporte, visite a página de contato.';
  }

  function setup() {
    const { roxinho, roxFallback, user } = avatarPaths();
    // Botão flutuante
    const fab = el('button', 'chatbot-fab');
    const fabImg = el('img'); fabImg.src = roxinho; fabImg.onerror = () => { fabImg.src = roxFallback; };
    fab.appendChild(fabImg);
    document.body.appendChild(fab);

    // Backdrop + modal
    const backdrop = el('div', 'chatbot-modal-backdrop');
    const modal = el('div', 'chatbot-modal');
    const header = el('div', 'chatbot-header');
    const hImg = el('img'); hImg.src = roxinho; hImg.onerror = () => { hImg.src = roxFallback; };
    const hTitle = el('div', 'chatbot-title', [document.createTextNode('Roxinho Assistente')]);
    const hSub = el('div', 'chatbot-subtitle', [document.createTextNode('Pergunte ou escolha uma opção')]);
    header.appendChild(hImg); header.appendChild(el('div', null, [hTitle, hSub]));
    const body = el('div', 'chatbot-body');
    const footer = el('div', 'chatbot-footer');
    const input = el('input', 'chat-input'); input.placeholder = 'Digite um número (ex.: 1) ou texto';
    const sendBtn = el('button', 'chat-send', [document.createTextNode('Enviar')]);
    footer.appendChild(input); footer.appendChild(sendBtn);
    modal.appendChild(header); modal.appendChild(body); modal.appendChild(footer);
    document.body.appendChild(backdrop); document.body.appendChild(modal);

    function addRow(text, who) {
      const row = el('div', 'chat-row' + (who === 'user' ? ' user' : ''));
      const avatar = el('img', 'chat-avatar'); avatar.src = who === 'user' ? user : roxinho; avatar.onerror = () => { avatar.src = roxFallback; };
      const bubble = el('div', 'chat-bubble', [document.createTextNode(text)]);
      if (who === 'user') { row.appendChild(bubble); row.appendChild(avatar); }
      else { row.appendChild(avatar); row.appendChild(bubble); }
      body.appendChild(row);
      body.scrollTop = body.scrollHeight;
      const hist = loadHistory(); hist.push({ who, text, ts: Date.now() }); saveHistory(hist);
    }

    function addOptions() {
      const cont = buildMenu();
      const row = el('div', 'chat-row');
      const avatar = el('img', 'chat-avatar'); avatar.src = roxinho; avatar.onerror = () => { avatar.src = roxFallback; };
      const bubble = el('div', 'chat-bubble'); bubble.appendChild(cont);
      row.appendChild(avatar); row.appendChild(bubble);
      body.appendChild(row);
      const opts = cont.querySelectorAll('.chat-option');
      opts.forEach(o => o.addEventListener('click', () => handleChoice(o.dataset.number)));
      body.scrollTop = body.scrollHeight;
    }

    function open() {
      backdrop.classList.add('open'); modal.classList.add('open');
      body.innerHTML = '';
      const hist = loadHistory();
      if (hist.length) hist.forEach(m => addRow(m.text, m.who));
      else {
        addRow('Bem-vindo! Escolha uma opção do menu:', 'bot');
        addOptions();
      }
    }
    function close() { backdrop.classList.remove('open'); modal.classList.remove('open'); }

    backdrop.addEventListener('click', close);
    fab.addEventListener('click', () => { if (modal.classList.contains('open')) close(); else open(); });

    async function handleChoice(val) {
      const num = String(val || '').trim().toLowerCase();
      if (!num) return;
      if (num === 'menu') { addRow('Voltando ao menu principal…', 'bot'); addOptions(); return; }

      addRow(num, 'user');
      if (num === '1') {
        addRow('Ok! Catálogo mais BARATO. Qual categoria? (ex.: Hardware, Smartphones).', 'bot');
      } else if (num === '2') {
        addRow('Certo! Catálogo mais CARO. Qual categoria? (ex.: Hardware, Smartphones).', 'bot');
      } else if (num === '3') {
        addRow('Consultando produtos mais pesquisados…', 'bot');
        const r = await send('/api/products/most-searched');
        const items = r?.data?.products || [];
        addRow(formatProducts(items), 'bot');
      } else if (num === '4') {
        const txt = policiesText();
        addRow(txt + '\n\nVeja mais em: Políticas <https://'+location.host+'/politicas> e Contato <https://'+location.host+'/contato>.', 'bot');
      } else if (num === '5') {
        addRow('Buscando sua conta…', 'bot');
        const me = await send('/api/auth/me');
        if (me?.success && me?.user) {
          const u = me.user;
          addRow(`Conta: ${u.nome} ${u.sobrenome || ''} • ${u.email} • Perfil: ${u.role}`, 'bot');
        } else {
          addRow('Você não está autenticado no momento. Faça login para ver os detalhes da sua conta.', 'bot');
        }
      } else {
        addRow('Não entendi. Digite 1, 2, 3, 4 ou 5; ou "menu".', 'bot');
      }
    }

    sendBtn.addEventListener('click', () => {
      const val = input.value.trim(); if (!val) return; input.value = ''; handleChoice(val);
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const val = input.value.trim(); if (!val) return; input.value=''; handleChoice(val); }});

    // Escuta resposta de categoria após escolher 1 ou 2
    let lastChoice = null;
    body.addEventListener('DOMNodeInserted', () => {
      // simples detecção: se última mensagem do bot pede categoria, guarda estado
      const rows = body.querySelectorAll('.chat-row');
      const last = rows[rows.length - 1];
      if (!last) return;
      const txt = last.querySelector('.chat-bubble')?.textContent || '';
      if (/Catálogo mais BARATO/i.test(txt)) lastChoice = 'cheap';
      else if (/Catálogo mais CARO/i.test(txt)) lastChoice = 'expensive';
    });

    async function searchByCategory(cat, mode) {
      const url = mode === 'cheap' ? `/api/products/top-cheap?categoria=${encodeURIComponent(cat)}` : `/api/products/top-expensive?categoria=${encodeURIComponent(cat)}`;
      const r = await send(url);
      const items = r?.data || [];
      addRow(formatProducts(items), 'bot');
    }

    // Interpretar textos livres como categoria após escolhas 1/2
    const originalHandle = handleChoice;
    handleChoice = async function(val) {
      const v = String(val || '').trim();
      if (!v) return;
      const isNum = /^\d+$/.test(v);
      if (isNum) return originalHandle(v);
      if (v.toLowerCase() === 'menu') return originalHandle('menu');
      if (lastChoice === 'cheap' || lastChoice === 'expensive') {
        addRow(v, 'user');
        await searchByCategory(v, lastChoice);
        lastChoice = null;
        return;
      }
      // fallback: reexibir menu
      addRow('Não entendi. Vamos voltar ao menu principal.', 'bot');
      addOptions();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();

