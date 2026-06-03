const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});

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
                <span>${wine.scores[0].score}</span>
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

setupCart();
renderCatalog();
setupFilters();
