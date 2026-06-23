const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 5000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname)));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas (JPG, PNG, WEBP)'));
  }
});

const db = new Database(path.join(__dirname, 'wines.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS wines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    year TEXT,
    region TEXT,
    type TEXT,
    grape TEXT,
    price REAL DEFAULT 0,
    oldPrice REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    color TEXT DEFAULT '#8b1537',
    accent TEXT DEFAULT '#d6b05b',
    label TEXT,
    short TEXT,
    history TEXT,
    tasting TEXT,
    pairings TEXT DEFAULT '[]',
    scores TEXT DEFAULT '[]',
    image TEXT DEFAULT ''
  )
`);

try {
  db.exec(`ALTER TABLE wines ADD COLUMN image TEXT DEFAULT ''`);
} catch (e) {
  if (!e.message.includes('duplicate column')) throw e;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);
const defaultSettings = { theme: 'dark', site_name: 'Vinhos Raros', logo: '/logo.png', whatsapp: '', ticker_text: '🍷 Vinhos raros de produção limitada · Safras históricas selecionadas · Procedência 100% verificada · Separação climatizada em 12h · Pontuações 96+ · Entrega para todo o Brasil' };
const seedSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
for (const [key, value] of Object.entries(defaultSettings)) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  if (!row) seedSetting.run(key, value);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS carousel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image TEXT DEFAULT '',
    title TEXT DEFAULT '',
    subtitle TEXT DEFAULT '',
    cta_text TEXT DEFAULT 'Ver catálogo',
    cta_link TEXT DEFAULT '#catalogo',
    bg_color TEXT DEFAULT '#5c0f24',
    sort_order INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  )
`);
if (db.prepare('SELECT COUNT(*) as cnt FROM carousel').get().cnt === 0) {
  const ins = db.prepare(`INSERT INTO carousel (image,title,subtitle,cta_text,cta_link,bg_color,sort_order) VALUES (?,?,?,?,?,?,?)`);
  ins.run('/assets/vinhos-raros-hero.png','Vinhos Raros','Uma curadoria de safras históricas, regiões lendárias e rótulos com pontuações altas para colecionar, presentear e abrir no momento certo.','Ver catálogo','#catalogo','#0d0a06',0);
  ins.run('','Bordeaux Premier Cru','As melhores safras dos châteaux mais icônicos da França, selecionadas para colecionadores e apreciadores.','Explorar coleção','#catalogo','#5c0f24',1);
  ins.run('','Safra 2018 Barolo','Vinhos de guarda com taninos precisos, notas de cereja e alcaçuz — um dos melhores anos da última década.','Ver vinhos','#catalogo','#1a0d06',2);
}

