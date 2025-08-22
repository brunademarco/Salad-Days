const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');

const dbPath = path.join(__dirname, '../../db/db.json');
const readDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

const sanitize = (u) => {
  if (!u) return u;
  const { senha, ...rest } = u;
  return rest;
};

module.exports = {

  // GET /api/usuarios/perfil
  profile: (req, res) => {
    const db = readDB();
    const usuario = db.usuarios.find(u => u.id === req.userId);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(sanitize(usuario));
  },

  // GET /api/usuarios/favoritos  
  getFavorites: (req, res) => {
    const db = readDB();
    const usuario = db.usuarios.find(u => u.id === req.userId);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(Array.isArray(usuario.favoritos) ? usuario.favoritos : []);
  },

  // POST /api/usuarios/favoritos  body: { receitaId }
  toggleFavorite: (req, res) => {
    const { receitaId } = req.body;
    if (!receitaId) return res.status(400).json({ error: 'receitaId é obrigatório' });

    const db = readDB();
    const idx = db.usuarios.findIndex(u => u.id === req.userId);
    if (idx === -1) return res.status(404).json({ error: 'Usuário não encontrado' });

    const favs = Array.isArray(db.usuarios[idx].favoritos) ? db.usuarios[idx].favoritos : [];

    const pos = favs.indexOf(receitaId);
    if (pos === -1) favs.push(receitaId);
    else favs.splice(pos, 1);

    db.usuarios[idx].favoritos = favs;
    saveDB(db);

    res.json({ favoritos: favs });
  },

  // PATCH /api/usuarios/:id  -> { nome | email | login | senha }
  patchById: (req, res) => {
    const { id } = req.params;
    if (id !== req.userId) return res.status(403).json({ error: 'Operação não permitida' });

    const { nome, email, login, senha } = req.body;
    const db = readDB();

    const idx = db.usuarios.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Usuário não encontrado' });

    // valida colisões (login/email) se vierem no body
    if (login && db.usuarios.some(u => u.login === login && u.id !== id)) {
      return res.status(409).json({ error: 'Login já em uso' });
    }
    if (email && db.usuarios.some(u => u.email === email && u.id !== id)) {
      return res.status(409).json({ error: 'E-mail já em uso' });
    }

    if (typeof nome === 'string') db.usuarios[idx].nome = nome.trim();
    if (typeof email === 'string') db.usuarios[idx].email = email.trim();
    if (typeof login === 'string') db.usuarios[idx].login = login.trim();

    if (typeof senha === 'string' && senha.trim()) {
      const senhaCriptografada = CryptoJS.AES.encrypt(
        senha.trim(),
        process.env.CRYPTO_SECRET
      ).toString();
      db.usuarios[idx].senha = senhaCriptografada;
    }

    saveDB(db);
    res.json(sanitize(db.usuarios[idx]));
  },

  // DELETE /api/usuarios/:id
  deleteById: (req, res) => {
    const { id } = req.params;
    if (id !== req.userId) return res.status(403).json({ error: 'Operação não permitida' });

    const db = readDB();
    const exists = db.usuarios.some(u => u.id === id);
    if (!exists) return res.status(404).json({ error: 'Usuário não encontrado' });

    db.usuarios = db.usuarios.filter(u => u.id !== id);

    //  remover receitas
    if (Array.isArray(db.receitas)) {
      db.receitas = db.receitas.filter(r => r.autorId !== id);
    }

    saveDB(db);
    res.status(204).send();
  }
};
