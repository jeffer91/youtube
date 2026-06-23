# Prueba local de progreso real

Este documento sirve para revisar si AutoVideoJeff está listo antes de subir un video real.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Verificar diagnóstico general

```bash
npm run check:diagnostico
```

Debe responder con `ok: true`.

## 3. Verificar integración final

```bash
npm run check:integracion-final
```

Debe confirmar que cargan los módulos críticos del motor, edición dinámica, visuales, sonidos, salida y progreso.

## 4. Verificar progreso real

```bash
npm run check:progreso
```

Debe confirmar que existen eventos de progreso, fallo y finalizado.

## 5. Verificar todo en un solo comando

```bash
npm run check:todo
```

Este comando ejecuta diagnóstico, integración final y progreso real.

## 6. Probar la app

```bash
npm run dev
```

Luego:

1. Selecciona un video.
2. Presiona `Procesar automáticamente`.
3. Revisa la barra de progreso.
4. Revisa el historial de edición.
5. Si aparece un modal de error, copia o captura:
   - etapa
   - detalle
   - archivo sugerido
   - recomendación

## Qué enviar si falla

Enviar una captura del modal y, si puedes, el resultado de:

```bash
npm run check:todo
```

Con eso se puede saber si el error está en diagnóstico, progreso, cortes, visuales, sonidos o exportación.
