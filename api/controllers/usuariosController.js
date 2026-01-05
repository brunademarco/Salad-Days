const bcrypt = require('bcryptjs');
const { query } = require('../services/db');

const toPublicUser = (u) => {
  if (!u) return u;
  return {
    id: u.id_usuario,
    nome: u.nome_completo,
    login: u.nome_usuario,
    email: u.email,
    criadoEm: u.criado_em
  };
};

module.exports = {

  // GET /api/usuarios/perfil
  profile: async (req, res) => {
    const result = await query(
      'SELECT id_usuario, nome_completo, nome_usuario, email, criado_em FROM usuarios WHERE id_usuario = $1',
      [req.userId]
    );
    const usuario = result.rows[0];
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(toPublicUser(usuario));
  },

  // GET /api/usuarios/favoritos  
  getFavorites: async (req, res) => {
    const usuario = await query('SELECT 1 FROM usuarios WHERE id_usuario = $1', [req.userId]);
    if (usuario.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    const result = await query(
      'SELECT id_receita FROM receitas_favoritas WHERE id_usuario = $1 ORDER BY data_favorito DESC',
      [req.userId]
    );
    res.json(result.rows.map(r => r.id_receita));
  },

  // POST /api/usuarios/favoritos  body: { receitaId }
  toggleFavorite: async (req, res) => {
    const { receitaId } = req.body;
    if (!receitaId) return res.status(400).json({ error: 'receitaId é obrigatório' });
    const receitaIdNumero = Number(receitaId);
    if (!Number.isInteger(receitaIdNumero)) {
      return res.status(400).json({ error: 'receitaId inválido' });
    }

    const usuario = await query('SELECT 1 FROM usuarios WHERE id_usuario = $1', [req.userId]);
    if (usuario.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    const favorito = await query(
      'SELECT 1 FROM receitas_favoritas WHERE id_usuario = $1 AND id_receita = $2',
      [req.userId, receitaIdNumero]
    );

    if (favorito.rows.length === 0) {
      try {
        await query(
          'INSERT INTO receitas_favoritas (id_usuario, id_receita) VALUES ($1, $2)',
          [req.userId, receitaIdNumero]
        );
      } catch (err) {
        if (err.code === '23503') {
          return res.status(404).json({ error: 'Receita não encontrada' });
        }
        throw err;
      }
    } else {
      await query(
        'DELETE FROM receitas_favoritas WHERE id_usuario = $1 AND id_receita = $2',
        [req.userId, receitaIdNumero]
      );
    }

    const result = await query(
      'SELECT id_receita FROM receitas_favoritas WHERE id_usuario = $1 ORDER BY data_favorito DESC',
      [req.userId]
    );
    res.json({ favoritos: result.rows.map(r => r.id_receita) });
  },

  // PATCH /api/usuarios/:id  -> { nome | email | login | senha }
  patchById: async (req, res) => {
    const { id } = req.params;
    if (Number(id) !== Number(req.userId)) return res.status(403).json({ error: 'Operação não permitida' });

    const { nome, email, login, senha } = req.body;

    const usuarioExistente = await query(
      'SELECT id_usuario, senha FROM usuarios WHERE id_usuario = $1',
      [req.userId]
    );
    const usuarioAtual = usuarioExistente.rows[0];
    if (!usuarioAtual) return res.status(404).json({ error: 'Usuário não encontrado' });

    // valida colisões (login/email) se vierem no body
    if (login) {
      const loginEmUso = await query(
        'SELECT 1 FROM usuarios WHERE nome_usuario = $1 AND id_usuario <> $2',
        [login, req.userId]
      );
      if (loginEmUso.rows.length > 0) return res.status(409).json({ error: 'Login já em uso' });
    }
    if (email) {
      const emailEmUso = await query(
        'SELECT 1 FROM usuarios WHERE email = $1 AND id_usuario <> $2',
        [email, req.userId]
      );
      if (emailEmUso.rows.length > 0) return res.status(409).json({ error: 'E-mail já em uso' });
    }

    const campos = [];
    const valores = [];
    let i = 1;
    if (typeof nome === 'string') {
      campos.push(`nome_completo = $${i++}`);
      valores.push(nome.trim());
    }
    if (typeof email === 'string') {
      campos.push(`email = $${i++}`);
      valores.push(email.trim());
    }
    if (typeof login === 'string') {
      campos.push(`nome_usuario = $${i++}`);
      valores.push(login.trim());
    }
    if (typeof senha === 'string' && senha.trim()) {
      const senhaAtual = typeof req.body.senhaAtual === 'string' ? req.body.senhaAtual.trim() : '';
      if (!senhaAtual) return res.status(400).json({ error: 'Senha atual é obrigatória' });

      const senhaConfere = await bcrypt.compare(senhaAtual, usuarioAtual.senha);
      if (!senhaConfere) return res.status(401).json({ error: 'Senha atual inválida' });

      const senhaHash = await bcrypt.hash(senha.trim(), 10);
      campos.push(`senha = $${i++}`);
      valores.push(senhaHash);
    }

    if (campos.length === 0) {
      const atual = await query(
        'SELECT id_usuario, nome_completo, nome_usuario, email, criado_em FROM usuarios WHERE id_usuario = $1',
        [req.userId]
      );
      return res.json(toPublicUser(atual.rows[0]));
    }

    valores.push(req.userId);
    const atualizado = await query(
      `UPDATE usuarios SET ${campos.join(', ')} WHERE id_usuario = $${i}
       RETURNING id_usuario, nome_completo, nome_usuario, email, criado_em`,
      valores
    );
    res.json(toPublicUser(atualizado.rows[0]));
  },

  // DELETE /api/usuarios/:id
  deleteById: async (req, res) => {
    const { id } = req.params;
    if (Number(id) !== Number(req.userId)) return res.status(403).json({ error: 'Operação não permitida' });

    const result = await query('DELETE FROM usuarios WHERE id_usuario = $1', [req.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.status(204).send();
  }
};
