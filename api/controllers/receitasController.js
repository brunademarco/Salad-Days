const { pool, query } = require('../services/db');

const RECIPE_FIELDS = `
  SELECT r.id_receita, r.titulo, r.descricao, r.tempo_preparo_min,
         r.numero_porcoes, r.imagem_url,
         r.id_usuario_autor, r.criado_em, r.atualizado_em,
         COALESCE((SELECT json_agg(rc.id_categoria ORDER BY rc.id_categoria)
                   FROM receitas_categorias rc WHERE rc.id_receita = r.id_receita), '[]') AS categorias,
         COALESCE((SELECT json_agg(json_build_object('nome', i.nome, 'observacao', ri.observacao) ORDER BY i.nome)
                   FROM receitas_ingredientes ri
                   JOIN ingredientes i ON i.id_ingrediente = ri.id_ingrediente
                   WHERE ri.id_receita = r.id_receita), '[]') AS ingredientes,
         COALESCE((SELECT mp.passos FROM modos_preparo mp WHERE mp.id_receita = r.id_receita LIMIT 1), r.modo_preparo_text, '') AS passos
  FROM receitas r`;

const normalizeCategorias = (cat) => {
  if (Array.isArray(cat)) return cat.map(Number).filter(n => !Number.isNaN(n));
  const n = Number(cat);
  return Number.isNaN(n) ? [] : [n];
};

const isAllowedImageUrl = (value) => {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' && url.hostname.endsWith('cloudinary.com');
  } catch {
    return false;
  }
};

async function criarReceita(req, res) {
  const {
    titulo,
    descricao,
    tempo_preparo_min,
    numero_porcoes,
    imagem,
    categorias,
    ingredientesBaseTexto,
    ingredientesMolhoTexto,
    modoPreparoTexto
  } = req.body;

  if (!req.userId) {
    return res.status(401).json({ erro: 'Usuário não autenticado' });
  }

  const categoriasNormalizadas = normalizeCategorias(categorias);
  if (!String(titulo || '').trim() || !String(descricao || '').trim() ||
      !isAllowedImageUrl(imagem) || categoriasNormalizadas.length === 0 ||
      !Number.isInteger(Number(tempo_preparo_min)) || Number(tempo_preparo_min) <= 0 ||
      !Number.isInteger(Number(numero_porcoes)) || Number(numero_porcoes) <= 0) {
    return res.status(400).json({ erro: 'Dados obrigatórios da receita são inválidos' });
  }

  const client = await pool.connect();

  const quebrarEmLinhas = (texto) => {
    if (!texto) return [];
    return String(texto)
      .split('\n')
      .map(linha => linha.trim())
      .filter(Boolean);
  };

  try {
    await client.query('BEGIN');

    const insertReceita = await client.query(
      `INSERT INTO receitas (
        id_usuario_autor,
        titulo,
        descricao,
        tempo_preparo_min,
        numero_porcoes,
        imagem_url,
        ingredientes_base_text,
        ingredientes_molho_text,
        modo_preparo_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id_receita`,
      [
        req.userId,
        titulo,
        descricao,
        tempo_preparo_min,
        numero_porcoes,
        imagem,
        ingredientesBaseTexto,
        ingredientesMolhoTexto,
        modoPreparoTexto
      ]
    );

    const { id_receita } = insertReceita.rows[0];

    if (categoriasNormalizadas.length > 0) {
      for (const categoriaId of categoriasNormalizadas) {
        await client.query(
          `INSERT INTO receitas_categorias (id_receita, id_categoria)
           VALUES ($1, $2)`,
          [id_receita, categoriaId]
        );
      }
    }

    const ingredientesBase = quebrarEmLinhas(ingredientesBaseTexto);
    const ingredientesMolho = quebrarEmLinhas(ingredientesMolhoTexto);

    const todosIngredientes = [
      ...ingredientesBase.map(nome => ({ nome, tipo: 'base' })),
      ...ingredientesMolho.map(nome => ({ nome, tipo: 'molho' }))
    ];

    for (const ingrediente of todosIngredientes) {
      const inserido = await client.query(
        `INSERT INTO ingredientes (nome) VALUES ($1)
         ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome
         RETURNING id_ingrediente`,
        [ingrediente.nome]
      );
      const idIngrediente = inserido.rows[0].id_ingrediente;

      await client.query(
        `INSERT INTO receitas_ingredientes (
          id_receita,
          id_ingrediente,
          quantidade,
          unidade_medida,
          observacao
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id_receita, id_ingrediente)
        DO UPDATE SET observacao = CASE
          WHEN receitas_ingredientes.observacao = EXCLUDED.observacao
            THEN receitas_ingredientes.observacao
          ELSE CONCAT(receitas_ingredientes.observacao, ',', EXCLUDED.observacao)
        END`,
        [id_receita, idIngrediente, null, null, ingrediente.tipo]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ id_receita, mensagem: 'Receita criada com sucesso' });
  } catch (erro) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar receita:', erro);
    return res.status(500).json({ erro: 'Erro ao criar receita' });
  } finally {
    client.release();
  }
}

