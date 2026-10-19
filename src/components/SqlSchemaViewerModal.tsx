import React, { useState } from 'react';
import { Database, Copy, Check, FileCode, Layers, ShieldCheck, Cpu } from 'lucide-react';

export const SqlSchemaViewerModal: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'architecture' | 'erd'>('sql');

  const sqlCode = `-- ============================================================================
-- SCHEMA SQL: SISTEMA DE GESTÃO DE ESTOQUE PARA DISTRIBUIDORA DE BEBIDAS
-- Dialeto: PostgreSQL 14+ / Supabase / Neon / Cloud SQL
-- ============================================================================

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
    codigo_barras VARCHAR(14) NOT NULL UNIQUE, -- EAN-13 / DUN-14
    nome VARCHAR(150) NOT NULL,
    categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    unidade_medida VARCHAR(30) NOT NULL, -- 'Unidade', 'Fardo c/ 12', 'Pack c/ 6', 'Caixa c/ 24'
    preco_custo NUMERIC(12, 2) NOT NULL CHECK (preco_custo >= 0),
    preco_venda NUMERIC(12, 2) NOT NULL CHECK (preco_venda >= preco_custo),
    estoque_atual INT NOT NULL DEFAULT 0,
    estoque_minimo INT NOT NULL DEFAULT 10,
    estoque_maximo INT NOT NULL DEFAULT 500,
    
    -- Endereçamento Logístico Físico
    rua VARCHAR(20) NOT NULL,
    prateleira VARCHAR(20) NOT NULL,
    palete VARCHAR(20) NOT NULL,
    
    -- Vínculo com vasilhame retornável
    e_retornavel BOOLEAN NOT NULL DEFAULT FALSE,
    retornavel_id INT REFERENCES retornaveis(id) ON DELETE SET NULL,
    
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE LOTES E VALIDADE (Shelf-Life)
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
    codigo VARCHAR(30) NOT NULL UNIQUE, -- 'VAS-600ML', 'VAS-LITRAO', 'VAS-BAR50L'
    nome VARCHAR(100) NOT NULL,
    capacidade VARCHAR(50) NOT NULL,
    saldo_cheio INT NOT NULL DEFAULT 0 CHECK (saldo_cheio >= 0),
    saldo_vazio INT NOT NULL DEFAULT 0 CHECK (saldo_vazio >= 0),
    valor_caucao NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    limite_minimo_vazio INT NOT NULL DEFAULT 50, -- Dispara remessa p/ cervejaria
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
    
    -- Motivo específico para quebras/garrafas estouradas
    motivo_avaria VARCHAR(100),
    fornecedor_cliente VARCHAR(120),
    documento_fiscal VARCHAR(60),
    usuario_responsavel VARCHAR(80) NOT NULL,
    observacoes TEXT,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ÍNDICES DE ALTA PERFORMANCE (Bipagem Contínua e FIFO)
-- ============================================================================
CREATE INDEX idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX idx_produtos_sku ON produtos(sku);
CREATE INDEX idx_produtos_estoque_critico ON produtos(estoque_atual, estoque_minimo);
CREATE INDEX idx_lotes_data_validade ON lotes(data_validade ASC);
CREATE INDEX idx_movimentacoes_data_hora ON movimentacoes(data_hora DESC);
CREATE INDEX idx_movimentacoes_produto ON movimentacoes(produto_id, data_hora DESC);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Modelagem Relacional (Schema SQL) & Arquitetura
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Schema DDL pronto para PostgreSQL, Supabase ou Cloud SQL com chaves primárias, relacionamentos, índices e restrições.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? 'Copiado!' : 'Copiar DDL SQL'}</span>
            </button>
          </div>
        </div>

        {/* Tabs de Documentação */}
        <div className="flex items-center gap-1 pt-4 mt-4 border-t border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'sql' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Script SQL DDL (PostgreSQL)
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'architecture' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Estrutura de Pastas & Camadas
          </button>
          <button
            onClick={() => setActiveTab('erd')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'erd' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Diagrama ER & Regras de Negócio
          </button>
        </div>
      </div>

      {activeTab === 'sql' && (
        <div className="bg-slate-950 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-xl overflow-x-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs text-slate-400">
            <span className="flex items-center gap-2 font-mono">
              <FileCode className="w-4 h-4 text-amber-400" />
              schema_distribuidora_bebidas.sql
            </span>
            <span className="font-mono text-2xs">PostgreSQL 14+</span>
          </div>
          <pre className="font-mono text-xs leading-relaxed text-emerald-300">
            {sqlCode}
          </pre>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              Organização Modular do Projeto
            </h3>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto">
{`/
├── src/
│   ├── types/
│   │   └── inventory.ts         # Contratos TypeScript (Product, Lot, Movement, Returnable)
│   ├── data/
│   │   ├── schema.sql           # Modelagem de dados relacional oficial DDL
│   │   └── mockData.ts          # Carga inicial com bebidas, cervejas, vasilhames
│   ├── services/
│   │   ├── storageService.ts    # Persistência atômica, FIFO de lotes e cálculos de KPIs
│   │   └── exportService.ts     # Gerador de planilhas Excel (.xlsx) e CSV formatados
│   ├── components/
│   │   ├── Header.tsx           # Barra superior com Top Bar Contract e atalhos rápidos
│   │   ├── Dashboard.tsx        # Métricas em tempo real, SVG donut e alertas de validade
│   │   ├── ScannerModal.tsx     # Bipador contínuo por câmera e leitor óptico USB
│   │   ├── ProductList.tsx      # Tabela de estoque com busca, filtros e saldo
│   │   ├── ProductFormModal.tsx # Cadastro e edição de produtos e localização
│   │   ├── ReturnablesManager.tsx# Balanço de vasilhames cheios x vazios no pátio
│   │   ├── MovementsLog.tsx     # Log auditável com histórico completo de operações
│   │   └── SqlSchemaViewerModal.tsx # Documentação e exportação do schema SQL
│   ├── App.tsx                  # Orquestrador central e gerenciador de estado
│   └── main.tsx                 # Ponto de entrada React 19
├── package.json                 # Dependências (lucide-react, xlsx, html5-qrcode)
└── vite.config.ts               # Bundler Vite e Tailwind CSS v4`}
            </pre>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Padrões Arquiteturais Adotados
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block font-semibold mb-1">
                  1. Regra FIFO (First In, First Out) na Baixa de Lotes
                </strong>
                Ao registrar saídas ou vendas, o algoritmo consome automaticamente os lotes com data de validade mais próxima, mitigando o risco de produtos vencidos no galpão.
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block font-semibold mb-1">
                  2. Desacoplamento entre Bebida Envasada e Vasilhame Retornável
                </strong>
                Garrafas de vidro (600ml e litrão) possuem rastreio duplo: como produto acabado vendável e como ativo de caução (casco vazio no pátio aguardando remessa para a Ambev/Heineken).
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 block font-semibold mb-1">
                  3. Auditoria Imutável de Movimentações
                </strong>
                Toda alteração de saldo gera uma tupla com estoque anterior, estoque resultante, operador responsável, tipo de avaria e timestamp.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'erd' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Relacionamentos e Chaves Estrangeiras (ERD)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block font-sans mb-1">categorias</span>
              <span className="text-slate-500 block">PK: id (SERIAL)</span>
              <span className="text-emerald-700 block mt-1">1 &rarr; N com produtos</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block font-sans mb-1">produtos</span>
              <span className="text-slate-500 block">PK: id (UUID)</span>
              <span className="text-slate-500 block">FK: categoria_id</span>
              <span className="text-slate-500 block">FK: retornavel_id</span>
              <span className="text-emerald-700 block mt-1">1 &rarr; N com lotes</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block font-sans mb-1">lotes</span>
              <span className="text-slate-500 block">PK: id (UUID)</span>
              <span className="text-slate-500 block">FK: produto_id</span>
              <span className="text-slate-500 block">Index: data_validade</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block font-sans mb-1">movimentacoes</span>
              <span className="text-slate-500 block">PK: id (UUID)</span>
              <span className="text-slate-500 block">FK: produto_id</span>
              <span className="text-slate-500 block">FK: lote_id</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
