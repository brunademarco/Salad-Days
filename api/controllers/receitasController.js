const { readDB, saveDB } = require('../services/dbService');

const normalizeCategorias = (cat) => {
  if (Array.isArray(cat)) return cat.map(Number).filter(n => !Number.isNaN(n));
  const n = Number(cat);
  return Number.isNaN(n) ? [] : [n];
};

module.exports = {
  // GET /api/receitas  (suporta ?autorId=...)
  getAll: (req, res) => {
    const db = readDB();
    const { autorId } = req.query;
    const list = autorId
      ? db.receitas.filter(r => r.autorId === autorId)
      : db.receitas;
    res.json(list);
  },

  // GET /api/receitas/:id
  getById: (req, res) => {
    const db = readDB();
    const receita = db.receitas.find(r => r.id === req.params.id);
    return receita
      ? res.json(receita)
      : res.status(404).json({ error: 'Receita não encontrada' });
  },

  // POST /api/receitas   (auth)  body: { titulo, categoria_id, card_descricao, ingredientes_base, ingredientes_molho, instrucoes, imagem }
  create: (req, res) => {
    const db = readDB();
    const {
      titulo,
      categoria_id,
      card_descricao,
      ingredientes_base,
      ingredientes_molho,
      instrucoes,
      imagem, 
    } = req.body;

    if (!titulo || !imagem || !categoria_id) {
      return res.status(400).json({ error: 'Campos obrigatórios: titulo, imagem, categoria_id' });
    }

    const novaReceita = {
      id: Date.now().toString(),
      titulo: String(titulo).trim(),
      categoria_id: normalizeCategorias(categoria_id),
      card_descricao: (card_descricao || '').toString().trim(),
      ingredientes_base: Array.isArray(ingredientes_base) ? ingredientes_base : [],
      ingredientes_molho: Array.isArray(ingredientes_molho) ? ingredientes_molho : [],
      instrucoes: Array.isArray(instrucoes) ? instrucoes : [],
      imagem: String(imagem).trim(), 
      autorId: req.userId,          
      criadoEm: new Date().toISOString()
    };

    db.receitas.push(novaReceita);
    saveDB(db);
    res.status(201).json(novaReceita);
  },

  // PUT /api/receitas/:id   (auth)
  update: (req, res) => {
    const db = readDB();
    const idx = db.receitas.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Receita não encontrada' });

    if (db.receitas[idx].autorId !== req.userId) {
      return res.status(403).json({ error: 'Você não pode editar esta receita' });
    }

    const payload = { ...req.body };
    if (payload.categoria_id) {
      payload.categoria_id = normalizeCategorias(payload.categoria_id);
    }

    delete payload.autorId;

    db.receitas[idx] = { ...db.receitas[idx], ...payload, atualizadoEm: new Date().toISOString() };
    saveDB(db);
    res.json(db.receitas[idx]);
  },

  // DELETE /api/receitas/:id   (auth)
  delete: (req, res) => {
    const db = readDB();
    const receita = db.receitas.find(r => r.id === req.params.id);
    if (!receita) return res.status(404).json({ error: 'Receita não encontrada' });

    if (receita.autorId !== req.userId) {
      return res.status(403).json({ error: 'Você não pode excluir esta receita' });
    }

    db.receitas = db.receitas.filter(r => r.id !== req.params.id);
    saveDB(db);
    res.status(204).send();
  },

  // GET /api/receitas/categoria/:categoriaId
  getByCategory: (req, res) => {
    const db = readDB();
    const catId = parseInt(req.params.categoriaId, 10);
    const receitas = db.receitas.filter(r =>
      Array.isArray(r.categoria_id) && r.categoria_id.includes(catId)
    );
    res.json(receitas);
  }
};
