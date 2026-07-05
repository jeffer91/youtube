# REGLAS DE DESARROLLO DE LA APP

Este archivo define las reglas obligatorias para desarrollar, corregir, dividir y mantener la app.

Estas reglas deben respetarse en todos los archivos nuevos y en todas las correcciones futuras.

---

## 1. Regla de nombres únicos

Dos archivos no pueden tener el mismo nombre dentro del proyecto.

Ejemplo incorrecto:

```text
src/pantallas/01-cargar-proyecto/index/main.js
src/pantallas/02-mejorar-audio/index/main.js
```

Aunque estén en carpetas diferentes, esto puede causar confusión, errores al copiar, errores al importar y dificultad para revisar el proyecto.

Ejemplo correcto:

```text
src/pantallas/01-cargar-proyecto/cp-main.js
src/pantallas/02-mejorar-audio/ma-main.js
```

Cada archivo debe tener un nombre único y relacionado con su pantalla o función.

---

## 2. Regla de prefijo por pantalla

Cada pantalla debe tener un prefijo propio.

Ejemplo:

```text
01-cargar-proyecto  -> cp
02-mejorar-audio    -> ma
03-exportar-video   -> ev
```

Todos los archivos de esa pantalla deben iniciar con ese prefijo.

Ejemplo correcto:

```text
ma-main.js
ma.css
ma-controles.js
ma-comparar.js
ma-guardar.js
```

Ejemplo incorrecto:

```text
main.js
styles.css
script.js
helpers.js
```

---

## 3. Regla de no hacer crecer demasiado ningún archivo

Ningún archivo del proyecto debe crecer demasiado.

Si un archivo tiene más de 700 líneas de código, se debe dividir en uno o más archivos nuevos.

La división debe hacerse por funciones o responsabilidades.

Ejemplo correcto:

```text
ma-main.js          -> Conecta la pantalla Mejorar Audio.
ma-controles.js     -> Maneja botones y controles.
ma-comparar.js      -> Maneja comparación entre original y mejorado.
ma-guardar.js       -> Maneja guardado y exportación.
```

Ejemplo incorrecto:

```text
ma-main.js -> Tiene toda la lógica de controles, comparación, guardado, exportación, validaciones y navegación.
```

La idea es que ningún archivo sea difícil de revisar, corregir o mantener.

---

## 4. Regla de modularidad por pantalla

Cada pantalla debe tener su propia carpeta.

Dentro de cada carpeta deben estar los archivos necesarios para esa pantalla.

Ejemplo:

```text
src/pantallas/02-mejorar-audio/
  ma-main.js
  ma.css
  ma-controles.js
  ma-comparar.js
  ma-guardar.js
```

La lógica de una pantalla no debe estar mezclada con la lógica de otra pantalla.

---

## 5. Regla de una función principal por archivo

Cada archivo debe tener una responsabilidad clara.

Ejemplo correcto:

```text
ma-controles.js   -> Maneja botones, sliders y acciones del usuario.
ma-comparar.js    -> Maneja comparación entre video original y mejorado.
ma-guardar.js     -> Maneja exportación o guardado del video mejorado.
ma-main.js        -> Conecta los módulos de la pantalla Mejorar Audio.
```

Ejemplo incorrecto:

```text
ma-main.js -> Maneja botones, comparación, exportación, estilos, validaciones y navegación.
```

---

## 6. Regla de encabezado obligatorio en cada archivo

Todo archivo completo debe iniciar con un encabezado en comentario.

Ejemplo para JavaScript:

```js
/* =========================================================
Nombre completo: ma-comparar.js
Ruta o ubicación: src/pantallas/02-mejorar-audio/ma-comparar.js
Función o funciones:
- Mostrar video original y video mejorado lado a lado.
- Sincronizar reproducción de ambos videos.
- Permitir comparar antes y después del audio mejorado.
Con qué se conecta:
- ma-main.js
- ma-controles.js
========================================================= */
```

Ejemplo para CSS:

```css
/* =========================================================
Nombre completo: ma.css
Ruta o ubicación: src/pantallas/02-mejorar-audio/ma.css
Función o funciones:
- Definir el diseño visual de la pantalla Mejorar Audio.
- Organizar los videos comparativos.
- Estilizar botones, tarjetas y estados visuales.
Con qué se conecta:
- ma-main.js
- index.html
========================================================= */
```

---

## 7. Regla de pantallas independientes

Cada pantalla debe poder entenderse por separado.

Una pantalla no debe depender directamente de archivos internos de otra pantalla.

Ejemplo incorrecto:

```js
import "../01-cargar-proyecto/cp-controles.js";
```

Ejemplo correcto:

```js
import "../../core/app-state.js";
```

Si varias pantallas necesitan una misma función, esa función debe ir en una carpeta global o compartida.

---

## 8. Regla de carpeta global solo para funciones compartidas

La carpeta global o compartida solo debe tener funciones usadas por varias pantallas.

Ejemplo:

