import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

import '../models/etapas.dart';
import '../models/movseg_models.dart';
import '../services/api_client.dart';

class NovoRegistroScreen extends StatefulWidget {
  final MovSegApiClient api;
  final TimelineUnidade timeline;
  final VoidCallback onRegistrado;

  const NovoRegistroScreen({
    super.key,
    required this.api,
    required this.timeline,
    required this.onRegistrado,
  });

  @override
  State<NovoRegistroScreen> createState() => _NovoRegistroScreenState();
}

class _NovoRegistroScreenState extends State<NovoRegistroScreen> {
  static const _capacidade = 100 * 1024 * 1024;
  static const _limiteArquivos = 10;

  final _picker = ImagePicker();
  final _localCtrl = TextEditingController();
  final _obsCtrl = TextEditingController();
  final _tipoAvariaCtrl = TextEditingController();
  final _evidencias = <EvidenciaLocalPayload>[];
  final _checklist = <String, bool>{};

  bool? _houveAvaria;
  Position? _posicao;
  String? _erroGps;
  String? _erro;
  bool _localizando = false;
  bool _capturando = false;
  bool _enviando = false;

  EtapaColeta? get _etapa => proximaEtapa(widget.timeline);

  bool get _ocupado => _enviando || _capturando || _localizando;

  bool _mesmoRegistro(String id, EtapaColeta? etapa) =>
      widget.timeline.unidade.id == id && _etapa == etapa;

