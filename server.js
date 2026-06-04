const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname)));

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
    scores TEXT DEFAULT '[]'
  )
`);

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
    INSERT INTO wines (id,name,year,region,type,grape,price,oldPrice,stock,color,accent,label,short,history,tasting,pairings,scores)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insertAll = db.transaction((list) => {
    for (const w of list) {
      insert.run(
        w.id, w.name, w.year, w.region, w.type, w.grape,
        w.price, w.oldPrice, w.stock, w.color, w.accent,
        w.label, w.short, w.history, w.tasting,
        JSON.stringify(w.pairings), JSON.stringify(w.scores)
      );
    }
  });
  insertAll(seedWines);
  console.log('Banco de dados populado com os vinhos iniciais.');
}

const sessions = new Set();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ') || !sessions.has(auth.slice(7))) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
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
  };
}

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }
  const token = crypto.randomUUID();
  sessions.add(token);
  res.json({ token });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  sessions.delete(req.headers.authorization.slice(7));
  res.json({ ok: true });
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
      INSERT INTO wines (id,name,year,region,type,grape,price,oldPrice,stock,color,accent,label,short,history,tasting,pairings,scores)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      w.id, w.name, w.year, w.region, w.type, w.grape,
      w.price, w.oldPrice, w.stock, w.color, w.accent,
      w.label, w.short, w.history, w.tasting,
      JSON.stringify(w.pairings || []), JSON.stringify(w.scores || [])
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
    UPDATE wines SET name=?,year=?,region=?,type=?,grape=?,price=?,oldPrice=?,stock=?,color=?,accent=?,label=?,short=?,history=?,tasting=?,pairings=?,scores=?
    WHERE id=?
  `).run(
    w.name, w.year, w.region, w.type, w.grape,
    w.price, w.oldPrice, w.stock, w.color, w.accent,
    w.label, w.short, w.history, w.tasting,
    JSON.stringify(w.pairings || []), JSON.stringify(w.scores || []),
    req.params.id
  );
  if (result.changes === 0) return res.status(404).json({ error: 'Vinho não encontrado' });
  res.json(parseWine(db.prepare('SELECT * FROM wines WHERE id = ?').get(req.params.id)));
});

app.delete('/api/wines/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM wines WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Vinho não encontrado' });
  res.json({ ok: true });
});

app.get('/admin', (req, res) => res.redirect('/admin.html'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vinhos Raros rodando em http://0.0.0.0:${PORT}`);
  console.log(`Painel admin: http://0.0.0.0:${PORT}/admin`);
});