module.exports = {
  criarReceita,
  // GET /api/receitas  (suporta ?autorId=...)
  getAll: async (req, res) => {
    const { autorId } = req.query;
    const requestedPage = Number.parseInt(req.query.page || '1', 10);
    const requestedLimit = Number.parseInt(req.query.limit || '20', 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const limit = Number.isFinite(requestedLimit) ? Math.min(50, Math.max(1, requestedLimit)) : 20;
    const offset = (page - 1) * limit;
    const params = [];
    let sql = RECIPE_FIELDS;
    if (autorId) {
      const autorIdNumero = Number(autorId);
      if (!Number.isInteger(autorIdNumero) || autorIdNumero <= 0) {
        return res.status(400).json({ error: 'autorId inválido' });
      }
      sql += ' WHERE id_usuario_autor = $1';
      params.push(autorIdNumero);
    }
    sql += ` ORDER BY criado_em DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const receitas = result.rows.map(formatAggregatedRecipe);
    res.json(receitas);
  },

  // GET /api/receitas/:id
  getById: async (req, res) => {
    const receitaId = Number(req.params.id);
    if (!Number.isInteger(receitaId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const result = await query(`${RECIPE_FIELDS} WHERE r.id_receita = $1`, [receitaId]);
    const receita = result.rows[0];
    if (!receita) return res.status(404).json({ error: 'Receita não encontrada' });

    res.json(formatAggregatedRecipe(receita));
  },

  // POST /api/receitas   (auth)
  create: criarReceita,

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
      descricao,
      tempo_preparo_min,
      numero_porcoes,
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
      const descricaoAtualizada = typeof descricao === 'string' ? descricao : card_descricao;
      if (typeof descricaoAtualizada === 'string') {
        campos.push(`descricao = $${i++}`);
        valores.push(descricaoAtualizada.trim());
      }
      if (tempo_preparo_min !== undefined && Number.isInteger(Number(tempo_preparo_min)) && Number(tempo_preparo_min) > 0) {
        campos.push(`tempo_preparo_min = $${i++}`);
        valores.push(Number(tempo_preparo_min));
      }
      if (numero_porcoes !== undefined && Number.isInteger(Number(numero_porcoes)) && Number(numero_porcoes) > 0) {
        campos.push(`numero_porcoes = $${i++}`);
        valores.push(Number(numero_porcoes));
      }
      if (typeof imagem === 'string') {
        if (imagem.trim() && !isAllowedImageUrl(imagem.trim())) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'URL de imagem inválida' });
        }
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

      if (categoria_id !== undefined) {
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
      `${RECIPE_FIELDS}
       JOIN receitas_categorias rc ON rc.id_receita = r.id_receita
       WHERE rc.id_categoria = $1
       ORDER BY r.criado_em DESC`,
      [catId]
    );
    const receitas = result.rows.map(formatAggregatedRecipe);
    res.json(receitas);
  }
};

const formatAggregatedRecipe = (row) => {
  const ingredientesBase = [];
  const ingredientesMolho = [];
  for (const item of row.ingredientes || []) {
    const tipos = String(item.observacao || '').split(',');
    if (tipos.includes('molho')) ingredientesMolho.push(item.nome);
    if (tipos.includes('base') || !tipos.includes('molho')) ingredientesBase.push(item.nome);
  }
  return {
    id: row.id_receita,
    titulo: row.titulo,
    categoria_id: row.categorias || [],
    card_descricao: row.descricao || '',
    ingredientes_base: ingredientesBase,
    ingredientes_molho: ingredientesMolho,
    instrucoes: String(row.passos || '').split('\n').map(s => s.trim()).filter(Boolean),
    imagem: row.imagem_url || '',
    tempo_preparo_min: row.tempo_preparo_min || '',
    numero_porcoes: row.numero_porcoes || '',
    autorId: row.id_usuario_autor,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em
  };
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
    const tipos = String(item.observacao || '').split(',');
    if (tipos.includes('molho')) ingredientesMolho.push(item.nome);
    if (tipos.includes('base') || !tipos.includes('molho')) ingredientesBase.push(item.nome);
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
      DO UPDATE SET observacao = CASE
        WHEN receitas_ingredientes.observacao = EXCLUDED.observacao
          THEN receitas_ingredientes.observacao
        ELSE CONCAT(receitas_ingredientes.observacao, ',', EXCLUDED.observacao)
      END`,
      [receitaId, idIngrediente, tipo]
    );
  }
};
