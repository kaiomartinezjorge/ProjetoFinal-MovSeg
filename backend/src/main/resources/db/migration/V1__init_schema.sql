-- MovSeg - Schema Inicial e Triggers de Imutabilidade (PostgreSQL)

CREATE TABLE produto (
    id UUID PRIMARY KEY,
    sku VARCHAR(60) NOT NULL UNIQUE,
    nome VARCHAR(160) NOT NULL,
    linha_producao VARCHAR(100) NOT NULL,
    especificacoes_tecnicas JSONB NOT NULL DEFAULT '{}'::jsonb,
    checklist_padrao JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuario (
    id UUID PRIMARY KEY,
    matricula_ou_client_id VARCHAR(60) NOT NULL UNIQUE,
    nome VARCHAR(160) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(40) NOT NULL,
    terminal_ou_veiculo VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE unidade_movel (
    id UUID PRIMARY KEY,
    produto_id UUID NOT NULL REFERENCES produto(id),
    numero_serie VARCHAR(80) NOT NULL UNIQUE,
    lote_fabricacao VARCHAR(60) NOT NULL,
    ordem_producao VARCHAR(60) NOT NULL,
    codigo_qr VARCHAR(80) NOT NULL UNIQUE,
    chain_id VARCHAR(40) NOT NULL,
    transportadora VARCHAR(120),
    destino_cidade VARCHAR(120),
    cliente_destinatario VARCHAR(160),
    status_atual VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE marco_rastreabilidade (
    id UUID PRIMARY KEY,
    unidade_movel_id UUID NOT NULL REFERENCES unidade_movel(id),
    responsavel_id UUID NOT NULL REFERENCES usuario(id),
    etapa VARCHAR(40) NOT NULL,
    resultado VARCHAR(40) NOT NULL,
    local_descricao VARCHAR(200),
    observacoes TEXT,
    checklist_metadados JSONB NOT NULL DEFAULT '{}'::jsonb,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    hash_bloco VARCHAR(64) NOT NULL,
    hash_integridade_anterior VARCHAR(64) NOT NULL,
    registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evidencia_midia (
    id UUID PRIMARY KEY,
    marco_id UUID NOT NULL REFERENCES marco_rastreabilidade(id),
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    hash_sha256 VARCHAR(64) NOT NULL,
    tipo_evidencia VARCHAR(40) NOT NULL,
    mime_type VARCHAR(80) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    legenda VARCHAR(180),
    duracao_segundos INTEGER,
    uploaded_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ocorrencia_avaria (
    id UUID PRIMARY KEY,
    unidade_movel_id UUID NOT NULL REFERENCES unidade_movel(id),
    marco_deteccao_id UUID NOT NULL REFERENCES marco_rastreabilidade(id),
    etapa_responsavel_apurada VARCHAR(40) NOT NULL,
    tipo_avaria VARCHAR(80) NOT NULL,
    descricao_avaria TEXT NOT NULL,
    parecer_tecnico TEXT,
    status_chamado VARCHAR(40) NOT NULL,
    analisado_por_id UUID REFERENCES usuario(id),
    aberto_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    encerrado_em TIMESTAMPTZ
);

CREATE INDEX idx_unidade_lote ON unidade_movel(lote_fabricacao);
CREATE INDEX idx_unidade_status ON unidade_movel(status_atual);
CREATE INDEX idx_marco_unidade_data ON marco_rastreabilidade(unidade_movel_id, registrado_em);
CREATE INDEX idx_evidencia_marco ON evidencia_midia(marco_id);
CREATE INDEX idx_ocorrencia_status ON ocorrencia_avaria(status_chamado);

-- Diretriz de Imutabilidade (WORM / Append-Only) para MARCO_RASTREABILIDADE e EVIDENCIA_MIDIA
CREATE OR REPLACE FUNCTION fn_bloquear_mutacao_ledger()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Registro imutavel (WORM): operacoes de UPDATE e DELETE sao proibidas na tabela %', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_marco_imutavel
BEFORE UPDATE OR DELETE ON marco_rastreabilidade
FOR EACH ROW
EXECUTE FUNCTION fn_bloquear_mutacao_ledger();

CREATE TRIGGER trg_evidencia_imutavel
BEFORE UPDATE OR DELETE ON evidencia_midia
FOR EACH ROW
EXECUTE FUNCTION fn_bloquear_mutacao_ledger();
