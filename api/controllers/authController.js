const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const dbPath = path.join(__dirname, '../../db/db.json');
const readDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

module.exports = {
  login: (req, res) => {
    const { login, senha } = req.body;
    const db = readDB();
    const usuario = db.usuarios.find(
      u => u.login === login || u.email === login
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    try {
      const bytes = CryptoJS.AES.decrypt(usuario.senha, process.env.CRYPTO_SECRET);
      const senhaOriginal = bytes.toString(CryptoJS.enc.Utf8);
      if (senhaOriginal !== senha) return res.status(401).json({ error: 'Credenciais inválidas' });
    } catch {
      return res.status(500).json({ error: 'Falha ao validar credenciais' });
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
  },

  register: (req, res) => {
      const { login, senha, nome, email } = req.body;
      const db = readDB();

      if (db.usuarios.some(u => u.login === login || u.email === email)) {
          return res.status(409).json({ error: 'Usuário ou email já existe' });
      }

      const senhaCriptografada = CryptoJS.AES.encrypt(senha, process.env.CRYPTO_SECRET).toString();
      const novoUsuario = {
          id: Date.now().toString(),
          login,
          senha: senhaCriptografada,
          nome,
          email
        };

      db.usuarios.push(novoUsuario);
      saveDB(db);

      const token = jwt.sign({ id: novoUsuario.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(201).json({ token, usuario: { id: novoUsuario.id, nome, email } });
  }
};