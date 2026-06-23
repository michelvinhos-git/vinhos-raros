/* ── Tema ── */
fetch('/api/settings').then(r => r.json()).then(s => {
  document.documentElement.setAttribute('data-theme', s.theme || 'dark');
}).catch(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
});

const params = new URLSearchParams(window.location.search);
const wineId = params.get("id");
const root = document.querySelector("[data-detail-root]");

function renderDetail(wine) {
  document.title = `${wine.name} | Vinhos Raros`;

  const visual = wine.image
    ? `<div class="detail-visual detail-photo-wrap">
         <img class="detail-photo" src="${esc(wine.image)}" alt="${esc(wine.name)}" />
       </div>`
    : `<div class="detail-visual">${renderBottle(wine)}</div>`;

  root.innerHTML = `
    <section class="detail-hero">
      ${visual}
      <div class="detail-summary">
        <p class="eyebrow">${esc([wine.country, wine.region, wine.year].filter(Boolean).join(' · '))}</p>
        <h1>${esc(wine.name)}</h1>
        <p>${esc(wine.short)}</p>
        <div class="detail-facts">
          <span>${esc(wine.type)}</span>
          <span>${esc(wine.grape)}</span>
          <span>${esc(wine.stock)} garrafas</span>
        </div>
        <div class="detail-price">
          <strong>${currency.format(wine.price)}</strong>
          <span>${currency.format(wine.oldPrice)}</span>
        </div>
        <button class="primary-action detail-buy" type="button" data-add="${esc(wine.id)}">Adicionar ao carrinho</button>
      </div>
    </section>

    <section class="wine-profile">
      <article>
        <p class="eyebrow">Historia</p>
        <h2>A origem desta garrafa</h2>
        <p>${esc(wine.history)}</p>
      </article>
      <article>
        <p class="eyebrow">Degustacao</p>
        <h2>Perfil do vinho</h2>
        <p>${esc(wine.tasting)}</p>
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
                <strong>${esc(score.score)}</strong>
                <span>${esc(score.source)}</span>
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
        ${wine.pairings.map((pairing) => `<span>${esc(pairing)}</span>`).join("")}
      </div>
    </section>
  `;

  root.querySelector("[data-add]").addEventListener("click", () => addToCart(wine.id));
}

async function initDetail() {
  root.innerHTML = `<p style="text-align:center;padding:4rem;color:var(--muted)">Carregando...</p>`;

  try {
    let wine;
    if (wineId) {
      const res = await fetch(`/api/wines/${encodeURIComponent(wineId)}`);
      if (res.ok) wine = await res.json();
    }
    if (!wine) {
      const res = await fetch('/api/wines');
      const all = await res.json();
      wine = all[0];
    }
    if (!wine) throw new Error('nenhum vinho encontrado');
    wines = wines.length ? wines : [wine];
    renderDetail(wine);
  } catch (e) {
    root.innerHTML = `<p style="text-align:center;padding:4rem;color:var(--muted)">Vinho não encontrado.</p>`;
  }
}

initDetail();
