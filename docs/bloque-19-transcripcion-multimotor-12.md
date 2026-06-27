# Bloque 19.12 - Prueba completa con video real

## Objetivo

Preparar una prueba completa para validar el flujo multimotor con un proyecto real y un video real cargado en AutoVideoJeff.

Este bloque no inventa resultados. El script debe ejecutarse en la PC local, con la app abierta y un proyecto que ya tenga video subido.

## Archivos creados

```text
scripts/probar-flujo-transcripcion-multimotor-real.js
scripts/verificar-bloque-19-transcripcion-multimotor-12.js
docs/bloque-19-transcripcion-multimotor-12.md
```

## Requisitos previos

```text
1. Tener la app abierta.
2. Tener un proyecto creado.
3. Tener al menos un video real subido al proyecto.
4. Tener el proyectoId.
5. Tener al menos un motor local configurado o texto manual disponible.
```

## Flujo completo que prueba

```text
Nuevo proyecto
Subir video real
Diagnosticar motores
Abrir guía de instalación
Procesar entendimiento
Cargar entendimiento
Ver transcripciones por motor
Elegir principal
Confirmar archivos generados
Guardar reporte de prueba
```

## Comando de verificación estructural

```bash
node scripts/verificar-bloque-19-transcripcion-multimotor-12.js
```

Salida esperada:

```text
Bloque 19.12 OK: prueba completa con video real preparada.
```

## Comando de prueba real

Con proyectoId por argumento:

```bash
node scripts/probar-flujo-transcripcion-multimotor-real.js --proyecto-id=TU_PROYECTO_ID --base-url=http://localhost:3000
```

O con variables de entorno:

```bash
set AUTOVIDEOJEFF_PROYECTO_ID=TU_PROYECTO_ID
set AUTOVIDEOJEFF_BASE_URL=http://localhost:3000
node scripts/probar-flujo-transcripcion-multimotor-real.js
```

## Selección manual durante la prueba

El script busca una transcripción de motor con texto útil y la marca como principal.

Si se quiere preferir un motor:

```bash
node scripts/probar-flujo-transcripcion-multimotor-real.js --proyecto-id=TU_PROYECTO_ID --motor=faster-whisper
```

Si no se quiere probar selección manual:

```bash
node scripts/probar-flujo-transcripcion-multimotor-real.js --proyecto-id=TU_PROYECTO_ID --sin-seleccion
```

## Archivos esperados dentro del proyecto

```text
transcripciones/audio/audio-motores.wav
transcripciones/audio/audio-motores.json
transcripciones/resumen-motores.json
transcripciones/principal/transcripcion-principal.json
transcripciones/principal/seleccion-manual.json
transcripciones/prueba-completa-bloque-19-12.json
```

`seleccion-manual.json` solo aparece si la prueba ejecuta selección manual.

## Resultado esperado

Si todo está correcto, el script imprime:

```text
Bloque 19.12 OK: prueba completa con video real superada.
```

## Qué valida el reporte

```text
- Diagnóstico de motores.
- Guía de instalación disponible.
- Entendimiento procesado.
- Entendimiento cargado.
- Transcripciones por motor detectadas.
- Selección manual, si existe motor con texto útil.
- Archivos reales generados.
```

## Estado final

Con este bloque queda cerrada la primera integración multimotor de transcripción local gratuita para Entendimiento.
