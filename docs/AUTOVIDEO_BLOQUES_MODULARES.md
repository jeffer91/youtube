# AutoVideoJeff - Bloques modulares

Este documento resume los bloques creados para la nueva arquitectura modular de AutoVideoJeff.

## Flujo principal

1. Subida y configuracion
2. Procesado
3. Produccion
4. Resultado y comparativa

La biblioteca queda como modulo externo al flujo principal.

## Bloques

### Bloque 1
Base modular de proyectos, perfiles y exportacion.

### Bloque 2
Audio avanzado, subtitulos por plataforma, textos relevantes, graficos y tablas.

### Bloque 3
Visual: sujeto, rostro, zonas seguras, fondo, zooms, animaciones, efectos y encuadre dinamico.

### Bloque 4
Biblioteca general, biblioteca del proyecto y recursos externos.

### Bloque 5
Gemini como inteligencia de edicion. Gemini propone y Produccion aprueba.

### Bloque 6
Produccion y aprendizaje por correcciones de Jeff.

### Bloque 7
Pantallas, menu grande, navegacion y controladores UI.

### Bloque 8
Conexion del servidor y flujo principal con los modulos nuevos.

### Bloque 9
Resultado, comparativa y exportaciones por plataforma.

### Bloque 10
Diagnostico final, pruebas agrupadas y package actualizado.

## Comandos principales

```bash
npm run check:autovideo
npm run check:bloque10-autovideo
npm start
```

## Nota importante

La app mantiene render base funcional. Las plataformas adicionales pueden quedar como pendientes de render especifico hasta conectar el render final real por formato.
