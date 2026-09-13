/* ==========================================================================
   CHOPP SUEY — script principal
   Cardápio, carrinho de compras, parallax, menus e modais interativos.
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- Dados do cardápio ---------- */
  const PRODUTOS = [
    {
      id: 'red-dead',
      nome: 'Cerveja Red Dead',
      tipo: 'Amber Ale',
      desc: 'Maltada e encorpada, com notas de caramelo e final levemente amargo.',
      preco: 14.99,
      img: 'images/prod-red-dead.jpg'
    },
    {
      id: 'everglades',
      nome: 'Cerveja Everglades',
      tipo: 'Green IPA',
      desc: 'Lupulada e refrescante, com aroma cítrico e herbal marcante.',
      preco: 13.00,
      img: 'images/prod-everglades.jpg'
    },
    {
      id: 'ocean-boulevard',
      nome: 'Cerveja Ocean Boulevard',
      tipo: 'Golden Lager',
      desc: 'Leve e dourada, ideal para dias quentes à beira-mar.',
      preco: 12.00,
      img: 'images/prod-ocean.jpg'
    },
    {
      id: 'pilsen',
      nome: 'Cerveja Pilsen',
      tipo: 'Pilsen Clássica',
      desc: 'Cristalina e leve, com espuma cremosa e amargor equilibrado.',
      preco: 10.00,
      img: 'images/prod-pilsen.jpg'
    },
    {
      id: 'witbier',
      nome: 'Cerveja Witte Roos',
      tipo: 'Witbier Cítrica',
      desc: 'Trigo belga com toques de laranja e coentro, turva e aromática.',
      preco: 15.50,
      img: 'images/prod-witbier.jpg'
    },
    {
      id: 'session',
      nome: 'Cerveja Session Red',
      tipo: 'Session Ale',
      desc: 'Fácil de beber, com corpo médio e final seco.',
      preco: 11.50,
      img: 'images/prod-session.jpg'
    }
  ];

  const AVALIACOES = [
    { nome: 'Markus Oliveira', texto: '"Melhor cervejaria da cidade!"', img: 'images/avatar-markus.png' },
    { nome: 'Chloe Nascimento', texto: '"Um ambiente maravilhoso com cerveja de qualidade."', img: 'images/avatar-chloe.png' },
    { nome: 'Bento Gonçalves', texto: '"Virei cliente fiel, sem dúvidas, maravilhoso!"', img: 'images/avatar-bento.png' }
  ];

  const fmtBRL = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  /* ---------- Estado do carrinho (persistido) ---------- */
  let carrinho = {};
  try {
    carrinho = JSON.parse(localStorage.getItem('chopp-suey-carrinho') || '{}');
  } catch (e) {
    carrinho = {};
  }

  function salvarCarrinho() {
    try { localStorage.setItem('chopp-suey-carrinho', JSON.stringify(carrinho)); } catch (e) { /* ambiente sem storage */ }
  }

  /* ---------- Render do cardápio ---------- */
  const grid = document.getElementById('productGrid');
  const quantSelecionadas = {};

  function renderProdutos() {
    grid.innerHTML = PRODUTOS.map((p) => {
      quantSelecionadas[p.id] = quantSelecionadas[p.id] || 1;
      return `
      <article class="box reveal visivel" data-id="${p.id}">
        <div class="box-img"><img src="${p.img}" alt="${p.nome}" loading="lazy"></div>
        <span class="tag">${p.tipo}</span>
        <h3>${p.nome}</h3>
        <p class="desc">${p.desc}</p>
        <div class="preço">${fmtBRL(p.preco)}</div>
        <div class="qty-row">
          <button type="button" class="qty-menos" aria-label="Diminuir quantidade">−</button>
          <span class="qty-valor">${quantSelecionadas[p.id]}</span>
          <button type="button" class="qty-mais" aria-label="Aumentar quantidade">+</button>
        </div>
        <button type="button" class="btn btn-primary btn-block btn-add">Adicionar ao carrinho</button>
      </article>`;
    }).join('');
  }

  grid.addEventListener('click', (e) => {
    const box = e.target.closest('.box');
    if (!box) return;
    const id = box.dataset.id;
    const valorSpan = box.querySelector('.qty-valor');

    if (e.target.classList.contains('qty-mais')) {
      quantSelecionadas[id] = Math.min(quantSelecionadas[id] + 1, 20);
      valorSpan.textContent = quantSelecionadas[id];
    }
    if (e.target.classList.contains('qty-menos')) {
      quantSelecionadas[id] = Math.max(quantSelecionadas[id] - 1, 1);
      valorSpan.textContent = quantSelecionadas[id];
    }
    if (e.target.classList.contains('btn-add')) {
      const produto = PRODUTOS.find((p) => p.id === id);
      const qtd = quantSelecionadas[id];
      carrinho[id] = (carrinho[id] || 0) + qtd;
      salvarCarrinho();
      renderCarrinho();
      mostrarToast(`${qtd}x ${produto.nome} adicionado ao carrinho`);
      quantSelecionadas[id] = 1;
      valorSpan.textContent = 1;
    }
  });

  /* ---------- Render das avaliações ---------- */
  const estrela = '<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L10 14.9 4.4 18l1.4-6.2L1 7.5l6.4-.6L10 1z"/></svg>';
  document.getElementById('reviewGrid').innerHTML = AVALIACOES.map((r) => `
    <div class="review reveal visivel">
      <img src="${r.img}" alt="Foto de ${r.nome}">
      <p>${r.texto}</p>
      <h3>${r.nome}</h3>
      <div class="stars">${estrela.repeat(5)}</div>
    </div>
  `).join('');

  /* ---------- Carrinho: drawer ---------- */
  const cartDrawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('overlay');
  const cartItemsEl = document.getElementById('cartItems');
  const cartEmptyMsg = document.getElementById('cartEmptyMsg');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartCountEl = document.getElementById('cartCount');
  const checkoutBtn = document.getElementById('checkoutBtn');

  function renderCarrinho() {
    const ids = Object.keys(carrinho).filter((id) => carrinho[id] > 0);
    const totalItens = ids.reduce((s, id) => s + carrinho[id], 0);
    cartCountEl.textContent = totalItens;

    if (ids.length === 0) {
      cartItemsEl.innerHTML = '';
      cartItemsEl.appendChild(cartEmptyMsg);
      cartTotalEl.textContent = fmtBRL(0);
      checkoutBtn.disabled = true;
      return;
    }

    let total = 0;
    cartItemsEl.innerHTML = ids.map((id) => {
      const p = PRODUTOS.find((x) => x.id === id);
      const qtd = carrinho[id];
      const subtotal = p.preco * qtd;
      total += subtotal;
      return `
      <div class="cart-item" data-id="${id}">
        <img src="${p.img}" alt="${p.nome}">
        <div class="cart-item-info">
          <h4>${p.nome}</h4>
          <div class="preço">${fmtBRL(subtotal)}</div>
          <div class="cart-item-actions">
            <button type="button" class="c-menos" aria-label="Diminuir">−</button>
            <span>${qtd}</span>
            <button type="button" class="c-mais" aria-label="Aumentar">+</button>
            <button type="button" class="cart-item-remove">Remover</button>
          </div>
        </div>
      </div>`;
    }).join('');
    cartTotalEl.textContent = fmtBRL(total);
    checkoutBtn.disabled = false;
  }

  cartItemsEl.addEventListener('click', (e) => {
    const item = e.target.closest('.cart-item');
    if (!item) return;
    const id = item.dataset.id;
    if (e.target.classList.contains('c-mais')) carrinho[id]++;
    if (e.target.classList.contains('c-menos')) carrinho[id] = Math.max(carrinho[id] - 1, 0);
    if (e.target.classList.contains('cart-item-remove')) carrinho[id] = 0;
    if (carrinho[id] === 0) delete carrinho[id];
    salvarCarrinho();
    renderCarrinho();
  });

  function abrirCarrinho() {
    cartDrawer.classList.add('aberto');
    overlay.classList.add('aberto');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.getElementById('cartToggle').setAttribute('aria-expanded', 'true');
  }
  function fecharCarrinho() {
    cartDrawer.classList.remove('aberto');
    overlay.classList.remove('aberto');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.getElementById('cartToggle').setAttribute('aria-expanded', 'false');
  }
  document.getElementById('cartToggle').addEventListener('click', abrirCarrinho);
  document.getElementById('cartClose').addEventListener('click', fecharCarrinho);
  overlay.addEventListener('click', () => { fecharCarrinho(); fecharModais(); });

  /* ---------- Modais (login / checkout) ---------- */
  const loginModal = document.getElementById('loginModal');
  const checkoutModal = document.getElementById('checkoutModal');

  function abrirModal(modal) {
    modal.classList.add('aberto');
    modal.setAttribute('aria-hidden', 'false');
    overlay.classList.add('aberto');
  }
  function fecharModais() {
    [loginModal, checkoutModal].forEach((m) => {
      m.classList.remove('aberto');
      m.setAttribute('aria-hidden', 'true');
    });
    if (!cartDrawer.classList.contains('aberto')) overlay.classList.remove('aberto');
  }

  document.getElementById('loginLink').addEventListener('click', (e) => {
    e.preventDefault();
    abrirModal(loginModal);
  });
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', fecharModais);
  });

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    fecharModais();
    mostrarToast('Login fictício realizado com sucesso!');
    e.target.reset();
  });

  checkoutBtn.addEventListener('click', () => {
    if (checkoutBtn.disabled) return;
    fecharCarrinho();
    carrinho = {};
    salvarCarrinho();
    renderCarrinho();
    setTimeout(() => abrirModal(checkoutModal), 250);
  });
  document.getElementById('checkoutCloseBtn').addEventListener('click', fecharModais);

  /* ---------- Newsletter ---------- */
  document.getElementById('newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail');
    const feedback = document.getElementById('newsletterFeedback');
    if (email.checkValidity()) {
      feedback.textContent = 'Inscrição fictícia confirmada — obrigado!';
      email.value = '';
    } else {
      feedback.textContent = 'Digite um e-mail válido.';
    }
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('mostrar');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('mostrar'), 2600);
  }

  /* ---------- Menu mobile (hamburguer) ---------- */
  const hamburguer = document.getElementById('hamburguer');
  const menu = document.getElementById('menu');
  hamburguer.addEventListener('click', () => {
    const aberto = menu.classList.toggle('ativo');
    hamburguer.classList.toggle('ativo', aberto);
    hamburguer.setAttribute('aria-expanded', String(aberto));
  });
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('ativo');
      hamburguer.classList.remove('ativo');
      hamburguer.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Rolagem suave / seção ativa ---------- */
  document.getElementById('scrollCue').addEventListener('click', () => {
    document.getElementById('sobre').scrollIntoView({ behavior: 'smooth' });
  });

  const secoes = ['topo', 'sobre', 'produtos', 'review'].map((id) => document.getElementById(id));
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  function atualizarLinkAtivo() {
    let atual = secoes[0].id;
    const y = window.scrollY + window.innerHeight * 0.4;
    secoes.forEach((sec) => { if (sec && sec.offsetTop <= y) atual = sec.id; });
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + atual);
    });
  }

  /* ---------- Efeito parallax ---------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroParallax = document.getElementById('heroParallax');
  const sobreParallax = document.getElementById('sobreParallax');
  const heroSection = document.getElementById('topo');
  const sobreSection = document.getElementById('sobre');

  function aplicarParallax() {
    if (prefersReduced) return;
    const scrollY = window.scrollY;

    const heroRect = heroSection.getBoundingClientRect();
    if (heroRect.bottom > 0 && heroRect.top < window.innerHeight) {
      heroParallax.style.transform = `translate3d(0, ${scrollY * 0.32}px, 0)`;
    }

    const sobreRect = sobreSection.getBoundingClientRect();
    if (sobreRect.bottom > 0 && sobreRect.top < window.innerHeight) {
      const offset = (sobreRect.top - window.innerHeight) * 0.12;
      sobreParallax.style.transform = `translate3d(0, ${offset}px, 0)`;
    }
  }

  let ticking = false;
  function aoRolar() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        aplicarParallax();
        atualizarLinkAtivo();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', aoRolar, { passive: true });

  /* ---------- Revelação ao rolar (scroll reveal) ---------- */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visivel');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  /* ---------- Inicialização ---------- */
  renderProdutos();
  renderCarrinho();
  aplicarParallax();
  atualizarLinkAtivo();

  // fechar modais/carrinho com a tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { fecharCarrinho(); fecharModais(); }
  });
})();
