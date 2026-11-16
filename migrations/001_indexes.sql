CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_lower_idx ON usuarios (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_nome_usuario_lower_idx ON usuarios (LOWER(nome_usuario));
CREATE UNIQUE INDEX IF NOT EXISTS ingredientes_nome_idx ON ingredientes (nome);
CREATE UNIQUE INDEX IF NOT EXISTS receitas_favoritas_usuario_receita_idx ON receitas_favoritas (id_usuario, id_receita);
CREATE INDEX IF NOT EXISTS receitas_autor_idx ON receitas (id_usuario_autor);
CREATE INDEX IF NOT EXISTS receitas_criado_em_idx ON receitas (criado_em DESC);
CREATE INDEX IF NOT EXISTS receitas_categorias_categoria_idx ON receitas_categorias (id_categoria, id_receita);
CREATE INDEX IF NOT EXISTS receitas_ingredientes_receita_idx ON receitas_ingredientes (id_receita);
CREATE INDEX IF NOT EXISTS receitas_favoritas_usuario_data_idx ON receitas_favoritas (id_usuario, data_favorito DESC);
