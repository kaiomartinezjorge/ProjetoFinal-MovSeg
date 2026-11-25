import 'package:flutter/material.dart';
import '../models/movseg_models.dart';
import '../services/api_client.dart';
import '../theme/deepsea_theme.dart';

class MarcosTimelineScreen extends StatelessWidget {
  final TimelineUnidade timeline;
  final VoidCallback onRegistrarEntrega;
  final VoidCallback onAuditarHash;

  const MarcosTimelineScreen({
    super.key,
    required this.timeline,
    required this.onRegistrarEntrega,
    required this.onAuditarHash,
  });

  @override
  Widget build(BuildContext context) {
    final u = timeline.unidade;
    final marcos = timeline.marcos;
    final etapasDone = marcos.map((m) => m.etapa).toSet().length;
    final pct = (etapasDone / 6.0).clamp(0.0, 1.0);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Card Mestre do Móvel
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'CÓD: ${u.produto.sku}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: DeepSeaColors.secondary,
                            ),
                          ),
                          Text(
                            u.produto.nome,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: DeepSeaColors.primary,
                            ),
                          ),
                          Text(
                            '${u.produto.linhaProducao} • Lote ${u.loteFabricacao}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: DeepSeaColors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: DeepSeaColors.surfaceLow,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        u.codigoQr,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: DeepSeaColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: DeepSeaColors.primaryContainer,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Row(
                    children: [
                      Icon(
                        Icons.lock_rounded,
                        size: 16,
                        color: DeepSeaColors.secondaryContainer,
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'REGISTRO IMUTÁVEL (WORM) • DADOS BLOQUEADOS PARA EDIÇÃO',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: DeepSeaColors.secondaryContainer,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Status da Cadeia de Custódia',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      '$etapasDone de 6 (${(pct * 100).round()}%)',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: DeepSeaColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: pct,
                    minHeight: 10,
                    backgroundColor: DeepSeaColors.surfaceHigh,
                    valueColor: const AlwaysStoppedAnimation(
                      DeepSeaColors.secondary,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Destino: ${u.destinoCidade ?? "Não informado"} • Status: ${u.statusAtual}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: DeepSeaColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: onAuditarHash,
                        icon: const Icon(Icons.verified_user_outlined, size: 18),
                        label: const Text('Auditar Hash'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size.fromHeight(44),
                        ),
                        onPressed: onRegistrarEntrega,
                        icon: const Icon(Icons.camera_alt_rounded, size: 18),
                        label: const Text('Registrar Foto/Vídeo'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Timeline Criptográfica (SHA-256)',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: DeepSeaColors.primary,
          ),
        ),
        const SizedBox(height: 8),
        ...marcos.map((m) => _MarcoCard(marco: m)),
      ],
    );
  }
}

class _MarcoCard extends StatelessWidget {
  final MarcoRastreabilidade marco;
  const _MarcoCard({required this.marco});

  @override
  Widget build(BuildContext context) {
    final reprovado = marco.resultado == 'REPROVADO';
    final corBarra = reprovado ? DeepSeaColors.alert : DeepSeaColors.success;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: DeepSeaColors.surfaceLow,
        borderRadius: BorderRadius.circular(12),
        border: Border(
          left: BorderSide(color: corBarra, width: 5),
        ),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'MARCO 0${marco.ordemEtapa} • ${marco.etapa}',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: DeepSeaColors.secondary,
                      ),
                    ),
                    Text(
                      marco.localDescricao ?? marco.etapa,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: DeepSeaColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: corBarra.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  marco.resultado,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: corBarra,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '${marco.responsavelMatricula} (${marco.responsavelNome}) • ${marco.registradoEm}',
            style: const TextStyle(
              fontSize: 11,
              color: DeepSeaColors.onSurfaceVariant,
            ),
          ),
          if (marco.observacoes != null && marco.observacoes!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(marco.observacoes!, style: const TextStyle(fontSize: 13)),
          ],
          if (marco.evidencias.isNotEmpty) ...[
            const SizedBox(height: 8),
            SizedBox(
              height: 84,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: marco.evidencias.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, idx) {
                  final ev = marco.evidencias[idx];
                  return Container(
                    width: 130,
                    decoration: BoxDecoration(
                      color: DeepSeaColors.primaryContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        if (ev.isVideo)
                          const Center(
                            child: Icon(
                              Icons.videocam_rounded,
                              color: Colors.white,
                              size: 32,
                            ),
                          )
                        else
                          Image.network(
                            '${MovSegApiClient.baseUrl}${ev.urlConteudo}',
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Center(
                              child: Icon(Icons.image, color: Colors.white),
                            ),
                          ),
                        Positioned(
                          left: 4,
                          right: 4,
                          bottom: 4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 2,
                            ),
                            color: Colors.black54,
                            child: Text(
                              ev.legenda ?? ev.tipoEvidencia,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              'HASH: ${marco.hashBloco.substring(0, 16)}... ← ${marco.hashIntegridadeAnterior.substring(0, 10)}...',
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 10,
                color: DeepSeaColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
