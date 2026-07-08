/* =========================================================
Nombre completo: sa.js
Ruta o ubicación: /src/pantallas/04-subtitulos-automaticos/index/sa.js
Funciones principales:
- Iniciar la pantalla Subtítulos automáticos.
- Leer el proyecto activo desde estadoApp.
- Verificar qué videos tienen transcripción guardada.
- Generar subtítulos reales desde los segmentos de transcripción.
- Guardar los subtítulos dentro del proyecto activo y como capa por video.
- Mostrar resumen y vista previa de los subtítulos preparados.
Con qué se conecta:
- sa.html
- sa.css
- estadoApp.proyectoActivo
- router.js
- window.videoEditorAPI.guardarProyectoLocal
========================================================= */

const SA_CAPA_SUBTITULOS = Object.freeze({
  id: "subtitulos-automaticos",
  tipo: "subtitulos",
  nombre: "Subtítulos automáticos",
  activa: true
});

function escaparHtmlSA(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function limpiarTextoSA(valor) {
  return String(valor ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function clonarSeguroSA(valor) {
  try {
    return JSON.parse(JSON.stringify(valor || null));
  } catch (error) {
    return null;
  }
}

function obtenerProyectoActivoSA(estadoApp) {
  if (!estadoApp?.obtenerProyectoActivo) {
    return null;
  }

  return estadoApp.obtenerProyectoActivo();
}

function actualizarProyectoActivoSA(estadoApp, proyecto) {
  if (!estadoApp?.establecerProyectoActivo) {
    return;
  }

  const estadoGlobal = estadoApp.obtenerEstado?.() || {};
  estadoApp.establecerProyectoActivo(
    proyecto,
    estadoGlobal.rutaProyectoActivo || null
  );
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

function obtenerSubtitulosPreparadosSA(video) {
  if (Array.isArray(video?.subtitulosAutomaticos?.subtitulos)) {
    return video.subtitulosAutomaticos.subtitulos;
  }

  if (Array.isArray(video?.subtitulos)) {
    return video.subtitulos;
  }

  return [];
}

function videoTieneSubtitulosSA(video) {
  return obtenerSubtitulosPreparadosSA(video).length > 0;
}

function contarPalabrasSA(transcripcion) {
  const texto = limpiarTextoSA(transcripcion?.texto || "");

  if (!texto) {
    return 0;
  }

  return texto.split(/\s+/).filter(Boolean).length;
}

function crearResumenSA(proyecto) {
  const videos = obtenerVideosSA(proyecto);
  const listos = videos.filter((video) => obtenerTranscripcionSA(video));
  const conSubtitulos = videos.filter((video) => videoTieneSubtitulosSA(video));
  const totalSubtitulos = videos.reduce((total, video) => {
    return total + obtenerSubtitulosPreparadosSA(video).length;
  }, 0);
  const pendientes = Math.max(videos.length - listos.length, 0);

  return {
    videos,
    total: videos.length,
    listos: listos.length,
    pendientes,
    conSubtitulos: conSubtitulos.length,
    totalSubtitulos,
    puedePreparar: videos.length > 0 && pendientes === 0
  };
}

function normalizarSegundosSA(valor, respaldo = 0) {
  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    return Math.max(0, Number(respaldo) || 0);
  }

  return Math.round(numero * 1000) / 1000;
}

function formatearTiempoSrtSA(segundosEntrada) {
  const totalMilisegundos = Math.max(0, Math.round(normalizarSegundosSA(segundosEntrada) * 1000));
  const horas = Math.floor(totalMilisegundos / 3600000);
  const minutos = Math.floor((totalMilisegundos % 3600000) / 60000);
  const segundos = Math.floor((totalMilisegundos % 60000) / 1000);
  const milisegundos = totalMilisegundos % 1000;

  return [
    String(horas).padStart(2, "0"),
    String(minutos).padStart(2, "0"),
    String(segundos).padStart(2, "0")
  ].join(":") + `,${String(milisegundos).padStart(3, "0")}`;
}

function formatearTiempoCortoSA(segundosEntrada) {
  const totalSegundos = Math.max(0, Math.round(normalizarSegundosSA(segundosEntrada)));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;

  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function obtenerTextoSegmentoSA(segmento) {
  return limpiarTextoSA(segmento?.texto || segmento?.text || "");
}

function dividirTextoEnBloquesSA(texto, palabrasPorBloque = 10) {
  const palabras = limpiarTextoSA(texto).split(/\s+/).filter(Boolean);
  const bloques = [];

  for (let i = 0; i < palabras.length; i += palabrasPorBloque) {
    const bloque = palabras.slice(i, i + palabrasPorBloque).join(" ");
    if (bloque) {
      bloques.push(bloque);
    }
  }

  return bloques;
}

function crearSegmentosEstimadosSA(transcripcion) {
  const bloques = dividirTextoEnBloquesSA(transcripcion?.texto || "");
  let cursor = 0;

  return bloques.map((texto, index) => {
    const palabras = texto.split(/\s+/).filter(Boolean).length;
    const duracion = Math.max(2.2, Math.min(6, (palabras / 145) * 60));
    const inicio = cursor;
    const fin = inicio + duracion;
    cursor = fin;

    return {
      id: `segmento-estimado-${index + 1}`,
      indice: index + 1,
      inicio,
      fin,
      texto,
      estimado: true
    };
  });
}

function normalizarSegmentosSA(transcripcion) {
  const segmentosBase = Array.isArray(transcripcion?.segmentos)
    ? transcripcion.segmentos
    : [];
  const fuente = segmentosBase.length ? segmentosBase : crearSegmentosEstimadosSA(transcripcion);
  let ultimoFin = 0;

  return fuente
    .map((segmento, index) => {
      const texto = obtenerTextoSegmentoSA(segmento);

      if (!texto) {
        return null;
      }

      const inicioBase = segmento?.inicio ?? segmento?.start ?? ultimoFin;
      const inicio = Math.max(ultimoFin, normalizarSegundosSA(inicioBase, ultimoFin));
      const finBase = segmento?.fin ?? segmento?.end ?? inicio + 3;
      const fin = Math.max(inicio + 0.5, normalizarSegundosSA(finBase, inicio + 3));
      ultimoFin = fin;

      return {
        id: segmento?.id || `subtitulo-${index + 1}`,
        indice: index + 1,
        inicio,
        fin,
        duracion: Math.round((fin - inicio) * 1000) / 1000,
        inicioTexto: segmento?.inicioTexto || formatearTiempoCortoSA(inicio),
        finTexto: segmento?.finTexto || formatearTiempoCortoSA(fin),
        inicioSrt: segmento?.inicioSrt || formatearTiempoSrtSA(inicio),
        finSrt: segmento?.finSrt || formatearTiempoSrtSA(fin),
        texto,
        estimado: Boolean(segmento?.estimado)
      };
    })
    .filter(Boolean);
}

function crearTextoSrtSA(subtitulos) {
  return subtitulos
    .map((subtitulo, index) => {
      return [
        String(index + 1),
        `${subtitulo.inicioSrt} --> ${subtitulo.finSrt}`,
        subtitulo.texto
      ].join("\n");
    })
    .join("\n\n");
}

function crearIdCapaSubtitulosSA(videoId) {
  return `${SA_CAPA_SUBTITULOS.id}-${videoId}`;
}

function crearSubtitulosVideoSA(video) {
  const transcripcion = obtenerTranscripcionSA(video);

  if (!transcripcion?.texto) {
    return {
      ok: false,
      video,
      mensaje: `${video?.nombre || "Video"}: no tiene transcripción guardada.`
    };
  }

  const subtitulos = normalizarSegmentosSA(transcripcion).map((segmento, index) => ({
    id: `${video?.id || "video"}-subtitulo-${index + 1}`,
    videoId: video?.id || "",
    indice: index + 1,
    inicio: segmento.inicio,
    fin: segmento.fin,
    duracion: segmento.duracion,
    inicioTexto: segmento.inicioTexto,
    finTexto: segmento.finTexto,
    inicioSrt: segmento.inicioSrt,
    finSrt: segmento.finSrt,
    texto: segmento.texto,
    estimado: segmento.estimado,
    origen: "transcripcion"
  }));

  if (!subtitulos.length) {
    return {
      ok: false,
      video,
      mensaje: `${video?.nombre || "Video"}: la transcripción no tiene texto suficiente para subtítulos.`
    };
  }

  const srt = crearTextoSrtSA(subtitulos);

  return {
    ok: true,
    video,
    subtitulos,
    srt,
    total: subtitulos.length,
    mensaje: `${video?.nombre || "Video"}: ${subtitulos.length} subtítulo(s) preparado(s).`
  };
}

function crearCapaSubtitulosSA({ video, resultado }) {
  const fecha = new Date().toISOString();

  return {
    ...SA_CAPA_SUBTITULOS,
    id: crearIdCapaSubtitulosSA(video.id),
    videoId: video.id,
    nombre: `Subtítulos automáticos - ${video.nombre || "video"}`,
    activa: true,
    datos: {
      formato: "SRT",
      total: resultado.total,
      subtitulos: resultado.subtitulos,
      srt: resultado.srt,
      videoOriginal: {
        id: video.id,
        nombre: video.nombre,
        ruta: video.ruta,
        url: video.url
      }
    },
    creadoEn: fecha,
    actualizadoEn: fecha
  };
}

function agregarOActualizarCapaSA(capasActuales, capaNueva) {
  const capas = Array.isArray(capasActuales) ? [...capasActuales] : [];
  const index = capas.findIndex((capa) => capa.id === capaNueva.id);

  if (index >= 0) {
    capas[index] = {
      ...capas[index],
      ...capaNueva,
      actualizadoEn: new Date().toISOString()
    };
  } else {
    capas.push(capaNueva);
  }

  return capas;
}

function actualizarVideoConSubtitulosSA(video, resultado) {
  const fecha = new Date().toISOString();

  return {
    ...video,
    subtitulos: resultado.subtitulos,
    subtitulosAutomaticos: {
      estado: "PREPARADO",
      formato: "SRT",
      total: resultado.total,
      subtitulos: resultado.subtitulos,
      srt: resultado.srt,
      origen: "transcripcion",
      actualizadoEn: fecha
    },
    actualizadoEn: fecha
  };
}

function prepararSubtitulosProyectoSA(proyecto) {
  const proyectoBase = clonarSeguroSA(proyecto);
  const videos = obtenerVideosSA(proyectoBase);
  const errores = [];
  const resultados = [];

  if (!proyectoBase) {
    return {
      ok: false,
      proyecto: null,
      resultados: [],
      errores: ["No hay proyecto activo."],
      mensajes: []
    };
  }

  if (!videos.length) {
    return {
      ok: false,
      proyecto: proyectoBase,
      resultados: [],
      errores: ["No hay videos cargados para preparar subtítulos."],
      mensajes: []
    };
  }

  videos.forEach((video) => {
    const resultado = crearSubtitulosVideoSA(video);

    if (!resultado.ok) {
      errores.push(resultado.mensaje);
      return;
    }

    resultados.push(resultado);
  });

  if (errores.length) {
    return {
      ok: false,
      proyecto: proyectoBase,
      resultados,
      errores,
      mensajes: []
    };
  }

  const resultadosPorVideo = new Map(resultados.map((resultado) => [resultado.video.id, resultado]));
  const videosActualizados = videos.map((video) => {
    const resultado = resultadosPorVideo.get(video.id);
    return resultado ? actualizarVideoConSubtitulosSA(video, resultado) : video;
  });

  let capasActualizadas = Array.isArray(proyectoBase.capas) ? [...proyectoBase.capas] : [];

  videosActualizados.forEach((video) => {
    const resultado = resultadosPorVideo.get(video.id);

    if (!resultado) {
      return;
    }

    capasActualizadas = agregarOActualizarCapaSA(
      capasActualizadas,
      crearCapaSubtitulosSA({ video, resultado })
    );
  });

  const totalSubtitulos = resultados.reduce((total, resultado) => total + resultado.total, 0);
  const fecha = new Date().toISOString();
  const proyectoActualizado = {
    ...proyectoBase,
    videos: videosActualizados,
    capas: capasActualizadas,
    pantallaActual: "04-subtitulos-automaticos",
    subtitulosAutomaticos: {
      estado: "PREPARADO",
      totalVideos: videosActualizados.length,
      totalSubtitulos,
      formato: "SRT",
      actualizadoEn: fecha
    },
    actualizadoEn: fecha
  };

  return {
    ok: true,
    proyecto: proyectoActualizado,
    resultados,
    totalVideos: videosActualizados.length,
    totalSubtitulos,
    errores: [],
    mensajes: [`Subtítulos preparados para ${videosActualizados.length} video(s).`]
  };
}

async function guardarProyectoLocalSA(proyecto) {
  if (!window.videoEditorAPI?.guardarProyectoLocal) {
    return {
      ok: false,
      omitido: true,
      proyecto,
      mensaje: "Proyecto actualizado en memoria. Abre con Electron para guardar el respaldo local."
    };
  }

  return await window.videoEditorAPI.guardarProyectoLocal(proyecto);
}

function crearResultadoHtmlSA(resultado) {
  if (!resultado) {
    return "";
  }

  if (!resultado.ok) {
    return `
      <div class="sa-empty">
        <div>
          <h3>No se pudieron preparar los subtítulos</h3>
          ${(resultado.errores || []).map((error) => `<p>${escaparHtmlSA(error)}</p>`).join("")}
        </div>
      </div>
    `;
  }

  return `
    <div class="sa-empty">
      <div>
        <h3>Subtítulos preparados</h3>
        <p>${escaparHtmlSA(resultado.totalVideos)} video(s) · ${escaparHtmlSA(resultado.totalSubtitulos)} subtítulo(s) en formato SRT.</p>
        ${(resultado.mensajes || []).map((mensaje) => `<p>${escaparHtmlSA(mensaje)}</p>`).join("")}
      </div>
    </div>
  `;
}

function crearVistaPreviaSubtitulosSA(subtitulos) {
  const vista = subtitulos.slice(0, 3);

  if (!vista.length) {
    return "";
  }

  return `
    <div class="sa-preview">
      <p><strong>Vista previa</strong></p>
      ${vista.map((subtitulo) => `
        <p>
          <small>${escaparHtmlSA(subtitulo.inicioTexto)} - ${escaparHtmlSA(subtitulo.finTexto)}</small><br>
          ${escaparHtmlSA(subtitulo.texto)}
        </p>
      `).join("")}
    </div>
  `;
}

function renderResumenSA({ contenedor, proyecto, resultado = null }) {
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
      <div class="sa-stat">
        <strong>Con subtítulos</strong>
        <span>${escaparHtmlSA(resumen.conSubtitulos)}</span>
      </div>
      <div class="sa-stat">
        <strong>Total subtítulos</strong>
        <span>${escaparHtmlSA(resumen.totalSubtitulos)}</span>
      </div>
    </div>

    ${resultado ? crearResultadoHtmlSA(resultado) : ""}
  `;
}

function renderVideosSA({ contenedor, proyecto, resultado = null }) {
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
        const subtitulos = obtenerSubtitulosPreparadosSA(video);
        const segmentos = Array.isArray(transcripcion?.segmentos) ? transcripcion.segmentos.length : 0;
        const palabras = contarPalabrasSA(transcripcion);
        const listo = Boolean(transcripcion?.texto);
        const preparado = subtitulos.length > 0;

        return `
          <article class="sa-video-card ${listo ? "is-ready" : "is-pending"}">
            <div class="sa-video-card__head">
              <strong>${escaparHtmlSA(index + 1)}. ${escaparHtmlSA(video.nombre || "Video")}</strong>
              <span class="sa-chip">${preparado ? "Subtítulos preparados" : listo ? "Listo" : "Pendiente"}</span>
            </div>
            <p>${listo
              ? `${escaparHtmlSA(palabras)} palabras · ${escaparHtmlSA(segmentos)} bloques de tiempo · ${escaparHtmlSA(subtitulos.length)} subtítulo(s).`
              : "Este video todavía no tiene transcripción guardada."}</p>
            ${preparado ? crearVistaPreviaSubtitulosSA(subtitulos) : ""}
          </article>
        `;
      }).join("")}
    </div>
    ${resultado ? crearResultadoHtmlSA(resultado) : ""}
  `;
}

function conectarEventosSA({ router, estadoApp, proyecto }) {
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

  if (!btnContinuar) {
    return;
  }

  btnContinuar.disabled = !resumen.puedePreparar;
  btnContinuar.textContent = resumen.puedePreparar
    ? (resumen.conSubtitulos === resumen.total ? "Reconstruir subtítulos" : "Preparar subtítulos")
    : "Faltan transcripciones";

  btnContinuar.addEventListener("click", async () => {
    const proyectoActual = obtenerProyectoActivoSA(estadoApp) || proyecto;
    const contenedorResumen = document.getElementById("saResumen");
    const contenedorVideos = document.getElementById("saVideos");

    btnContinuar.disabled = true;
    btnContinuar.textContent = "Preparando subtítulos...";

    try {
      const resultado = prepararSubtitulosProyectoSA(proyectoActual);

      if (!resultado.ok) {
        renderResumenSA({ contenedor: contenedorResumen, proyecto: proyectoActual, resultado });
        renderVideosSA({ contenedor: contenedorVideos, proyecto: proyectoActual, resultado });
        btnContinuar.disabled = false;
        btnContinuar.textContent = "Reintentar preparar subtítulos";
        return;
      }

      let proyectoFinal = resultado.proyecto;
      const guardadoLocal = await guardarProyectoLocalSA(proyectoFinal);

      if (guardadoLocal?.ok && guardadoLocal.proyecto) {
        proyectoFinal = {
          ...guardadoLocal.proyecto,
          subtitulosAutomaticos: resultado.proyecto.subtitulosAutomaticos
        };
        resultado.proyecto = proyectoFinal;
        resultado.mensajes = [
          ...(resultado.mensajes || []),
          guardadoLocal.mensaje || "Respaldo local actualizado."
        ];
      } else if (guardadoLocal?.mensaje) {
        resultado.mensajes = [
          ...(resultado.mensajes || []),
          guardadoLocal.mensaje
        ];
      }

      actualizarProyectoActivoSA(estadoApp, proyectoFinal);
      renderResumenSA({ contenedor: contenedorResumen, proyecto: proyectoFinal, resultado });
      renderVideosSA({ contenedor: contenedorVideos, proyecto: proyectoFinal, resultado });
      btnContinuar.textContent = "Subtítulos preparados";
    } catch (error) {
      const resultadoError = {
        ok: false,
        proyecto: proyectoActual,
        resultados: [],
        errores: [error?.message || "No se pudieron preparar los subtítulos."],
        mensajes: []
      };

      renderResumenSA({ contenedor: contenedorResumen, proyecto: proyectoActual, resultado: resultadoError });
      renderVideosSA({ contenedor: contenedorVideos, proyecto: proyectoActual, resultado: resultadoError });
      btnContinuar.disabled = false;
      btnContinuar.textContent = "Reintentar preparar subtítulos";
    }
  });
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

  conectarEventosSA({ router, estadoApp, proyecto });
}
