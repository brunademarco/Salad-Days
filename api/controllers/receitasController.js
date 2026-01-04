const { pool, query } = require('../services/db');

const normalizeCategorias = (cat) => {
  if (Array.isArray(cat)) return cat.map(Number).filter(n => !Number.isNaN(n));
  const n = Number(cat);
  return Number.isNaN(n) ? [] : [n];
};

module.exports = {
  // GET /api/receitas  (suporta ?autorId=...)
  getAll: async (req, res) => {
    const { autorId } = req.query;
    const params = [];
    let sql = 'SELECT * FROM receitas';
    if (autorId) {
      sql += ' WHERE id_usuario_autor = $1';
      params.push(Number(autorId));
    }
    sql += ' ORDER BY criado_em DESC';

    const result = await query(sql, params);
    const receitas = await Promise.all(result.rows.map((row) => buildReceitaResponse(row)));
    res.json(receitas);
  },

  // GET /api/receitas/:id
  getById: async (req, res) => {
    const receitaId = Number(req.params.id);
    if (!Number.isInteger(receitaId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const result = await query('SELECT * FROM receitas WHERE id_receita = $1', [receitaId]);
    const receita = result.rows[0];
    if (!receita) return res.status(404).json({ error: 'Receita não encontrada' });

    res.json(await buildReceitaResponse(receita));
  },

  // POST /api/receitas   (auth)  body: { titulo, categoria_id, card_descricao, ingredientes_base, ingredientes_molho, instrucoes, imagem }
  create: async (req, res) => {
    const {
      titulo,
      categoria_id,
      card_descricao,
      ingredientes_base,
      ingredientes_molho,
      instrucoes,
      imagem
    } = req.body;

    if (!titulo || !imagem || !categoria_id) {
      return res.status(400).json({ error: 'Campos obrigatórios: titulo, imagem, categoria_id' });
    }

    const categorias = normalizeCategorias(categoria_id);
    const ingredientesBase = Array.isArray(ingredientes_base) ? ingredientes_base : [];
    const ingredientesMolho = Array.isArray(ingredientes_molho) ? ingredientes_molho : [];
    const passos = Array.isArray(instrucoes)
      ? instrucoes.map(String).map(s => s.trim()).filter(Boolean).join('\n')
      : '';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insert = await client.query(
        `INSERT INTO receitas (id_usuario_autor, titulo, descricao, imagem_url)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.userId, String(titulo).trim(), (card_descricao || '').toString().trim(), String(imagem).trim()]
      );
      const receita = insert.rows[0];

      for (const catId of categorias) {
        await client.query(
          'INSERT INTO receitas_categorias (id_receita, id_categoria) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [receita.id_receita, catId]
        );
      }

      if (passos) {
        await client.query(
          `INSERT INTO modos_preparo (id_receita, passos)
           VALUES ($1, $2)
           ON CONFLICT (id_receita) DO UPDATE SET passos = EXCLUDED.passos`,
          [receita.id_receita, passos]
        );
      }

      await upsertIngredientes(client, receita.id_receita, ingredientesBase, 'base');
      await upsertIngredientes(client, receita.id_receita, ingredientesMolho, 'molho');

      await client.query('COMMIT');
      res.status(201).json(await buildReceitaResponse(receita));
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // PUT /api/receitas/:id   (auth)
  update: async (req, res) => {
    const receitaId = Number(req.params.id);
    if (!Number.isInteger(receitaId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const {
      titulo,
      categoria_id,
      card_descricao,
      ingredientes_base,
      ingredientes_molho,
      instrucoes,
      imagem
    } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existente = await client.query('SELECT * FROM receitas WHERE id_receita = $1', [receitaId]);
      const receita = existente.rows[0];
      if (!receita) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Receita não encontrada' });
      }
      if (Number(receita.id_usuario_autor) !== Number(req.userId)) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Você não pode editar esta receita' });
      }

      const campos = [];
      const valores = [];
      let i = 1;
      if (typeof titulo === 'string') {
        campos.push(`titulo = $${i++}`);
        valores.push(titulo.trim());
      }
      if (typeof card_descricao === 'string') {
        campos.push(`descricao = $${i++}`);
        valores.push(card_descricao.trim());
      }
      if (typeof imagem === 'string') {
        campos.push(`imagem_url = $${i++}`);
        valores.push(imagem.trim());
      }

      if (campos.length > 0) {
        valores.push(receitaId);
        await client.query(
          `UPDATE receitas SET ${campos.join(', ')}, atualizado_em = NOW() WHERE id_receita = $${i}`,
          valores
        );
      }

      if (categoria_id) {
        const categorias = normalizeCategorias(categoria_id);
        await client.query('DELETE FROM receitas_categorias WHERE id_receita = $1', [receitaId]);
        for (const catId of categorias) {
          await client.query(
            'INSERT INTO receitas_categorias (id_receita, id_categoria) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [receitaId, catId]
          );
        }
      }

      if (Array.isArray(instrucoes)) {
        const passos = instrucoes.map(String).map(s => s.trim()).filter(Boolean).join('\n');
        await client.query(
          `INSERT INTO modos_preparo (id_receita, passos)
           VALUES ($1, $2)
           ON CONFLICT (id_receita) DO UPDATE SET passos = EXCLUDED.passos`,
          [receitaId, passos]
        );
      }

      if (Array.isArray(ingredientes_base) || Array.isArray(ingredientes_molho)) {
        await client.query('DELETE FROM receitas_ingredientes WHERE id_receita = $1', [receitaId]);
        await upsertIngredientes(client, receitaId, Array.isArray(ingredientes_base) ? ingredientes_base : [], 'base');
        await upsertIngredientes(client, receitaId, Array.isArray(ingredientes_molho) ? ingredientes_molho : [], 'molho');
      }

      const atualizado = await client.query('SELECT * FROM receitas WHERE id_receita = $1', [receitaId]);
      await client.query('COMMIT');
      res.json(await buildReceitaResponse(atualizado.rows[0]));
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // DELETE /api/receitas/:id   (auth)
  delete: async (req, res) => {
    const receitaId = Number(req.params.id);
    if (!Number.isInteger(receitaId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const receita = await query('SELECT id_usuario_autor FROM receitas WHERE id_receita = $1', [receitaId]);
    const row = receita.rows[0];
    if (!row) return res.status(404).json({ error: 'Receita não encontrada' });
    if (Number(row.id_usuario_autor) !== Number(req.userId)) {
      return res.status(403).json({ error: 'Você não pode excluir esta receita' });
    }

    await query('DELETE FROM receitas WHERE id_receita = $1', [receitaId]);
    res.status(204).send();
  },

  // GET /api/receitas/categoria/:categoriaId
  getByCategory: async (req, res) => {
    const catId = parseInt(req.params.categoriaId, 10);
    if (!Number.isInteger(catId)) {
      return res.status(400).json({ error: 'Categoria inválida' });
    }

    const result = await query(
      `SELECT r.*
       FROM receitas r
       JOIN receitas_categorias rc ON rc.id_receita = r.id_receita
       WHERE rc.id_categoria = $1
       ORDER BY r.criado_em DESC`,
      [catId]
    );
    const receitas = await Promise.all(result.rows.map((row) => buildReceitaResponse(row)));
    res.json(receitas);
  }
};

const buildReceitaResponse = async (receitaRow) => {
  const [categoriasRes, ingredientesRes, modoRes] = await Promise.all([
    query('SELECT id_categoria FROM receitas_categorias WHERE id_receita = $1', [receitaRow.id_receita]),
    query(
      `SELECT i.nome, ri.observacao
       FROM receitas_ingredientes ri
       JOIN ingredientes i ON i.id_ingrediente = ri.id_ingrediente
       WHERE ri.id_receita = $1
       ORDER BY i.nome`,
      [receitaRow.id_receita]
    ),
    query('SELECT passos FROM modos_preparo WHERE id_receita = $1', [receitaRow.id_receita])
  ]);

  const ingredientesBase = [];
  const ingredientesMolho = [];
  for (const item of ingredientesRes.rows) {
    if (item.observacao === 'molho') ingredientesMolho.push(item.nome);
    else ingredientesBase.push(item.nome);
  }

  const passos = modoRes.rows[0]?.passos || '';
  const instrucoes = passos
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  return {
    id: receitaRow.id_receita,
    titulo: receitaRow.titulo,
    categoria_id: categoriasRes.rows.map(r => r.id_categoria),
    card_descricao: receitaRow.descricao || '',
    ingredientes_base: ingredientesBase,
    ingredientes_molho: ingredientesMolho,
    instrucoes,
    imagem: receitaRow.imagem_url || '',
    autorId: receitaRow.id_usuario_autor,
    criadoEm: receitaRow.criado_em,
    atualizadoEm: receitaRow.atualizado_em
  };
};

const upsertIngredientes = async (client, receitaId, ingredientes, tipo) => {
  for (const item of ingredientes) {
    const nome = String(item).trim();
    if (!nome) continue;
    const ingr = await client.query(
      `INSERT INTO ingredientes (nome)
       VALUES ($1)
       ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome
       RETURNING id_ingrediente`,
      [nome]
    );
    const idIngrediente = ingr.rows[0].id_ingrediente;
    await client.query(
      `INSERT INTO receitas_ingredientes (id_receita, id_ingrediente, observacao)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_receita, id_ingrediente)
       DO UPDATE SET observacao = EXCLUDED.observacao`,
      [receitaId, idIngrediente, tipo]
    );
  }
};
