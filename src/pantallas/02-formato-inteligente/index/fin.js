/* =========================================================
Nombre completo: fin.js
Ruta o ubicación: /src/pantallas/02-formato-inteligente/index/fin.js
Funciones principales:
- Mostrar comparación Antes / Después para cada video.
- Convertir videos a 1080 x 1080 con progreso real.
- Permitir cancelar y reintentar conversiones.
- Guardar el proyecto después de cada video terminado.
- Bloquear el avance hasta que todos los videos estén cuadrados.
========================================================= */

const TAMANO_CUADRADO_FIN = 1080;
const CAPA_ID_FIN = "formato-inteligente";

function escaparHtmlFIN(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clonarFIN(valor) {
  return JSON.parse(JSON.stringify(valor || null));
}

function formatearBytesFIN(bytes) {
  const total = Number(bytes) || 0;
  if (total <= 0) return "";
  if (total < 1024) return `${total} B`;
  if (total < 1024 ** 2) return `${(total / 1024).toFixed(1)} KB`;
  if (total < 1024 ** 3) return `${(total / (1024 ** 2)).toFixed(1)} MB`;
  return `${(total / (1024 ** 3)).toFixed(2)} GB`;
}

function formatearTiempoFIN(segundos) {
  const total = Math.max(0, Math.round(Number(segundos) || 0));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const seg = total % 60;
  return horas > 0
    ? `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(seg).padStart(2, "0")}`
    : `${String(minutos).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
}

function obtenerProyectoFIN(estadoApp) {
  return estadoApp?.obtenerProyectoActivo?.() || null;
}

function obtenerVideosFIN(proyecto) {
  return Array.isArray(proyecto?.videos) ? proyecto.videos : [];
}

function obtenerOriginalFIN(video) {
  const guardado = video?.videoOriginal || video?.formatoCuadrado?.original || null;
  if (guardado?.ruta) return guardado;

  return {
    id: video?.id || "",
    nombre: video?.nombre || "Video",
    ruta: video?.ruta || "",
    url: video?.url || "",
    extension: video?.extension || "",
    pesoBytes: Number(video?.pesoBytes) || 0,
    fechaModificacion: Number(video?.fechaModificacion) || 0,
    duracionSegundos: Number(video?.duracionSegundos || video?.duracion) || 0,
    duracionTexto: video?.duracionTexto || ""
  };
}

function obtenerCuadradoFIN(video) {
  return video?.formatoCuadrado?.aplicado ? video.formatoCuadrado : null;
}

function videoCuadradoListoFIN(video) {
  const cuadrado = obtenerCuadradoFIN(video);
  return Boolean(
    cuadrado?.ruta &&
    cuadrado?.url &&
    Number(cuadrado.ancho) === TAMANO_CUADRADO_FIN &&
    Number(cuadrado.alto) === TAMANO_CUADRADO_FIN
  );
}

function obtenerClaveVideoFIN(video, index) {
  return String(video?.id || video?.videoOriginal?.id || `video-${index}`);
}

function crearCapaFormatoFIN({ proyecto, completos, fallidos }) {
  const fecha = new Date().toISOString();
  const capas = Array.isArray(proyecto?.capas) ? [...proyecto.capas] : [];
  const anterior = capas.find((capa) => capa?.id === CAPA_ID_FIN) || {};
  const total = obtenerVideosFIN(proyecto).length;
  const capa = {
    ...anterior,
    id: CAPA_ID_FIN,
    tipo: "formato",
    nombre: "Formato cuadrado 1:1",
    activa: true,
    estado: fallidos === 0 && completos === total ? "APLICADO" : "PARCIAL",
    ordenFlujo: "02",
    datos: {
      ...(anterior.datos || {}),
      routeId: "02-formato-inteligente",
      formatoObjetivo: "1:1",
      resolucionObjetivo: `${TAMANO_CUADRADO_FIN}x${TAMANO_CUADRADO_FIN}`,
      estrategia: "contenido-completo-con-fondo-difuminado",
      totalVideos: total,
      videosCompletos: completos,
      videosFallidos: fallidos,
      obligatorio: true,
      motor: "ffmpeg"
    },
    creadoEn: anterior.creadoEn || fecha,
    actualizadoEn: fecha
  };

  const indice = capas.findIndex((item) => item?.id === CAPA_ID_FIN);
  if (indice >= 0) capas[indice] = capa;
  else capas.push(capa);
  return capas;
}

function reemplazarVideoProcesadoFIN(video, resultado) {
  const original = obtenerOriginalFIN(video);
  const cuadrado = {
    ...(resultado?.videoCuadrado || {}),
    original,
    diagnosticoOriginal: resultado?.diagnosticoOriginal || null,
    aplicado: true
  };

  return {
    ...video,
    videoOriginal: original,
    formatoCuadrado: cuadrado,
    ruta: cuadrado.ruta,
    url: cuadrado.url,
    extension: cuadrado.extension || "mp4",
    pesoBytes: cuadrado.pesoBytes || video?.pesoBytes || 0,
    fechaModificacion: cuadrado.fechaModificacion || Date.now(),
    formato: "1:1",
    orientacion: "cuadrado",
    resolucion: cuadrado.resolucion || `${TAMANO_CUADRADO_FIN}x${TAMANO_CUADRADO_FIN}`,
    ancho: TAMANO_CUADRADO_FIN,
    alto: TAMANO_CUADRADO_FIN
  };
}

function actualizarProyectoEnMemoriaFIN(estadoApp, proyecto) {
  const estadoGlobal = estadoApp?.obtenerEstado?.() || {};
  estadoApp?.establecerProyectoActivo?.(proyecto, estadoGlobal.rutaProyectoActivo || null);
}

async function guardarProyectoFIN(estadoApp, proyecto) {
  let proyectoFinal = proyecto;
  if (window.videoEditorAPI?.guardarProyectoLocal) {
    const resultado = await window.videoEditorAPI.guardarProyectoLocal(proyecto);
    if (!resultado?.ok) {
      return {
        ok: false,
        proyecto,
        mensaje: resultado?.mensaje || "No se pudo guardar el proyecto local.",
        detalle: resultado?.detalle || ""
      };
    }
    proyectoFinal = resultado.proyecto || proyecto;
  }

  actualizarProyectoEnMemoriaFIN(estadoApp, proyectoFinal);
  return { ok: true, proyecto: proyectoFinal };
}

function crearVideoHtmlFIN({ url, clase = "", etiqueta }) {
  if (!url) {
    return `<div class="fin-preview__empty"><strong>${escaparHtmlFIN(etiqueta || "Sin vista previa")}</strong><span>No se encontró una URL local para reproducir este archivo.</span></div>`;
  }

  return `<video class="fin-video ${escaparHtmlFIN(clase)}" src="${escaparHtmlFIN(url)}" controls preload="metadata" playsinline></video>`;
}

function crearDetalleOriginalFIN({ video, diagnostico }) {
  const original = obtenerOriginalFIN(video);
  const partes = [];
  if (diagnostico?.resolucion) partes.push(diagnostico.resolucion);
  if (diagnostico?.orientacion) partes.push(diagnostico.orientacion);
  if (!diagnostico?.resolucion && original.extension) partes.push(String(original.extension).toUpperCase());
  if (original.pesoBytes) partes.push(formatearBytesFIN(original.pesoBytes));
  return partes.filter(Boolean).join(" · ") || "Formato original";
}

function crearDetalleCuadradoFIN(video) {
  const cuadrado = obtenerCuadradoFIN(video);
  if (!cuadrado) return "Pendiente de conversión";
  return [
    cuadrado.resolucion || `${TAMANO_CUADRADO_FIN}x${TAMANO_CUADRADO_FIN}`,
    "cuadrado 1:1",
    cuadrado.pesoBytes ? formatearBytesFIN(cuadrado.pesoBytes) : ""
  ].filter(Boolean).join(" · ");
}

function crearTarjetaVideoFIN({ video, index, diagnostico, estadoProceso }) {
  const original = obtenerOriginalFIN(video);
  const cuadrado = obtenerCuadradoFIN(video);
  const listo = videoCuadradoListoFIN(video);
  const procesando = estadoProceso.procesandoIndice === index;
  const clave = obtenerClaveVideoFIN(video, index);
  const error = estadoProceso.erroresPorVideo[clave] || "";
  const estadoTexto = listo ? "Cuadrado listo" : procesando ? estadoProceso.etapaTexto || "Procesando..." : error ? "Error" : "Pendiente";
  const estadoClase = listo ? "fin-status--ok" : procesando ? "fin-status--working" : error ? "fin-status--error" : "fin-status--pending";

  return `
    <article class="fin-video-card app-card ${procesando ? "is-processing" : ""}">
      <header class="fin-video-card__header">
        <div><p>Video ${index + 1}</p><h3>${escaparHtmlFIN(original.nombre || video?.nombre || `Video ${index + 1}`)}</h3></div>
        <span class="fin-status ${estadoClase}">${escaparHtmlFIN(estadoTexto)}</span>
      </header>
      <div class="fin-comparison">
        <section class="fin-preview fin-preview--before">
          <div class="fin-preview__title"><span>ANTES</span><strong>Original</strong></div>
          <div class="fin-preview__stage fin-preview__stage--original">${crearVideoHtmlFIN({ url: original.url || video?.url || "", clase: "fin-video--original", etiqueta: "Video original" })}</div>
          <p>${escaparHtmlFIN(crearDetalleOriginalFIN({ video, diagnostico }))}</p>
        </section>
        <div class="fin-comparison__arrow" aria-hidden="true">→</div>
        <section class="fin-preview fin-preview--after">
          <div class="fin-preview__title"><span>DESPUÉS</span><strong>Cuadrado 1:1</strong></div>
          <div class="fin-preview__stage fin-preview__stage--square">
            ${cuadrado?.url
              ? crearVideoHtmlFIN({ url: cuadrado.url, clase: "fin-video--square", etiqueta: "Video cuadrado" })
              : `<div class="fin-preview__empty"><strong>1080 × 1080</strong><span>Se mostrará aquí al terminar la conversión.</span></div>`}
          </div>
          <p>${escaparHtmlFIN(crearDetalleCuadradoFIN(video))}</p>
        </section>
      </div>
      <footer class="fin-video-card__footer"><span>El video completo se conserva centrado.</span><span>Los espacios se rellenan con fondo difuminado.</span></footer>
      ${error ? `<div class="fin-alert fin-alert--error">${escaparHtmlFIN(error)}</div>` : ""}
    </article>`;
}

function crearResumenFIN({ proyecto, videos, completos, procesando }) {
  return `
    <section class="fin-summary app-card">
      <div><p>Pantalla 02</p><h2>Formato cuadrado obligatorio</h2><span>Todo video vertical u horizontal se convierte a 1080 × 1080 antes de continuar.</span></div>
      <div class="fin-summary__stats">
        <div><strong>${videos.length}</strong><span>Videos</span></div>
        <div><strong>${completos}</strong><span>Cuadrados</span></div>
        <div><strong>${Math.max(videos.length - completos, 0)}</strong><span>Pendientes</span></div>
      </div>
      <div class="fin-summary__project"><small>Proyecto activo</small><strong>${escaparHtmlFIN(proyecto?.nombre || "Sin proyecto")}</strong><span>${procesando ? "Conversión activa con progreso real." : "Objetivo final: relación 1:1."}</span></div>
    </section>`;
}

function crearAccionesFIN({ todosListos, procesando }) {
  return `
    <section class="fin-toolbar app-card">
      <div class="fin-toolbar__text"><strong>${todosListos ? "Comparación terminada" : "Convierte los videos pendientes"}</strong><span>${todosListos ? "Revisa el antes y el después. Ya puedes continuar." : "Cada resultado se guarda inmediatamente al terminar."}</span></div>
      <div class="fin-toolbar__actions">
        ${procesando
          ? `<button id="finBtnCancelar" class="app-btn app-btn--danger" type="button">Cancelar conversión</button>`
          : todosListos
            ? `<button id="finBtnRegenerarTodos" class="app-btn app-btn--ghost" type="button">Regenerar todos</button>`
            : `<button id="finBtnProcesarTodos" class="app-btn" type="button">Convertir pendientes</button>`}
        <button id="finBtnContinuar" class="app-btn" type="button" ${todosListos && !procesando ? "" : "disabled"}>Continuar</button>
        <button id="finBtnVolver" class="app-btn app-btn--ghost" type="button" ${procesando ? "disabled" : ""}>Volver</button>
      </div>
    </section>`;
}

function crearProgresoFIN(estadoProceso, total) {
  if (!estadoProceso.procesando) return "";
  const actual = Math.max(1, estadoProceso.procesandoIndice + 1);
  const porcentajeVideo = Math.max(0, Math.min(100, Number(estadoProceso.porcentajeVideo) || 0));
  const completadosAntes = Math.max(0, Number(estadoProceso.completadosAntes) || 0);
  const porcentajeLote = total > 0 ? Math.round(((completadosAntes + porcentajeVideo / 100) / total) * 100) : 0;

  return `
    <section class="fin-progress app-card" aria-live="polite">
      <div class="fin-progress__head">
        <strong>Video ${actual} de ${total} · <span id="finPorcentajeVideo">${porcentajeVideo}%</span></strong>
        <span id="finMensajeProceso">${escaparHtmlFIN(estadoProceso.mensajeProceso || "Preparando conversión...")}</span>
      </div>
      <div class="fin-progress__meta">
        <span id="finTiempoProceso">${formatearTiempoFIN(estadoProceso.tiempoProcesado)} de ${formatearTiempoFIN(estadoProceso.duracionSegundos)}</span>
        <span id="finVelocidadProceso">${escaparHtmlFIN(estadoProceso.velocidad || "Esperando datos de FFmpeg")}</span>
        <span id="finPorcentajeLote">Lote ${porcentajeLote}%</span>
      </div>
      <div class="fin-progress__track"><span id="finBarraVideo" style="width:${porcentajeVideo}%"></span></div>
    </section>`;
}

function crearEstadoVacioFIN(proyecto) {
  return `<section class="fin-empty app-card"><h2>${proyecto ? "El proyecto no tiene videos" : "No hay un proyecto activo"}</h2><p>Regresa al paso 01, carga los videos y guarda el proyecto.</p><button id="finBtnVolver" class="app-btn" type="button">Volver a Video base</button></section>`;
}

export async function iniciarPantallaFormatoInteligente({ root, router, estadoApp }) {
  const contenedor = root?.querySelector?.("#finRoot") || root;
  const diagnosticos = {};
  const estadoProceso = {
    procesando: false,
    procesandoIndice: -1,
    processId: "",
    cancelarSolicitado: false,
    porcentajeVideo: 0,
    tiempoProcesado: 0,
    duracionSegundos: 0,
    velocidad: "",
    mensajeProceso: "",
    etapaTexto: "",
    completadosAntes: 0,
    mensajeGeneral: "",
    errorGeneral: "",
    erroresPorVideo: {}
  };

  const proyectoActual = () => obtenerProyectoFIN(estadoApp);

  function actualizarProgresoDOM() {
    const porcentaje = Math.max(0, Math.min(100, Number(estadoProceso.porcentajeVideo) || 0));
    const videos = obtenerVideosFIN(proyectoActual());
    const lote = videos.length
      ? Math.round(((estadoProceso.completadosAntes + porcentaje / 100) / videos.length) * 100)
      : 0;
    const asignar = (id, valor) => {
      const elemento = contenedor?.querySelector?.(`#${id}`);
      if (elemento) elemento.textContent = valor;
    };
    asignar("finPorcentajeVideo", `${porcentaje}%`);
    asignar("finMensajeProceso", estadoProceso.mensajeProceso || "Procesando...");
    asignar("finTiempoProceso", `${formatearTiempoFIN(estadoProceso.tiempoProcesado)} de ${formatearTiempoFIN(estadoProceso.duracionSegundos)}`);
    asignar("finVelocidadProceso", estadoProceso.velocidad || "FFmpeg activo");
    asignar("finPorcentajeLote", `Lote ${lote}%`);
    const barra = contenedor?.querySelector?.("#finBarraVideo");
    if (barra) barra.style.width = `${porcentaje}%`;
  }

  function renderizar() {
    const proyecto = proyectoActual();
    const videos = obtenerVideosFIN(proyecto);
    const completos = videos.filter(videoCuadradoListoFIN).length;
    const todosListos = videos.length > 0 && completos === videos.length;
    if (!contenedor) return;

    if (!proyecto || !videos.length) {
      contenedor.innerHTML = `<section class="fin-screen">${crearEstadoVacioFIN(proyecto)}</section>`;
      conectarEventos();
      return;
    }

    contenedor.innerHTML = `
      <section class="fin-screen">
        ${crearResumenFIN({ proyecto, videos, completos, procesando: estadoProceso.procesando })}
        ${estadoProceso.mensajeGeneral ? `<div class="fin-alert fin-alert--success">${escaparHtmlFIN(estadoProceso.mensajeGeneral)}</div>` : ""}
        ${estadoProceso.errorGeneral ? `<div class="fin-alert fin-alert--error">${escaparHtmlFIN(estadoProceso.errorGeneral)}</div>` : ""}
        ${crearProgresoFIN(estadoProceso, videos.length)}
        ${crearAccionesFIN({ todosListos, procesando: estadoProceso.procesando })}
        <section class="fin-video-list">${videos.map((video, index) => crearTarjetaVideoFIN({ video, index, diagnostico: diagnosticos[obtenerClaveVideoFIN(video, index)] || null, estadoProceso })).join("")}</section>
      </section>`;
    conectarEventos();
  }

  async function cargarDiagnosticos() {
    const videos = obtenerVideosFIN(proyectoActual());
    if (!window.videoEditorAPI?.inspeccionarVideoFormato) return;

    for (let index = 0; index < videos.length; index += 1) {
      const video = videos[index];
      const clave = obtenerClaveVideoFIN(video, index);
      if (diagnosticos[clave]) continue;
      try {
        const resultado = await window.videoEditorAPI.inspeccionarVideoFormato(video);
        if (resultado?.ok) diagnosticos[clave] = resultado.diagnostico || null;
      } catch (error) {
        console.warn("No se pudo inspeccionar el video:", error);
      }
    }
    renderizar();
  }

  async function guardarAvance(proyectoTrabajo, fallidos) {
    const completos = proyectoTrabajo.videos.filter(videoCuadradoListoFIN).length;
    const proyectoGuardar = {
      ...proyectoTrabajo,
      capas: crearCapaFormatoFIN({ proyecto: proyectoTrabajo, completos, fallidos }),
      pantallaActual: "02-formato-inteligente",
      actualizadoEn: new Date().toISOString()
    };
    return guardarProyectoFIN(estadoApp, proyectoGuardar);
  }

  async function procesarTodos(regenerar = false) {
    if (estadoProceso.procesando) return;
    const proyectoInicial = proyectoActual();
    const videosIniciales = obtenerVideosFIN(proyectoInicial);
    estadoProceso.mensajeGeneral = "";
    estadoProceso.errorGeneral = "";
    estadoProceso.erroresPorVideo = {};

    if (!proyectoInicial || !videosIniciales.length) {
      estadoProceso.errorGeneral = "No hay videos para convertir.";
      renderizar();
      return;
    }
    if (!window.videoEditorAPI?.convertirVideoCuadrado) {
      estadoProceso.errorGeneral = "El motor de formato no está disponible. Abre la app mediante npm start.";
      renderizar();
      return;
    }

    estadoProceso.procesando = true;
    estadoProceso.cancelarSolicitado = false;
    let proyectoTrabajo = clonarFIN(proyectoInicial);
    let exitosos = 0;
    let fallidos = 0;
    renderizar();

    for (let index = 0; index < proyectoTrabajo.videos.length; index += 1) {
      if (estadoProceso.cancelarSolicitado) break;
      const video = proyectoTrabajo.videos[index];
      if (!regenerar && videoCuadradoListoFIN(video)) continue;

      const clave = obtenerClaveVideoFIN(video, index);
      const original = obtenerOriginalFIN(video);
      estadoProceso.procesandoIndice = index;
      estadoProceso.processId = `fin-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`;
      estadoProceso.porcentajeVideo = 0;
      estadoProceso.tiempoProcesado = 0;
      estadoProceso.duracionSegundos = Number(diagnosticos[clave]?.duracionSegundos || original.duracionSegundos) || 0;
      estadoProceso.velocidad = "";
      estadoProceso.etapaTexto = "Inspeccionando";
      estadoProceso.mensajeProceso = `Preparando ${original.nombre || `Video ${index + 1}`}...`;
      estadoProceso.completadosAntes = proyectoTrabajo.videos.filter(videoCuadradoListoFIN).length;
      renderizar();

      try {
        const resultado = await window.videoEditorAPI.convertirVideoCuadrado({
          video,
          processId: estadoProceso.processId,
          proyectoId: proyectoTrabajo.id || "",
          proyectoNombre: proyectoTrabajo.nombre || ""
        });

        if (resultado?.cancelado || estadoProceso.cancelarSolicitado) break;
        if (!resultado?.ok || !resultado.videoCuadrado?.ruta) {
          fallidos += 1;
          estadoProceso.erroresPorVideo[clave] = resultado?.detalle || resultado?.mensaje || "No se pudo generar la versión cuadrada.";
          renderizar();
          continue;
        }

        proyectoTrabajo.videos[index] = reemplazarVideoProcesadoFIN(video, resultado);
        diagnosticos[clave] = resultado.diagnosticoOriginal || diagnosticos[clave] || null;
        exitosos += 1;
        proyectoTrabajo = { ...proyectoTrabajo, videos: [...proyectoTrabajo.videos], actualizadoEn: new Date().toISOString() };

        const guardadoParcial = await guardarAvance(proyectoTrabajo, fallidos);
        if (!guardadoParcial.ok) {
          fallidos += 1;
          estadoProceso.erroresPorVideo[clave] = `El video se convirtió, pero no se pudo guardar el proyecto. ${guardadoParcial.mensaje || ""}`.trim();
        } else {
          proyectoTrabajo = clonarFIN(guardadoParcial.proyecto);
        }
        renderizar();
      } catch (error) {
        fallidos += 1;
        estadoProceso.erroresPorVideo[clave] = error.message || "Error inesperado durante la conversión.";
        renderizar();
      }
    }

    const guardadoFinal = await guardarAvance(proyectoTrabajo, fallidos);
    estadoProceso.procesando = false;
    estadoProceso.procesandoIndice = -1;
    estadoProceso.processId = "";
    estadoProceso.porcentajeVideo = 0;
    estadoProceso.mensajeProceso = "";
    estadoProceso.etapaTexto = "";

    const completos = obtenerVideosFIN(guardadoFinal.proyecto || proyectoTrabajo).filter(videoCuadradoListoFIN).length;
    if (!guardadoFinal.ok) {
      estadoProceso.errorGeneral = `${guardadoFinal.mensaje || "No se pudo guardar el proyecto."} ${guardadoFinal.detalle || ""}`.trim();
    } else if (estadoProceso.cancelarSolicitado) {
      estadoProceso.errorGeneral = "Conversión cancelada. Los videos terminados antes de cancelar quedaron guardados.";
    } else if (fallidos > 0) {
      estadoProceso.errorGeneral = `${exitosos} video(s) convertido(s) y ${fallidos} con error. Usa Convertir pendientes para reintentar.`;
    } else {
      estadoProceso.mensajeGeneral = `${completos} video(s) cuadrados y guardados. Revisa el antes y el después.`;
    }
    renderizar();
  }

  async function cancelar() {
    if (!estadoProceso.procesando || !estadoProceso.processId) return;
    estadoProceso.cancelarSolicitado = true;
    estadoProceso.mensajeProceso = "Cancelando conversión y limpiando archivo incompleto...";
    actualizarProgresoDOM();
    try {
      await window.videoEditorAPI?.cancelarConversionFormato?.(estadoProceso.processId);
    } catch (error) {
      estadoProceso.errorGeneral = `No se pudo solicitar la cancelación. ${error.message || ""}`.trim();
    }
  }

  async function continuar() {
    const proyecto = proyectoActual();
    const videos = obtenerVideosFIN(proyecto);
    const completos = videos.filter(videoCuadradoListoFIN).length;
    if (!videos.length || completos !== videos.length) {
      estadoProceso.errorGeneral = "Debes convertir todos los videos a cuadrado antes de continuar.";
      renderizar();
      return;
    }

    const proyectoListo = {
      ...clonarFIN(proyecto),
      capas: crearCapaFormatoFIN({ proyecto, completos, fallidos: 0 }),
      pantallaActual: "03-transcripcion-analisis",
      actualizadoEn: new Date().toISOString()
    };
    const guardado = await guardarProyectoFIN(estadoApp, proyectoListo);
    if (!guardado.ok) {
      estadoProceso.errorGeneral = guardado.mensaje || "No se pudo guardar el formato cuadrado.";
      renderizar();
      return;
    }
    await router?.irA?.("03-transcripcion-analisis");
  }

  function conectarEventos() {
    contenedor?.querySelector?.("#finBtnProcesarTodos")?.addEventListener("click", () => procesarTodos(false), { once: true });
    contenedor?.querySelector?.("#finBtnRegenerarTodos")?.addEventListener("click", () => procesarTodos(true), { once: true });
    contenedor?.querySelector?.("#finBtnCancelar")?.addEventListener("click", cancelar, { once: true });
    contenedor?.querySelector?.("#finBtnContinuar")?.addEventListener("click", continuar, { once: true });
    contenedor?.querySelector?.("#finBtnVolver")?.addEventListener("click", () => router?.irA?.("01-video-base-diagnostico"), { once: true });
  }

  if (window.videoEditorAPI?.escucharProgresoFormato) {
    window.videoEditorAPI.dejarEscucharProgresoFormato?.();
    window.videoEditorAPI.escucharProgresoFormato((datos) => {
      if (!datos || datos.processId !== estadoProceso.processId) return;
      estadoProceso.porcentajeVideo = Number(datos.porcentaje) || 0;
      estadoProceso.tiempoProcesado = Number(datos.tiempoProcesado) || 0;
      estadoProceso.duracionSegundos = Number(datos.duracionSegundos) || estadoProceso.duracionSegundos || 0;
      estadoProceso.velocidad = datos.velocidad ? `Velocidad ${datos.velocidad}` : "FFmpeg activo";
      estadoProceso.mensajeProceso = datos.mensaje || estadoProceso.mensajeProceso;
      estadoProceso.etapaTexto = datos.etapa === "validando" ? "Validando" : datos.etapa === "inspeccionando" ? "Inspeccionando" : "Convirtiendo";
      actualizarProgresoDOM();
    });
  }

  const observador = new MutationObserver(() => {
    if (!document.body.contains(contenedor)) {
      window.videoEditorAPI?.dejarEscucharProgresoFormato?.();
      observador.disconnect();
    }
  });
  observador.observe(document.body, { childList: true, subtree: true });

  renderizar();
  cargarDiagnosticos();
}
