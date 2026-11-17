const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool, query } = require('../services/db');

const RESET_TOKEN_TTL_MINUTES = 30;
const RESET_REQUEST_MESSAGE = 'Se este e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.';

const createPasswordResetUrl = (token) => {
  if (!process.env.APP_BASE_URL) throw new Error('APP_BASE_URL não configurado');
  const appUrl = new URL(process.env.APP_BASE_URL);
  if (process.env.NODE_ENV === 'production' && appUrl.protocol !== 'https:') {
    throw new Error('APP_BASE_URL precisa usar HTTPS em produção');
  }
  const resetUrl = new URL('/login.html', appUrl.origin);
  resetUrl.hash = `redefinir-senha=${token}`;
  return resetUrl.toString();
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error('Serviço de e-mail não configurado');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: 'Redefina sua senha do Salad Days',
      text: `Recebemos um pedido para redefinir sua senha do Salad Days. Acesse este link em até ${RESET_TOKEN_TTL_MINUTES} minutos: ${resetUrl}\n\nSe você não solicitou a redefinição, ignore este e-mail.`,
      html: `<p>Recebemos um pedido para redefinir sua senha do Salad Days.</p><p><a href="${resetUrl}">Criar uma nova senha</a></p><p>Este link expira em ${RESET_TOKEN_TTL_MINUTES} minutos. Se você não solicitou a redefinição, ignore este e-mail.</p>`
    })
  });

  if (!response.ok) {
    throw new Error(`Falha no serviço de e-mail (${response.status})`);
  }
};

const setAuthCookie = (res, token) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `token=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600${secure}`);
};

module.exports = {
  requestPasswordReset: async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Informe um e-mail válido.' });
    }

    if (!process.env.APP_BASE_URL || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      return res.status(503).json({ error: 'A recuperação de senha está indisponível no momento.' });
    }

    const client = await pool.connect();
    let transactionStarted = false;
    let usuario;
    let token;
    let tokenHash;
    try {
      await client.query('BEGIN');
      transactionStarted = true;
      const result = await client.query(
        'SELECT id_usuario, email FROM usuarios WHERE LOWER(email) = $1 LIMIT 1 FOR UPDATE',
        [email]
      );
      usuario = result.rows[0];
      if (!usuario) {
        await client.query('COMMIT');
        transactionStarted = false;
        return res.json({ message: RESET_REQUEST_MESSAGE });
      }

      const recentRequest = await client.query(
        `SELECT 1 FROM password_reset_tokens
         WHERE id_usuario = $1 AND created_at > NOW() - INTERVAL '1 minute'
         LIMIT 1`,
        [usuario.id_usuario]
      );
      if (recentRequest.rows.length > 0) {
        await client.query('COMMIT');
        transactionStarted = false;
        return res.json({ message: RESET_REQUEST_MESSAGE });
      }

      token = crypto.randomBytes(32).toString('hex');
      tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await client.query(
        `UPDATE password_reset_tokens SET used_at = NOW()
         WHERE id_usuario = $1 AND used_at IS NULL`,
        [usuario.id_usuario]
      );
      await client.query(
        `INSERT INTO password_reset_tokens (id_usuario, token_hash, expires_at)
         VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 minute'))`,
        [usuario.id_usuario, tokenHash, RESET_TOKEN_TTL_MINUTES]
      );
      await client.query('COMMIT');
      transactionStarted = false;
    } catch (error) {
      if (transactionStarted) await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    try {
      await sendPasswordResetEmail(usuario.email, createPasswordResetUrl(token));
    } catch (error) {
      await query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1',
        [tokenHash]
      );
      console.error('Falha ao enviar e-mail de redefinição:', error.message);
    }

    return res.json({ message: RESET_REQUEST_MESSAGE });
  },

  completePasswordReset: async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const senha = typeof req.body?.senha === 'string' ? req.body.senha : '';
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ error: 'O link de redefinição é inválido ou expirou.' });
    }
    if (senha.length < 8) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const client = await pool.connect();
    let transactionStarted = false;
    try {
      await client.query('BEGIN');
      transactionStarted = true;
      const result = await client.query(
        `SELECT id_usuario FROM password_reset_tokens
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
         FOR UPDATE`,
        [tokenHash]
      );
      const reset = result.rows[0];
      if (!reset) {
        await client.query('ROLLBACK');
        transactionStarted = false;
        return res.status(400).json({ error: 'O link de redefinição é inválido ou expirou.' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      await client.query('UPDATE usuarios SET senha = $1 WHERE id_usuario = $2', [senhaHash, reset.id_usuario]);
      await client.query(
        `UPDATE password_reset_tokens SET used_at = NOW()
         WHERE id_usuario = $1 AND used_at IS NULL`,
        [reset.id_usuario]
      );
      await client.query('COMMIT');
      transactionStarted = false;
      return res.json({ message: 'Senha redefinida com sucesso. Entre com sua nova senha.' });
    } catch (error) {
      if (transactionStarted) await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

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
