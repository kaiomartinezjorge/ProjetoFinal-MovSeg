export type PerfilUsuario =
  | "ADMIN"
  | "SUPERVISOR_QUALIDADE"
  | "ENTREGADOR"
  | "OPERADOR_FABRICA"
  | "INSPETOR"
  | "INTEGRACAO_API";

export type StatusUnidade =
  | "EM_FABRICACAO"
  | "INSPECIONADO"
  | "EMBALADO"
  | "EXPEDIDO"
  | "EM_TRANSPORTE"
  | "ENTREGUE"
  | "AVARIADO";

export type EtapaRastreabilidade =
  | "FABRICACAO"
  | "INSPECAO"
  | "EMBALAGEM"
  | "EXPEDICAO"
  | "TRANSPORTE"
  | "RECEBIMENTO";

export type ResultadoMarco = "APROVADO" | "APROVADO_COM_RESSALVA" | "REPROVADO";

export type StatusOcorrencia =
  | "ABERTO"
  | "EM_ANALISE"
  | "GARANTIA_APROVADA"
  | "IMPROCEDENTE";

export type OrigemAvaria =
  | "FABRICACAO"
  | "INSPECAO"
  | "EMBALAGEM"
  | "EXPEDICAO"
  | "TRANSPORTE"
  | "CLIENTE_RECEBIMENTO"
  | "INDETERMINADA";

export interface Usuario {
  id: string;
  matriculaOuClientId: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  terminalOuVeiculo: string | null;
  ativo: boolean;
}

export interface ChecklistItem {
  codigo: string;
  categoria: string;
  item: string;
  criterio: string;
}

export interface Produto {
  id: string;
  sku: string;
  nome: string;
  linhaProducao: string;
  especificacoesTecnicas: Record<string, unknown>;
  checklistPadrao: ChecklistItem[];
  createdAt: string;
}

export interface UnidadeResumo {
  id: string;
  numeroSerie: string;
  loteFabricacao: string;
  ordemProducao: string;
  codigoQr: string;
  chainId: string;
  transportadora: string | null;
  destinoCidade: string | null;
  clienteDestinatario: string | null;
  statusAtual: StatusUnidade;
  totalMarcos: number;
  totalEvidencias: number;
  cadeiaIntegra: boolean;
  produto: Produto;
  createdAt: string;
}

export interface EvidenciaMidia {
  id: string;
  storageKey: string;
  hashSha256: string;
  tipoEvidencia: string;
  mimeType: string;
  tamanhoBytes: number;
  legenda: string | null;
  duracaoSegundos: number | null;
  urlConteudo: string;
  uploadedEm: string;
}

export interface MarcoRastreabilidade {
  id: string;
  etapa: EtapaRastreabilidade;
  ordemEtapa: number;
  resultado: ResultadoMarco;
  localDescricao: string | null;
  observacoes: string | null;
  checklistMetadados: Record<string, unknown>;
  latitude: number | null;
  longitude: number | null;
  hashBloco: string;
  hashIntegridadeAnterior: string;
  responsavelNome: string;
  responsavelMatricula: string;
  responsavelPerfil: string;
  registradoEm: string;
  evidencias: EvidenciaMidia[];
}

export interface BlocoAuditoria {
  sequencia: number;
  marcoId: string;
  etapa: EtapaRastreabilidade;
  hashArmazenado: string;
  hashRecalculado: string;
  hashAnterior: string;
  encadeamentoValido: boolean;
  responsavel: string;
  registradoEm: string;
}

export interface AuditoriaLedger {
  unidadeId: string;
  codigoQr: string;
  chainId: string;
  merkleRoot: string;
  cadeiaIntegra: boolean;
  totalMarcos: number;
  totalEvidencias: number;
  verificadoEm: string;
  blocos: BlocoAuditoria[];
}

export interface OcorrenciaAvaria {
  id: string;
  unidadeMovelId: string;
  unidadeCodigoQr: string;
  unidadeLote: string;
  produtoNome: string;
  transportadora: string | null;
  marcoDeteccaoId: string;
  etapaDeteccao: EtapaRastreabilidade;
  etapaResponsavelApurada: OrigemAvaria;
  tipoAvaria: string;
  descricaoAvaria: string;
  parecerTecnico: string | null;
  statusChamado: StatusOcorrencia;
  analisadoPorNome: string | null;
  abertoEm: string;
  encerradoEm: string | null;
}

export interface TimelineUnidade {
  unidade: UnidadeResumo;
  auditoria: AuditoriaLedger;
  marcos: MarcoRastreabilidade[];
  ocorrencias: OcorrenciaAvaria[];
}

export interface IndicadoresDashboard {
  totalUnidades: number;
  unidadesIntactas: number;
  unidadesEmTransporte: number;
  unidadesEntregues: number;
  unidadesAvariadas: number;
  ocorrenciasAbertas: number;
  ocorrenciasEmAnalise: number;
  totalMarcosRegistrados: number;
  totalEvidenciasMidia: number;
  taxaIntegridadePercentual: number;
  avariasPorOrigem: { chave: string; total: number }[];
  avariasPorLinhaProduto: { chave: string; total: number }[];
  unidadesPorTransportadora: { chave: string; total: number }[];
  avariasPorTipo: { chave: string; total: number }[];
  ultimosEventosAuditoria: Array<{
    marcoId: string;
    codigoQr: string;
    etapa: string;
    resultado: string;
    responsavel: string;
    hashBloco: string;
    registradoEm: string;
  }>;
}

export interface PublicoRastreio {
  codigoQr: string;
  numeroSerie: string;
  loteFabricacao: string;
  chainId: string;
  produtoNome: string;
  produtoSku: string;
  linhaProducao: string;
  destinoCidade: string | null;
  clienteMascarado: string;
  statusAtual: string;
  cadeiaIntegra: boolean;
  merkleRoot: string;
  marcos: MarcoRastreabilidade[];
}
