-- ============================================================================
-- SCHEMA SQL: SISTEMA DE GESTÃO DE ESTOQUE PARA DISTRIBUIDORA DE BEBIDAS
-- Dialeto: PostgreSQL 14+ / Supabase / Neon
-- ============================================================================

-- Extensões necessárias para UUID e busca otimizada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(60) NOT NULL UNIQUE,
    descricao VARCHAR(255),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(40) NOT NULL UNIQUE,
    codigo_barras VARCHAR(14) NOT NULL UNIQUE, -- Suporta EAN-13 e DUN-14
    nome VARCHAR(150) NOT NULL,
    categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    unidade_medida VARCHAR(30) NOT NULL, -- 'Unidade', 'Fardo c/ 12', 'Pack c/ 6', 'Caixa c/ 24'
    preco_custo NUMERIC(12, 2) NOT NULL CHECK (preco_custo >= 0),
    preco_venda NUMERIC(12, 2) NOT NULL CHECK (preco_venda >= preco_custo),
    estoque_atual INT NOT NULL DEFAULT 0,
    estoque_minimo INT NOT NULL DEFAULT 10,
    estoque_maximo INT NOT NULL DEFAULT 500,
    
    -- Localização física no depósito
    rua VARCHAR(20) NOT NULL,           -- Ex: 'Rua A', 'Corredor 03'
    prateleira VARCHAR(20) NOT NULL,    -- Ex: 'Prateleira 02'
    palete VARCHAR(20) NOT NULL,        -- Ex: 'Palete P14'
    
    -- Vínculo com vasilhames retornáveis (quando aplicável)
    e_retornavel BOOLEAN NOT NULL DEFAULT FALSE,
    retornavel_id INT REFERENCES retornaveis(id) ON DELETE SET NULL,
    
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE LOTES E VALIDADE
CREATE TABLE IF NOT EXISTS lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    numero_lote VARCHAR(50) NOT NULL,
    data_fabricacao DATE,
    data_validade DATE NOT NULL,
    quantidade_inicial INT NOT NULL CHECK (quantidade_inicial > 0),
    quantidade_atual INT NOT NULL CHECK (quantidade_atual >= 0),
    preco_custo_lote NUMERIC(12, 2) NOT NULL,
    fornecedor VARCHAR(120),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_produto_lote UNIQUE (produto_id, numero_lote)
);

