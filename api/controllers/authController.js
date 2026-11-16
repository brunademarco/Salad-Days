const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../services/db');

const setAuthCookie = (res, token) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `token=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600${secure}`);
};

module.exports = {
  login: async (req, res) => {
    const { login, senha } = req.body;
    const loginValue = typeof login === 'string' ? login.trim() : '';
    if (!loginValue) {
      return res.status(400).json({ error: 'Login ou email obrigatório' });
    }
    const result = await query(
      'SELECT id_usuario, nome_completo, nome_usuario, email, senha FROM usuarios WHERE LOWER(nome_usuario) = LOWER($1) OR LOWER(email) = LOWER($1) LIMIT 1',
      [loginValue]
    );
    const usuario = result.rows[0];

    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    const senhaValida = typeof senha === 'string' && await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign({ id: usuario.id_usuario }, process.env.JWT_SECRET, { expiresIn: '1h' });
    setAuthCookie(res, token);
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
      const { login, senha, nome, email } = req.body || {};
      const values = {
        login: typeof login === 'string' ? login.trim() : '',
        senha: typeof senha === 'string' ? senha : '',
        nome: typeof nome === 'string' ? nome.trim() : '',
        email: typeof email === 'string' ? email.trim().toLowerCase() : ''
      };
      if (!values.login || !values.senha || !values.nome || !values.email) {
        return res.status(400).json({ error: 'Nome, login, email e senha são obrigatórios' });
      }
      if (values.senha.length < 8) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' });
      }
      if (!/^\S+@\S+\.\S+$/.test(values.email)) {
        return res.status(400).json({ error: 'E-mail inválido' });
      }

      const existente = await query(
        'SELECT 1 FROM usuarios WHERE nome_usuario = $1 OR email = $2 LIMIT 1',
        [values.login, values.email]
      );
      if (existente.rows.length > 0) return res.status(409).json({ error: 'Usuário ou email já existe' });

      const senhaHash = await bcrypt.hash(values.senha, 10);
      const insert = await query(
        `INSERT INTO usuarios (nome_completo, nome_usuario, email, senha)
         VALUES ($1, $2, $3, $4)
         RETURNING id_usuario, nome_completo, email`,
        [values.nome, values.login, values.email, senhaHash]
      );
      const novoUsuario = insert.rows[0];

      const token = jwt.sign({ id: novoUsuario.id_usuario }, process.env.JWT_SECRET, { expiresIn: '1h' });
      setAuthCookie(res, token);
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