const seedWines = [
  {
    id: "barolo-riserva-2016",
    name: "Barolo Riserva Nebbiolo",
    year: "2016",
    region: "Piemonte, Italia",
    type: "Tinto",
    grape: "Nebbiolo",
    price: 1290,
    oldPrice: 1480,
    stock: 6,
    color: "#8f1f3d",
    accent: "#e6c26f",
    label: "Riserva",
    short: "Um Barolo de guarda, com taninos finos, cereja negra, alcaçuz e notas florais.",
    history: "Produzido nas colinas de Langhe, este Barolo vem de vinhas de baixa produção e passa por longa maturação antes de chegar ao mercado. A safra 2016 ficou conhecida pelo equilíbrio entre estrutura, acidez e precisão aromática, tornando-se uma das mais procuradas da década.",
    tasting: "No nariz aparecem rosas secas, cereja, trufa, ervas e especiarias. Em boca é firme, profundo e elegante, com taninos de textura calcária e final persistente.",
    pairings: ["Risoto de funghi", "Ossobuco", "Queijos maturados"],
    scores: [
      { source: "Críticos internacionais", score: "97/100" },
      { source: "Painel Vinhos Raros", score: "96/100" },
      { source: "Potencial de guarda", score: "2038" }
    ]
  },
  {
    id: "bourgogne-pinot-2018",
    name: "Bourgogne Premier Cru Pinot Noir",
    year: "2018",
    region: "Borgonha, Franca",
    type: "Tinto",
    grape: "Pinot Noir",
    price: 980,
    oldPrice: 1120,
    stock: 4,
    color: "#b43542",
    accent: "#f2d7a1",
    label: "1er Cru",
    short: "Pinot Noir sedoso, com frutas vermelhas, sous-bois e assinatura mineral.",
    history: "Este Premier Cru representa a escala mais delicada da Borgonha: pequenas parcelas, manejo preciso e fermentacao voltada a preservar o perfume da Pinot Noir. A safra 2018 trouxe maturidade generosa sem perder frescor.",
    tasting: "Aromas de framboesa, morango silvestre, folhas secas e especiarias doces. Corpo medio, textura acetinada e acidez viva, com final limpo e mineral.",
    pairings: ["Pato assado", "Cogumelos salteados", "Atum selado"],
    scores: [
      { source: "Críticos internacionais", score: "94/100" },
      { source: "Painel Vinhos Raros", score: "95/100" },
      { source: "Potencial de guarda", score: "2032" }
    ]
  },
  {
    id: "champagne-millesime-2012",
    name: "Champagne Millesime Brut",
    year: "2012",
    region: "Champagne, Franca",
    type: "Espumante",
    grape: "Chardonnay e Pinot Noir",
    price: 1640,
    oldPrice: 1810,
    stock: 8,
    color: "#d8bb63",
    accent: "#fff4c2",
    label: "Brut",
    short: "Champagne safrado, cremoso e preciso, com citrus, brioche e final salino.",
    history: "Champagnes millesimes so sao declarados em anos excepcionais. A safra 2012 combinou concentracao, acidez e energia, resultando em vinhos com mousse refinada e grande longevidade.",
    tasting: "Perlage fino, aromas de limao siciliano, macas assadas, amendoas e pao tostado. Boca cremosa, tensa e salina, com final muito longo.",
    pairings: ["Ostras", "Vieiras", "Frango ao creme"],
    scores: [
      { source: "Críticos internacionais", score: "96/100" },
      { source: "Painel Vinhos Raros", score: "97/100" },
      { source: "Potencial de guarda", score: "2035" }
    ]
  },
  {
    id: "toscana-super-2017",
    name: "Toscana Superiore IGT",
    year: "2017",
    region: "Toscana, Italia",
    type: "Tinto",
    grape: "Cabernet Sauvignon, Merlot e Sangiovese",
    price: 850,
    oldPrice: 990,
    stock: 10,
    color: "#6d142a",
    accent: "#d7a85d",
    label: "IGT",
    short: "Super Toscano potente, com ameixa, cedro, tabaco e especiarias.",
    history: "Inspirado pela liberdade dos vinhos IGT da Toscana, este corte une castas internacionais e Sangiovese em um perfil moderno. A safra 2017 foi quente, gerando concentracao e textura ampla.",
    tasting: "Ameixa madura, cassis, cedro, baunilha discreta e tabaco. Paladar encorpado, taninos polidos e final especiado.",
    pairings: ["Bistecca alla fiorentina", "Ragu de cordeiro", "Parmesao"],
    scores: [
      { source: "Críticos internacionais", score: "95/100" },
      { source: "Painel Vinhos Raros", score: "94/100" },
      { source: "Potencial de guarda", score: "2030" }
    ]
  },
  {
    id: "rioja-gran-reserva-2011",
    name: "Rioja Gran Reserva",
    year: "2011",
    region: "Rioja, Espanha",
    type: "Tinto",
    grape: "Tempranillo",
    price: 720,
    oldPrice: 860,
    stock: 12,
    color: "#9c2832",
    accent: "#caa15d",
    label: "Gran Reserva",
    short: "Rioja classico, com cereja em compota, couro, baunilha e final macio.",
    history: "O estilo Gran Reserva nasce do tempo: longos anos de barrica e garrafa antes da venda. A safra 2011 oferece maturidade e complexidade, preservando a elegancia classica da Rioja.",
    tasting: "Cereja, ameixa seca, couro novo, coco, baunilha e ervas. Boca redonda, taninos integrados e acidez equilibrada.",
    pairings: ["Leitao assado", "Costela bovina", "Embutidos ibericos"],
    scores: [
      { source: "Críticos internacionais", score: "93/100" },
      { source: "Painel Vinhos Raros", score: "94/100" },
      { source: "Potencial de guarda", score: "2029" }
    ]
  },
  {
    id: "port-vintage-2007",
    name: "Porto Vintage",
    year: "2007",
    region: "Douro, Portugal",
    type: "Fortificado",
    grape: "Touriga Nacional e castas tradicionais",
    price: 1120,
    oldPrice: 1260,
    stock: 5,
    color: "#4f1027",
    accent: "#bf8c4a",
    label: "Vintage",
    short: "Vinho do Porto raro, intenso, com cassis, chocolate amargo e especiarias.",
    history: "Declarado apenas em safras de excelencia, o Porto Vintage e engarrafado jovem para evoluir por decadas. 2007 e lembrada pela concentracao, frescor e arquitetura firme.",
    tasting: "Frutas negras, violeta, chocolate, pimenta e figo. Doce sem peso, com taninos presentes e final potente.",
    pairings: ["Chocolate 70%", "Queijo azul", "Torta de nozes"],
    scores: [
      { source: "Críticos internacionais", score: "96/100" },
      { source: "Painel Vinhos Raros", score: "96/100" },
      { source: "Potencial de guarda", score: "2050" }
    ]
  }
];

