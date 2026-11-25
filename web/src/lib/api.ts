import type {
  AuditoriaLedger,
  ChecklistItem,
  EtapaRastreabilidade,
  IndicadoresDashboard,
  OcorrenciaAvaria,
  OrigemAvaria,
  Produto,
  PublicoRastreio,
  ResultadoMarco,
  StatusOcorrencia,
  TimelineUnidade,
  UnidadeResumo,
  Usuario,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const TOKEN_KEY = "movseg_admin_token";
const USER_KEY = "movseg_admin_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getSavedUser(): Usuario | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

export function saveSession(token: string, usuario: Usuario) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function mediaUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!(init?.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = `Erro HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err?.erro) msg = err.erro;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export const api = {
  login: (login: string, senha: string) =>
    request<{ token: string; tipo: string; usuario: Usuario }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ login, senha }),
      }
    ),

  me: () => request<Usuario>("/api/v1/auth/me"),

  indicadores: () =>
    request<IndicadoresDashboard>("/api/v1/dashboard/indicadores"),

  listarUnidades: (busca?: string) =>
    request<UnidadeResumo[]>(
      `/api/v1/unidades${busca ? `?busca=${encodeURIComponent(busca)}` : ""}`
    ),

  buscarTimelinePorCodigo: (codigo: string) =>
    request<TimelineUnidade>(
      `/api/v1/unidades/codigo/${encodeURIComponent(codigo)}`
    ),

  buscarTimeline: (id: string) =>
    request<TimelineUnidade>(`/api/v1/unidades/${id}/timeline`),

  criarUnidade: (payload: {
    produtoId: string;
    numeroSerie: string;
    loteFabricacao: string;
    ordemProducao: string;
    codigoQr?: string;
    transportadora?: string;
    destinoCidade?: string;
    clienteDestinatario?: string;
  }) =>
    request<UnidadeResumo>("/api/v1/unidades", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  revalidarLedger: (unidadeId: string) =>
    request<AuditoriaLedger>(`/api/v1/unidades/${unidadeId}/revalidar-ledger`, {
      method: "POST",
    }),

  registrarMarcoFabril: (
    unidadeId: string,
    payload: {
      etapa: EtapaRastreabilidade;
      resultado: ResultadoMarco;
      localDescricao: string;
      observacoes: string;
      checklistMetadados: Record<string, unknown>;
      houveAvaria: boolean;
      tipoAvaria?: string;
      descricaoAvaria?: string;
    }
  ) =>
    request(`/api/v1/unidades/${unidadeId}/marcos`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listarProdutos: () => request<Produto[]>("/api/v1/produtos"),

  criarProduto: (payload: {
    sku: string;
    nome: string;
    linhaProducao: string;
    especificacoesTecnicas: Record<string, unknown>;
    checklistPadrao: ChecklistItem[];
  }) =>
    request<Produto>("/api/v1/produtos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  atualizarChecklistProduto: (
    produtoId: string,
    checklistPadrao: ChecklistItem[]
  ) =>
    request<Produto>(`/api/v1/produtos/${produtoId}/checklist`, {
      method: "PUT",
      body: JSON.stringify({ checklistPadrao }),
    }),

  listarOcorrencias: (status?: StatusOcorrencia) =>
    request<OcorrenciaAvaria[]>(
      `/api/v1/ocorrencias${status ? `?status=${status}` : ""}`
    ),

  analisarOcorrencia: (
    id: string,
    payload: {
      statusChamado: StatusOcorrencia;
      etapaResponsavelApurada: OrigemAvaria;
      parecerTecnico: string;
    }
  ) =>
    request<OcorrenciaAvaria>(`/api/v1/ocorrencias/${id}/analise`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  rastreioPublico: (codigoQr: string) =>
    request<PublicoRastreio>(
      `/api/v1/publico/rastreio/${encodeURIComponent(codigoQr)}`
    ),
};
