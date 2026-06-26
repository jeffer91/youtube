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

### Bloque 11
Render final real por plataforma: 9:16, 16:9 y 1:1.

### Bloque 12
Selector real de perfil, plataformas, modo de edicion y exportacion multiplataforma desde la interfaz.

### Bloque 13
Historial real de proyectos recientes conectado a la pantalla Historial.

### Bloque 14
Revision visual del plan de Produccion desde la pantalla Produccion.

### Bloque 15
Acciones de revision en Produccion: aprobar, no usar, pendiente y guardar cambios.

### Bloque 16
Biblioteca real en pantalla: buscar, filtrar y guardar recursos locales o por URL.

### Bloque 17
Reemplazar recursos desde Produccion y guardar aprendizaje de la correccion.

### Bloque 18
Gemini real conectado por perfil, con instrucciones especificas y fallback local seguro.

## Comandos principales

```bash
npm run check:autovideo
npm run check:bloque18-autovideo
npm start
```

## Nota importante

La app mantiene render base funcional, permite seleccionar perfil y plataformas desde la interfaz, carga proyectos recientes desde el historial local, muestra el ultimo plan de Produccion, permite marcar y reemplazar sus elementos, registra aprendizaje por correcciones, muestra la biblioteca general en pantalla y ejecuta Gemini por perfil cuando hay credencial. Si Gemini no esta activo o falla, la app usa fallback local y no debe romper el flujo.
