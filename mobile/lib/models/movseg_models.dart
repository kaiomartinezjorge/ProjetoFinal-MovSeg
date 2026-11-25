class Usuario {
  final String id;
  final String matriculaOuClientId;
  final String nome;
  final String email;
  final String perfil;
  final String? terminalOuVeiculo;

  Usuario({
    required this.id,
    required this.matriculaOuClientId,
    required this.nome,
    required this.email,
    required this.perfil,
    this.terminalOuVeiculo,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) => Usuario(
        id: json['id'] as String,
        matriculaOuClientId: json['matriculaOuClientId'] as String,
        nome: json['nome'] as String,
        email: json['email'] as String,
        perfil: json['perfil'] as String,
        terminalOuVeiculo: json['terminalOuVeiculo'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'matriculaOuClientId': matriculaOuClientId,
        'nome': nome,
        'email': email,
        'perfil': perfil,
        'terminalOuVeiculo': terminalOuVeiculo,
      };
}

class ChecklistModeloItem {
  final String codigo;
  final String categoria;
  final String item;
  final String criterio;

  ChecklistModeloItem({
    required this.codigo,
    required this.categoria,
    required this.item,
    required this.criterio,
  });

  factory ChecklistModeloItem.fromJson(Map<String, dynamic> json) =>
      ChecklistModeloItem(
        codigo: (json['codigo'] ?? '') as String,
        categoria: (json['categoria'] ?? '') as String,
        item: (json['item'] ?? '') as String,
        criterio: (json['criterio'] ?? '') as String,
      );
}

class Produto {
  final String id;
  final String sku;
  final String nome;
  final String linhaProducao;
  final List<ChecklistModeloItem> checklistPadrao;

  Produto({
    required this.id,
    required this.sku,
    required this.nome,
    required this.linhaProducao,
    required this.checklistPadrao,
  });

  factory Produto.fromJson(Map<String, dynamic> json) => Produto(
        id: json['id'] as String,
        sku: json['sku'] as String,
        nome: json['nome'] as String,
        linhaProducao: json['linhaProducao'] as String,
        checklistPadrao: ((json['checklistPadrao'] as List?) ?? [])
            .map((e) => ChecklistModeloItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class UnidadeResumo {
  final String id;
  final String numeroSerie;
  final String loteFabricacao;
  final String ordemProducao;
  final String codigoQr;
  final String chainId;
  final String? transportadora;
  final String? destinoCidade;
  final String statusAtual;
  final int totalMarcos;
  final int totalEvidencias;
  final bool cadeiaIntegra;
  final Produto produto;

  UnidadeResumo({
    required this.id,
    required this.numeroSerie,
    required this.loteFabricacao,
    required this.ordemProducao,
    required this.codigoQr,
    required this.chainId,
    this.transportadora,
    this.destinoCidade,
    required this.statusAtual,
    required this.totalMarcos,
    required this.totalEvidencias,
    required this.cadeiaIntegra,
    required this.produto,
  });

  factory UnidadeResumo.fromJson(Map<String, dynamic> json) => UnidadeResumo(
        id: json['id'] as String,
        numeroSerie: json['numeroSerie'] as String,
        loteFabricacao: json['loteFabricacao'] as String,
        ordemProducao: json['ordemProducao'] as String,
        codigoQr: json['codigoQr'] as String,
        chainId: json['chainId'] as String,
        transportadora: json['transportadora'] as String?,
        destinoCidade: json['destinoCidade'] as String?,
        statusAtual: json['statusAtual'] as String,
        totalMarcos: (json['totalMarcos'] as num).toInt(),
        totalEvidencias: (json['totalEvidencias'] as num).toInt(),
        cadeiaIntegra: json['cadeiaIntegra'] as bool,
        produto: Produto.fromJson(json['produto'] as Map<String, dynamic>),
      );
}

class EvidenciaMidia {
  final String id;
  final String hashSha256;
  final String tipoEvidencia;
  final String mimeType;
  final int tamanhoBytes;
  final String? legenda;
  final String urlConteudo;

  EvidenciaMidia({
    required this.id,
    required this.hashSha256,
    required this.tipoEvidencia,
    required this.mimeType,
    required this.tamanhoBytes,
    this.legenda,
    required this.urlConteudo,
  });

  bool get isVideo => mimeType.startsWith('video/');

  factory EvidenciaMidia.fromJson(Map<String, dynamic> json) => EvidenciaMidia(
        id: json['id'] as String,
        hashSha256: json['hashSha256'] as String,
        tipoEvidencia: json['tipoEvidencia'] as String,
        mimeType: json['mimeType'] as String,
        tamanhoBytes: (json['tamanhoBytes'] as num).toInt(),
        legenda: json['legenda'] as String?,
        urlConteudo: json['urlConteudo'] as String,
      );
}

class MarcoRastreabilidade {
  final String id;
  final String etapa;
  final int ordemEtapa;
  final String resultado;
  final String? localDescricao;
  final String? observacoes;
  final double? latitude;
  final double? longitude;
  final String hashBloco;
  final String hashIntegridadeAnterior;
  final String responsavelNome;
  final String responsavelMatricula;
  final String registradoEm;
  final List<EvidenciaMidia> evidencias;

  MarcoRastreabilidade({
    required this.id,
    required this.etapa,
    required this.ordemEtapa,
    required this.resultado,
    this.localDescricao,
    this.observacoes,
    this.latitude,
    this.longitude,
    required this.hashBloco,
    required this.hashIntegridadeAnterior,
    required this.responsavelNome,
    required this.responsavelMatricula,
    required this.registradoEm,
    required this.evidencias,
  });

  factory MarcoRastreabilidade.fromJson(Map<String, dynamic> json) =>
      MarcoRastreabilidade(
        id: json['id'] as String,
        etapa: json['etapa'] as String,
        ordemEtapa: (json['ordemEtapa'] as num).toInt(),
        resultado: json['resultado'] as String,
        localDescricao: json['localDescricao'] as String?,
        observacoes: json['observacoes'] as String?,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        hashBloco: json['hashBloco'] as String,
        hashIntegridadeAnterior: json['hashIntegridadeAnterior'] as String,
        responsavelNome: json['responsavelNome'] as String,
        responsavelMatricula: json['responsavelMatricula'] as String,
        registradoEm: json['registradoEm'] as String,
        evidencias: ((json['evidencias'] as List?) ?? [])
            .map((e) => EvidenciaMidia.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class BlocoAuditoria {
  final int sequencia;
  final String etapa;
  final String hashArmazenado;
  final String hashAnterior;
  final bool encadeamentoValido;
  final String responsavel;
  final String registradoEm;

  BlocoAuditoria({
    required this.sequencia,
    required this.etapa,
    required this.hashArmazenado,
    required this.hashAnterior,
    required this.encadeamentoValido,
    required this.responsavel,
    required this.registradoEm,
  });

  factory BlocoAuditoria.fromJson(Map<String, dynamic> json) => BlocoAuditoria(
        sequencia: (json['sequencia'] as num).toInt(),
        etapa: json['etapa'] as String,
        hashArmazenado: json['hashArmazenado'] as String,
        hashAnterior: json['hashAnterior'] as String,
        encadeamentoValido: json['encadeamentoValido'] as bool,
        responsavel: json['responsavel'] as String,
        registradoEm: json['registradoEm'] as String,
      );
}

class AuditoriaLedger {
  final String unidadeId;
  final String codigoQr;
  final String chainId;
  final String merkleRoot;
  final bool cadeiaIntegra;
  final int totalMarcos;
  final int totalEvidencias;
  final List<BlocoAuditoria> blocos;

  AuditoriaLedger({
    required this.unidadeId,
    required this.codigoQr,
    required this.chainId,
    required this.merkleRoot,
    required this.cadeiaIntegra,
    required this.totalMarcos,
    required this.totalEvidencias,
    required this.blocos,
  });

  factory AuditoriaLedger.fromJson(Map<String, dynamic> json) =>
      AuditoriaLedger(
        unidadeId: json['unidadeId'] as String,
        codigoQr: json['codigoQr'] as String,
        chainId: json['chainId'] as String,
        merkleRoot: json['merkleRoot'] as String,
        cadeiaIntegra: json['cadeiaIntegra'] as bool,
        totalMarcos: (json['totalMarcos'] as num).toInt(),
        totalEvidencias: (json['totalEvidencias'] as num).toInt(),
        blocos: ((json['blocos'] as List?) ?? [])
            .map((e) => BlocoAuditoria.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class TimelineUnidade {
  final UnidadeResumo unidade;
  final AuditoriaLedger auditoria;
  final List<MarcoRastreabilidade> marcos;

  TimelineUnidade({
    required this.unidade,
    required this.auditoria,
    required this.marcos,
  });

  factory TimelineUnidade.fromJson(Map<String, dynamic> json) =>
      TimelineUnidade(
        unidade: UnidadeResumo.fromJson(json['unidade'] as Map<String, dynamic>),
        auditoria:
            AuditoriaLedger.fromJson(json['auditoria'] as Map<String, dynamic>),
        marcos: ((json['marcos'] as List?) ?? [])
            .map((e) => MarcoRastreabilidade.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
