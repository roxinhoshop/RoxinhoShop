// Administração: Todos os Produtos
(function(){
  // Mapa de categorias e subcategorias (espelhado de js/produtos.js)
  const sistemaCategorias = {
    'Hardware': { subcategorias: ['Processadores', 'Placas de Vídeo', 'Memórias RAM', 'Placas Mãe', 'Fontes', 'Coolers', 'Gabinetes', 'Armazenamento', 'Placas de Som'] },
    'Periféricos': { subcategorias: ['Teclados', 'Mouses', 'Headsets', 'Webcams', 'Microfones', 'Mousepads', 'Controles', 'Caixas de Som', 'Monitores'] },
    'Computadores': { subcategorias: ['PCs Gamer', 'Workstations', 'All-in-One', 'Mini PCs', 'Notebooks', 'Chromebooks', 'Ultrabooks', 'Tablets'] },
    'Games': { subcategorias: ['Consoles', 'Jogos PC', 'Jogos Console', 'Acessórios Gaming', 'Cadeiras Gamer', 'Mesas Gamer', 'Controles', 'Volantes'] },
    'Celular & Smartphone': { subcategorias: ['Smartphones', 'Capas e Películas', 'Carregadores', 'Fones de Ouvido', 'Power Banks', 'Suportes', 'Smartwatches'] },
    'TV & Áudio': { subcategorias: ['Smart TVs', 'TVs 4K', 'TVs 8K', 'Suportes TV', 'Conversores', 'Antenas', 'Soundbars', 'Home Theater'] },
    'Áudio': { subcategorias: ['Fones de Ouvido', 'Caixas de Som', 'Soundbars', 'Amplificadores', 'Microfones', 'Interfaces de Áudio', 'Monitores de Referência'] },
    'Espaço Gamer': { subcategorias: ['Cadeiras Gamer', 'Mesas Gamer', 'Suportes Monitor', 'Iluminação RGB', 'Decoração', 'Organização', 'Tapetes'] },
    'Casa Inteligente': { subcategorias: ['Assistentes Virtuais', 'Câmeras Segurança', 'Lâmpadas Smart', 'Tomadas Smart', 'Sensores', 'Fechaduras Digitais', 'Termostatos'] },
    'Giftcards': { subcategorias: ['Mais populares','Serviços', 'Jogos', 'Xbox', 'Nintendo'] },
  };

  let carregado = false;

  function createOption(value, text, selected=false) {
    const o = document.createElement('option');
    o.value = value; o.textContent = text;
    if (selected) o.selected = true; return o;
  }

  function popularSelectCategoria(sel, current) {
    sel.innerHTML = '';
    sel.appendChild(createOption('', 'Selecione...'));
    Object.keys(sistemaCategorias).forEach(cat => {
      sel.appendChild(createOption(cat, cat, String(current||'')===cat));
    });
  }

  function popularSelectSubcategoria(sel, categoria, current) {
    sel.innerHTML = '';
    sel.appendChild(createOption('', 'Selecione...'));
    const grupo = sistemaCategorias[categoria];
    const lista = grupo?.subcategorias || [];
    lista.forEach(sub => sel.appendChild(createOption(sub, sub, String(current||'')===sub)));
  }

  function primeiraImagem(p) {
    let imgs = [];
    if (Array.isArray(p.imagens)) imgs = p.imagens;
    else if (typeof p.imagens === 'string') { try { imgs = JSON.parse(p.imagens); } catch(_){} }
    return Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : '/imagens/thumbs/produto1.webp';
  }

  async function carregarProdutosAdmin() {
    if (carregado) return; // evita recargas múltiplas
    try {
      const resp = await fetch('/api/products', { credentials: 'include' });
      const json = await resp.json();
      const lista = Array.isArray(json?.data) ? json.data : [];
      const tbody = document.getElementById('tabelaProdutosBody');
      tbody.innerHTML = '';

      lista.forEach(p => {
        const tr = document.createElement('tr');
        // Foto
        const tdFoto = document.createElement('td');
        const img = document.createElement('img');
        img.className = 'thumb';
        img.src = primeiraImagem(p);
        img.alt = p.titulo || 'Foto do produto';
        tdFoto.appendChild(img);

        // Nome
        const tdNome = document.createElement('td');
        tdNome.textContent = p.titulo || p.nome || `#${p.id}`;

        // Categoria
        const tdCat = document.createElement('td');
        const selCat = document.createElement('select');
        popularSelectCategoria(selCat, p.categoria);
        tdCat.appendChild(selCat);

        // Subcategoria
        const tdSub = document.createElement('td');
        const selSub = document.createElement('select');
        popularSelectSubcategoria(selSub, selCat.value, p.subcategoria);
        tdSub.appendChild(selSub);

        selCat.addEventListener('change', () => {
          popularSelectSubcategoria(selSub, selCat.value, '');
        });

        // Ações
        const tdAcoes = document.createElement('td');
        const aEditar = document.createElement('a');
        aEditar.className = 'btn btn-secundario';
        aEditar.href = `/editar-produto.html?id=${p.id}`;
        aEditar.target = '_blank';
        aEditar.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar';

        const btnSalvar = document.createElement('button');
        btnSalvar.className = 'btn btn-primario';
        btnSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';
        btnSalvar.addEventListener('click', async () => {
          const payload = { categoria: selCat.value || null, subcategoria: selSub.value || null };
          try {
            const r = await fetch(`/api/products/${p.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(payload)
            });
            const j = await r.json();
            if (r.ok && j.success) {
              window.sitePopup && window.sitePopup.alert('Categoria atualizada!', 'Sucesso');
              btnSalvar.textContent = 'Salvo';
              setTimeout(() => { btnSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar'; }, 1200);
            } else {
              throw new Error(j.message || 'Falha ao salvar');
            }
          } catch (e) {
            window.sitePopup && window.sitePopup.alert(e.message || 'Erro ao salvar', 'Erro');
          }
        });

        tdAcoes.appendChild(aEditar);
        tdAcoes.appendChild(btnSalvar);

        tr.appendChild(tdFoto);
        tr.appendChild(tdNome);
        tr.appendChild(tdCat);
        tr.appendChild(tdSub);
        tr.appendChild(tdAcoes);
        tbody.appendChild(tr);
      });

      carregado = true;
    } catch (e) {
      console.error('Erro ao carregar produtos admin:', e);
    }
  }

  function setupAbasAdmin() {
    const btns = Array.from(document.querySelectorAll('.aba-admin'));
    const secVend = document.getElementById('sec-vendedores');
    const secProd = document.getElementById('sec-produtos');
    btns.forEach(b => {
      b.addEventListener('click', () => {
        btns.forEach(x => x.classList.remove('ativa'));
        b.classList.add('ativa');
        const alvo = b.getAttribute('data-target');
        if (alvo === '#sec-produtos') {
          secVend && (secVend.style.display = 'none');
          secProd && (secProd.style.display = 'block');
          carregarProdutosAdmin();
        } else {
          secProd && (secProd.style.display = 'none');
          secVend && (secVend.style.display = 'block');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupAbasAdmin();
  });
})();

