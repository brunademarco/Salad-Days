CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nome_completo VARCHAR(120) NOT NULL,
  nome_usuario VARCHAR(60) NOT NULL,
  email VARCHAR(255) NOT NULL,
  senha TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
  id_categoria SERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS receitas (
  id_receita SERIAL PRIMARY KEY,
  id_usuario_autor INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  titulo VARCHAR(160) NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  tempo_preparo_min INTEGER CHECK (tempo_preparo_min > 0),
  numero_porcoes INTEGER CHECK (numero_porcoes > 0),
  imagem_url TEXT NOT NULL DEFAULT '',
  ingredientes_base_text TEXT NOT NULL DEFAULT '',
  ingredientes_molho_text TEXT NOT NULL DEFAULT '',
  modo_preparo_text TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receitas_categorias (
  id_receita INTEGER NOT NULL REFERENCES receitas(id_receita) ON DELETE CASCADE,
  id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria) ON DELETE RESTRICT,
  PRIMARY KEY (id_receita, id_categoria)
);

CREATE TABLE IF NOT EXISTS ingredientes (
  id_ingrediente SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS receitas_ingredientes (
  id_receita INTEGER NOT NULL REFERENCES receitas(id_receita) ON DELETE CASCADE,
  id_ingrediente INTEGER NOT NULL REFERENCES ingredientes(id_ingrediente) ON DELETE RESTRICT,
  quantidade NUMERIC,
  unidade_medida VARCHAR(40),
  observacao TEXT,
  PRIMARY KEY (id_receita, id_ingrediente)
);

CREATE TABLE IF NOT EXISTS modos_preparo (
  id_receita INTEGER PRIMARY KEY REFERENCES receitas(id_receita) ON DELETE CASCADE,
  passos TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS receitas_favoritas (
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_receita INTEGER NOT NULL REFERENCES receitas(id_receita) ON DELETE CASCADE,
  data_favorito TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_usuario, id_receita)
);

INSERT INTO categorias (id_categoria, nome) VALUES
  (1, 'Vegetariana'), (2, 'Vegana'), (3, 'Sem Glúten'),
  (4, 'Clássicas'), (5, 'Proteícas'), (6, 'Refrescantes')
ON CONFLICT (id_categoria) DO NOTHING;

SELECT setval(pg_get_serial_sequence('categorias', 'id_categoria'),
              COALESCE((SELECT MAX(id_categoria) FROM categorias), 1));
