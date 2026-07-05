/* =========================================================
Nombre completo: tr.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/index/tr.js
Funciones principales:
- Iniciar la pantalla Transcribir video.
- Recibir el proyecto activo desde el estado global.
- Crear el estado local de transcripción.
- Renderizar la estructura visual base.
- Conectar eventos principales sin procesar archivos pesados.
Con qué se conecta:
- tr.html
- tr.css
- tr-estado.js
- tr-selectores.js
- tr-api-electron.js
- tr-ui-layout.js
========================================================= */

import {
  crearEstadoTranscripcion,
  actualizarVideoSeleccionadoTR,
  actualizarOpcionesTR,
  limpiarMensajesTR,
  agregarMensajeTR,
  agregarErrorTR
} from "../estado/tr-estado.js";

import {
  obtenerProyectoActivoSeguroTR,
  proyectoTieneVideosTR,
  obtenerElementosPantallaTR
} from "../estado/tr-selectores.js";

import { crearApiElectronTR } from "../adaptadores/tr-api-electron.js";

import {
  renderPantallaTR,
  renderSinProyectoTR,
  conectarEventosLayoutTR
} from "../ui/tr-ui-layout.js";

let routerActual = null;
let estadoAppActual = null;
let estadoTR = null;
let apiElectronTR = null;

async function cargarHtmlTR() {
  const respuesta = await fetch(new URL("./tr.html", import.meta.url));

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar tr.html.");
  }

  return await respuesta.text();
}

function pantallaExisteEnRootTR(root) {
  return Boolean(root?.querySelector?.("#trRoot"));
}

function renderizarTR() {
  const elementos = obtenerElementosPantallaTR();

  renderPantallaTR({
    elementos,
    estado: estadoTR
  });
}

function seleccionarVideoTR(videoId) {
  estadoTR = actualizarVideoSeleccionadoTR(estadoTR, videoId);
  estadoTR = limpiarMensajesTR(estadoTR);
  renderizarTR();
}

function cambiarOpcionTR(nombre, valor) {
  estadoTR = actualizarOpcionesTR(estadoTR, {
    [nombre]: valor
  });

  renderizarTR();
}

async function probarConexionTR() {
  estadoTR = limpiarMensajesTR(estadoTR);

  const resultado = apiElectronTR.verificarDisponibilidad();

  if (!resultado.ok) {
    estadoTR = agregarErrorTR(estadoTR, resultado.mensaje);
    renderizarTR();
    return;
  }

  estadoTR = agregarMensajeTR(
    estadoTR,
    "La pantalla está lista. En el siguiente bloque conectaremos Electron para procesar transcripciones."
  );

  renderizarTR();
}

function irAMejorarAudioTR() {
  if (!routerActual?.irA) {
    return;
  }

  routerActual.irA("02-mejorar-audio");
}

function conectarEventosTR() {
  conectarEventosLayoutTR({
    onSeleccionarVideo: seleccionarVideoTR,
    onCambiarOpcion: cambiarOpcionTR,
    onProbarConexion: probarConexionTR,
    onIrAMejorarAudio: irAMejorarAudioTR
  });
}

export async function iniciarPantallaTranscribirVideo({ root, router, estadoApp }) {
  routerActual = router;
  estadoAppActual = estadoApp;
  apiElectronTR = crearApiElectronTR();

  const proyectoActivo = obtenerProyectoActivoSeguroTR(estadoAppActual);

  if (!proyectoTieneVideosTR(proyectoActivo)) {
    renderSinProyectoTR(root, [
      "Primero carga un proyecto con videos.",
      "La transcripción necesita un video seleccionado para poder trabajar."
    ]);
    return;
  }

  if (!pantallaExisteEnRootTR(root)) {
    root.innerHTML = await cargarHtmlTR();
  }

  estadoTR = crearEstadoTranscripcion({
    proyectoActivo
  });

  renderizarTR();
  conectarEventosTR();
}