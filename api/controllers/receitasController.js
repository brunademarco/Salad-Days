const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../db/db.json');


const readDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

module.exports = {

  //Todas
  getAll: (req, res) => {
    const db = readDB();
    res.json(db.receitas);
  },

  //Id
  getById: (req, res) => {
    const db = readDB();
    const receita = db.receitas.find(r => r.id === req.params.id);
    receita ? res.json(receita) : res.status(404).json({ error: 'Receita não encontrada' });
  },

  //CREATE
  create: (req, res) => {
    const db = readDB();
    const novaReceita = { id: Date.now().toString(), ...req.body }; // ID único
    db.receitas.push(novaReceita);
    saveDB(db);
    res.status(201).json(novaReceita);
  },

  //UPDATE
  update: (req, res) => {
    const db = readDB();
    const index = db.receitas.findIndex(r => r.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Receita não encontrada' });
    
    db.receitas[index] = { ...db.receitas[index], ...req.body };
    saveDB(db);
    res.json(db.receitas[index]);
  },

  //DELETE
  delete: (req, res) => {
    const db = readDB();
    db.receitas = db.receitas.filter(r => r.id !== req.params.id);
    saveDB(db);
    res.status(204).send();
  },

  //filtra
  getByCategory: (req, res) => {
    const db = readDB();
    const receitas = db.receitas.filter(r => 
      r.categoria_id.includes(parseInt(req.params.categoriaId))
    );
    res.json(receitas);
  }
};