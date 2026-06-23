/* ── Tema e identidade ── */
function applyBranding(s) {
  const name = (s && s.site_name) || 'Vinhos Raros';
  const logo = (s && s.logo) || '/logo.png';
  document.querySelectorAll('[data-site-logo]').forEach((img) => {
    img.src = logo;
    img.alt = name;
  });
  document.querySelectorAll('[data-site-name]').forEach((el) => {
    el.textContent = name;
  });
  if (document.title.includes('Vinhos Raros')) {
    document.title = document.title.replace('Vinhos Raros', name);
  }
}

let siteSettings = {};
fetch('/api/settings').then(r => r.json()).then(s => {
  siteSettings = s || {};
  document.documentElement.setAttribute('data-theme', s.theme || 'dark');
  applyBranding(s);
  applyTicker(s.ticker_text || '');
}).catch(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
});

function applyTicker(text) {
  const inner = document.getElementById('ticker-inner');
  const track = document.getElementById('ticker-track');
  const band  = document.getElementById('beneficios');
  if (!inner || !track) return;
  if (!text.trim()) {
    if (band) band.style.display = 'none';
    return;
  }
  const segment = text + '   ·   ';
  inner.textContent = segment.repeat(5);
  const clone = inner.cloneNode(true);
  track.appendChild(clone);
}

function esc(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});

let wines = [];

const cart = JSON.parse(localStorage.getItem("vinhosRarosCart") || "[]");

function saveCart() {
  localStorage.setItem("vinhosRarosCart", JSON.stringify(cart));
  renderCart();
}

function addToCart(id) {
  const wine = wines.find((w) => w.id === id);
  const stock = wine ? Number(wine.stock) || 0 : 0;
  const item = cart.find((cartItem) => cartItem.id === id);
  const currentQty = item ? item.qty : 0;

  // respeita o estoque quando definido (> 0)
  if (stock > 0 && currentQty >= stock) {
    document.body.classList.add("cart-open");
    return;
  }

  if (item) {
    item.qty += 1;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart();
  document.body.classList.add("cart-open");
}

function removeFromCart(id) {
  const index = cart.findIndex((item) => item.id === id);
  if (index >= 0) cart.splice(index, 1);
  saveCart();
}

function decrementCart(id) {
  const index = cart.findIndex((item) => item.id === id);
  if (index >= 0) {
    cart[index].qty -= 1;
    if (cart[index].qty <= 0) cart.splice(index, 1);
  }
  saveCart();
}

function renderBottle(wine) {
  if (wine.image) {
    return `
      <div class="bottle-wrap wine-photo-wrap" aria-hidden="true">
        <img class="wine-photo" src="${wine.image}" alt="${wine.name}" loading="lazy" />
        <span class="wine-photo-label" style="border-color:${wine.accent}; color:${wine.accent}">${wine.label}</span>
      </div>
    `;
  }
  return `
    <div class="bottle-wrap" aria-hidden="true">
      <div class="bottle-neck" style="background:${wine.color}"></div>
      <div class="bottle" style="background:linear-gradient(135deg, ${wine.color}, #1b1114 72%)">
        <span style="border-color:${wine.accent}; color:${wine.accent}">${wine.label}</span>
      </div>
    </div>
  `;
}

function renderCart() {
  // remove itens órfãos (vinho excluído/alterado) — só quando o catálogo já carregou
  if (wines.length) {
    let pruned = false;
    for (let i = cart.length - 1; i >= 0; i--) {
      if (!wines.find((w) => w.id === cart[i].id)) {
        cart.splice(i, 1);
        pruned = true;
      }
    }
    if (pruned) localStorage.setItem("vinhosRarosCart", JSON.stringify(cart));
  }

  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = count;
  });

  const itemsRoot = document.querySelector("[data-cart-items]");
  const totalRoot = document.querySelector("[data-cart-total]");
  if (!itemsRoot || !totalRoot) return;

  if (!cart.length) {
    itemsRoot.innerHTML = `<p class="empty-cart">Seu carrinho está vazio.</p>`;
    totalRoot.textContent = currency.format(0);
    return;
  }

  let total = 0;
  itemsRoot.innerHTML = cart
    .map((item) => {
      const wine = wines.find((entry) => entry.id === item.id);
      if (!wine) return "";
      total += wine.price * item.qty;
      const stock = Number(wine.stock) || 0;
      const atMax = stock > 0 && item.qty >= stock;
      return `
        <div class="cart-item">
          <div class="cart-item-info">
            <strong>${esc(wine.name)}</strong>
            <span>${currency.format(wine.price)} · ${currency.format(wine.price * item.qty)}</span>
          </div>
          <div class="cart-qty">
            <button class="qty-btn" type="button" data-dec="${esc(wine.id)}" aria-label="Diminuir quantidade de ${esc(wine.name)}">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" type="button" data-inc="${esc(wine.id)}" ${atMax ? "disabled" : ""} aria-label="Aumentar quantidade de ${esc(wine.name)}">+</button>
            <button class="cart-remove" type="button" data-remove="${esc(wine.id)}" aria-label="Remover ${esc(wine.name)} do carrinho">✕</button>
          </div>
        </div>
      `;
    })
    .join("");

  totalRoot.textContent = currency.format(total);
  itemsRoot.querySelectorAll("[data-inc]").forEach((b) =>
    b.addEventListener("click", () => addToCart(b.dataset.inc)));
  itemsRoot.querySelectorAll("[data-dec]").forEach((b) =>
    b.addEventListener("click", () => decrementCart(b.dataset.dec)));
  itemsRoot.querySelectorAll("[data-remove]").forEach((b) =>
    b.addEventListener("click", () => removeFromCart(b.dataset.remove)));
}

