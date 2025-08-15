const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const dbPath = path.join(__dirname, '../../db/db.json');
const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
const senhaCriptografada = CryptoJS.AES.encrypt(senha, process.env.CRYPTO_SECRET).toString();

const readDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

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
        { id: usuario.id }, // Dados armazenados no token
        process.env.JWT_SECRET,
        {expiresIn: '1h' } // Token expira em 1 hora
    );
  
    const { senha: _, ...userData } = usuario;
    res.json({ ...userData, token }); // Retorna token + dados do usuário
    }
},
};