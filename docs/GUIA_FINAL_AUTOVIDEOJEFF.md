# Guia final AutoVideoJeff 1.0.0

Esta guia es para probar y cerrar la primera version funcional de AutoVideoJeff.

## 1. Actualizar el proyecto

```bash
git pull
npm install
```

## 2. Verificar la app completa

```bash
npm run check:auditoria-integral-autovideo
npm run check:bloque21-autovideo
npm run check:autovideo
```

Si esos comandos pasan, la estructura principal, variables, conexiones, botones, entradas y salidas estan listas para prueba real.

## 3. Abrir la app

```bash
npm start
```

## 4. Flujo de prueba recomendado

1. Abrir Inicio.
2. Ir a Nuevo proyecto.
3. Elegir perfil.
4. Elegir plataformas.
5. Activar o desactivar Gemini.
6. Subir un video corto.
7. Procesar.
8. Revisar Resultado.
9. Revisar Produccion.
10. Probar Aprobar, No usar, Pendiente y Reemplazar.
11. Ir a Biblioteca y cargar recursos.
12. Ir a Historial y actualizar.
13. Ir a Diagnostico y ejecutar diagnostico fuerte.
14. En Diagnostico ejecutar Auditoria integral.

## 5. Crear instalador para Windows

```bash
npm run dist:win
```

El instalador se genera en la carpeta `release`.

## 6. Comandos utiles

```bash
npm run check:diagnostico-fuerte
npm run check:auditoria-integral-autovideo
npm run check:gemini-real-perfil
npm run check:render-plataformas
npm run check:cierre-final-autovideo
```

## 7. Que debe quedar listo

- Procesar video desde Electron.
- Usar perfiles de edicion.
- Usar plataformas de exportacion.
- Mantener fallback si Gemini falla.
- Mostrar resultado y comparativa.
- Revisar plan en Produccion.
- Aprender de reemplazos.
- Ver Historial.
- Gestionar Biblioteca.
- Ejecutar diagnostico fuerte.
- Ejecutar auditoria integral.
- Reintentar etapa fallida desde ventana de error.
- Empaquetar instalador Windows.

## 8. Despues del cierre

Luego del Bloque 21 no se deben agregar bloques grandes a esta version. Lo correcto es probar en la PC y corregir errores puntuales segun lo que aparezca en consola, auditoria integral o diagnostico fuerte.