-- 4. TABELA DE VASILHAMES E GARRAFAS RETORNÁVEIS
CREATE TABLE IF NOT EXISTS retornaveis (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE, -- Ex: 'VAS-600ML', 'VAS-LITRAO'
    nome VARCHAR(100) NOT NULL,         -- Ex: 'Garrafa 600ml Ambev Retornável'
    capacidade VARCHAR(50) NOT NULL,    -- Ex: '600ml', '1000ml', 'Caixa 24 unidades'
    saldo_cheio INT NOT NULL DEFAULT 0 CHECK (saldo_cheio >= 0),
    saldo_vazio INT NOT NULL DEFAULT 0 CHECK (saldo_vazio >= 0),
    valor_caucao NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    limite_minimo_vazio INT NOT NULL DEFAULT 50, -- Alerta para remessa à cervejaria
    ultima_troca_cervejaria DATE,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE MOVIMENTAÇÕES DE ESTOQUE (LOG AUDITÁVEL)
CREATE TYPE tipo_movimentacao_enum AS ENUM (
    'ENTRADA',
    'SAIDA',
    'PERDA_AVARIA',
    'AJUSTE_INVENTARIO'
);

CREATE TABLE IF NOT EXISTS movimentacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    tipo tipo_movimentacao_enum NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    estoque_anterior INT NOT NULL,
    estoque_resultante INT NOT NULL,
    preco_unitario NUMERIC(12, 2) NOT NULL,
    valor_total NUMERIC(14, 2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
    
    -- Detalhamento em caso de perda ou avaria
    motivo_avaria VARCHAR(100), -- 'Quebra no manuseio', 'Garrafa estourada', 'Vazamento'
    
    -- Origem / Destino
    fornecedor_cliente VARCHAR(120),
    documento_fiscal VARCHAR(60), -- Nota Fiscal ou Pedido
    usuario_responsavel VARCHAR(80) NOT NULL,
    observacoes TEXT,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABELA DE MOVIMENTAÇÕES DE RETORNÁVEIS (LOG SEPARADO)
CREATE TABLE IF NOT EXISTS movimentacoes_retornaveis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retornavel_id INT NOT NULL REFERENCES retornaveis(id) ON DELETE RESTRICT,
    tipo VARCHAR(40) NOT NULL, -- 'RECEBIMENTO_CLIENTE', 'ENTREGA_CLIENTE', 'ENVIO_CERVEJARIA', 'RETORNO_CERVEJARIA', 'AVARIA'
    quantidade_vazio INT NOT NULL DEFAULT 0,
    quantidade_cheio INT NOT NULL DEFAULT 0,
    usuario_responsavel VARCHAR(80) NOT NULL,
    observacoes TEXT,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ÍNDICES DE ALTA PERFORMANCE (Logística e Bipagem Contínua)
-- ============================================================================

-- Busca instantânea por leitor de código de barras
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_sku ON produtos(sku);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_estoque_critico ON produtos(estoque_atual, estoque_minimo);

-- Controle de shelf-life e alerta de validade por proximidade
CREATE INDEX IF NOT EXISTS idx_lotes_data_validade ON lotes(data_validade ASC);
CREATE INDEX IF NOT EXISTS idx_lotes_produto_validade ON lotes(produto_id, data_validade ASC);

-- Histórico de auditoria e relatórios de fechamento diário
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data_hora ON movimentacoes(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto ON movimentacoes(produto_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes(tipo);

-- ============================================================================
-- VIEWS DE APOIO: RELATÓRIOS E DASHBOARD
-- ============================================================================

-- View: Estoque consolidado com alerta de status
CREATE OR REPLACE VIEW v_status_estoque AS
SELECT 
    p.id,
    p.sku,
    p.codigo_barras,
    p.nome AS produto,
    c.nome AS categoria,
    p.unidade_medida,
    p.preco_custo,
    p.preco_venda,
    p.estoque_atual,
    p.estoque_minimo,
    p.estoque_maximo,
    (p.estoque_atual * p.preco_custo) AS valor_total_custo,
    (p.estoque_atual * p.preco_venda) AS valor_total_venda,
    CASE 
        WHEN p.estoque_atual <= 0 THEN 'SEM ESTOQUE'
        WHEN p.estoque_atual <= p.estoque_minimo THEN 'CRITICO'
        WHEN p.estoque_atual >= p.estoque_maximo THEN 'EXCESSO'
        ELSE 'NORMAL'
    END AS situacao_estoque,
    p.rua || ' - ' || p.prateleira || ' - ' || p.palete AS endereco_deposito
FROM produtos p
JOIN categorias c ON p.categoria_id = c.id
WHERE p.ativo = TRUE;

-- View: Lotes com validade crítica (próximos 60 dias)
CREATE OR REPLACE VIEW v_alerta_validade AS
SELECT 
    l.id AS lote_id,
    p.nome AS produto,
    p.codigo_barras,
    l.numero_lote,
    l.data_validade,
    (l.data_validade - CURRENT_DATE) AS dias_para_vencer,
    l.quantidade_atual,
    (l.quantidade_atual * l.preco_custo_lote) AS capital_em_risco
FROM lotes l
JOIN produtos p ON l.produto_id = p.id
WHERE l.quantidade_atual > 0 
  AND l.data_validade <= (CURRENT_DATE + INTERVAL '60 days')
ORDER BY l.data_validade ASC;
