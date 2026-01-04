const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../services/db');

module.exports = {
  login: async (req, res) => {
    const { login, senha } = req.body;
    const result = await query(
      'SELECT id_usuario, nome_completo, nome_usuario, email, senha FROM usuarios WHERE nome_usuario = $1 OR email = $1 LIMIT 1',
      [login]
    );
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ id: usuario.id_usuario }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({
      token,
      usuario: {
        id: usuario.id_usuario,
        nome: usuario.nome_completo,
        email: usuario.email
      }
    });
  },

  register: async (req, res) => {
      const { login, senha, nome, email } = req.body;

      const existente = await query(
        'SELECT 1 FROM usuarios WHERE nome_usuario = $1 OR email = $2 LIMIT 1',
        [login, email]
      );
      if (existente.rows.length > 0) return res.status(409).json({ error: 'Usuário ou email já existe' });

      const senhaHash = await bcrypt.hash(senha, 10);
      const insert = await query(
        `INSERT INTO usuarios (nome_completo, nome_usuario, email, senha)
         VALUES ($1, $2, $3, $4)
         RETURNING id_usuario, nome_completo, email`,
        [nome, login, email, senhaHash]
      );
      const novoUsuario = insert.rows[0];

      const token = jwt.sign({ id: novoUsuario.id_usuario }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(201).json({
        token,
        usuario: {
          id: novoUsuario.id_usuario,
          nome: novoUsuario.nome_completo,
          email: novoUsuario.email
        }
      });
  }
};
