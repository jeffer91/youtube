# Bloque 5 - Verificacion y correccion funcional

Este bloque revisa variables, botones, conexiones y flujo principal.

## Objetivo

Corregir errores de conexion para que la app quede mas funcional antes de probarla con videos reales.

## Correcciones realizadas

| Area | Correccion |
|---|---|
| Motor principal | Ahora envia transcripcion y edicion dinamica a salida |
| Salida | Antes/despues recibe todos los datos necesarios |
| Mensaje final | Ahora indica cuando existe antes/despues |
| UI | Se agrego verificacion de IDs usados en app.js contra index.html |
| Package | Se agregaron comandos check:ui y check:funcional |
| Diagnostico | Se agrego la verificacion de UI/conexiones |

## Nuevo comando

```bash
npm run check:ui
```

Revisa:

- Que los botones y variables usados en `app/app.js` existan en `app/index.html`.
- Que el motor envie datos completos a salida.
- Que antes/despues este conectado entre salida, app.js e index.html.
- Que package.json tenga comandos funcionales.

## Comando completo recomendado

```bash
npm run check:funcional
```

Este comando ejecuta:

1. Revision de variables, botones y conexiones.
2. Revision general de la app.

## Estado

Bloque de verificacion y correccion subido.

La prueba final debe hacerse en la computadora local con videos reales.
