/* =========================================================
Nombre completo: tr-botones.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/render/tr-botones.js
Funciones principales:
- Renderizar mensajes y acciones principales de Transcribir video.
- Conectar botones de verificar Whisper, transcribir, guardar y exportar.
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

  const tieneTranscripcion = Boolean(estado.transcripcionActual?.texto);
  const proyectoValido = Boolean(estado.proyectoValido);

  contenedor.innerHTML = `
    <button id="trBtnVolverAudio" class="tr-btn" type="button" ${bloqueado ? "disabled" : ""}>
      Volver a audio
    </button>

    <button id="trBtnVerificarWhisper" class="tr-btn" type="button" ${bloqueado ? "disabled" : ""}>
      ${estado.verificandoWhisper ? "Verificando..." : "Verificar Whisper"}
    </button>

    <button id="trBtnExportarTxt" class="tr-btn" type="button" ${bloqueado || !tieneTranscripcion ? "disabled" : ""}>
      Preparar TXT
    </button>

    <button id="trBtnExportarSrt" class="tr-btn" type="button" ${bloqueado || !tieneTranscripcion ? "disabled" : ""}>
      Preparar SRT
    </button>

    <button id="trBtnExportarJson" class="tr-btn" type="button" ${bloqueado || !tieneTranscripcion ? "disabled" : ""}>
      Preparar JSON
    </button>

    <button id="trBtnGuardar" class="tr-btn" type="button" ${bloqueado || !tieneTranscripcion ? "disabled" : ""}>
      Guardar transcripción
    </button>

    <button id="trBtnTranscribir" class="tr-btn tr-btn--primary" type="button" ${bloqueado || !proyectoValido ? "disabled" : ""}>
      ${estado.procesando ? "Transcribiendo..." : "Transcribir"}
    </button>
  `;
}

export function conectarAccionesTranscripcionTR({ service, router }) {
  const btnVolverAudio = document.getElementById("trBtnVolverAudio");
  const btnVerificarWhisper = document.getElementById("trBtnVerificarWhisper");
  const btnTranscribir = document.getElementById("trBtnTranscribir");
  const btnGuardar = document.getElementById("trBtnGuardar");
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
