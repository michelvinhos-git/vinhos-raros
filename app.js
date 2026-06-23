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

fetch('/api/settings').then(r => r.json()).then(s => {
  document.documentElement.setAttribute('data-theme', s.theme || 'dark');
  applyBranding(s);
}).catch(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
});

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
  const item = cart.find((cartItem) => cartItem.id === id);
  if (item) {
    item.qty += 1;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart();
  document.body.classList.add("cart-open");
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
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = count;
  });

  const itemsRoot = document.querySelector("[data-cart-items]");
  const totalRoot = document.querySelector("[data-cart-total]");
  if (!itemsRoot || !totalRoot) return;

  if (!cart.length) {
    itemsRoot.innerHTML = `<p class="empty-cart">Seu carrinho esta vazio.</p>`;
    totalRoot.textContent = currency.format(0);
    return;
  }

  let total = 0;
  itemsRoot.innerHTML = cart
    .map((item) => {
      const wine = wines.find((entry) => entry.id === item.id);
      if (!wine) return "";
      total += wine.price * item.qty;
      return `
        <div class="cart-item">
          <div>
            <strong>${wine.name}</strong>
            <span>${item.qty} x ${currency.format(wine.price)}</span>
          </div>
          <button class="icon-button" type="button" data-remove="${wine.id}" aria-label="Remover ${wine.name}">-</button>
        </div>
      `;
    })
    .join("");

  totalRoot.textContent = currency.format(total);
  itemsRoot.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = cart.findIndex((item) => item.id === button.dataset.remove);
      if (index >= 0) {
        cart[index].qty -= 1;
        if (cart[index].qty <= 0) cart.splice(index, 1);
      }
      saveCart();
    });
  });
}

function setupCart() {
  document.querySelectorAll("[data-cart-toggle]").forEach((button) => {
    button.addEventListener("click", () => document.body.classList.toggle("cart-open"));
  });
  renderCart();
}

function renderCatalog(filter = "Todos") {
  const grid = document.querySelector("[data-wine-grid]");
  if (!grid) return;
  const filtered = filter === "Todos" ? wines : wines.filter((wine) => wine.type === filter);
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
