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
  applyTicker(s.ticker_text || '', parseInt(s.ticker_speed, 10) || 30);
  setupWhatsappFab(s);
}).catch(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
});

function setupWhatsappFab(s) {
  const number = ((s && s.whatsapp) || "").replace(/\D/g, "");
  let fab = document.getElementById("whatsapp-fab");
  if (!number) { if (fab) fab.remove(); return; }
  if (!fab) {
    fab = document.createElement("a");
    fab.id = "whatsapp-fab";
    fab.className = "whatsapp-fab";
    fab.target = "_blank";
    fab.rel = "noopener";
    fab.setAttribute("aria-label", "Fale conosco no WhatsApp");
    fab.innerHTML = `<svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M16.04 4C9.42 4 4.04 9.38 4.04 16c0 2.12.55 4.16 1.6 5.98L4 28l6.18-1.62A11.9 11.9 0 0016.04 28C22.66 28 28.04 22.62 28.04 16S22.66 4 16.04 4zm0 21.82c-1.86 0-3.68-.5-5.27-1.45l-.38-.22-3.67.96.98-3.58-.25-.37A9.78 9.78 0 016.22 16c0-5.42 4.4-9.82 9.82-9.82 5.42 0 9.82 4.4 9.82 9.82 0 5.42-4.4 9.82-9.82 9.82zm5.39-7.35c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z"/></svg>`;
    document.body.appendChild(fab);
  }
  fab.href = `https://wa.me/${number}`;
}

function applyTicker(text, speed) {
  const inner = document.getElementById('ticker-inner');
  const track = document.getElementById('ticker-track');
  const band  = document.getElementById('beneficios');
  if (!inner || !track) return;
  if (!text.trim()) {
    if (band) band.style.display = 'none';
    return;
  }
  const duration = (speed || 30) + 's';
  track.style.animationDuration = duration;
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

/* ── Checkout: dados do cliente + WhatsApp ── */
const PAYMENT_METHODS = ["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro"];
const CUSTOMER_KEY = "vinhosRarosCliente";

function loadCustomer() {
  try { return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "{}"); }
  catch { return {}; }
}

