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
    final unidade = widget.timeline.unidade;
    final etapa = _etapa;
    final podeRegistrar =
        etapa != null && etapa.permite(widget.api.usuario?.perfil);
    final tema = Theme.of(context);
    final podeCapturar = !_ocupado && _evidencias.length < _limiteArquivos;
    final itens = etapa == null ? const <String, String>{} : _itens(etapa);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 620),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _PainelRegistro(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Pedido ${unidade.ordemProducao}',
                          style: tema.textTheme.labelLarge),
                      const SizedBox(height: 5),
                      Text(etapa?.titulo ?? 'Coleta concluída',
                          style: tema.textTheme.headlineSmall
                              ?.copyWith(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 5),
                      Text(unidade.produto.nome),
                      Text('QR ${unidade.codigoQr}',
                          style: tema.textTheme.bodySmall),
                      const SizedBox(height: 12),
                      if (etapa == null)
                        const Text(
                            'Todos os pontos de coleta estão registrados. Consulte o histórico do pedido.')
                      else if (!podeRegistrar)
                        Text(
                            'A próxima etapa precisa ser registrada por ${_responsavel(etapa)}. Acompanhe o histórico e retorne após esse registro.')
                      else
                        Text(_orientacao(etapa)),
                    ],
                  ),
                ),
                if (etapa != null && podeRegistrar) ...[
                  const SizedBox(height: 10),
                  _PainelRegistro(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Fotos e vídeos',
                            style: tema.textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 5),
                        Text(
                            '${_evidencias.length}/$_limiteArquivos arquivos · mínimo 1 · até 100 MB'),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            FilledButton.icon(
                              onPressed: podeCapturar
                                  ? () => _capturarMidia(ImageSource.camera,
                                      video: false)
                                  : null,
                              icon: const Icon(Icons.photo_camera_outlined),
                              label: const Text('Tirar foto'),
                            ),
                            OutlinedButton.icon(
                              onPressed: podeCapturar
                                  ? () => _capturarMidia(ImageSource.camera,
                                      video: true)
                                  : null,
                              icon: const Icon(Icons.videocam_outlined),
                              label: const Text('Gravar vídeo'),
                            ),
                            OutlinedButton.icon(
                              onPressed: podeCapturar
                                  ? () => _capturarMidia(ImageSource.gallery,
                                      video: false)
                                  : null,
                              icon: const Icon(Icons.photo_library_outlined),
                              label: const Text('Escolher foto'),
                            ),
                            OutlinedButton.icon(
                              onPressed: podeCapturar
                                  ? () => _capturarMidia(ImageSource.gallery,
                                      video: true)
                                  : null,
                              icon: const Icon(Icons.video_library_outlined),
                              label: const Text('Escolher vídeo'),
                            ),
                          ],
                        ),
                        if (_capturando) ...[
                          const SizedBox(height: 12),
                          const LinearProgressIndicator(),
                        ],
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
                            subtitle: Text(
                                '${(evidencia.bytes.length / 1024).toStringAsFixed(0)} KB'),
                            trailing: IconButton(
                              tooltip: 'Remover arquivo',
                              onPressed: _ocupado
                                  ? null
                                  : () => setState(
                                      () => _evidencias.removeAt(indice)),
                              icon: const Icon(Icons.close),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  _PainelRegistro(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Condição do móvel',
                            style: tema.textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        _EscolhaBinaria(
                          valor: _houveAvaria,
                          positivo: 'Com avaria',
                          negativo: 'Sem avaria',
                          onChanged: _ocupado
                              ? null
                              : (valor) => setState(() => _houveAvaria = valor),
                        ),
                        if (_houveAvaria == true) ...[
                          const SizedBox(height: 12),
                          TextField(
                            controller: _tipoAvariaCtrl,
                            enabled: !_ocupado,
                            maxLength: 80,
                            decoration: const InputDecoration(
                                labelText: 'Tipo de avaria',
                                hintText: 'Ex.: quina amassada'),
                          ),
                        ],
                        const SizedBox(height: 12),
                        TextField(
                          controller: _obsCtrl,
                          enabled: !_ocupado,
                          minLines: 2,
                          maxLines: 4,
                          decoration: InputDecoration(
                              labelText: _houveAvaria == true
                                  ? 'Descrição da avaria'
                                  : 'Observações (opcional)'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  _PainelRegistro(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Checklist da etapa',
                            style: tema.textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 5),
                        const Text('Responda os itens que você conferiu.'),
                        for (final item in itens.entries) ...[
                          const SizedBox(height: 12),
                          Text(item.value),
                          const SizedBox(height: 4),
                          _EscolhaBinaria(
                            valor: _checklist[item.key],
                            positivo: 'Conforme',
                            negativo: 'Divergente',
                            onChanged: _ocupado
                                ? null
                                : (valor) => setState(
                                    () => _checklist[item.key] = valor),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  _PainelRegistro(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Local da vistoria',
                            style: tema.textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _localCtrl,
                          enabled: !_ocupado,
                          maxLength: 200,
                          decoration: const InputDecoration(
                              labelText: 'Descreva o local (opcional)'),
                        ),
                        if (etapa.emCampo) ...[
                          OutlinedButton.icon(
                            onPressed: _ocupado ? null : _capturarGps,
                            icon: const Icon(Icons.my_location),
                            label: Text(_localizando
                                ? 'Localizando…'
                                : (_posicao == null
                                    ? 'Adicionar localização GPS'
                                    : 'Atualizar localização GPS')),
                          ),
                          if (_posicao != null)
                            Text(
                                'Localização capturada (± ${_posicao!.accuracy.round()} m).'),
                          if (_erroGps != null)
                            Text(_erroGps!,
                                style:
                                    TextStyle(color: tema.colorScheme.error)),
                        ],
                      ],
                    ),
                  ),
                  if (_erro != null) ...[
                    const SizedBox(height: 12),
                    Text(_erro!,
                        style: TextStyle(color: tema.colorScheme.error)),
                  ],
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: _ocupado ? null : () => _enviarMarco(etapa),
                    icon: _enviando
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.cloud_upload_outlined),
                    label: Text(
                        _enviando ? 'Enviando evidências…' : 'Registrar etapa'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
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
