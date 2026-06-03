const params = new URLSearchParams(window.location.search);
const wine = wines.find((item) => item.id === params.get("id")) || wines[0];
const root = document.querySelector("[data-detail-root]");

document.title = `${wine.name} | Vinhos Raros`;

root.innerHTML = `
  <section class="detail-hero">
    <div class="detail-visual">
      ${renderBottle(wine)}
    </div>
    <div class="detail-summary">
      <p class="eyebrow">${wine.region} | ${wine.year}</p>
      <h1>${wine.name}</h1>
      <p>${wine.short}</p>
      <div class="detail-facts">
        <span>${wine.type}</span>
        <span>${wine.grape}</span>
        <span>${wine.stock} garrafas</span>
      </div>
      <div class="detail-price">
        <strong>${currency.format(wine.price)}</strong>
        <span>${currency.format(wine.oldPrice)}</span>
      </div>
      <button class="primary-action detail-buy" type="button" data-add="${wine.id}">Adicionar ao carrinho</button>
    </div>
  </section>

  <section class="wine-profile">
    <article>
      <p class="eyebrow">Historia</p>
      <h2>A origem desta garrafa</h2>
      <p>${wine.history}</p>
    </article>
    <article>
      <p class="eyebrow">Degustacao</p>
      <h2>Perfil do vinho</h2>
      <p>${wine.tasting}</p>
    </article>
  </section>

  <section class="ratings">
    <div>
      <p class="eyebrow">Pontuacoes</p>
      <h2>Referencias de qualidade</h2>
    </div>
    <div class="rating-grid">
      ${wine.scores
        .map(
          (score) => `
            <div class="rating-card">
              <strong>${score.score}</strong>
              <span>${score.source}</span>
            </div>
          `
        )
        .join("")}
    </div>
  </section>

  <section class="pairings">
    <div>
      <p class="eyebrow">Harmonizacao</p>
      <h2>Combina bem com</h2>
    </div>
    <div class="pairing-list">
      ${wine.pairings.map((pairing) => `<span>${pairing}</span>`).join("")}
    </div>
  </section>
`;

root.querySelector("[data-add]").addEventListener("click", () => addToCart(wine.id));
