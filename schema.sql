-- ==========================================
-- Schema Supabase - Boletim de Clientes
-- ==========================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_cliente TEXT UNIQUE NOT NULL
);

-- 2. Localidades
CREATE TABLE IF NOT EXISTS localidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_localidade TEXT NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    UNIQUE (nome_localidade, cliente_id)
);

-- 3. Pilares
CREATE TABLE IF NOT EXISTS pilares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_pilar TEXT UNIQUE NOT NULL
);

-- 4. Grupos
CREATE TABLE IF NOT EXISTS grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_grupo TEXT NOT NULL,
    pilar_id UUID REFERENCES pilares(id) ON DELETE CASCADE,
    UNIQUE (nome_grupo, pilar_id)
);

-- 5. Indicadores
CREATE TABLE IF NOT EXISTS indicadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_indicador TEXT NOT NULL,
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
    UNIQUE (nome_indicador, grupo_id)
);

-- 6. Indicadores por Competência (Fato)
CREATE TABLE IF NOT EXISTS indicadores_competencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    localidade_id UUID REFERENCES localidades(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    indicador_id UUID REFERENCES indicadores(id) ON DELETE CASCADE,
    competencia TEXT NOT NULL, -- Ex: 08/2026
    meta TEXT,
    formula_calculo TEXT,
    dados_base TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (localidade_id, cliente_id, indicador_id, competencia)
);

-- 7. Comentários (Histórico Executivo)
CREATE TABLE IF NOT EXISTS comentarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    competencia TEXT NOT NULL,
    comentario TEXT NOT NULL,
    categoria TEXT NOT NULL,
    ordem INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Rastreabilidade de Importações
CREATE TABLE IF NOT EXISTS importacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_arquivo TEXT NOT NULL,
    data_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario TEXT DEFAULT 'Anônimo',
    quantidade_registros INTEGER DEFAULT 0,
    registros_inseridos INTEGER DEFAULT 0,
    registros_atualizados INTEGER DEFAULT 0,
    registros_com_erro INTEGER DEFAULT 0,
    status_importacao TEXT
);
