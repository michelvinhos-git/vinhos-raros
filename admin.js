/* ── State ── */
let token = sessionStorage.getItem('vr_admin_token') || '';
let winesList = [];
let editingId = null;
let deleteTargetId = null;

/* ── Elements ── */
const loginScreen   = document.getElementById('login-screen');
const adminPanel    = document.getElementById('admin-panel');
const loginForm     = document.getElementById('login-form');
const loginError    = document.getElementById('login-error');
const logoutBtn     = document.getElementById('logout-btn');
const newWineBtn    = document.getElementById('new-wine-btn');
const tableContainer = document.getElementById('wines-table-container');

const modalOverlay  = document.getElementById('modal-overlay');
const modalTitle    = document.getElementById('modal-title');
const modalClose    = document.getElementById('modal-close');
const formCancel    = document.getElementById('form-cancel');
const formSave      = document.getElementById('form-save');
const formError     = document.getElementById('form-error');
const wineForm      = document.getElementById('wine-form');
const scoresContainer = document.getElementById('scores-container');

const imageFileInput   = document.getElementById('f-image-file');
const imageHidden      = document.getElementById('f-image');
const uploadPreviewWrap= document.getElementById('upload-preview-wrap');
const uploadPreview    = document.getElementById('upload-preview');
const uploadPlaceholder= document.getElementById('upload-placeholder');
const uploadStatus     = document.getElementById('upload-status');
const removeImageBtn   = document.getElementById('remove-image-btn');
const uploadArea       = document.getElementById('upload-area');

const confirmOverlay = document.getElementById('confirm-overlay');
const confirmMsg     = document.getElementById('confirm-msg');
const confirmCancel  = document.getElementById('confirm-cancel');
const confirmOk      = document.getElementById('confirm-ok');

/* ── Auth ── */
function showLogin()  { loginScreen.style.display = 'flex'; adminPanel.style.display = 'none'; }
function showAdmin()  { loginScreen.style.display = 'none'; adminPanel.style.display = 'block'; loadSlides(); }

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const password = document.getElementById('password-input').value;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) { loginError.textContent = data.error || 'Erro ao entrar'; return; }
    token = data.token;
    sessionStorage.setItem('vr_admin_token', token);
    showAdmin();
    loadWines();
  } catch {
    loginError.textContent = 'Erro de conexão. Tente novamente.';
  }
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', headers: authHeader() }).catch(() => {});
  token = '';
  sessionStorage.removeItem('vr_admin_token');
  showLogin();
});

function authHeader() {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

/* ── Load wines ── */
async function loadWines() {
  tableContainer.innerHTML = '<div class="table-empty">Carregando vinhos...</div>';
  try {
    const res = await fetch('/api/wines');
    if (!res.ok) throw new Error();
    winesList = await res.json();
    renderTable();
  } catch {
    tableContainer.innerHTML = '<div class="table-empty">Erro ao carregar vinhos.</div>';
  }
}

function renderTable() {
  if (!winesList.length) {
    tableContainer.innerHTML = '<div class="table-empty">Nenhum vinho cadastrado ainda. Clique em "+ Novo Vinho".</div>';
    return;
  }
  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  tableContainer.innerHTML = `
    <div class="wines-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Vinho</th>
            <th>Safra</th>
            <th>Tipo</th>
            <th>Preço</th>
            <th>Estoque</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${winesList.map(w => `
            <tr>
              <td style="display:flex;align-items:center;gap:.75rem;">
                ${w.image
                  ? `<img src="${w.image}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px;flex-shrink:0;" />`
                  : `<span class="bottle-dot" style="background:${w.color};flex-shrink:0;"></span>`}
                <div>
                  <strong>${w.name}</strong>
                  <div style="font-size:.8rem;margin-top:.15rem;color:var(--muted)">${w.region || ''}</div>
                </div>
              </td>
              <td class="muted">${w.year || '—'}</td>
              <td><span class="badge">${w.type || '—'}</span></td>
              <td>${currency.format(w.price)}</td>
              <td>${w.stock} gar.</td>
              <td>
                <div class="action-btns">
                  <button class="btn-edit"   data-id="${w.id}">Editar</button>
                  <button class="btn-delete" data-id="${w.id}" data-name="${w.name}">Excluir</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  tableContainer.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  tableContainer.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => openConfirmDelete(btn.dataset.id, btn.dataset.name));
  });
}

