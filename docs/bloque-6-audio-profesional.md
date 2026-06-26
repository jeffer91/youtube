# Bloque 6 - Audio profesional / voz al frente

Este bloque corrige dos problemas reportados:

1. El audio se escuchaba casi igual al original.
2. La voz se escuchaba lejana y poco nitida.

## Que se corrigio

| Parte | Correccion |
|---|---|
| Preset de audio | Se reemplazo por preset de voz al frente |
| Limpieza de audio | Ahora realza presencia, claridad y volumen |
| Sonidos de edicion | Ahora se mezclan sobre audio mejorado cuando es seguro |
| Video dinamico | Si usa cortes, procesa la voz del video dinamico para no perder sincronizacion |
| Exportacion final | Puede aplicar filtro final de voz cuando no hay audio externo |

## Nueva ruta de audio

```txt
video original
  ↓
limpieza de ruido
  ↓
voz al frente
  ↓
compresion y volumen
  ↓
sonidos de edicion sobre audio mejorado
  ↓
exportacion final
```

## Resultado esperado

La voz debe escucharse:

- Mas cerca.
- Mas clara.
- Mas fuerte.
- Menos lejana.
- Mas uniforme para redes sociales.

## Version

Este bloque queda desde la version 0.3.11.
