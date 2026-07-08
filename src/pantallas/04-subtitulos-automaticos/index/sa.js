/* =========================================================
Nombre completo: sa.js
Ruta o ubicación: /src/pantallas/04-subtitulos-automaticos/index/sa.js
Funciones principales:
- Iniciar la pantalla Subtítulos automáticos.
- Leer el proyecto activo desde estadoApp.
- Verificar qué videos tienen transcripción guardada.
- Mostrar estado base antes de construir la generación de subtítulos.
Con qué se conecta:
- sa.html
- sa.css
- estadoApp.proyectoActivo
- router.js
========================================================= */

function escaparHtmlSA(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function obtenerProyectoActivoSA(estadoApp) {
  if (!estadoApp?.obtenerProyectoActivo) {
    return null;
  }

  return estadoApp.obtenerProyectoActivo();
}

function obtenerVideosSA(proyecto) {
  return Array.isArray(proyecto?.videos) ? proyecto.videos : [];
}

function obtenerTranscripcionSA(video) {
  if (video?.transcripcion?.texto) {
    return video.transcripcion;
  }

  if (Array.isArray(video?.transcripciones) && video.transcripciones.length) {
    return video.transcripciones[video.transcripciones.length - 1];
  }

  return null;
}

function contarPalabrasSA(transcripcion) {
  const texto = String(transcripcion?.texto || "").trim();

  if (!texto) {
    return 0;
  }

  return texto.split(/\s+/).filter(Boolean).length;
}

function crearResumenSA(proyecto) {
  const videos = obtenerVideosSA(proyecto);
  const listos = videos.filter((video) => obtenerTranscripcionSA(video));
  const pendientes = Math.max(videos.length - listos.length, 0);

  return {
    videos,
    total: videos.length,
    listos: listos.length,
    pendientes,
    puedePreparar: videos.length > 0 && pendientes === 0
  };
}

function renderResumenSA({ contenedor, proyecto }) {
  if (!contenedor) {
    return;
  }

  const resumen = crearResumenSA(proyecto);

  if (!proyecto) {
    contenedor.innerHTML = `
      <h3>Sin proyecto activo</h3>
      <p>Primero carga un proyecto y transcribe sus videos.</p>
    `;
    return;
  }

  contenedor.innerHTML = `
    <h3>Resumen</h3>
    <p>${escaparHtmlSA(proyecto.nombre || "Proyecto sin nombre")}</p>

    <div class="sa-stats">
      <div class="sa-stat">
        <strong>Videos cargados</strong>
        <span>${escaparHtmlSA(resumen.total)}</span>
      </div>
      <div class="sa-stat">
        <strong>Con transcripción</strong>
        <span>${escaparHtmlSA(resumen.listos)}</span>
      </div>
      <div class="sa-stat">
        <strong>Pendientes</strong>
        <span>${escaparHtmlSA(resumen.pendientes)}</span>
      </div>
    </div>
  `;
}

function renderVideosSA({ contenedor, proyecto }) {
  if (!contenedor) {
    return;
  }

  const videos = obtenerVideosSA(proyecto);

  if (!videos.length) {
    contenedor.innerHTML = `
      <h3>Videos</h3>
      <div class="sa-empty">
        <div>
          <h3>No hay videos cargados</h3>
          <p>Vuelve a cargar proyecto antes de continuar.</p>
        </div>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = `
    <h3>Videos listos para subtítulos</h3>
    <div class="sa-video-list">
      ${videos.map((video, index) => {
        const transcripcion = obtenerTranscripcionSA(video);
        const segmentos = Array.isArray(transcripcion?.segmentos) ? transcripcion.segmentos.length : 0;
        const palabras = contarPalabrasSA(transcripcion);
        const listo = Boolean(transcripcion?.texto);

        return `
          <article class="sa-video-card ${listo ? "is-ready" : "is-pending"}">
            <div class="sa-video-card__head">
              <strong>${escaparHtmlSA(index + 1)}. ${escaparHtmlSA(video.nombre || "Video")}</strong>
              <span class="sa-chip">${listo ? "Listo" : "Pendiente"}</span>
            </div>
            <p>${listo
              ? `${escaparHtmlSA(palabras)} palabras · ${escaparHtmlSA(segmentos)} bloques de tiempo disponibles.`
              : "Este video todavía no tiene transcripción guardada."}</p>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function conectarEventosSA({ router, proyecto }) {
  const btnVolver = document.getElementById("saBtnVolverTranscripcion");
  const btnContinuar = document.getElementById("saBtnContinuar");
  const resumen = crearResumenSA(proyecto);

  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      if (router?.irA) {
        router.irA("03-transcribir-video");
      }
    });
  }

  if (btnContinuar) {
    btnContinuar.disabled = !resumen.puedePreparar;
    btnContinuar.addEventListener("click", () => {
      btnContinuar.textContent = "Subtítulos listos para construir";
    });
  }
}

export async function iniciarPantallaSubtitulosAutomaticos({ router, estadoApp }) {
  const proyecto = obtenerProyectoActivoSA(estadoApp);

  renderResumenSA({
    contenedor: document.getElementById("saResumen"),
    proyecto
  });

  renderVideosSA({
    contenedor: document.getElementById("saVideos"),
    proyecto
  });

  conectarEventosSA({ router, proyecto });
}