/* ── Image upload ── */
function setImagePreview(url) {
  if (url) {
    imageHidden.value = url;
    uploadPreview.src = url;
    uploadPreviewWrap.style.display = 'block';
    uploadPlaceholder.style.display = 'none';
  } else {
    imageHidden.value = '';
    uploadPreview.src = '';
    uploadPreviewWrap.style.display = 'none';
    uploadPlaceholder.style.display = 'block';
  }
}

function resetImageUpload() {
  imageFileInput.value = '';
  uploadStatus.textContent = '';
  setImagePreview('');
}

imageFileInput.addEventListener('change', async () => {
  const file = imageFileInput.files[0];
  if (!file) return;
  uploadStatus.textContent = 'Enviando imagem...';
  uploadArea.style.borderColor = 'var(--gold)';
  const formData = new FormData();
  formData.append('image', file);
  try {
    const res = await fetch(`/api/upload?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) { uploadStatus.textContent = data.error || 'Erro no upload.'; return; }
    setImagePreview(data.url);
    uploadStatus.textContent = 'Foto carregada com sucesso!';
    uploadArea.style.borderColor = '#2ecc71';
    setTimeout(() => { uploadStatus.textContent = ''; uploadArea.style.borderColor = 'var(--line)'; }, 2500);
  } catch {
    uploadStatus.textContent = 'Erro ao enviar imagem.';
    uploadArea.style.borderColor = '#c0392b';
  }
});

removeImageBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  resetImageUpload();
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = 'var(--gold)';
});
uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderColor = 'var(--line)';
});
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = 'var(--line)';
  const file = e.dataTransfer.files[0];
  if (file && /^image\//.test(file.type)) {
    const dt = new DataTransfer();
    dt.items.add(file);
    imageFileInput.files = dt.files;
    imageFileInput.dispatchEvent(new Event('change'));
  }
});

/* ── Modal ── */
function buildScoreRows(scores = []) {
  const rows = scores.length ? scores : [
    { source: '', score: '' },
    { source: '', score: '' },
    { source: '', score: '' }
  ];
  scoresContainer.innerHTML = rows.map((s, i) => `
    <div class="score-row-inputs">
      <input type="text" name="score_source_${i}" placeholder="Fonte (ex: Críticos internacionais)" value="${s.source || ''}" />
      <input type="text" name="score_value_${i}"  placeholder="Nota (ex: 97/100)" value="${s.score || ''}" style="max-width:140px" />
    </div>
  `).join('') + `
    <button type="button" id="add-score-row" style="background:none;border:1px dashed var(--line);border-radius:8px;color:var(--muted);cursor:pointer;padding:.4rem 1rem;margin-top:.25rem;font-size:.82rem">
      + Adicionar pontuação
    </button>
  `;
  document.getElementById('add-score-row').addEventListener('click', () => {
    const count = scoresContainer.querySelectorAll('.score-row-inputs').length;
    const newRow = document.createElement('div');
    newRow.className = 'score-row-inputs';
    newRow.innerHTML = `
      <input type="text" name="score_source_${count}" placeholder="Fonte" />
      <input type="text" name="score_value_${count}"  placeholder="Nota" style="max-width:140px" />
    `;
    scoresContainer.insertBefore(newRow, document.getElementById('add-score-row'));
  });
}

function openNewModal() {
  editingId = null;
  modalTitle.textContent = 'Novo Vinho';
  wineForm.reset();
  document.getElementById('f-color').value  = '#8b1537';
  document.getElementById('f-accent').value = '#d6b05b';
  buildScoreRows();
  resetImageUpload();
  formError.textContent = '';
  openModal();
}

function openEditModal(id) {
  const wine = winesList.find(w => w.id === id);
  if (!wine) return;
  editingId = id;
  modalTitle.textContent = 'Editar Vinho';
  wineForm.reset();
  document.getElementById('f-name').value    = wine.name    || '';
  document.getElementById('f-year').value    = wine.year    || '';
  document.getElementById('f-region').value  = wine.region  || '';
  document.getElementById('f-type').value    = wine.type    || 'Tinto';
  document.getElementById('f-grape').value   = wine.grape   || '';
  document.getElementById('f-price').value   = wine.price   || 0;
  document.getElementById('f-oldprice').value= wine.oldPrice|| 0;
  document.getElementById('f-stock').value   = wine.stock   || 0;
  document.getElementById('f-label').value   = wine.label   || '';
  document.getElementById('f-color').value   = wine.color   || '#8b1537';
  document.getElementById('f-accent').value  = wine.accent  || '#d6b05b';
  document.getElementById('f-short').value   = wine.short   || '';
  document.getElementById('f-history').value = wine.history || '';
  document.getElementById('f-tasting').value = wine.tasting || '';
  document.getElementById('f-pairings').value= Array.isArray(wine.pairings) ? wine.pairings.join(', ') : '';
  buildScoreRows(wine.scores || []);
  resetImageUpload();
  if (wine.image) setImagePreview(wine.image);
  formError.textContent = '';
  openModal();
}

function openModal()  { modalOverlay.classList.add('open'); }
function closeModal() { modalOverlay.classList.remove('open'); }

modalClose.addEventListener('click', closeModal);
formCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
newWineBtn.addEventListener('click', openNewModal);

/* ── Save ── */
formSave.addEventListener('click', async () => {
  formError.textContent = '';
  const name  = document.getElementById('f-name').value.trim();
  const price = parseFloat(document.getElementById('f-price').value);
  if (!name)          { formError.textContent = 'O nome é obrigatório.'; return; }
  if (isNaN(price))   { formError.textContent = 'Informe um preço válido.'; return; }

  const pairingsRaw = document.getElementById('f-pairings').value;
  const pairings = pairingsRaw.split(',').map(s => s.trim()).filter(Boolean);

  const scoreRows = scoresContainer.querySelectorAll('.score-row-inputs');
  const scores = [];
  scoreRows.forEach((row, i) => {
    const src = row.querySelector(`[name="score_source_${i}"]`);
    const val = row.querySelector(`[name="score_value_${i}"]`);
    if (src && val && (src.value.trim() || val.value.trim())) {
      scores.push({ source: src.value.trim(), score: val.value.trim() });
    }
  });

  const wine = {
    name,
    year:     document.getElementById('f-year').value.trim(),
    region:   document.getElementById('f-region').value.trim(),
    type:     document.getElementById('f-type').value,
    grape:    document.getElementById('f-grape').value.trim(),
    price,
    oldPrice: parseFloat(document.getElementById('f-oldprice').value) || 0,
    stock:    parseInt(document.getElementById('f-stock').value)       || 0,
    label:    document.getElementById('f-label').value.trim(),
    color:    document.getElementById('f-color').value,
    accent:   document.getElementById('f-accent').value,
    short:    document.getElementById('f-short').value.trim(),
    history:  document.getElementById('f-history').value.trim(),
    tasting:  document.getElementById('f-tasting').value.trim(),
    pairings,
    scores,
    image:    imageHidden.value || '',
  };

  if (!editingId) {
    wine.id = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + (wine.year || Date.now());
  }

  formSave.disabled = true;
  formSave.textContent = 'Salvando...';

  try {
    const url    = editingId ? `/api/wines/${editingId}` : '/api/wines';
    const method = editingId ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: authHeader(), body: JSON.stringify(wine) });
    const data   = await res.json();
    if (!res.ok) { formError.textContent = data.error || 'Erro ao salvar.'; return; }
    closeModal();
    loadWines();
  } catch {
    formError.textContent = 'Erro de conexão.';
  } finally {
    formSave.disabled = false;
    formSave.textContent = 'Salvar';
  }
});

/* ── Delete ── */
function openConfirmDelete(id, name) {
  deleteTargetId = id;
  confirmMsg.textContent = `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`;
  confirmOverlay.classList.add('open');
}

confirmCancel.addEventListener('click', () => { confirmOverlay.classList.remove('open'); deleteTargetId = null; });
confirmOverlay.addEventListener('click', (e) => { if (e.target === confirmOverlay) { confirmOverlay.classList.remove('open'); deleteTargetId = null; } });

confirmOk.addEventListener('click', async () => {
  if (!deleteTargetId) return;
  confirmOk.disabled = true;
  try {
    const res = await fetch(`/api/wines/${deleteTargetId}`, { method: 'DELETE', headers: authHeader() });
    if (res.status === 401) { token = ''; sessionStorage.removeItem('vr_admin_token'); showLogin(); return; }
    confirmOverlay.classList.remove('open');
    deleteTargetId = null;
    loadWines();
  } catch {
    alert('Erro ao excluir. Tente novamente.');
  } finally {
    confirmOk.disabled = false;
  }
});

/* ── Carousel ── */
let editingSlideId = null;

const slideOverlay    = document.getElementById('slide-overlay');
const slideModalTitle = document.getElementById('slide-modal-title');
const slideModalClose = document.getElementById('slide-modal-close');
const slideCancel     = document.getElementById('slide-cancel');
const slideSave       = document.getElementById('slide-save');
const slideFormError  = document.getElementById('slide-form-error');
const slideImageFile  = document.getElementById('slide-image-file');
const slideImageHidden= document.getElementById('slide-image-hidden');
const slidePreview    = document.getElementById('slide-upload-preview');
const slidePlaceholder= document.getElementById('slide-upload-placeholder');
const slideUploadStatus = document.getElementById('slide-upload-status');
const slidesContainer = document.getElementById('carousel-slides-container');

async function loadSlides() {
  slidesContainer.innerHTML = '<div class="table-empty">Carregando slides...</div>';
  try {
    const r = await fetch(`/api/carousel/all?token=${token}`, { headers: authHeader() });
    if (r.status === 401) { token = ''; sessionStorage.removeItem('vr_admin_token'); showLogin(); return; }
    const slides = await r.json();
    renderSlides(slides);
  } catch {
    slidesContainer.innerHTML = '<div class="table-empty">Erro ao carregar slides.</div>';
  }
}

function renderSlides(slides) {
  if (!slides.length) {
    slidesContainer.innerHTML = '<div class="table-empty">Nenhum slide. Clique em "+ Novo Slide" para adicionar.</div>';
    return;
  }
  slidesContainer.innerHTML = `<div class="slides-grid">${slides.map(s => `
    <div class="slide-card${s.active ? '' : ' slide-inactive'}" data-id="${s.id}">
      ${s.image
        ? `<img class="slide-thumb" src="${s.image}" alt="${s.title}" />`
        : `<div class="slide-thumb-color" style="background:${s.bg_color}">🍷</div>`}
      <div class="slide-card-body">
        <strong>${s.title || '(sem título)'}</strong>
        <small>${s.subtitle || '—'}</small>
        <div class="slide-card-actions">
          <button class="btn-edit slide-edit-btn" data-id="${s.id}">Editar</button>
          <button class="btn-edit" style="border-color:${s.active?'#c0392b':'var(--gold)'};color:${s.active?'#c0392b':'var(--gold)'}" data-toggle="${s.id}" data-active="${s.active}">
            ${s.active ? 'Desativar' : 'Ativar'}
          </button>
          <button class="btn-delete slide-delete-btn" data-id="${s.id}">Excluir</button>
        </div>
      </div>
    </div>`).join('')}</div>`;

  slidesContainer.querySelectorAll('.slide-edit-btn').forEach(b =>
    b.addEventListener('click', () => openSlideModal(+b.dataset.id, slides)));
  slidesContainer.querySelectorAll('[data-toggle]').forEach(b =>
    b.addEventListener('click', () => toggleSlide(+b.dataset.toggle, +b.dataset.active)));
  slidesContainer.querySelectorAll('.slide-delete-btn').forEach(b =>
    b.addEventListener('click', () => deleteSlide(+b.dataset.id)));
}

function openSlideModal(id, slides) {
  editingSlideId = id || null;
  slideModalTitle.textContent = id ? 'Editar Slide' : 'Novo Slide';
  slideFormError.textContent = '';

  const s = id ? slides.find(x => x.id === id) : null;
  document.getElementById('slide-title').value     = s?.title    || '';
  document.getElementById('slide-subtitle').value  = s?.subtitle || '';
  document.getElementById('slide-cta-text').value  = s?.cta_text || 'Ver catálogo';
  document.getElementById('slide-cta-link').value  = s?.cta_link || '#catalogo';
  document.getElementById('slide-bg-color').value  = s?.bg_color || '#5c0f24';
  document.getElementById('slide-active').checked  = s ? !!s.active : true;
  slideImageHidden.value = s?.image || '';

  if (s?.image) {
    slidePreview.src = s.image;
    slidePreview.style.display = 'block';
    slidePlaceholder.style.display = 'none';
  } else {
    slidePreview.style.display = 'none';
    slidePlaceholder.style.display = 'flex';
  }
  slideUploadStatus.textContent = '';
  slideOverlay.classList.add('open');
}

function closeSlideModal() {
  slideOverlay.classList.remove('open');
  editingSlideId = null;
  slideImageFile.value = '';
}

slideModalClose.addEventListener('click', closeSlideModal);
slideCancel.addEventListener('click', closeSlideModal);
slideOverlay.addEventListener('click', e => { if (e.target === slideOverlay) closeSlideModal(); });

document.getElementById('add-slide-btn').addEventListener('click', () => {
  loadSlides().then(() => {
    const allSlides = [];
    openSlideModal(null, allSlides);
  });
  openSlideModal(null, []);
});

slideImageFile.addEventListener('change', async () => {
  const file = slideImageFile.files[0];
  if (!file) return;
  slideUploadStatus.textContent = 'Enviando imagem...';
  try {
    const fd = new FormData();
    fd.append('image', file);
    const r = await fetch(`/api/upload?token=${token}`, { method: 'POST', body: fd });
    if (r.status === 401) { token = ''; sessionStorage.removeItem('vr_admin_token'); showLogin(); return; }
    const data = await r.json();
    if (data.url) {
      slideImageHidden.value = data.url;
      slidePreview.src = data.url;
      slidePreview.style.display = 'block';
      slidePlaceholder.style.display = 'none';
      slideUploadStatus.textContent = '✓ Imagem enviada';
    } else {
      slideUploadStatus.textContent = data.error || 'Erro no upload';
    }
  } catch {
    slideUploadStatus.textContent = 'Erro de conexão no upload';
  }
});

slideSave.addEventListener('click', async () => {
  const title = document.getElementById('slide-title').value.trim();
  if (!title) { slideFormError.textContent = 'Título é obrigatório.'; return; }
  slideFormError.textContent = '';
  slideSave.disabled = true;

  const payload = {
    title,
    subtitle: document.getElementById('slide-subtitle').value.trim(),
    cta_text: document.getElementById('slide-cta-text').value.trim() || 'Ver catálogo',
    cta_link: document.getElementById('slide-cta-link').value.trim() || '#catalogo',
    bg_color: document.getElementById('slide-bg-color').value,
    active:   document.getElementById('slide-active').checked ? 1 : 0,
    image:    slideImageHidden.value,
  };

  try {
    const url    = editingSlideId ? `/api/carousel/${editingSlideId}` : '/api/carousel';
    const method = editingSlideId ? 'PUT' : 'POST';
    const r = await fetch(url, { method, headers: authHeader(), body: JSON.stringify(payload) });
    if (r.status === 401) { token = ''; sessionStorage.removeItem('vr_admin_token'); showLogin(); return; }
    if (!r.ok) { const d = await r.json(); slideFormError.textContent = d.error || 'Erro ao salvar'; return; }
    closeSlideModal();
    loadSlides();
  } catch {
    slideFormError.textContent = 'Erro de conexão. Tente novamente.';
  } finally {
    slideSave.disabled = false;
  }
});

async function toggleSlide(id, currentActive) {
  await fetch(`/api/carousel/${id}`, {
    method: 'PUT', headers: authHeader(),
    body: JSON.stringify({ active: currentActive ? 0 : 1 })
  });
  loadSlides();
}

async function deleteSlide(id) {
  if (!confirm('Excluir este slide permanentemente?')) return;
  await fetch(`/api/carousel/${id}`, { method: 'DELETE', headers: authHeader() });
  loadSlides();
}

/* ── Theme ── */
async function loadTheme() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    setThemeUI(data.theme || 'dark');
  } catch {}
}

function setThemeUI(theme) {
  document.getElementById('theme-dark').classList.toggle('selected', theme === 'dark');
  document.getElementById('theme-light').classList.toggle('selected', theme === 'light');
}

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const theme = btn.dataset.theme;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ theme })
      });
      if (res.status === 401) { token = ''; sessionStorage.removeItem('vr_admin_token'); showLogin(); return; }
      if (res.ok) setThemeUI(theme);
    } catch {
      alert('Erro ao salvar tema. Tente novamente.');
    }
  });
});

/* ── Init ── */
loadTheme();
if (token) {
  fetch('/api/auth/verify', { headers: authHeader() }).then(r => {
    if (r.ok) { showAdmin(); loadWines(); }
    else      { token = ''; sessionStorage.removeItem('vr_admin_token'); showLogin(); }
  }).catch(() => showLogin());
} else {
  showLogin();
}
