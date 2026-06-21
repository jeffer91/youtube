# AutoVideoJeff

App modular para editar videos automáticamente.

## Objetivo de la primera versión

La primera versión busca ser pequeña, funcional y fácil de ampliar:

1. Subir un video.
2. Entender el video de forma simple.
3. Crear una edición básica para TikTok.
4. Exportar el resultado final.

## Estructura general

```txt
AutoVideoJeff/
├── app/
├── motor/
├── entrada/
├── entender/
├── editar/
├── salida/
├── biblioteca/
├── datos/
└── comun/
```

## Lógica modular

Cada carpeta grande representa una función amplia de la app.

Cada carpeta principal tendrá un archivo de conexión:

```txt
entrada/entrada.conexion.js
entender/entender.conexion.js
editar/editar.conexion.js
salida/salida.conexion.js
biblioteca/biblioteca.conexion.js
```

La idea es que la app no dependa directamente de todos los archivos internos. La app se conecta con archivos de comunicación, y esos archivos llaman a sus servicios internos.

## Instalación

```bash
npm install
```

## Ejecutar la app

```bash
npm start
```

Luego abrir:

```txt
http://localhost:3000
```

## Estado actual

Bloque 1 creado:

```txt
package.json
server.js
README.md
app/index.html
app/styles.css
app/app.js
motor/motor.conexion.js
```

Este bloque deja lista la base visual, el servidor y la primera conexión con el motor.

Los siguientes bloques completarán:

```txt
motor/flujo-principal.js
entrada/
entender/
editar/
salida/
biblioteca/
comun/
```