```text
src/shared/
  app-state.js
  file-utils.js
  video-utils.js
  audio-utils.js
```

No se debe poner dentro de `shared` una función que solo usa una pantalla.

---

## 9. Regla de nombres claros

Los nombres de archivos, funciones, variables y clases deben ser claros.

Ejemplo correcto:

```js
procesarVideoMejorado()
mostrarComparacionAudio()
guardarVideoFinal()
```

Ejemplo incorrecto:

```js
hacerCosa()
procesar()
data1()
x()
```

---

## 10. Regla de no duplicar código

Si una función se repite en varios archivos, debe moverse a un archivo compartido.

Ejemplo:

```text
src/shared/audio-utils.js
```

Esto evita errores y hace más fácil mantener la app.

---

## 11. Regla de estado centralizado por pantalla

Cada pantalla debe tener un estado claro.

Ejemplo:

```js
const maState = {
  videoOriginal: null,
  videoMejorado: null,
  audioProcesado: false,
  exportando: false
};
```

No se deben crear variables sueltas por todos los archivos si pertenecen a la misma pantalla.

---

## 12. Regla de botones y acciones

Los botones deben tener una acción clara.

Cada botón debe:

* Tener un texto entendible.
* Estar conectado a una función específica.
* Mostrar cuando está cargando.
* Bloquearse si la acción todavía no se puede ejecutar.

Ejemplo:

```text
Mejorar audio
Comparar
Guardar video mejorado
Volver
```

---

## 13. Regla de mensajes claros para el usuario

La app debe mostrar mensajes simples y entendibles.

Ejemplo correcto:

```text
Audio mejorado correctamente.
Selecciona un video antes de continuar.
No se pudo guardar el video. Intenta nuevamente.
```

Ejemplo incorrecto:

```text
Error undefined.
Falló proceso interno.
NaN.
```

---

## 14. Regla de no mostrar mensajes técnicos al usuario final

Los errores técnicos deben quedar en consola o en diagnóstico.

El usuario debe ver un mensaje simple.

Ejemplo:

```js
console.error("Error técnico:", error);
mostrarMensaje("No se pudo mejorar el audio. Intenta nuevamente.");
```

---

## 15. Regla de diseño limpio

Cada pantalla debe tener un diseño claro, ordenado y fácil de usar.

Se debe evitar:

* Demasiados botones juntos.
* Doble scroll innecesario.
* Popups innecesarios.
* Textos largos sin orden.
* Pantallas cargadas visualmente.

---

## 16. Regla de reemplazo de pantalla cuando sea más lógico

Si una acción cambia completamente el flujo, puede reemplazar el contenido de la pantalla en lugar de abrir un popup.

Ejemplo:

Si el usuario sube un video, la pantalla puede cambiar de:

```text
Seleccionar video
```

a:

```text
Video cargado / Mejorar audio
```

Esto es mejor que abrir ventanas emergentes innecesarias.

---

## 17. Regla de carga rápida

Cada pantalla debe cargar lo más rápido posible.

Se debe evitar:

* Cargar todos los procesos al inicio.
* Procesar archivos pesados antes de que el usuario los seleccione.
* Ejecutar funciones innecesarias al abrir la pantalla.

La carga debe hacerse solo cuando sea necesaria.

---

## 18. Regla de validación antes de avanzar

Antes de pasar a la siguiente pantalla o proceso, la app debe validar que exista la información necesaria.

Ejemplo:

```text
No se puede mejorar audio si no hay video cargado.
No se puede comparar si no existe video mejorado.
No se puede guardar si el proceso no terminó.
```

---

## 19. Regla de conservar archivos originales

La app no debe destruir ni sobrescribir el archivo original del usuario.

El video original debe mantenerse intacto.

El video mejorado debe generarse como una nueva versión.

Ejemplo:

```text
video-original.mp4
video-original_mejorado.mp4
```

---

## 20. Regla de descarga o guardado claro

Cuando el usuario guarde un video, debe saber exactamente qué está guardando.

Ejemplo:

```text
Guardar video mejorado
Descargar video mejorado
Exportar comparación
```

No se deben usar textos ambiguos como:

```text
Guardar
Aceptar
Procesar
```

---

## 21. Regla de pruebas por pantalla

Cada pantalla debe probarse antes de avanzar a la siguiente.

Checklist mínimo:

```text
- Abre correctamente.
- No muestra errores en consola.
- Los botones funcionan.
- No se rompe al volver.
- No se duplican eventos.
- No se pierden archivos cargados.
- No aparecen mensajes innecesarios.
```

---

## 22. Regla de no duplicar eventos

No se deben registrar varias veces los mismos eventos.

Ejemplo incorrecto:

```js
boton.addEventListener("click", procesar);
boton.addEventListener("click", procesar);
```

Esto puede causar que una acción se ejecute dos o más veces.

---

## 23. Regla de limpieza visual por pantalla

Cada pantalla debe limpiar sus mensajes temporales cuando ya no sean necesarios.