const countRow = db.prepare('SELECT COUNT(*) as cnt FROM wines').get();
if (countRow.cnt === 0) {
  const insert = db.prepare(`
    INSERT INTO wines (id,name,year,region,type,grape,price,oldPrice,stock,color,accent,label,short,history,tasting,pairings,scores,image)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insertAll = db.transaction((list) => {
    for (const w of list) {
      insert.run(
        w.id, w.name, w.year, w.region, w.type, w.grape,
        w.price, w.oldPrice, w.stock, w.color, w.accent,
        w.label, w.short, w.history, w.tasting,
        JSON.stringify(w.pairings), JSON.stringify(w.scores), ''
      );
    }
  });
  insertAll(seedWines);
  console.log('Banco de dados populado com os vinhos iniciais.');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  )
`);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function extractToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  if (req.headers['x-auth-token']) return req.headers['x-auth-token'];
  if (req.query && req.query.token) return req.query.token;
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  const row = db.prepare('SELECT token FROM sessions WHERE token = ?').get(token);
  if (!row) return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  next();
}

function parseWine(w) {
  return {
    ...w,
    price: Number(w.price),
    oldPrice: Number(w.oldPrice),
    stock: Number(w.stock),
    pairings: JSON.parse(w.pairings || '[]'),
    scores: JSON.parse(w.scores || '[]'),
    image: w.image || '',
  };
}

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }
  const token = crypto.randomUUID();
  db.prepare('INSERT INTO sessions (token) VALUES (?)').run(token);
  res.json({ token });
});

app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = extractToken(req);
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ ok: true });
});

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

app.get('/api/wines', (req, res) => {
  const wines = db.prepare('SELECT * FROM wines ORDER BY rowid').all();
  res.json(wines.map(parseWine));
});

app.get('/api/wines/:id', (req, res) => {
  const wine = db.prepare('SELECT * FROM wines WHERE id = ?').get(req.params.id);
  if (!wine) return res.status(404).json({ error: 'Vinho não encontrado' });
  res.json(parseWine(wine));
});