function checkout() {
  if (!cart.length) return;

  const number = (siteSettings.whatsapp || "").replace(/\D/g, "");
  if (!number) {
    alert("O WhatsApp para pedidos ainda não foi configurado. Configure no painel administrativo.");
    return;
  }

  let total = 0;
  const lines = cart
    .map((item) => {
      const wine = wines.find((w) => w.id === item.id);
      if (!wine) return null;
      const sub = wine.price * item.qty;
      total += sub;
      return `• ${item.qty}x ${wine.name} — ${currency.format(sub)}`;
    })
    .filter(Boolean);

  if (!lines.length) return;

  const siteName = siteSettings.site_name || "Vinhos Raros";
  const msg = `Olá! Gostaria de finalizar meu pedido na ${siteName}:\n\n${lines.join("\n")}\n\n*Total: ${currency.format(total)}*`;
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, "_blank");
}

function setupCart() {
  document.querySelectorAll("[data-cart-toggle]").forEach((button) => {
    button.addEventListener("click", () => document.body.classList.toggle("cart-open"));
  });
  const checkoutBtn = document.querySelector(".checkout");
  if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);
  renderCart();
}

let activeFilter = "Todos";
let searchQuery = "";

function renderCatalog(filter, query) {
  if (filter !== undefined) activeFilter = filter;
  if (query !== undefined) searchQuery = query;
  const grid = document.querySelector("[data-wine-grid]");
  if (!grid) return;
  let filtered = activeFilter === "Todos" ? wines : wines.filter((wine) => wine.type === activeFilter);
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter((wine) =>
      wine.name.toLowerCase().includes(q) ||
      (wine.region && wine.region.toLowerCase().includes(q)) ||
      (wine.type && wine.type.toLowerCase().includes(q)) ||
      (wine.short && wine.short.toLowerCase().includes(q))
    );
  }
  grid.innerHTML = filtered
    .map(
      (wine) => `
        <article class="wine-card">
          <a class="wine-card-link" href="vinho.html?id=${wine.id}" aria-label="Ver detalhes de ${wine.name}">
            ${renderBottle(wine)}
            <div class="wine-card-body">
              <div class="wine-meta">${wine.region} | ${wine.year}</div>
              <h3>${wine.name}</h3>
              <p>${wine.short}</p>
              <div class="score-row">
                <span>${wine.scores[0] ? wine.scores[0].score : ''}</span>
                <small>${wine.type}</small>
              </div>
            </div>
          </a>
          <div class="buy-row">
            <div>
              <strong>${currency.format(wine.price)}</strong>
              <span>${currency.format(wine.oldPrice)}</span>
            </div>
            <button type="button" data-add="${wine.id}" aria-label="Adicionar ${wine.name} ao carrinho">Comprar</button>
          </div>
        </article>
      `
    )
    .join("");

  grid.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => addToCart(button.dataset.add));
  });
}