Ejemplo:

```text
Cargando...
Procesando...
Guardando...
```

Estos mensajes no deben quedarse pegados si el proceso ya terminó.

---

## 24. Regla de compatibilidad con Electron

Todo código debe funcionar dentro de Electron.

No se debe usar una función del navegador si rompe en Electron.

Cuando sea necesario acceder al sistema de archivos, debe hacerse mediante las funciones permitidas por Electron.

---

## 25. Regla de seguridad básica

No se debe ejecutar código peligroso ni abrir rutas externas sin validación.

Se debe validar:

* Archivos seleccionados.
* Extensiones permitidas.
* Rutas de guardado.
* Errores de lectura o escritura.

---

## 26. Regla de resumen al final de cada bloque de trabajo

Cuando se entreguen varios archivos, al final se debe indicar el avance.

Ejemplo:

```text
Archivos entregados en este bloque:
1. ma-main.js
2. ma.css
3. ma-controles.js

Avance de pantalla Mejorar Audio:
3 / 7 archivos entregados
```

---

## 27. Regla de trabajo por bloques

Cuando una pantalla tenga muchos archivos, se debe trabajar por bloques.

Ejemplo:

```text
Bloque 1: estructura principal
Bloque 2: controles
Bloque 3: comparación
Bloque 4: guardado
Bloque 5: pruebas y limpieza
```

Esto evita errores y permite revisar mejor cada parte.

---

## 28. Regla de no mezclar estilos

Cada pantalla debe tener su propio archivo CSS.

Ejemplo:

```text
ma.css
cp.css
ev.css
```

Los estilos globales solo deben ir en archivos globales si afectan a toda la app.

---

## 29. Regla de IDs únicos en HTML

Los IDs usados en HTML deben ser únicos.

Ejemplo correcto:

```html
<button id="ma-btn-mejorar-audio">Mejorar audio</button>
<button id="ma-btn-comparar">Comparar</button>
```

Ejemplo incorrecto:

```html
<button id="btnGuardar">Guardar</button>
<button id="btnGuardar">Guardar otro</button>
```

---

## 30. Regla de clases CSS con prefijo

Las clases CSS de cada pantalla deben iniciar con el prefijo de la pantalla.

Ejemplo correcto:

```css
.ma-panel {}
.ma-video-card {}
.ma-btn-primary {}
```

Ejemplo incorrecto:

```css
.panel {}
.card {}
.btn {}
```

---

## 31. Regla de diagnóstico sin molestar al usuario

La app puede tener diagnóstico técnico, pero no debe aparecer encima de la pantalla normal si el usuario no lo necesita.

El diagnóstico debe estar en consola, en archivo de log o en una pantalla específica.

---

## 32. Regla de navegación clara

Cada pantalla debe tener claro cómo avanzar, volver o guardar.

No debe existir una pantalla donde el usuario no sepa qué hacer.

---

## 33. Regla de errores recuperables

Si algo falla, la app no debe quedarse bloqueada.

Debe permitir:

* Volver a intentar.
* Seleccionar otro archivo.
* Cancelar el proceso.
* Volver a la pantalla anterior.

---

## 34. Regla de compatibilidad visual

La app debe verse bien en pantallas normales de laptop o escritorio.

No debe depender de tamaños exactos.

Se debe usar diseño flexible cuando sea posible.

---

## 35. Regla de comparación lado a lado

Cuando exista comparación entre original y resultado, debe mostrarse de forma clara.

Ejemplo:

```text
Video original | Video mejorado
```

Ambos deben verse en la misma pantalla cuando el espacio lo permita.

---

## 36. Regla de aprobación antes de avanzar

Cuando una pantalla o función quede bien, debe marcarse como aprobada antes de pasar a la siguiente.

No se debe cambiar una parte aprobada sin razón clara.

---

## 37. Regla de estructura fácil de revisar

El proyecto debe estar organizado para que cualquier pantalla se pueda revisar rápidamente.

Cada carpeta debe tener nombres claros y archivos relacionados con una sola pantalla o función.

Ejemplo correcto:

```text
src/pantallas/02-mejorar-audio/
  ma-main.js
  ma.css
  ma-controles.js
  ma-comparar.js
  ma-guardar.js
```

Ejemplo incorrecto:

```text
src/pantallas/02-mejorar-audio/
  main.js
  funciones.js
  cosas.js
  prueba.js
  nuevo.js
```

La estructura debe ayudar a entender la app, no volverla más difícil.

---

# Resumen de reglas principales

Las reglas más importantes son:

```text
1. No repetir nombres de archivos.
2. Usar prefijo por pantalla.
3. No hacer crecer demasiado ningún archivo.
4. Si un archivo pasa de 700 líneas, dividirlo por funciones.
5. Separar funciones por archivos.
6. Entregar archivos completos.
7. Mantener encabezado obligatorio.
8. Validar antes de avanzar.
9. Evitar doble scroll y popups innecesarios.
10. Probar pantalla por pantalla.
```
