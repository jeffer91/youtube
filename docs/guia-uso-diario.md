# Guia de uso diario - AutoVideoJeff

Esta guia esta escrita para usar la app sin saber programar.

## Abrir la app

Haz doble clic en:

```txt
abrir_app.bat
```

Ese archivo instala lo necesario si falta y abre la app.

## Actualizar y abrir

Haz doble clic en:

```txt
actualizar_y_abrir.bat
```

Ese archivo intenta traer los ultimos cambios desde GitHub, actualiza dependencias, verifica la app y la abre.

## Verificar que todo este bien

Haz doble clic en:

```txt
verificar_app.bat
```

Ese archivo revisa los bloques 1, 2, 3 y 4.

## Crear instalador de Windows

Haz doble clic en:

```txt
crear_instalador_windows.bat
```

Si todo sale bien, el instalador queda en la carpeta:

```txt
release
```

## Uso normal

1. Abre la app.
2. Selecciona un video.
3. Presiona Procesar automaticamente.
4. Espera a que termine la barra de progreso.
5. Revisa el resultado.
6. Compara Antes y Despues.
7. Descarga el video final.

## Donde quedan los videos

Los videos finales quedan en:

```txt
datos/videos-exportados
```

Los proyectos y reportes quedan en:

```txt
datos/proyectos
```

Cada proyecto puede incluir:

```txt
proyecto.json
salida-simple.json
antes-despues/antes-despues.json
```
