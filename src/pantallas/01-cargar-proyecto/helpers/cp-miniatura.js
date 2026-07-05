/* =========================================================
Nombre completo: cp-miniatura.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/helpers/cp-miniatura.js
Funciones principales:
- Crear una miniatura del video cargado.
- Usar un canvas temporal.
- Guardar la miniatura como imagen base64.
- Evitar que la app se bloquee si falla.
========================================================= */

const MINIATURA_DEFECTO = "";

function limpiarVideoTemporal(video) {
  if (!video) {
    return;
  }

  video.pause();
  video.removeAttribute("src");
  video.load();
}

function crearCanvasMiniatura(video) {
  const canvas = document.createElement("canvas");
  const ancho = 320;
  const alto = 180;

  canvas.width = ancho;
  canvas.height = alto;

  const contexto = canvas.getContext("2d");

  if (!contexto) {
    return MINIATURA_DEFECTO;
  }

  contexto.drawImage(video, 0, 0, ancho, alto);

  return canvas.toDataURL("image/jpeg", 0.75);
}

export function crearMiniaturaVideo(urlVideo) {
  return new Promise((resolve) => {
    if (!urlVideo) {
      resolve({
        ok: false,
        miniatura: MINIATURA_DEFECTO,
        mensaje: "No existe URL del video."
      });
      return;
    }

    const video = document.createElement("video");

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = urlVideo;

    let yaResolvio = false;

    function responder(resultado) {
      if (yaResolvio) {
        return;
      }

      yaResolvio = true;
      limpiarVideoTemporal(video);
      resolve(resultado);
    }

    video.onloadedmetadata = () => {
      const duracion = Number(video.duration);
      const segundoMiniatura = Number.isFinite(duracion) && duracion > 2 ? 1 : 0;

      try {
        video.currentTime = segundoMiniatura;
      } catch {
        responder({
          ok: false,
          miniatura: MINIATURA_DEFECTO,
          mensaje: "No se pudo ubicar el fotograma."
        });
      }
    };

    video.onseeked = () => {
      try {
        const miniatura = crearCanvasMiniatura(video);

        responder({
          ok: Boolean(miniatura),
          miniatura,
          mensaje: miniatura ? "" : "No se pudo crear miniatura."
        });
      } catch (error) {
        responder({
          ok: false,
          miniatura: MINIATURA_DEFECTO,
          mensaje: error.message
        });
      }
    };

    video.onerror = () => {
      responder({
        ok: false,
        miniatura: MINIATURA_DEFECTO,
        mensaje: "No se pudo cargar el video para crear miniatura."
      });
    };
  });
}

export async function agregarMiniaturaAVideo(video) {
  if (!video || !video.url) {
    return {
      ...video,
      miniatura: MINIATURA_DEFECTO
    };
  }

  const resultado = await crearMiniaturaVideo(video.url);

  return {
    ...video,
    miniatura: resultado.miniatura || MINIATURA_DEFECTO
  };
}

export async function agregarMiniaturaAVideos(videos) {
  if (!Array.isArray(videos)) {
    return [];
  }

  const videosConMiniatura = [];

  for (const video of videos) {
    const videoFinal = await agregarMiniaturaAVideo(video);
    videosConMiniatura.push(videoFinal);
  }

  return videosConMiniatura;
}