import 'package:flutter/material.dart';

import '../models/etapas.dart';
import '../models/movseg_models.dart';
import '../services/api_client.dart';
import '../theme/deepsea_theme.dart';

class MarcosTimelineScreen extends StatelessWidget {
  const MarcosTimelineScreen({
    super.key,
    required this.timeline,
    required this.api,
    required this.onRegistrarEntrega,
    required this.onAuditarHash,
  });

  final TimelineUnidade timeline;
  final MovSegApiClient api;
  final VoidCallback onRegistrarEntrega;
  final VoidCallback onAuditarHash;

  @override
  Widget build(BuildContext context) {
    final marcos = timeline.marcos;
    final ultima = proximaEtapa(timeline);
    final perfil = api.usuario?.perfil;
    final concluidaAntes = timeline.unidade.statusAtual == 'ENTREGUE' &&
        !marcos.any((marco) => marco.etapa == 'POS_ENTREGA');
    final total = concluidaAntes
        ? EtapaColeta.values.length - 1
        : EtapaColeta.values.length;
    final quantidade = marcos.map((marco) => marco.etapa).toSet().length;
    final etapaPermitida = ultima != null && ultima.permite(perfil);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Histórico da unidade',
                    style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 6),
                Text('$quantidade de $total etapas registradas'),
                const SizedBox(height: 12),
                LinearProgressIndicator(
                  value: (quantidade / total).clamp(0.0, 1.0),
                  semanticsLabel: 'Etapas registradas',
                ),
                if (ultima != null && !concluidaAntes) ...[
                  const SizedBox(height: 12),
                  Text('Próxima etapa · ${ultima.titulo}'),
                ],
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    if (etapaPermitida)
                      FilledButton.icon(
                        onPressed: onRegistrarEntrega,
                        icon: const Icon(Icons.add_a_photo_outlined),
                        label: const Text('Registrar etapa'),
                      ),
                    OutlinedButton.icon(
                      onPressed: onAuditarHash,
                      icon: const Icon(Icons.verified_user_outlined),
                      label: const Text('Consultar auditoria'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        if (marcos.isEmpty)
          const Padding(
            padding: EdgeInsets.all(12),
            child: Text('Esta unidade ainda não tem registros.'),
          ),
        for (final marco in marcos.reversed)
          _Registro(marco: marco, headers: api.headersEvidencia),
      ],
    );
  }
}

class _Registro extends StatelessWidget {
  const _Registro({required this.marco, required this.headers});

  final MarcoRastreabilidade marco;
  final Map<String, String> headers;

  @override
  Widget build(BuildContext context) {
    final avisado = marco.resultado != 'APROVADO';
    final descricao = switch (marco.resultado) {
      'APROVADO' => 'Aprovado',
      'APROVADO_COM_RESSALVA' => 'Com ressalva',
      'REPROVADO' => 'Reprovado',
      _ => marco.resultado,
    };
    final tema = Theme.of(context);
    final data = DateTime.tryParse(marco.registradoEm)?.toLocal();
    final horario = data == null
        ? marco.registradoEm
        : MaterialLocalizations.of(context).formatShortDate(data);
    final hora = data == null
        ? ''
        : MaterialLocalizations.of(context)
            .formatTimeOfDay(TimeOfDay.fromDateTime(data));

    return Card(
      margin: const EdgeInsets.only(top: 8),
      child: ExpansionTile(
        leading: Icon(
          avisado ? Icons.report_problem_outlined : Icons.check_circle_outline,
          color: avisado ? DeepSeaColors.error : DeepSeaColors.success,
        ),
        title:
            Text(rotuloEtapa(marco.etapa), style: tema.textTheme.titleMedium),
        subtitle: Text(hora.isEmpty
            ? '$descricao · $horario'
            : '$descricao · $horario às $hora'),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Registrado por ${marco.responsavelNome}'),
          if (marco.localDescricao?.isNotEmpty ?? false)
            Text(marco.localDescricao!),
          if (marco.observacoes?.isNotEmpty ?? false)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(marco.observacoes!),
            ),
          for (final evidencia in marco.evidencias)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: _Evidencia(evidencia: evidencia, headers: headers),
            ),
        ],
      ),
    );
  }
}

class _Evidencia extends StatelessWidget {
  const _Evidencia({required this.evidencia, required this.headers});

  final EvidenciaMidia evidencia;
  final Map<String, String> headers;

  @override
  Widget build(BuildContext context) {
    final foto = evidencia.mimeType.startsWith('image/');
    final legenda = evidencia.legenda ??
        (foto
            ? 'Evidência fotográfica'
            : evidencia.isVideo
                ? 'Vídeo'
                : 'Documento');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (foto)
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.network(
              '${MovSegApiClient.baseUrl}${evidencia.urlConteudo}',
              headers: headers,
              width: double.infinity,
              height: 165,
              fit: BoxFit.cover,
              semanticLabel: legenda,
              errorBuilder: (_, __, ___) => const SizedBox(
                height: 56,
                child: Center(child: Text('Prévia indisponível')),
              ),
            ),
          ),
        const SizedBox(height: 4),
        Text(legenda),
      ],
    );
  }
}
