# MovSeg | Coleta de evidências

O aplicativo Flutter registra as condições do móvel e da embalagem durante a operação. A equipe fabril documenta fabricação, inspeção, embalagem e saída da fábrica. A equipe de entrega registra antes da entrega, na chegada ao cliente e após a entrega.

1. Entre com sua conta de trabalho.
2. Identifique a unidade pelo código da etiqueta ou pelo número de série.
3. Confira a unidade e a etapa, fotografe a condição e informe a avaria quando houver.
4. Envie o registro e verifique se ele apareceu no histórico.

## Executar no emulador Android

```powershell
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:8080
```

A API precisa estar em execução. Para testar no navegador, consulte o guia e a configuração de CORS no [README do projeto](../README.md#6-como-executar-o-projeto). Para um aparelho físico, use uma URL de API acessível pelo dispositivo.
