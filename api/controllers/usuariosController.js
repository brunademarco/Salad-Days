const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../db/db.json');
const readDB = () => JSON.parse(fs.readFileSync(dbPath)); 
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');

module.exports = {

  login: (req, res) => {
    const { login, senha } = req.body;
    const db = readDB();
    const usuario = db.usuarios.find(u => u.login === login || u.email === login);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const senhaDescriptografada = CryptoJS.AES.decrypt(
      usuario.senha,
      process.env.CRYPTO_SECRET || 'chave-fallback'
    ).toString(CryptoJS.enc.Utf8);

    if (senha === senhaDescriptografada) {
      const token = jwt.sign(
        { id: usuario.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const { senha: _, ...userData } = usuario;
      res.json({ ...userData, token });
    } else {
      res.status(401).json({ error: 'Senha incorreta' });
    }
  },

  register: (req, res) => {
    const db = readDB();
    const { login, senha, nome, email } = req.body;

    if (db.usuarios.some(u => u.login === login || u.email === email)) {
      return res.status(400).json({ error: 'Usuário ou email já existe' });
    }

    const novoUsuario = {
      id: Date.now().toString(),
      login,
      senha: CryptoJS.AES.encrypt(senha, process.env.CRYPTO_SECRET || 'chave-fallback').toString(),
      nome,
      email
    };

    db.usuarios.push(novoUsuario);
    saveDB(db);

    res.status(201).json({ id: novoUsuario.id });
  }
};
