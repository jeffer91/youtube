# Bloque 1 - Estado de base

Este documento resume el estado del Bloque 1 en lenguaje simple.

## Objetivo del bloque

Ordenar la base del proyecto antes de seguir agregando funciones.

## Que se dejo claro

- La app se llama AutoVideoJeff.
- La app abre en modo escritorio con Electron.
- La app tambien puede correr como servidor local.
- El flujo principal ya esta conectado.
- Los modulos principales ya existen.
- El README anterior estaba desactualizado.
- El diagnostico automatico ahora revisa mas archivos criticos.

## Modulos principales

| Modulo | Estado | Conexion |
|---|---|---|
| Interfaz | Existe | app/app.js |
| Escritorio | Existe | main.js / preload.js |
| Servidor | Existe | server.js |
| Motor | Existe | motor/motor.conexion.js |
| Flujo principal | Existe | motor/flujo-principal.js |
| Entrada | Existe | entrada/entrada.conexion.js |
| Entender video | Existe | entender/entender.conexion.js |
| Audio | Existe | audio/audio.conexion.js |
| Transcripcion | Existe | transcripcion/transcripcion.conexion.js |
| Edicion | Existe | editar/editar.conexion.js |
| Salida | Existe | salida/salida.conexion.js |
| Progreso | Existe | progreso/progreso.conexion.js |

## Estado final del bloque

Bloque 1 completado a nivel de orden y documentacion.

La app aun no debe considerarse producto final. El siguiente paso es el Bloque 2: blindar modulos para que los errores se controlen mejor y una falla puntual no rompa innecesariamente todo el proceso.
