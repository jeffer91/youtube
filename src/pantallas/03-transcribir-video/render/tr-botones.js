/* =========================================================
Nombre completo: tr-botones.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/render/tr-botones.js
Funciones principales:
- Renderizar mensajes y acciones principales de Transcribir video.
- Conectar botones de verificar Whisper, transcribir lote, guardar, exportar y avanzar.
- Mantener botones bloqueados durante procesos.
Con qué se conecta:
- tr.js
- tr-service.js
- tr-texto.js
========================================================= */

import {
  escaparHtmlTR
} from "../helpers/tr-texto.js";

function renderAlertasTR(items, tipo) {
  const lista = Array.isArray(items) ? items : [];

  return lista.map((item) => {
    return `<div class="tr-alert tr-alert--${tipo}">${escaparHtmlTR(item)}</div>`;
  }).join("");
}

export function renderMensajesTranscripcionTR({ contenedor, estado }) {
  if (!contenedor) {
    return;
  }

  const errores = renderAlertasTR(estado.errores, "error");
  const mensajes = renderAlertasTR(estado.mensajes, "success");

  if (!errores && !mensajes) {
    contenedor.innerHTML = "";
    return;
  }

  contenedor.innerHTML = `${errores}${mensajes}`;
}

export function renderAccionesTranscripcionTR({ contenedor, estado }) {
  if (!contenedor) {
    return;
  }

  const bloqueado = Boolean(
    estado.procesando ||
    estado.guardando ||
    estado.exportando ||
    estado.verificandoWhisper
  );

  const totalVideos = Array.isArray(estado.videos) ? estado.videos.length : 0;
  const tieneTranscripcion = Boolean(estado.transcripcionActual?.texto);
  const proyectoValido = Boolean(estado.proyectoValido);
  const puedeAvanzar = Boolean(estado.puedeAvanzarSubtitulos || estado.transcripcionGuardada);

  contenedor.innerHTML = `
    <button id="trBtnVerificarWhisper" class="tr-btn tr-btn--compact" type="button" ${bloqueado ? "disabled" : ""}>
      ${estado.verificandoWhisper ? "Verificando..." : "Verificar Whisper"}
    </button>

    <button id="trBtnTranscribir" class="tr-btn tr-btn--primary tr-btn--compact" type="button" ${bloqueado || !proyectoValido ? "disabled" : ""}>
      ${estado.procesando ? "Transcribiendo lote..." : `Transcribir ${totalVideos || ""} video(s)`}
    </button>

    <button id="trBtnSiguiente" class="tr-btn tr-btn--next tr-btn--compact" type="button" ${bloqueado || !puedeAvanzar ? "disabled" : ""}>
      Pasar a subtítulos
    </button>

    <button id="trBtnGuardar" class="tr-btn tr-btn--compact" type="button" ${bloqueado || !tieneTranscripcion ? "disabled" : ""}>
      ${estado.transcripcionGuardada ? "Guardado" : "Guardar actual"}
    </button>

    <button id="trBtnExportarTxt" class="tr-btn tr-btn--compact" type="button" ${bloqueado || !tieneTranscripcion ? "disabled" : ""}>
      TXT
    </button>

    <button id="trBtnExportarSrt" class="tr-btn tr-btn--compact" type="button" ${bloqueado || !tieneTranscripcion ? "disabled" : ""}>
      SRT
    </button>

    <button id="trBtnExportarJson" class="tr-btn tr-btn--compact" type="button" ${bloqueado || !tieneTranscripcion ? "disabled" : ""}>
      JSON
    </button>

    <button id="trBtnVolverAudio" class="tr-btn tr-btn--compact" type="button" ${bloqueado ? "disabled" : ""}>
      Volver a audio
    </button>
  `;
}

export function conectarAccionesTranscripcionTR({ service, router }) {
  const btnVolverAudio = document.getElementById("trBtnVolverAudio");
  const btnVerificarWhisper = document.getElementById("trBtnVerificarWhisper");
  const btnTranscribir = document.getElementById("trBtnTranscribir");
  const btnGuardar = document.getElementById("trBtnGuardar");
  const btnSiguiente = document.getElementById("trBtnSiguiente");
  const btnTxt = document.getElementById("trBtnExportarTxt");
  const btnSrt = document.getElementById("trBtnExportarSrt");
  const btnJson = document.getElementById("trBtnExportarJson");

  if (btnVolverAudio) {
    btnVolverAudio.addEventListener("click", () => {
      if (router?.irA) {
        router.irA("02-mejorar-audio");
      }
    });
  }

  if (btnVerificarWhisper) {
    btnVerificarWhisper.addEventListener("click", () => {
      service.verificarWhisperActual();
    });
  }

  if (btnTranscribir) {
    btnTranscribir.addEventListener("click", () => {
      service.transcribirActual();
    });
  }

  if (btnGuardar) {
    btnGuardar.addEventListener("click", () => {
      service.guardarActual();
    });
  }

  if (btnSiguiente) {
    btnSiguiente.addEventListener("click", () => {
      let estado = service.obtenerEstado();

      if (!estado.puedeAvanzarSubtitulos && estado.transcripcionActual?.texto) {
        estado = service.guardarActual();
      }

      if ((estado?.puedeAvanzarSubtitulos || estado?.transcripcionGuardada) && router?.irA) {
        router.irA("04-subtitulos-automaticos");
      }
    });
  }

  if (btnTxt) {
    btnTxt.addEventListener("click", () => {
      service.prepararExportacion("txt");
    });
  }

  if (btnSrt) {
    btnSrt.addEventListener("click", () => {
      service.prepararExportacion("srt");
    });
  }

  if (btnJson) {
    btnJson.addEventListener("click", () => {
      service.prepararExportacion("json");
    });
  }
}