function setupFilters() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderCatalog(button.dataset.filter);
    });
  });

  const searchInput = document.getElementById("site-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderCatalog(undefined, searchInput.value);
      if (searchInput.value.trim()) {
        document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
}

async function init() {
  try {
    const res = await fetch('/api/wines');
    if (!res.ok) throw new Error('Falha ao carregar vinhos');
    wines = await res.json();
  } catch (e) {
    console.error('Erro ao carregar vinhos:', e);
    wines = [];
  }
  setupCart();
  renderCatalog();
  setupFilters();
}

init();

/* ── Carrossel ── */
(async function () {
  const track   = document.getElementById('carouselTrack');
  const dotsWrap= document.getElementById('carouselDots');
  if (!track) return;

  /* 1. buscar slides da API */
  let slides = [];
  try {
    const r = await fetch('/api/carousel');
    slides = await r.json();
  } catch { slides = []; }

  if (!slides.length) { track.closest('.hero-carousel').style.display = 'none'; return; }

  /* 2. renderizar slides */
  const total = slides.length;
  track.style.width = `${total * 100}%`;

  track.innerHTML = slides.map(s => {
    const hasImg = s.image && s.image !== '';
    return `
      <div class="carousel-slide" style="width:${100/total}%;background:${hasImg ? s.bg_color : s.bg_color}">
        ${hasImg ? `<img src="${s.image}" alt="${s.title}" class="carousel-img" /><div class="carousel-overlay"></div>` : ''}
        <div class="carousel-content" style="${!hasImg ? 'max-width:100%;margin-left:0' : ''}">
          <p class="eyebrow">Garrafas de produção limitada</p>
          <h1>${s.title}</h1>
          <p>${s.subtitle}</p>
          <div class="hero-actions">
            <a class="primary-action" href="${s.cta_link}">${s.cta_text}</a>
          </div>
        </div>
      </div>`;
  }).join('');

  dotsWrap.innerHTML = slides.map((_, i) =>
    `<button class="dot${i===0?' active':''}" data-index="${i}" aria-label="Slide ${i+1}"></button>`
  ).join('');

  /* 3. lógica de navegação */
  const dots = dotsWrap.querySelectorAll('.dot');
  let current = 0, timer;

  function goTo(idx) {
    current = ((idx % total) + total) % total;
    track.style.transform = `translateX(-${current * (100 / total)}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 5500);
  }

  document.getElementById('carouselPrev').addEventListener('click', () => { goTo(current - 1); resetTimer(); });
  document.getElementById('carouselNext').addEventListener('click', () => { goTo(current + 1); resetTimer(); });
  dots.forEach(d => d.addEventListener('click', () => { goTo(+d.dataset.index); resetTimer(); }));

  let touchX = 0;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(current + (diff > 0 ? 1 : -1)); resetTimer(); }
  });

  /* filtro de categoria pelo segundo nav */
  document.querySelectorAll('.cat-link[data-filter-cat]').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.cat-link[data-filter-cat]').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      renderCatalog(link.dataset.filterCat);
    });
  });

  resetTimer();
})();