app.post('/api/wines', requireAuth, (req, res) => {
  const w = req.body;
  if (!w.id || !w.name) return res.status(400).json({ error: 'id e name são obrigatórios' });
  try {
    db.prepare(`
      INSERT INTO wines (id,name,year,region,type,grape,price,oldPrice,stock,color,accent,label,short,history,tasting,pairings,scores,image)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      w.id, w.name, w.year, w.region, w.type, w.grape,
      w.price, w.oldPrice, w.stock, w.color, w.accent,
      w.label, w.short, w.history, w.tasting,
      JSON.stringify(w.pairings || []), JSON.stringify(w.scores || []), w.image || ''
    );
    res.status(201).json(parseWine(db.prepare('SELECT * FROM wines WHERE id = ?').get(w.id)));
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Já existe um vinho com este ID' });
    }
    throw e;
  }
});

app.put('/api/wines/:id', requireAuth, (req, res) => {
  const w = req.body;
  const result = db.prepare(`
    UPDATE wines SET name=?,year=?,region=?,type=?,grape=?,price=?,oldPrice=?,stock=?,color=?,accent=?,label=?,short=?,history=?,tasting=?,pairings=?,scores=?,image=?
    WHERE id=?
  `).run(
    w.name, w.year, w.region, w.type, w.grape,
    w.price, w.oldPrice, w.stock, w.color, w.accent,
    w.label, w.short, w.history, w.tasting,
    JSON.stringify(w.pairings || []), JSON.stringify(w.scores || []),
    w.image || '',
    req.params.id
  );
  if (result.changes === 0) return res.status(404).json({ error: 'Vinho não encontrado' });
  res.json(parseWine(db.prepare('SELECT * FROM wines WHERE id = ?').get(req.params.id)));
});

app.delete('/api/wines/:id', requireAuth, (req, res) => {
  const wine = db.prepare('SELECT image FROM wines WHERE id = ?').get(req.params.id);
  if (!wine) return res.status(404).json({ error: 'Vinho não encontrado' });
  if (wine.image && wine.image.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, wine.image);
    fs.unlink(filePath, () => {});
  }
  db.prepare('DELETE FROM wines WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ── Carousel ── */
app.get('/api/carousel', (req, res) => {
  const slides = db.prepare('SELECT * FROM carousel WHERE active=1 ORDER BY sort_order').all();
  res.json(slides);
});

app.get('/api/carousel/all', requireAuth, (req, res) => {
  const slides = db.prepare('SELECT * FROM carousel ORDER BY sort_order').all();
  res.json(slides);
});

app.post('/api/carousel', requireAuth, (req, res) => {
  const { title, subtitle, cta_text, cta_link, bg_color, image } = req.body;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM carousel').get().m ?? -1;
  const r = db.prepare(`INSERT INTO carousel (image,title,subtitle,cta_text,cta_link,bg_color,sort_order,active) VALUES (?,?,?,?,?,?,?,1)`)
    .run(image||'', title||'', subtitle||'', cta_text||'Ver catálogo', cta_link||'#catalogo', bg_color||'#5c0f24', maxOrder+1);
  res.status(201).json(db.prepare('SELECT * FROM carousel WHERE id=?').get(r.lastInsertRowid));
});

app.put('/api/carousel/:id', requireAuth, (req, res) => {
  const { title, subtitle, cta_text, cta_link, bg_color, image, active, sort_order } = req.body;
  const slide = db.prepare('SELECT * FROM carousel WHERE id=?').get(req.params.id);
  if (!slide) return res.status(404).json({ error: 'Slide não encontrado' });
  db.prepare(`UPDATE carousel SET image=?,title=?,subtitle=?,cta_text=?,cta_link=?,bg_color=?,active=?,sort_order=? WHERE id=?`)
    .run(
      image ?? slide.image, title ?? slide.title, subtitle ?? slide.subtitle,
      cta_text ?? slide.cta_text, cta_link ?? slide.cta_link, bg_color ?? slide.bg_color,
      active ?? slide.active, sort_order ?? slide.sort_order, req.params.id
    );
  res.json(db.prepare('SELECT * FROM carousel WHERE id=?').get(req.params.id));
});

app.delete('/api/carousel/:id', requireAuth, (req, res) => {
  const slide = db.prepare('SELECT image FROM carousel WHERE id=?').get(req.params.id);
  if (!slide) return res.status(404).json({ error: 'Slide não encontrado' });
  if (slide.image && slide.image.startsWith('/uploads/')) {
    fs.unlink(path.join(__dirname, slide.image), () => {});
  }
  db.prepare('DELETE FROM carousel WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ── Settings ── */
function readSettings() {
  const out = { ...defaultSettings };
  for (const row of db.prepare("SELECT key, value FROM settings").all()) {
    out[row.key] = row.value;
  }
  return out;
}

app.get('/api/settings', (req, res) => {
  res.json(readSettings());
});

app.put('/api/settings', requireAuth, (req, res) => {
  const { theme, site_name, logo, whatsapp, ticker_text } = req.body;
  const set = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");

  if (theme !== undefined) {
    if (!['dark', 'light'].includes(theme)) return res.status(400).json({ error: 'Tema inválido' });
    set.run('theme', theme);
  }
  if (site_name !== undefined) {
    const name = String(site_name).trim();
    if (!name) return res.status(400).json({ error: 'O nome do site não pode ficar vazio' });
    set.run('site_name', name);
  }
  if (logo !== undefined) {
    set.run('logo', String(logo).trim() || '/logo.png');
  }
  if (whatsapp !== undefined) {
    set.run('whatsapp', String(whatsapp).replace(/\D/g, ''));
  }
  if (ticker_text !== undefined) {
    set.run('ticker_text', String(ticker_text));
  }

  res.json({ ok: true, ...readSettings() });
});

app.get('/admin', (req, res) => res.redirect('/admin.html'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vinhos Raros rodando em http://0.0.0.0:${PORT}`);
  console.log(`Painel admin: http://0.0.0.0:${PORT}/admin`);
});
