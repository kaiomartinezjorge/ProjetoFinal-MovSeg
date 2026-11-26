import type { EtapaRastreabilidade, ResultadoMarco, StatusUnidade } from "./types";

export const ETAPAS = {
  FABRICACAO: "Fabricação",
  INSPECAO: "Inspeção",
  EMBALAGEM: "Embalagem",
  EXPEDICAO: "Saída da fábrica",
  TRANSPORTE: "Antes da entrega",
  RECEBIMENTO: "Chegada ao cliente",
  POS_ENTREGA: "Após a entrega",
} satisfies Record<EtapaRastreabilidade, string>;

export const STATUS_UNIDADE = {
  EM_FABRICACAO: "Em fabricação",
  INSPECIONADO: "Inspecionado",
  EMBALADO: "Embalado",
  EXPEDIDO: "Expedido",
  EM_TRANSPORTE: "Em transporte",
  EM_RECEBIMENTO: "Em recebimento",
  ENTREGUE: "Entregue",
  AVARIADO: "Com avaria",
} satisfies Record<StatusUnidade, string>;

export const RESULTADOS = {
  APROVADO: "Aprovado",
  APROVADO_COM_RESSALVA: "Com ressalva",
  REPROVADO: "Reprovado",
} satisfies Record<ResultadoMarco, string>;

export const RESULTADO_CORES = {
  APROVADO: "bg-[#e9f6ef] text-[#17634e]",
  APROVADO_COM_RESSALVA: "bg-[#f9efd9] text-[#795516]",
  REPROVADO: "bg-[#fbe9e6] text-[#993d30]",
} satisfies Record<ResultadoMarco, string>;

const formatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function formatarRegistro(valor: string) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "Data indisponível" : formatter.format(data);
}
