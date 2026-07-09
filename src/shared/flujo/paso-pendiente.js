/* =========================================================
Nombre completo: paso-pendiente.js
Ruta o ubicación: /src/shared/flujo/paso-pendiente.js
Funciones principales:
- Renderizar pantallas funcionales de pasos todavía no automatizados.
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
    return { ok: false, omitido: true };
  }

  return await window.videoEditorAPI.guardarProyectoLocal(proyecto);
}

function crearCapaPasoFP({ proyecto, config }) {
  const proyectoBase = clonarSeguroFP(proyecto);
  const fecha = new Date().toISOString();
  const capas = Array.isArray(proyectoBase.capas) ? [...proyectoBase.capas] : [];
  const capaId = config.capaId || `paso-${config.routeId}`;
  const capaNueva = {
    id: capaId,
    tipo: config.tipo || "decision",
    nombre: config.titulo || config.nombre || "Paso del flujo",
    activa: true,
    estado: "PLANIFICADO",
    datos: {
      routeId: config.routeId,
      numero: config.numero,
      descripcion: config.descripcion,
      criterio: config.criterio,
      acciones: Array.isArray(config.acciones) ? config.acciones : [],
      nota: "Capa funcional provisional: conserva la decisión del flujo hasta construir el motor automático real."
    },
    creadoEn: fecha,
    actualizadoEn: fecha
  };

  const index = capas.findIndex((capa) => capa.id === capaId);
  if (index >= 0) capas[index] = { ...capas[index], ...capaNueva, actualizadoEn: fecha };
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

function renderizarFP({ root, estadoApp, config, mensaje = "" }) {
  const proyecto = obtenerProyectoActivoFP(estadoApp);
  const videos = Array.isArray(proyecto?.videos) ? proyecto.videos : [];
  const capas = Array.isArray(proyecto?.capas) ? proyecto.capas : [];
  const capaExiste = capas.some((capa) => capa.id === (config.capaId || `paso-${config.routeId}`));

  root.innerHTML = `
    <section class="fp-screen">
      <header class="fp-header app-card">
        <div>
          <p>Pantalla ${escaparHtmlFP(config.numero || "")}</p>
          <h2>${escaparHtmlFP(config.titulo || "Paso del flujo")}</h2>
          <span>${escaparHtmlFP(config.descripcion || "Paso conectado al flujo de edición.")}</span>
        </div>
      </header>

      <main class="fp-grid">
        <aside class="fp-panel app-card">
          <h3>Estado</h3>
          <div class="fp-stat"><strong>Proyecto</strong><span>${escaparHtmlFP(proyecto?.nombre || "Sin proyecto activo")}</span></div>
          <div class="fp-stat"><strong>Videos</strong><span>${videos.length}</span></div>
          <div class="fp-stat"><strong>Capas guardadas</strong><span>${capas.length}</span></div>
          <div class="fp-stat"><strong>Este paso</strong><span>${capaExiste ? "Guardado" : "Pendiente"}</span></div>
          ${mensaje ? `<div class="fp-message">${escaparHtmlFP(mensaje)}</div>` : ""}
        </aside>

        <section class="fp-panel app-card">
          <h3>Qué hará este paso</h3>
          <p>${escaparHtmlFP(config.criterio || "Este paso queda conectado para no romper el flujo final.")}</p>
          ${crearListaAccionesFP(config.acciones)}

          <div class="fp-actions">
            <button id="${escaparHtmlFP(config.botonId)}" class="app-btn" type="button" ${proyecto ? "" : "disabled"}>
              ${capaExiste ? "Continuar" : "Guardar decisión y continuar"}
            </button>
            <button id="${escaparHtmlFP(config.botonVolverId)}" class="app-btn app-btn--ghost" type="button">
              Volver
            </button>
          </div>
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

      const proyectoActualizado = crearCapaPasoFP({ proyecto, config });
      const guardado = await guardarProyectoLocalFP(proyectoActualizado);
      const proyectoFinal = guardado?.ok && guardado.proyecto ? guardado.proyecto : proyectoActualizado;
      actualizarProyectoActivoFP(estadoApp, proyectoFinal);

      if (router?.irA && config.siguiente) {
        router.irA(config.siguiente);
      } else {
        renderizarFP({ root, estadoApp, config, mensaje: "Decisión guardada." });
      }
    });
  }

  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      if (router?.irA && config.anterior) router.irA(config.anterior);
    });
  }
}
