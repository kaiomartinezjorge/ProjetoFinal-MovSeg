import 'movseg_models.dart';

enum EtapaColeta {
  fabricacao('FABRICACAO', 'Fabricação'),
  inspecao('INSPECAO', 'Inspeção'),
  embalagem('EMBALAGEM', 'Embalagem'),
  expedicao('EXPEDICAO', 'Saída da fábrica'),
  transporte('TRANSPORTE', 'Antes da entrega', emCampo: true),
  recebimento('RECEBIMENTO', 'Chegada ao cliente', emCampo: true),
  posEntrega('POS_ENTREGA', 'Após a entrega', emCampo: true);

  const EtapaColeta(this.codigo, this.titulo, {this.emCampo = false});

  final String codigo;
  final String titulo;
  final bool emCampo;

  bool permite(String? perfil) => switch (perfil) {
        'INTEGRACAO_API' => true,
        'ADMIN' || 'SUPERVISOR_QUALIDADE' => !emCampo,
        'INSPETOR' => this == inspecao,
        'OPERADOR_FABRICA' =>
          this == fabricacao || this == embalagem || this == expedicao,
        'ENTREGADOR' => emCampo || this == expedicao,
        _ => false,
      };
}

EtapaColeta? proximaEtapa(TimelineUnidade timeline) {
  var ultimaOrdem = 0;
  for (final marco in timeline.marcos) {
    if (marco.ordemEtapa > ultimaOrdem) ultimaOrdem = marco.ordemEtapa;
  }
  return EtapaColeta.values.elementAtOrNull(ultimaOrdem);
}

String rotuloEtapa(String codigo) =>
    EtapaColeta.values
        .where((etapa) => etapa.codigo == codigo)
        .firstOrNull
        ?.titulo ??
    codigo;
