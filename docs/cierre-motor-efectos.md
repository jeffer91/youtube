# Cierre del motor de efectos

Estado final del módulo de efectos de AutoVideoJeff.

## Flujo

```text
Catálogo
→ análisis
→ presets por perfil
→ selector local o Gemini
→ aprendizaje
→ optimizador
→ validación
→ FFmpeg
→ render
→ diagnóstico
→ previsualización
```

## Carpetas principales

```text
editar/efectos/catalogo/
editar/efectos/analisis/
editar/efectos/presets/
editar/efectos/planificador/
editar/efectos/aprendizaje/
editar/efectos/optimizador/
editar/efectos/ffmpeg/
editar/efectos/previsualizacion/
diagnostico/efectos/
app/efectos-ui.js
```

## Comandos

```bash
npm run check:efectos
npm run check:efectos-cierre
```

## Prueba manual

```text
1. git pull
2. npm run check:efectos
3. npm start
4. Nuevo proyecto
5. Opciones avanzadas
6. Efectos visuales
7. Previsualizar efectos
8. Procesar un video corto
9. Revisar el resumen final
```

## Archivos de auditoría

```text
efectos/efectos-render.json
efectos/diagnostico-efectos.json
datos/efectos/memoria-efectos.json
```

La etapa queda lista para pruebas reales y mejoras futuras por módulos.
