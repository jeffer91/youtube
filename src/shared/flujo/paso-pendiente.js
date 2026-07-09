/* =========================================================
Nombre completo: paso-pendiente.js
Ruta o ubicación: /src/shared/flujo/paso-pendiente.js
Funciones principales:
- Renderizar pantallas funcionales de pasos todavía no automatizados.
- Mostrar proyecto, videos, criterio, acciones y capas guardadas.
- Guardar una capa/decisión ligera dentro del proyecto.
- Mantener conectado el flujo con el botón flotante.
- Evitar pantallas vacías o carpetas sin archivos.
Con qué se conecta:
- router.js
- estadoApp.proyectoActivo
- window.videoEditorAPI.guardarProyectoLocal
========================================================= */

function escaparHtmlFP(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clonarSeguroFP(valor) {
  try {
    return JSON.parse(JSON.stringify(valor || null));
  } catch (error) {
    return null;
  }
}

function obtenerProyectoActivoFP(estadoApp) {
  if (!estadoApp?.obtenerProyectoActivo) return null;
  return estadoApp.obtenerProyectoActivo() || null;
}

function actualizarProyectoActivoFP(estadoApp, proyecto) {
  if (!estadoApp?.establecerProyectoActivo) return;
  const estadoGlobal = estadoApp.obtenerEstado?.() || {};
  estadoApp.establecerProyectoActivo(proyecto, estadoGlobal.rutaProyectoActivo || null);
}

async function guardarProyectoLocalFP(proyecto) {
  if (!window.videoEditorAPI?.guardarProyectoLocal) {
    return { ok: false, omitido: true, mensaje: "Guardado solo en memoria." };
  }

  return await window.videoEditorAPI.guardarProyectoLocal(proyecto);
}

function obtenerVideosFP(proyecto) {
  return Array.isArray(proyecto?.videos) ? proyecto.videos : [];
}

function obtenerCapasFP(proyecto) {
  return Array.isArray(proyecto?.capas) ? proyecto.capas : [];
}

function obtenerCapaIdFP(config) {
  return config.capaId || `paso-${config.routeId}`;
}

function formatearFechaFP(valor) {
  if (!valor) return "Sin fecha";
  try {
    return new Date(valor).toLocaleString("es-EC");
  } catch (error) {
    return String(valor);
  }
}

function obtenerNombreVideoFP(video, index) {
  return video?.nombre || video?.name || video?.archivo?.nombre || `Video ${index + 1}`;
}

function obtenerDetalleVideoFP(video) {
  const partes = [];
  if (video?.duracionTexto) partes.push(video.duracionTexto);
  if (video?.extension) partes.push(String(video.extension).toUpperCase());
  if (video?.pesoTexto) partes.push(video.pesoTexto);
  if (video?.ruta) partes.push("archivo local");
  return partes.join(" · ") || "Video cargado en el proyecto";
}

function crearCapaPasoFP({ proyecto, config }) {
  const proyectoBase = clonarSeguroFP(proyecto);
  const fecha = new Date().toISOString();
  const capas = obtenerCapasFP(proyectoBase);
  const videos = obtenerVideosFP(proyectoBase);
  const capaId = obtenerCapaIdFP(config);
  const capaAnterior = capas.find((capa) => capa.id === capaId) || {};

  const capaNueva = {
    ...capaAnterior,
    id: capaId,
    tipo: config.tipo || "decision",
    nombre: config.titulo || config.nombre || "Paso del flujo",
    activa: true,
    estado: "PLANIFICADO",
    ordenFlujo: config.numero || "",
    datos: {
      ...(capaAnterior.datos || {}),
      routeId: config.routeId,
      numero: config.numero,
      descripcion: config.descripcion,
      criterio: config.criterio,
      acciones: Array.isArray(config.acciones) ? config.acciones : [],
      totalVideos: videos.length,
      origen: "pantalla-funcional-provisional",
      nota: "Capa funcional provisional: conserva la decisión del flujo hasta construir el motor automático real."
    },
    creadoEn: capaAnterior.creadoEn || fecha,
    actualizadoEn: fecha
  };

  const index = capas.findIndex((capa) => capa.id === capaId);
  if (index >= 0) capas[index] = capaNueva;
  else capas.push(capaNueva);

  return {
    ...proyectoBase,
    capas,
    pantallaActual: config.routeId,
    actualizadoEn: fecha
  };
}

function crearListaAccionesFP(acciones) {
  const lista = Array.isArray(acciones) ? acciones : [];
  if (!lista.length) return "";

  return `
    <ul class="fp-list">
      ${lista.map((accion) => `<li>${escaparHtmlFP(accion)}</li>`).join("")}
    </ul>
  `;
}

function crearListaVideosFP(videos) {
  if (!videos.length) {
    return `
      <div class="fp-empty-box">
        <strong>Sin videos todavía</strong>
        <span>Primero carga un proyecto en Video base.</span>
      </div>
    `;
  }

  return `
    <div class="fp-video-list">
      ${videos.map((video, index) => `
        <article class="fp-video-card">
          <strong>${index + 1}. ${escaparHtmlFP(obtenerNombreVideoFP(video, index))}</strong>
          <span>${escaparHtmlFP(obtenerDetalleVideoFP(video))}</span>
        </article>
      `).join("")}
    </div>
  `;
}

function crearListaCapasFP(capas) {
  if (!capas.length) {
    return `
      <div class="fp-empty-box">
        <strong>Sin capas guardadas</strong>
        <span>Las decisiones del flujo aparecerán aquí.</span>
      </div>
    `;
  }

  return `
    <div class="fp-layer-list">
      ${capas.map((capa, index) => `
        <article class="fp-layer-card">
          <span>${index + 1}</span>
          <div>
            <strong>${escaparHtmlFP(capa.nombre || capa.id || "Capa")}</strong>
            <small>${escaparHtmlFP(capa.tipo || "capa")} · ${escaparHtmlFP(capa.estado || "guardada")}</small>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function crearChipEstadoFP({ proyecto, capaExiste }) {
  if (!proyecto) {
    return `<span class="fp-chip fp-chip--danger">Sin proyecto activo</span>`;
  }

  if (capaExiste) {
    return `<span class="fp-chip fp-chip--ok">Paso guardado</span>`;
  }

  return `<span class="fp-chip fp-chip--warn">Listo para guardar</span>`;
}

function renderizarFP({ root, estadoApp, config, mensaje = "" }) {
  const proyecto = obtenerProyectoActivoFP(estadoApp);
  const videos = obtenerVideosFP(proyecto);
  const capas = obtenerCapasFP(proyecto);
  const capaId = obtenerCapaIdFP(config);
  const capaActual = capas.find((capa) => capa.id === capaId) || null;
  const capaExiste = Boolean(capaActual);
  const textoBoton = capaExiste ? "Continuar" : "Guardar decisión y continuar";

  root.innerHTML = `
    <section class="fp-screen">
      <header class="fp-header app-card">
        <div>
          <p>Pantalla ${escaparHtmlFP(config.numero || "")}</p>
          <h2>${escaparHtmlFP(config.titulo || "Paso del flujo")}</h2>
          <span>${escaparHtmlFP(config.descripcion || "Paso conectado al flujo de edición.")}</span>
        </div>
        ${crearChipEstadoFP({ proyecto, capaExiste })}
      </header>

      <main class="fp-grid fp-grid--wide">
        <aside class="fp-panel app-card">
          <h3>Estado del proyecto</h3>
          <div class="fp-stat"><strong>Proyecto</strong><span>${escaparHtmlFP(proyecto?.nombre || "Sin proyecto activo")}</span></div>
          <div class="fp-stat"><strong>Videos cargados</strong><span>${videos.length}</span></div>
          <div class="fp-stat"><strong>Capas guardadas</strong><span>${capas.length}</span></div>
          <div class="fp-stat"><strong>Este paso</strong><span>${capaExiste ? "Guardado" : "Pendiente"}</span></div>
          ${capaActual?.actualizadoEn ? `<div class="fp-stat"><strong>Actualizado</strong><span>${escaparHtmlFP(formatearFechaFP(capaActual.actualizadoEn))}</span></div>` : ""}
          ${mensaje ? `<div class="fp-message">${escaparHtmlFP(mensaje)}</div>` : ""}
        </aside>

        <section class="fp-panel app-card">
          <h3>Qué hará este paso</h3>
          <p>${escaparHtmlFP(config.criterio || "Este paso queda conectado para no romper el flujo final.")}</p>
          ${crearListaAccionesFP(config.acciones)}

          <div class="fp-actions">
            <button id="${escaparHtmlFP(config.botonId)}" class="app-btn" type="button" ${proyecto ? "" : "disabled"}>
              ${escaparHtmlFP(textoBoton)}
            </button>
            <button id="${escaparHtmlFP(config.botonVolverId)}" class="app-btn app-btn--ghost" type="button">
              Volver
            </button>
          </div>
        </section>

        <section class="fp-panel app-card">
          <h3>Videos del proyecto</h3>
          ${crearListaVideosFP(videos)}
        </section>

        <section class="fp-panel app-card">
          <h3>Capas actuales</h3>
          ${crearListaCapasFP(capas)}
        </section>
      </main>
    </section>
  `;
}

export function iniciarPasoFuncionalPendiente({ root, router, estadoApp, config }) {
  renderizarFP({ root, estadoApp, config });

  const btnContinuar = document.getElementById(config.botonId);
  const btnVolver = document.getElementById(config.botonVolverId);

  if (btnContinuar) {
    btnContinuar.addEventListener("click", async () => {
      const proyecto = obtenerProyectoActivoFP(estadoApp);
      if (!proyecto) return;

      btnContinuar.disabled = true;
      btnContinuar.textContent = "Guardando...";

      const proyectoActualizado = crearCapaPasoFP({ proyecto, config });
      const guardado = await guardarProyectoLocalFP(proyectoActualizado);
      const proyectoFinal = guardado?.ok && guardado.proyecto ? guardado.proyecto : proyectoActualizado;
      actualizarProyectoActivoFP(estadoApp, proyectoFinal);

      if (router?.irA && config.siguiente) {
        router.irA(config.siguiente);
      } else {
        renderizarFP({ root, estadoApp, config, mensaje: guardado?.mensaje || "Decisión guardada." });
      }
    });
  }

  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      if (router?.irA && config.anterior) router.irA(config.anterior);
    });
  }
}