  @override
  void dispose() {
    _localCtrl.dispose();
    _obsCtrl.dispose();
    _tipoAvariaCtrl.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant NovoRegistroScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.timeline.unidade.id != widget.timeline.unidade.id ||
        proximaEtapa(oldWidget.timeline) != _etapa) {
      _localCtrl.clear();
      _obsCtrl.clear();
      _tipoAvariaCtrl.clear();
      _evidencias.clear();
      _checklist.clear();
      _houveAvaria = null;
      _posicao = null;
      _erroGps = null;
      _erro = null;
    }
  }

  Future<void> _capturarGps() async {
    if (_ocupado) return;
    final unidadeId = widget.timeline.unidade.id;
    final etapa = _etapa;
    setState(() {
      _localizando = true;
      _erroGps = null;
    });
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw const _FalhaColeta(
            'Ative a localização no dispositivo e tente novamente.');
      }
      var permissao = await Geolocator.checkPermission();
      if (permissao == LocationPermission.denied) {
        permissao = await Geolocator.requestPermission();
      }
      if (permissao == LocationPermission.denied ||
          permissao == LocationPermission.deniedForever) {
        throw const _FalhaColeta(
            'Permita o acesso à localização nas configurações do dispositivo.');
      }
      final posicao = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
      if (mounted && _mesmoRegistro(unidadeId, etapa)) {
        setState(() => _posicao = posicao);
      }
    } on _FalhaColeta catch (erro) {
      if (mounted && _mesmoRegistro(unidadeId, etapa)) {
        setState(() => _erroGps = erro.mensagem);
      }
    } catch (_) {
      if (mounted && _mesmoRegistro(unidadeId, etapa)) {
        setState(() => _erroGps =
            'Localização indisponível. Tente novamente ou descreva o local.');
      }
    } finally {
      if (mounted) setState(() => _localizando = false);
    }
  }

  Future<void> _capturarMidia(ImageSource source, {required bool video}) async {
    if (_ocupado || _evidencias.length >= _limiteArquivos) return;
    final unidadeId = widget.timeline.unidade.id;
    final etapa = _etapa;
    setState(() {
      _capturando = true;
      _erro = null;
    });
    try {
      final arquivo = video
          ? await _picker.pickVideo(
              source: source, maxDuration: const Duration(seconds: 45))
          : await _picker.pickImage(source: source, imageQuality: 85);
      if (arquivo == null || !mounted || !_mesmoRegistro(unidadeId, etapa)) {
        return;
      }
      final totalAtual = _evidencias.fold<int>(
          0, (total, evidencia) => total + evidencia.bytes.length);
      final tamanho = await arquivo.length();
      if (tamanho == 0 || tamanho > _capacidade - totalAtual) {
        throw const _FalhaColeta(
            'Escolha arquivos válidos com até 100 MB no total.');
      }
      final mimeType = _mimeType(arquivo);
      if (mimeType == null ||
          !mimeType.startsWith(video ? 'video/' : 'image/')) {
        throw const _FalhaColeta(
            'Formato de mídia indisponível. Use uma foto JPG, PNG ou um vídeo MP4.');
      }
      final bytes = await arquivo.readAsBytes();
      if (!mounted || !_mesmoRegistro(unidadeId, etapa)) return;
      final evidencia = EvidenciaLocalPayload(
        bytes: bytes,
        filename: arquivo.name,
        mimeType: mimeType,
        tipoEvidencia: '',
        legenda: '',
        sha256: sha256.convert(bytes).toString(),
      );
      setState(() => _evidencias.add(evidencia));
    } on _FalhaColeta catch (erro) {
      if (mounted && _mesmoRegistro(unidadeId, etapa)) {
        _mostrarErro(erro.mensagem);
      }
    } catch (_) {
      if (mounted && _mesmoRegistro(unidadeId, etapa)) {
        _mostrarErro(
            'Não foi possível abrir a mídia. Verifique as permissões e tente novamente.');
      }
    } finally {
      if (mounted) setState(() => _capturando = false);
    }
  }

  String? _mimeType(XFile arquivo) {
    const formatos = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'avif': 'image/avif',
      'heic': 'image/heic',
      'heif': 'image/heif',
      'bmp': 'image/bmp',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
      'm4v': 'video/x-m4v',
      '3gp': 'video/3gpp',
      'ogv': 'video/ogg',
    };
    final mime = arquivo.mimeType?.toLowerCase().split(';').first.trim();
    if (formatos.containsValue(mime)) return mime;
    return formatos[arquivo.name.toLowerCase().split('.').last];
  }

  EvidenciaLocalPayload _classificar(
      EvidenciaLocalPayload evidencia, EtapaColeta etapa) {
    final comAvaria = _houveAvaria == true;
    final naEntrega =
        etapa == EtapaColeta.recebimento || etapa == EtapaColeta.posEntrega;
    final String tipo;
    if (evidencia.isVideo) {
      tipo = comAvaria
          ? 'VIDEO_AVARIA'
          : (naEntrega ? 'VIDEO_ENTREGA' : 'VIDEO_TRANSPORTE');
    } else {
      tipo = comAvaria
          ? 'FOTO_AVARIA'
          : switch (etapa) {
              EtapaColeta.fabricacao || EtapaColeta.inspecao => 'FOTO_PRODUTO',
              EtapaColeta.embalagem => 'FOTO_EMBALAGEM',
              EtapaColeta.expedicao || EtapaColeta.transporte => 'FOTO_CARGA',
              EtapaColeta.recebimento ||
              EtapaColeta.posEntrega =>
                'FOTO_ENTREGA',
            };
    }
    final midia = evidencia.isVideo ? 'Vídeo' : 'Foto';
    return EvidenciaLocalPayload(
      bytes: evidencia.bytes,
      filename: evidencia.filename,
      mimeType: evidencia.mimeType,
      tipoEvidencia: tipo,
      legenda:
          '$midia ${comAvaria ? 'de avaria' : 'da vistoria'} – ${etapa.titulo}',
      sha256: evidencia.sha256,
    );
  }

  void _mostrarErro(String mensagem) {
    setState(() => _erro = mensagem);
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(mensagem)));
  }

  Future<void> _enviarMarco(EtapaColeta etapa) async {
    if (_ocupado || !etapa.permite(widget.api.usuario?.perfil)) return;
    if (_evidencias.isEmpty) {
      _mostrarErro('Adicione pelo menos uma foto ou vídeo.');
      return;
    }
    final houveAvaria = _houveAvaria;
    final unidadeId = widget.timeline.unidade.id;
    if (houveAvaria == null) {
      _mostrarErro('Informe a condição do móvel antes de enviar.');
      return;
    }
    final tipoAvaria = _tipoAvariaCtrl.text.trim();
    final observacao = _obsCtrl.text.trim();
    if (houveAvaria && (tipoAvaria.isEmpty || observacao.isEmpty)) {
      _mostrarErro('Informe o tipo de avaria e descreva o que foi encontrado.');
      return;
    }

    setState(() {
      _enviando = true;
      _erro = null;
    });
    try {
      await widget.api.registrarMarcoComEvidencias(
        unidadeId: unidadeId,
        etapa: etapa.codigo,
        resultado: houveAvaria
            ? 'REPROVADO'
            : (_checklist.containsValue(false)
                ? 'APROVADO_COM_RESSALVA'
                : 'APROVADO'),
        localDescricao: _localCtrl.text.trim(),
        observacoes: observacao,
        checklistMetadados: {..._checklist, 'houve_avaria': houveAvaria},
        latitude: _posicao?.latitude,
        longitude: _posicao?.longitude,
        houveAvaria: houveAvaria,
        tipoAvaria: houveAvaria ? tipoAvaria : null,
        descricaoAvaria: houveAvaria ? observacao : null,
        evidencias: _evidencias
            .map((evidencia) => _classificar(evidencia, etapa))
            .toList(),
      );
      if (mounted && _mesmoRegistro(unidadeId, etapa)) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${etapa.titulo} registrada com sucesso.')),
        );
        widget.onRegistrado();
      }
    } catch (erro) {
      if (mounted && _mesmoRegistro(unidadeId, etapa)) {
        _mostrarErro(erro.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  Map<String, String> _itens(EtapaColeta etapa) {
    return switch (etapa) {
      EtapaColeta.fabricacao => {
          'pecas_conferidas': 'Peças e componentes conferidos',
          'acabamento_integro': 'Acabamento sem danos aparentes',
        },
      EtapaColeta.inspecao => {
          'acabamento_integro': 'Acabamento sem danos aparentes',
          for (final item in widget.timeline.unidade.produto.checklistPadrao)
            if (item.codigo.isNotEmpty && item.item.isNotEmpty)
              'produto_${item.codigo}': item.item,
        },
      EtapaColeta.embalagem => {
          'protecao_quinas': 'Proteções e cantoneiras aplicadas',
          'lacre_integro': 'Embalagem e lacre íntegros',
        },
      EtapaColeta.expedicao => {
          'volumes_conferidos': 'Volumes e etiquetas conferidos',
          'carga_fixada': 'Carga protegida e fixada',
        },
      EtapaColeta.transporte => {
          'carga_fixada': 'Carga protegida e fixada',
          'lacre_integro': 'Embalagem e lacre íntegros',
        },
      EtapaColeta.recebimento => {
          'volumes_conferidos': 'Volumes conferidos na chegada',
          'lacre_integro': 'Embalagem e lacre íntegros',
        },
      EtapaColeta.posEntrega => {
          'volumes_entregues': 'Volumes entregues no destino',
          'condicao_movel_conferida':
              'Condição do móvel conferida após a descarga',
        },
    };
  }

  String _orientacao(EtapaColeta etapa) => switch (etapa) {
        EtapaColeta.fabricacao =>
          'Fotografe as peças e o acabamento ao concluir a produção.',
        EtapaColeta.inspecao =>
          'Fotografe o móvel e os pontos verificados na inspeção.',
        EtapaColeta.embalagem =>
          'Fotografe os volumes, as proteções e o lacre.',
        EtapaColeta.expedicao =>
          'Fotografe a carga e a embalagem antes da saída da fábrica.',
        EtapaColeta.transporte =>
          'Fotografe a condição da carga durante a vistoria antes da entrega.',
        EtapaColeta.recebimento =>
          'Fotografe os volumes na chegada ao cliente, antes da descarga.',
        EtapaColeta.posEntrega =>
          'Fotografe o móvel após a descarga, incluindo eventuais avarias.',
      };

  String _responsavel(EtapaColeta etapa) => switch (etapa) {
        EtapaColeta.fabricacao ||
        EtapaColeta.embalagem =>
          'a equipe da fábrica',
        EtapaColeta.inspecao => 'a equipe de inspeção',
        EtapaColeta.expedicao => 'a equipe da fábrica ou o entregador',
        EtapaColeta.transporte ||
        EtapaColeta.recebimento ||
        EtapaColeta.posEntrega =>
          'o entregador',
      };

  @override
  Widget build(BuildContext context) {
    final etapa = _etapa;
    final tema = Theme.of(context);
    final cabecalho = _PainelRegistro(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(etapa == null ? 'Coleta concluída' : 'Próxima etapa',
              style: tema.textTheme.labelLarge),
          if (etapa != null)
            Text(etapa.titulo,
                style: tema.textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(etapa == null
              ? 'Todos os registros estão disponíveis no histórico.'
              : etapa.permite(widget.api.usuario?.perfil)
                  ? _orientacao(etapa)
                  : 'Esta etapa deve ser registrada por ${_responsavel(etapa)}.'),
        ],
      ),
    );
    if (etapa == null || !etapa.permite(widget.api.usuario?.perfil)) {
      return ListView(padding: const EdgeInsets.all(16), children: [cabecalho]);
    }

    final podeCapturar = !_ocupado && _evidencias.length < _limiteArquivos;
    final String? pendencia;
    if (_evidencias.isEmpty) {
      pendencia = 'Adicione uma foto ou um vídeo para enviar.';
    } else if (_houveAvaria == null) {
      pendencia = 'Informe a condição do móvel para enviar.';
    } else if (_houveAvaria == true &&
        (_tipoAvariaCtrl.text.trim().isEmpty || _obsCtrl.text.trim().isEmpty)) {
      pendencia = 'Preencha o tipo e a descrição da avaria.';
    } else {
      pendencia = null;
    }

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
            children: [
              cabecalho,
              const SizedBox(height: 10),
              _PainelRegistro(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Evidência', style: tema.textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        FilledButton.icon(
                          onPressed: podeCapturar
                              ? () => _capturarMidia(ImageSource.camera,
                                  video: false)
                              : null,
                          icon: const Icon(Icons.photo_camera_outlined),
                          label: Text(_evidencias.isEmpty
                              ? 'Tirar foto'
                              : 'Tirar outra foto'),
                        ),
                        PopupMenuButton<(ImageSource, bool)>(
                          enabled: podeCapturar,
                          tooltip: 'Outras opções de captura',
                          onSelected: (opcao) =>
                              _capturarMidia(opcao.$1, video: opcao.$2),
                          itemBuilder: (_) => const [
                            PopupMenuItem(
                                value: (ImageSource.gallery, false),
                                child: Text('Escolher foto')),
                            PopupMenuItem(
                                value: (ImageSource.camera, true),
                                child: Text('Gravar vídeo')),
                            PopupMenuItem(
                                value: (ImageSource.gallery, true),
                                child: Text('Escolher vídeo')),
                          ],
                          child: const Padding(
                            padding: EdgeInsets.symmetric(
                                vertical: 11, horizontal: 6),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text('Mais opções'),
                                Icon(Icons.arrow_drop_down),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (_capturando) const LinearProgressIndicator(),
                    for (final (indice, evidencia) in _evidencias.indexed)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: SizedBox.square(
                          dimension: 42,
                          child: evidencia.isVideo
                              ? const Icon(Icons.videocam_outlined)
                              : ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: Image.memory(
                                    evidencia.bytes,
                                    fit: BoxFit.cover,
                                    cacheWidth: 128,
                                    errorBuilder: (_, __, ___) =>
                                        const Icon(Icons.image_outlined),
                                  ),
                                ),
                        ),
                        title: Text(evidencia.filename,
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        trailing: IconButton(
                          tooltip: 'Remover arquivo',
                          onPressed: _ocupado
                              ? null
                              : () =>
                                  setState(() => _evidencias.removeAt(indice)),
                          icon: const Icon(Icons.close),
                        ),
                      ),
                    if (_evidencias.length >= _limiteArquivos)
                      const Text('Limite de arquivos atingido.'),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              _PainelRegistro(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Como está o móvel?',
                        style: tema.textTheme.titleMedium),
                    const SizedBox(height: 6),
                    _EscolhaBinaria(
                      valor: _houveAvaria,
                      positivo: 'Com avaria',
                      negativo: 'Sem avaria',
                      onChanged: _ocupado
                          ? null
                          : (valor) => setState(() => _houveAvaria = valor),
                    ),
                    if (_houveAvaria == true) ...[
                      const SizedBox(height: 10),
                      TextField(
                        controller: _tipoAvariaCtrl,
                        enabled: !_ocupado,
                        maxLength: 80,
                        onChanged: (_) => setState(() {}),
                        decoration: const InputDecoration(
                            labelText: 'Tipo de avaria',
                            hintText: 'Ex. quina amassada'),
                      ),
                      TextField(
                        controller: _obsCtrl,
                        enabled: !_ocupado,
                        minLines: 2,
                        maxLines: 4,
                        onChanged: (_) => setState(() {}),
                        decoration: const InputDecoration(
                            labelText: 'Descrição da avaria'),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 10),
              _detalhes(etapa),
            ],
          ),
        ),
        Material(
          color: tema.colorScheme.surface,
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_erro != null)
                  Text(_erro!, style: TextStyle(color: tema.colorScheme.error))
                else if (pendencia != null)
                  Text(pendencia, style: tema.textTheme.bodySmall),
                const SizedBox(height: 4),
                FilledButton.icon(
                  onPressed: _ocupado || pendencia != null
                      ? null
                      : () {
                          FocusScope.of(context).unfocus();
                          _enviarMarco(etapa);
                        },
                  icon: _enviando
                      ? const SizedBox.square(
                          dimension: 16,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.cloud_upload_outlined),
                  label: Text(_enviando ? 'Enviando…' : 'Enviar registro'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _detalhes(EtapaColeta etapa) {
    return Card(
      margin: EdgeInsets.zero,
      child: ExpansionTile(
        title: const Text('Detalhes da vistoria'),
        subtitle: const Text('Checklist, observações e local'),
        maintainState: true,
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final item in _itens(etapa).entries) ...[
            Text(item.value),
            _EscolhaBinaria(
              valor: _checklist[item.key],
              positivo: 'Conforme',
              negativo: 'Divergente',
              onChanged: _ocupado
                  ? null
                  : (valor) => setState(() => _checklist[item.key] = valor),
            ),
            const SizedBox(height: 8),
          ],
          if (_houveAvaria != true) ...[
            TextField(
              controller: _obsCtrl,
              enabled: !_ocupado,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Observações'),
            ),
            const SizedBox(height: 10),
          ],
          TextField(
            controller: _localCtrl,
            enabled: !_ocupado,
            maxLength: 200,
            decoration: const InputDecoration(labelText: 'Local da vistoria'),
          ),
          if (etapa.emCampo) ...[
            OutlinedButton.icon(
              onPressed: _ocupado ? null : _capturarGps,
              icon: const Icon(Icons.my_location),
              label: Text(_localizando
                  ? 'Localizando…'
                  : _posicao == null
                      ? 'Usar minha localização'
                      : 'Atualizar localização'),
            ),
            if (_posicao != null)
              Text(
                  'Localização capturada (± ${_posicao!.accuracy.round()} m).'),
            if (_erroGps != null)
              Text(_erroGps!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
        ],
      ),
    );
  }
}

class _PainelRegistro extends StatelessWidget {
  final Widget child;
  const _PainelRegistro({required this.child});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(padding: const EdgeInsets.all(16), child: child),
    );
  }
}

class _EscolhaBinaria extends StatelessWidget {
  final bool? valor;
  final String positivo;
  final String negativo;
  final ValueChanged<bool>? onChanged;

  const _EscolhaBinaria({
    required this.valor,
    required this.positivo,
    required this.negativo,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 4,
      children: [
        ChoiceChip(
          label: Text(negativo),
          selected: valor == false,
          onSelected: onChanged == null ? null : (_) => onChanged!(false),
        ),
        ChoiceChip(
          label: Text(positivo),
          selected: valor == true,
          onSelected: onChanged == null ? null : (_) => onChanged!(true),
        ),
      ],
    );
  }
}

class _FalhaColeta implements Exception {
  final String mensagem;
  const _FalhaColeta(this.mensagem);
}