function ensureCheckoutModal() {
  if (document.getElementById("checkout-overlay")) return;
  const c = loadCustomer();
  const overlay = document.createElement("div");
  overlay.id = "checkout-overlay";
  overlay.innerHTML = `
    <div class="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div class="checkout-head">
        <h2 id="checkout-title">Finalizar pedido</h2>
        <button type="button" class="checkout-close" aria-label="Fechar">✕</button>
      </div>
      <form class="checkout-form" id="checkout-form" novalidate>
        <div class="ck-field ck-full">
          <label for="ck-name">Nome completo *</label>
          <input id="ck-name" type="text" required value="${esc(c.name)}" placeholder="Seu nome" />
        </div>
        <div class="ck-field ck-full">
          <label for="ck-phone">Telefone / WhatsApp *</label>
          <input id="ck-phone" type="tel" required value="${esc(c.phone)}" placeholder="(11) 99999-9999" />
        </div>
        <div class="ck-field ck-full">
          <label for="ck-street">Endereço (rua / av.) *</label>
          <input id="ck-street" type="text" required value="${esc(c.street)}" placeholder="Rua Exemplo" />
        </div>
        <div class="ck-field">
          <label for="ck-number">Número *</label>
          <input id="ck-number" type="text" required value="${esc(c.number)}" placeholder="123" />
        </div>
        <div class="ck-field">
          <label for="ck-complement">Complemento</label>
          <input id="ck-complement" type="text" value="${esc(c.complement)}" placeholder="Apto, bloco..." />
        </div>
        <div class="ck-field">
          <label for="ck-district">Bairro *</label>
          <input id="ck-district" type="text" required value="${esc(c.district)}" placeholder="Centro" />
        </div>
        <div class="ck-field">
          <label for="ck-city">Cidade *</label>
          <input id="ck-city" type="text" required value="${esc(c.city)}" placeholder="São Paulo" />
        </div>
        <div class="ck-field">
          <label for="ck-cep">CEP</label>
          <input id="ck-cep" type="text" value="${esc(c.cep)}" placeholder="00000-000" />
        </div>
        <div class="ck-field">
          <label for="ck-payment">Forma de pagamento *</label>
          <select id="ck-payment" required>
            ${PAYMENT_METHODS.map((m) => `<option value="${esc(m)}" ${c.payment === m ? "selected" : ""}>${esc(m)}</option>`).join("")}
          </select>
        </div>
        <div class="ck-field ck-full">
          <label for="ck-notes">Observações</label>
          <textarea id="ck-notes" rows="2" placeholder="Ex: troco para R$ 200, ponto de referência...">${esc(c.notes)}</textarea>
        </div>
        <p class="ck-error" id="ck-error"></p>
        <div class="checkout-summary" id="ck-summary"></div>
        <button type="submit" class="checkout ck-submit">Enviar pedido pelo WhatsApp</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeCheckout(); });
  overlay.querySelector(".checkout-close").addEventListener("click", closeCheckout);
  overlay.querySelector("#checkout-form").addEventListener("submit", submitCheckout);
}

function closeCheckout() {
  const o = document.getElementById("checkout-overlay");
  if (o) o.classList.remove("open");
}

function checkout() {
  if (!cart.length) return;

  const number = (siteSettings.whatsapp || "").replace(/\D/g, "");
  if (!number) {
    alert("O WhatsApp para pedidos ainda não foi configurado. Configure no painel administrativo.");
    return;
  }

  ensureCheckoutModal();

  let total = 0;
  cart.forEach((it) => { const w = wines.find((x) => x.id === it.id); if (w) total += w.price * it.qty; });
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const summary = document.getElementById("ck-summary");
  if (summary) summary.innerHTML = `${count} ${count === 1 ? "item" : "itens"} · <strong>${currency.format(total)}</strong>`;
  document.getElementById("ck-error").textContent = "";

  document.getElementById("checkout-overlay").classList.add("open");
  document.body.classList.remove("cart-open");
  setTimeout(() => document.getElementById("ck-name")?.focus(), 50);
}

function submitCheckout(e) {
  e.preventDefault();
  const val = (id) => (document.getElementById(id)?.value || "").trim();
  const customer = {
    name: val("ck-name"),
    phone: val("ck-phone"),
    street: val("ck-street"),
    number: val("ck-number"),
    complement: val("ck-complement"),
    district: val("ck-district"),
    city: val("ck-city"),
    cep: val("ck-cep"),
    payment: val("ck-payment"),
    notes: val("ck-notes"),
  };

  const required = [
    ["name", "Nome"], ["phone", "Telefone"], ["street", "Endereço"],
    ["number", "Número"], ["district", "Bairro"], ["city", "Cidade"]
  ];
  const missing = required.filter(([k]) => !customer[k]).map(([, label]) => label);
  const errEl = document.getElementById("ck-error");
  if (missing.length) {
    errEl.textContent = "Preencha: " + missing.join(", ") + ".";
    return;
  }

  const number = (siteSettings.whatsapp || "").replace(/\D/g, "");
  if (!number) { errEl.textContent = "WhatsApp não configurado."; return; }

  try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer)); } catch {}

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
  const addr = `${customer.street}, ${customer.number}` +
    `${customer.complement ? " - " + customer.complement : ""}` +
    ` - ${customer.district}, ${customer.city}` +
    `${customer.cep ? " - CEP " + customer.cep : ""}`;

  const parts = [
    `*Novo pedido — ${siteName}*`,
    ``,
    `*Itens:*`,
    lines.join("\n"),
    ``,
    `*Total: ${currency.format(total)}*`,
    ``,
    `*Cliente:* ${customer.name}`,
    `*Telefone:* ${customer.phone}`,
    `*Entrega:* ${addr}`,
    `*Pagamento:* ${customer.payment}`,
  ];
  if (customer.notes) parts.push(`*Obs.:* ${customer.notes}`);

  const msg = parts.join("\n");
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, "_blank");
  closeCheckout();
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
      (wine.country && wine.country.toLowerCase().includes(q)) ||
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
              <div class="wine-meta">${[wine.country, wine.region, wine.year].filter(Boolean).join(' · ')}</div>
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
