const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';

let ultimoResultadoEntendimiento = null;
let transcripcionActivaId = 'principal';

function $(id) { return document.getElementById(id); }
function texto(valor, respaldo = '—') { const limpio = String(valor ?? '').trim(); return limpio || respaldo; }
function escapar(valor) { return texto(valor, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function numero(valor) { const n = Number(valor); return Number.isFinite(n) ? n : null; }
function tieneTexto(valor) { return Boolean(String(valor ?? '').trim()); }

function normalizarTexto(valor = '') {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function textoEsPendiente(valor = '') {
  const limpio = normalizarTexto(valor).replace(/[.。]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!limpio) return true;
  const restante = limpio
    .replace(/transcripcion pendiente/g, '')
    .replace(/texto pendiente/g, '')
    .replace(/sin texto transcrito todavia/g, '')
    .replace(/sin texto transcrito/g, '')
    .replace(/transcripcion no disponible/g, '')
    .replace(/sin transcripcion/g, '')
    .replace(/[\s.:-]/g, '')
    .trim();
  return restante.length === 0;
}

function textoEsUtil(valor = '') {
  const limpio = texto(valor, '');
  return Boolean(limpio && !textoEsPendiente(limpio));
}

function transcripcionTieneTextoUtil(transcripcion = {}) {
  if (textoEsUtil(transcripcion?.textoCompleto || transcripcion?.texto)) return true;
  const segmentos = Array.isArray(transcripcion?.segmentos) ? transcripcion.segmentos : [];
  return segmentos.some((segmento) => textoEsUtil(segmento.texto || segmento.text || segmento.nota));
}

function contarPalabrasUtiles(valor = '') {
  if (!textoEsUtil(valor)) return 0;
  return String(valor || '').split(/\s+/).map((item) => item.trim()).filter(Boolean).length;
}

async function obtenerBaseApi() {
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try {
      const estado = await apiElectron();
      if (estado?.url) return estado.url;
    } catch (error) {
      console.warn('[Entendimiento UI] No se pudo leer servidor Electron:', error.message);
    }
  }
  return window.location.origin;
}

async function api(ruta, opciones = {}) {
  const base = await obtenerBaseApi();
  const respuesta = await fetch(`${base}${ruta}`, opciones);
  const textoRespuesta = await respuesta.text();
  let datos = {};
  try { datos = textoRespuesta ? JSON.parse(textoRespuesta) : {}; } catch (_error) { datos = { ok: false, mensaje: textoRespuesta }; }
  if (!respuesta.ok || datos.ok === false) throw new Error(datos.mensaje || `Error HTTP ${respuesta.status}`);
  return datos;
}

function obtenerProyectoId() {
  const input = $('entendimientoProyectoId');
  const desdeInput = input?.value?.trim();
  if (desdeInput) return desdeInput;
  return localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
}

function guardarProyectoId(proyectoId) {
  if (!proyectoId) return;
  localStorage.setItem(STORAGE_PROYECTO_ETAPAS, proyectoId);
  const input = $('entendimientoProyectoId');
  if (input && !input.value) input.value = proyectoId;
}

function setMensaje(mensaje, tipo = 'normal') {
  const box = $('entendimientoMensaje');
  if (!box) return;
  box.hidden = false;
  box.textContent = mensaje;
  box.className = `entendimiento-message is-${tipo}`;
}

function ocultarMensaje() {
  const box = $('entendimientoMensaje');
  if (!box) return;
  box.hidden = true;
  box.textContent = '';
}

function setChip(textoChip, tipo = 'normal') {
  const chip = $('entendimientoEstadoChip');
  if (!chip) return;
  chip.textContent = textoChip;
  chip.className = `aj-status-chip entendimiento-chip is-${tipo}`;
}

function extraerResultado(payload = {}) {
  const wrapper = payload.resultado || payload;
  if (wrapper?.resultado) return wrapper.resultado;
  if (wrapper?.datos?.resultado) return wrapper.datos.resultado;
  return wrapper;
}

function obtenerResumen(resultado = {}) {
  return resultado.resumenEtapa || resultado.resumen || resultado.reporteEntendimiento?.resumen || {};
}

function obtenerLineaTiempo(resultado = {}) {
  return resultado.lineaTiempoGlobal || resultado.entendimientoGlobal?.lineaTiempoGlobal || {};
}

function obtenerResumenLinea(resultado = {}) {
  return obtenerLineaTiempo(resultado).resumen || {};
}

function obtenerTotalVideos(resultado = {}) {
  const resumen = obtenerResumen(resultado);
  const linea = obtenerResumenLinea(resultado);
  return numero(resumen.videosOriginales ?? resumen.totalVideos ?? linea.totalVideos ?? resultado.multivideo?.totalVideos ?? resultado.videosEntendimiento?.totalValidos) || 1;
}

function esMultivideo(resultado = {}) {
  return Boolean(obtenerTotalVideos(resultado) > 1 || resultado.multivideo?.activo || obtenerResumen(resultado).esMultivideo);
}

function formatearDuracion(segundos) {
  const valor = numero(segundos);
  if (valor === null) return '—';
  const total = Math.max(0, Math.round(valor));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const seg = total % 60;
  if (horas) return `${horas}h ${String(minutos).padStart(2, '0')}m ${String(seg).padStart(2, '0')}s`;
  if (minutos) return `${minutos}m ${String(seg).padStart(2, '0')}s`;
  return `${seg}s`;
}

function obtenerSrcFrame(frame = {}) {
  const src = frame.urlPublica || frame.rutaPublica || frame.rutaPreviewPublica || frame.rutaRelativa || '';
  if (!src) return '';
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  return src.startsWith('/') ? src : `/${src}`;
}

function motorBonito(motor = '') {
  const mapa = {
    principal: 'Principal',
    manual: 'Manual',
    'faster-whisper': 'faster-whisper',
    'whisper-cpp': 'whisper.cpp',
    vosk: 'Vosk',
    gemini: 'Gemini',
    'global-multivideo': 'Global multivideo',
    'transcripcion-simple': 'Simple',
    'modulo-transcripcion': 'Módulo anterior'
  };
  return mapa[motor] || texto(motor, 'Motor');
}

function estadoBonito(estado = '') {
  const mapa = { ok: 'OK', listo: 'Listo', vacia: 'Vacía', omitida: 'Omitida', error: 'Error', pendiente: 'Pendiente', falta_modelo: 'Falta modelo', falta_python_o_paquete: 'Falta Python/paquete', falta_paquete: 'Falta paquete', requiere_configuracion: 'Configurar', opcional: 'Opcional' };
  return mapa[estado] || texto(estado, 'Pendiente');
}

function claseEstadoTranscripcion(opcion = {}) {
  if (opcion.ok || opcion.estado === 'ok') return 'ok';
  if (opcion.estado === 'error') return 'error';
  if (opcion.estado === 'omitida' || opcion.estado === 'vacia' || opcion.estado === 'pendiente') return 'warn';
  return 'normal';
}

function normalizarItemMotor(item = {}, indice = 0) {
  const transcripcion = item.transcripcion || item;
  const motor = item.motor || transcripcion.motor || transcripcion.motorPrincipal || `motor-${indice + 1}`;
  const util = transcripcionTieneTextoUtil(transcripcion);
  const estado = item.estado || transcripcion.estado || (util ? 'ok' : 'pendiente');
  return {
    id: `motor:${motor}`,
    tipo: 'motor',
    motor,
    etiqueta: motorBonito(motor),
    ok: Boolean(item.ok || transcripcion.ok || util),
    estado: util ? 'ok' : estado,
    mensaje: item.mensaje || transcripcion.mensaje || transcripcion.observacion || '',
    resumen: item.resumen || transcripcion.resumen || transcripcion.resumenTranscripcion || null,
    transcripcion,
    error: item.error || transcripcion.error || null
  };
}

function extraerMotoresDesdeResultadosPorVideo(resultado = {}) {
  const lista = [];
  const resultados = Array.isArray(resultado.resultadosPorVideo) ? resultado.resultadosPorVideo : [];
  resultados.forEach((item) => {
    const res = item.resultado || {};
    const motores = [
      ...(Array.isArray(res.transcripcionesPorMotor) ? res.transcripcionesPorMotor : []),
      ...(Array.isArray(res.transcripcion?.transcripcionesPorMotor) ? res.transcripcion.transcripcionesPorMotor : [])
    ];
    motores.forEach((motor) => lista.push({ ...motor, videoId: item.videoId || res.videoId }));
  });
  return lista;
}

function crearOpcionesTranscripcion(resultado = {}) {
  const opciones = [];
  const vistos = new Set();
  const transcripcionBase = resultado.transcripcion || {};
  const principal = resultado.transcripcionGlobal || resultado.transcripcionPrincipal || transcripcionBase.transcripcionPrincipal || (tieneTexto(transcripcionBase.textoCompleto) ? transcripcionBase : null);

  if (principal) {
    const principalEsGlobal = principal.tipo === 'transcripcion-global-multivideo' || resultado.multivideo?.transcripcionGlobal;
    const util = transcripcionTieneTextoUtil(principal);
    opciones.push({
      id: 'principal',
      tipo: 'principal',
      motor: principal.motor || transcripcionBase.motorPrincipal || transcripcionBase.motor || 'principal',
      etiqueta: principalEsGlobal ? 'Global' : 'Principal',
      ok: Boolean(principal.ok || util),
      estado: util ? 'ok' : (principal.estado || 'pendiente'),
      mensaje: principal.mensaje || transcripcionBase.observacion || 'Transcripción principal seleccionada.',
      resumen: principal.resumen || null,
      transcripcion: principal,
      error: principal.error || null
    });
    vistos.add('principal');
  }

  const listaMotores = [
    ...(Array.isArray(resultado.transcripcionesPorMotor) ? resultado.transcripcionesPorMotor : []),
    ...(Array.isArray(resultado.entendimientoGlobal?.transcripcionesPorMotor) ? resultado.entendimientoGlobal.transcripcionesPorMotor : []),
    ...(Array.isArray(transcripcionBase.transcripcionesPorMotor) ? transcripcionBase.transcripcionesPorMotor : []),
    ...extraerMotoresDesdeResultadosPorVideo(resultado)
  ];

  listaMotores.forEach((item, indice) => {
    const normalizado = normalizarItemMotor(item, indice);
    if (vistos.has(normalizado.id)) return;
    vistos.add(normalizado.id);
    opciones.push(normalizado);
  });

  if (!opciones.length) {
    const util = transcripcionTieneTextoUtil(transcripcionBase);
    opciones.push({
      id: 'base',
      tipo: 'base',
      motor: transcripcionBase.motor || 'transcripcion-simple',
      etiqueta: motorBonito(transcripcionBase.motor || 'transcripcion-simple'),
      ok: util,
      estado: util ? 'ok' : 'pendiente',
      mensaje: transcripcionBase.mensaje || transcripcionBase.observacion || 'Transcripción pendiente.',
      resumen: transcripcionBase.resumen || null,
      transcripcion: transcripcionBase,
      error: transcripcionBase.error || null
    });
  }

  return opciones;
}

function obtenerOpcionTranscripcionActiva() {
  if (!ultimoResultadoEntendimiento) return null;
  const opciones = crearOpcionesTranscripcion(ultimoResultadoEntendimiento);
  return opciones.find((opcion) => opcion.id === transcripcionActivaId) || opciones[0] || null;
}

function aplicarPrincipalEnResultadoLocal(seleccion = {}) {
  const principal = seleccion.transcripcionPrincipal || seleccion.principal?.transcripcion || null;
  if (!ultimoResultadoEntendimiento || !principal) return;
  ultimoResultadoEntendimiento.transcripcionPrincipal = principal;
  ultimoResultadoEntendimiento.resumenTranscripcion = seleccion.resumen || ultimoResultadoEntendimiento.resumenTranscripcion || null;
  ultimoResultadoEntendimiento.transcripcion = {
    ...(ultimoResultadoEntendimiento.transcripcion || {}),
    ...principal,
    motorPrincipal: seleccion.motor || principal.motor,
    transcripcionPrincipal: principal,
    resumenTranscripcion: seleccion.resumen || ultimoResultadoEntendimiento.transcripcion?.resumenTranscripcion || null
  };
  if (ultimoResultadoEntendimiento.resumen) {
    ultimoResultadoEntendimiento.resumen.motorTranscripcionPrincipal = seleccion.motor || principal.motor;
  }
}

function renderKpis(resultado = {}) {
  const resumen = obtenerResumen(resultado);
  const linea = obtenerResumenLinea(resultado);
  const duracion = numero(resumen.duracionTotalSegundos ?? resumen.duracionSegundos ?? linea.duracionTotalSegundos);
  const totalVideos = obtenerTotalVideos(resultado);
  const opcionesTranscripcion = crearOpcionesTranscripcion(resultado);
  const orientacion = resumen.orientacion || linea.orientacionPredominante || resultado.analisis?.orientacion;
  $('entendimientoOrientacion').textContent = totalVideos > 1 ? `${texto(orientacion)} · ${totalVideos} videos` : texto(orientacion);
  $('entendimientoDuracion').textContent = formatearDuracion(duracion);
  $('entendimientoAudio').textContent = resumen.todosTienenAudio ? 'Sí, todos' : resumen.tieneAudio ? 'Sí' : 'No / pendiente';
  $('entendimientoFotogramas').textContent = String(resumen.fotogramasExtraidos ?? resumen.fotogramasGlobales ?? resultado.fotogramas?.cantidadExtraida ?? 0);
  $('entendimientoMomentos').textContent = String(resumen.momentosClave ?? resultado.analisisVideo?.momentosClave?.length ?? 0);
  const motoresEl = $('entendimientoMotores');
  if (motoresEl) motoresEl.textContent = String(resumen.transcripcionesGeneradas ?? opcionesTranscripcion.length ?? 0);
  $('entendimientoListo').textContent = resumen.listoParaEditar ? 'Sí' : 'Revisar';
}

function renderTabsTranscripcion(opciones = []) {
  const contenedor = $('entendimientoTranscripcionTabs');
  if (!contenedor) return;
  contenedor.innerHTML = opciones.map((opcion) => {
    const activa = opcion.id === transcripcionActivaId;
    const estado = claseEstadoTranscripcion(opcion);
    return `<button type="button" class="entendimiento-transcripcion-tab is-${estado}${activa ? ' is-active' : ''}" data-transcripcion-tab="${escapar(opcion.id)}"><span>${escapar(opcion.etiqueta)}</span><small>${escapar(estadoBonito(opcion.estado))}</small></button>`;
  }).join('');
}

function renderMetaTranscripcion(opcion = {}) {
  const meta = $('entendimientoTranscripcionMeta');
  if (!meta) return;
  const transcripcion = opcion.transcripcion || {};
  const resumen = opcion.resumen || transcripcion.resumen || {};
  const segmentos = Array.isArray(transcripcion.segmentos) ? transcripcion.segmentos.length : 0;
  const palabras = resumen.palabras ?? contarPalabrasUtiles(transcripcion.textoCompleto || transcripcion.texto || '');
  const videos = resumen.videosTotales || resumen.videosConTexto || transcripcion.textosPorVideo?.length || null;
  const partes = [`Motor: ${motorBonito(opcion.motor)}`, `Estado: ${estadoBonito(opcion.estado)}`, `Segmentos: ${segmentos}`, `Palabras: ${palabras}`];
  if (videos) partes.push(`Videos: ${videos}`);
  if (opcion.error?.mensaje) partes.push(`Error: ${opcion.error.mensaje}`);
  else if (opcion.mensaje) partes.push(opcion.mensaje);
  meta.innerHTML = partes.map((parte) => `<span>${escapar(parte)}</span>`).join('');
}

function renderAccionesTranscripcion(opcion = {}) {
  const contenedor = $('entendimientoTranscripcionAcciones');
  if (!contenedor) return;
  const esPrincipal = opcion.id === 'principal';
  const esGlobal = opcion.transcripcion?.tipo === 'transcripcion-global-multivideo';
  const puedeUsar = !esPrincipal && opcion.ok && transcripcionTieneTextoUtil(opcion.transcripcion) && opcion.motor;
  contenedor.innerHTML = `
    <button type="button" class="secondary-button entendimiento-usar-principal-btn" data-usar-transcripcion-principal ${puedeUsar ? '' : 'disabled'}>
      ${esPrincipal ? (esGlobal ? 'Esta ya es la global principal' : 'Esta ya es la principal') : 'Usar esta como principal'}
    </button>
    <span>${puedeUsar ? `Seleccionará ${escapar(motorBonito(opcion.motor))} como texto base del plan.` : 'Solo se puede elegir una transcripción con texto útil.'}</span>
  `;
}

function etiquetaSegmento(segmento = {}) {
  const video = segmento.videoId ? `${segmento.videoId} · ` : '';
  const inicio = segmento.inicioGlobal ?? segmento.inicio ?? segmento.start ?? 0;
  const fin = segmento.finGlobal ?? segmento.fin ?? segmento.end ?? 'fin';
  return `${video}${inicio}s - ${fin}s`;
}

function renderTextosPorVideo(transcripcion = {}) {
  const textosPorVideo = Array.isArray(transcripcion.textosPorVideo) ? transcripcion.textosPorVideo : [];
  if (!textosPorVideo.length) return '';
  return `<div class="entendimiento-transcripcion-videos">${textosPorVideo.map((item) => {
    const contenido = textoEsUtil(item.textoCompleto) ? item.textoCompleto : 'Sin texto útil en este video para este motor.';
    return `<article><strong>${escapar(item.videoId || 'video')}</strong><p>${escapar(contenido)}</p></article>`;
  }).join('')}</div>`;
}

function renderDetalleTranscripcion(opcion = {}) {
  const transcripcion = opcion.transcripcion || {};
  const textoBase = transcripcion.textoCompleto || transcripcion.texto || '';
  const util = transcripcionTieneTextoUtil(transcripcion);
  const textoCompleto = util && textoEsUtil(textoBase)
    ? textoBase
    : (opcion.mensaje || transcripcion.mensaje || transcripcion.observacion || 'No hay texto útil todavía para este motor.');
  const segmentos = Array.isArray(transcripcion.segmentos) ? transcripcion.segmentos : [];
  const esGlobal = transcripcion.tipo === 'transcripcion-global-multivideo';
  $('entendimientoTranscripcionEstado').textContent = util
    ? `${esGlobal ? 'Global multivideo' : motorBonito(opcion.motor)} · texto real`
    : `${motorBonito(opcion.motor)} · pendiente`;
  $('entendimientoTranscripcion').innerHTML = `<p>${escapar(textoCompleto)}</p>` + (segmentos.length ? `<ol>${segmentos.slice(0, 40).map((s) => `<li><strong>${escapar(etiquetaSegmento(s))}</strong><span>${escapar(textoEsUtil(s.texto || s.text || s.nota) ? (s.texto || s.text || s.nota) : 'Sin texto útil en este segmento')}</span></li>`).join('')}</ol>` : '') + renderTextosPorVideo(transcripcion);
  renderMetaTranscripcion(opcion);
  renderAccionesTranscripcion(opcion);
}

function renderTranscripcion(resultado = {}) {
  const opciones = crearOpcionesTranscripcion(resultado);
  if (!opciones.some((opcion) => opcion.id === transcripcionActivaId)) transcripcionActivaId = opciones[0]?.id || 'principal';
  renderTabsTranscripcion(opciones);
  const activa = opciones.find((opcion) => opcion.id === transcripcionActivaId) || opciones[0] || {};
  renderDetalleTranscripcion(activa);
}

function obtenerFrames(resultado = {}) {
  return Array.isArray(resultado.fotogramasGlobales?.fotogramas)
    ? resultado.fotogramasGlobales.fotogramas
    : Array.isArray(resultado.fotogramas?.fotogramas)
      ? resultado.fotogramas.fotogramas
      : [];
}

function renderFrames(resultado = {}) {
  const frames = obtenerFrames(resultado);
  const totalVideos = obtenerTotalVideos(resultado);
  $('entendimientoFramesEstado').textContent = totalVideos > 1 ? `${frames.length} globales` : String(frames.length);
  const contenedor = $('entendimientoFrames');
  if (!frames.length) {
    contenedor.innerHTML = '<div class="entendimiento-empty">No hay fotogramas disponibles para este proyecto.</div>';
    return;
  }
  contenedor.innerHTML = frames.slice(0, 16).map((frame) => {
    const src = obtenerSrcFrame(frame);
    const visual = frame.analisisVisual || {};
    const descripcion = frame.descripcionVisual || visual.descripcion || visual.escena || 'Sin descripción visual todavía.';
    const escena = visual.escena ? `<span>${escapar(visual.escena)}</span>` : '';
    const accion = visual.accion ? `<span>${escapar(visual.accion)}</span>` : '';
    const video = frame.videoId ? `<span>${escapar(frame.videoId)}</span>` : '';
    const tiempo = frame.segundoGlobal !== undefined ? `${frame.segundoGlobal}s global` : `${frame.segundo}s`;
    const local = frame.segundoLocal !== undefined ? ` · ${frame.segundoLocal}s local` : '';
    return `<article class="entendimiento-frame"><div>${src ? `<img src="${escapar(src)}" alt="${escapar(descripcion)}" />` : '<span>Sin preview</span>'}</div><strong>${escapar(frame.id)}</strong><small>${escapar(tiempo)}${escapar(local)} · ${escapar(frame.estado)}</small><p class="entendimiento-frame-desc">${escapar(descripcion)}</p>${video || escena || accion ? `<div class="entendimiento-frame-tags">${video}${escena}${accion}</div>` : ''}</article>`;
  }).join('');
}

function renderGlobal(resultado = {}) {
  const analisis = resultado.analisisVideo || {};
  const editorial = analisis.resumenEditorial || resultado.reporteEntendimiento?.resumen?.editorial || {};
  const resumen = obtenerResumen(resultado);
  const linea = obtenerResumenLinea(resultado);
  const momentos = Array.isArray(analisis.momentosClave) ? analisis.momentosClave : [];
  const lineaTiempo = Array.isArray(resultado.lineaTiempoGlobal?.lineaTiempo) ? resultado.lineaTiempoGlobal.lineaTiempo : [];
  const totalVideos = obtenerTotalVideos(resultado);
  $('entendimientoGlobalEstado').textContent = analisis.ok ? (totalVideos > 1 ? 'Global multivideo' : 'Generado') : 'Pendiente';
  $('entendimientoGlobal').innerHTML = `
    <article><strong>Videos analizados</strong><span>${escapar(resumen.videosProcesados ?? linea.videosAnalizados ?? totalVideos)} / ${escapar(totalVideos)}</span></article>
    <article><strong>Duración total</strong><span>${escapar(formatearDuracion(resumen.duracionTotalSegundos ?? resumen.duracionSegundos ?? linea.duracionTotalSegundos))}</span></article>
    <article><strong>Formato detectado</strong><span>${escapar(editorial.formatoDetectado || linea.orientacionPredominante || 'desconocido')}</span></article>
    <article><strong>Tipo de duración</strong><span>${escapar(editorial.duracionTipo || 'desconocida')}</span></article>
    <article><strong>Transcripción global</strong><span>${escapar(resumen.segmentosTranscripcion ?? resultado.transcripcion?.segmentos?.length ?? 0)} segmentos · ${escapar(resumen.palabrasTranscripcion ?? resultado.transcripcion?.resumen?.palabras ?? 0)} palabras</span></article>
    <article><strong>Fotogramas globales</strong><span>${escapar(resumen.fotogramasExtraidos ?? resultado.fotogramas?.cantidadExtraida ?? 0)}</span></article>
    <article><strong>Lectura</strong><span>${escapar(editorial.lectura || 'Sin lectura editorial todavía.')}</span></article>
    <article><strong>Recomendación</strong><span>${escapar(editorial.recomendacionInicial || 'Revisar entendimiento antes de planificar.')}</span></article>
    <article><strong>Momentos principales</strong><span>${momentos.slice(0, 8).map((m) => `${m.videoId ? `${m.videoId} · ` : ''}${m.inicioGlobal ?? m.inicio}s ${m.tipo || 'momento'}`).join(' · ') || 'Sin momentos'}</span></article>
    ${lineaTiempo.length ? `<article><strong>Línea de tiempo</strong><span>${lineaTiempo.slice(0, 6).map((item) => `${item.videoId}: ${item.inicioGlobal}s-${item.finGlobal}s`).join(' · ')}${lineaTiempo.length > 6 ? ' · ...' : ''}</span></article>` : ''}
  `;
}

function renderNecesidades(resultado = {}) {
  const necesidades = resultado.analisisVideo?.necesidades || resultado.reporteEntendimiento?.resumen?.necesidades || obtenerResumen(resultado).necesidades || [];
  $('entendimientoNecesidadesEstado').textContent = String(necesidades.length);
  $('entendimientoNecesidades').innerHTML = necesidades.length ? necesidades.map((item) => `<span>${escapar(item)}</span>`).join('') : '<span>Sin necesidades críticas</span>';
}

function renderDiagnosticoMotores(payload = {}) {
  const diagnostico = payload.diagnostico || payload;
  const panel = $('entendimientoDiagnosticoMotores');
  const estado = $('entendimientoDiagnosticoMotoresEstado');
  const resumenBox = $('entendimientoDiagnosticoMotoresResumen');
  const lista = $('entendimientoDiagnosticoMotoresLista');
  if (!panel || !estado || !resumenBox || !lista) return;

  const resumen = diagnostico.resumen || {};
  const motores = Array.isArray(diagnostico.motores) ? diagnostico.motores : [];
  panel.hidden = false;
  estado.textContent = resumen.puedeTranscribirGratis ? 'Listo parcial' : 'Revisar';
  resumenBox.innerHTML = `
    <strong>${escapar(resumen.recomendacion || 'Diagnóstico completado.')}</strong>
    <span>Listos: ${escapar(resumen.listos ?? 0)} · Faltantes: ${escapar(resumen.faltantes ?? 0)} · Puede transcribir gratis: ${resumen.puedeTranscribirGratis ? 'Sí' : 'No todavía'}</span>
  `;

  lista.innerHTML = motores.map((motor) => {
    const severidad = motor.severidad || (motor.ok ? 'ok' : 'warn');
    const acciones = Array.isArray(motor.acciones) ? motor.acciones : [];
    const rutas = motor.rutas && typeof motor.rutas === 'object' ? Object.entries(motor.rutas).filter(([, valor]) => valor !== '' && valor !== null && valor !== undefined) : [];
    return `<article class="entendimiento-diagnostico-card is-${escapar(severidad)}">
      <header><strong>${escapar(motor.nombre || motor.motor)}</strong><span>${escapar(estadoBonito(motor.estado))}</span></header>
      <p>${escapar(motor.mensaje || 'Sin mensaje.')}</p>
      ${motor.detalle ? `<small>${escapar(motor.detalle)}</small>` : ''}
      ${rutas.length ? `<div class="entendimiento-diagnostico-rutas">${rutas.map(([clave, valor]) => `<span>${escapar(clave)}: ${escapar(valor)}</span>`).join('')}</div>` : ''}
      ${acciones.length ? `<ul>${acciones.slice(0, 4).map((accion) => `<li>${escapar(accion)}</li>`).join('')}</ul>` : ''}
    </article>`;
  }).join('') || '<div class="entendimiento-empty">No hay motores reportados.</div>';
}

function renderInstalacionMotores(payload = {}) {
  const guia = payload.guia || payload;
  const panel = $('entendimientoInstalacionMotores');
  const estado = $('entendimientoInstalacionMotoresEstado');
  const resumenBox = $('entendimientoInstalacionMotoresResumen');
  const lista = $('entendimientoInstalacionMotoresLista');
  if (!panel || !estado || !resumenBox || !lista) return;

  const pasos = Array.isArray(guia.pasos) ? guia.pasos : [];
  const variables = Array.isArray(guia.variablesEntorno) ? guia.variablesEntorno : [];
  panel.hidden = false;
  estado.textContent = 'Guía lista';
  resumenBox.innerHTML = `
    <strong>${escapar(guia.objetivo || 'Guía de instalación cargada.')}</strong>
    <span>${escapar(guia.aviso || 'Instalación manual asistida.')}</span>
    <div class="entendimiento-instalacion-vars">${variables.map((item) => `<span>${escapar(item.nombre)}: ${escapar(item.uso)}</span>`).join('')}</div>
  `;

  lista.innerHTML = pasos.map((paso) => {
    const comandos = Array.isArray(paso.comandos) ? paso.comandos : [];
    const acciones = Array.isArray(paso.siFalla) ? paso.siFalla : [];
    return `<article class="entendimiento-instalacion-card">
      <header><strong>${escapar(paso.titulo)}</strong><span>${paso.recomendado ? 'Recomendado' : paso.obligatorio ? 'Base' : 'Opcional'}</span></header>
      <p>${escapar(paso.descripcion || '')}</p>
      ${comandos.length ? `<div class="entendimiento-comandos">${comandos.map((cmd) => `<code>${escapar(cmd.comando || cmd)}</code>`).join('')}</div>` : ''}
      ${paso.resultadoEsperado ? `<small>Resultado esperado: ${escapar(paso.resultadoEsperado)}</small>` : ''}
      ${acciones.length ? `<ul>${acciones.map((accion) => `<li>${escapar(accion)}</li>`).join('')}</ul>` : ''}
    </article>`;
  }).join('') || '<div class="entendimiento-empty">No hay pasos de instalación disponibles.</div>';
}

function renderResultado(datos = {}) {
  const resultado = extraerResultado(datos);
  ultimoResultadoEntendimiento = resultado;
  renderKpis(resultado);
  renderTranscripcion(resultado);
  renderFrames(resultado);
  renderGlobal(resultado);
  renderNecesidades(resultado);
  const listo = Boolean(obtenerResumen(resultado).listoParaEditar || resultado.reporteEntendimiento?.listoParaEditar);
  const planBtn = $('entendimientoCrearPlanBtn');
  if (planBtn) planBtn.disabled = !listo;
  setChip(listo ? (esMultivideo(resultado) ? 'Entendido global' : 'Entendido') : 'Revisar', listo ? 'ok' : 'warn');
}

async function cargarEntendimiento() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Escribe o pega el proyectoId para cargar el entendimiento.', 'warn'); return; }
  guardarProyectoId(proyectoId);
  ocultarMensaje();
  setChip('Cargando...', 'normal');
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/entendimiento`);
  if (!datos.resultado) {
    setMensaje('Todavía no existe entendimiento para este proyecto. Presiona Procesar entendimiento.', 'warn');
    setChip('Sin resultado', 'warn');
    return;
  }
  renderResultado(datos);
  setMensaje('Entendimiento cargado correctamente.', 'ok');
}

async function procesarEntendimiento() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Primero necesitas el proyectoId creado en Nuevo proyecto.', 'warn'); return; }
  guardarProyectoId(proyectoId);
  ocultarMensaje();
  setChip('Procesando...', 'normal');
  transcripcionActivaId = 'principal';
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/entendimiento/procesar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origen: 'pantalla-entendimiento' }) });
  renderResultado(datos);
  setMensaje(datos.mensaje || 'Entendimiento procesado correctamente.', 'ok');
}

async function diagnosticarMotores() {
  const panel = $('entendimientoDiagnosticoMotores');
  const estado = $('entendimientoDiagnosticoMotoresEstado');
  const resumenBox = $('entendimientoDiagnosticoMotoresResumen');
  const lista = $('entendimientoDiagnosticoMotoresLista');
  if (panel) panel.hidden = false;
  if (estado) estado.textContent = 'Revisando...';
  if (resumenBox) resumenBox.textContent = 'Revisando motores locales gratuitos...';
  if (lista) lista.innerHTML = '';
  const datos = await api('/api/autovideo/transcripcion/motores/diagnostico');
  renderDiagnosticoMotores(datos);
  setMensaje('Diagnóstico de motores completado.', 'ok');
}

async function mostrarGuiaInstalacionMotores() {
  const panel = $('entendimientoInstalacionMotores');
  const estado = $('entendimientoInstalacionMotoresEstado');
  const resumenBox = $('entendimientoInstalacionMotoresResumen');
  const lista = $('entendimientoInstalacionMotoresLista');
  if (panel) panel.hidden = false;
  if (estado) estado.textContent = 'Cargando...';
  if (resumenBox) resumenBox.textContent = 'Cargando guía de instalación gratuita...';
  if (lista) lista.innerHTML = '';
  const datos = await api('/api/autovideo/transcripcion/motores/instalacion');
  renderInstalacionMotores(datos);
  setMensaje('Guía de instalación cargada.', 'ok');
}

async function usarTranscripcionActivaComoPrincipal() {
  const proyectoId = obtenerProyectoId();
  const opcion = obtenerOpcionTranscripcionActiva();
  if (!proyectoId) { setMensaje('Falta proyectoId para seleccionar la transcripción principal.', 'warn'); return; }
  if (!opcion?.motor || opcion.id === 'principal') { setMensaje('Selecciona una transcripción de motor distinta a Principal.', 'warn'); return; }
  if (!transcripcionTieneTextoUtil(opcion.transcripcion)) { setMensaje('Esa transcripción no tiene texto útil para usar como principal.', 'warn'); return; }

  setMensaje(`Seleccionando ${motorBonito(opcion.motor)} como transcripción principal...`, 'normal');
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/transcripciones/${encodeURIComponent(opcion.motor)}/usar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo: 'ui-entendimiento', usuario: 'local' })
  });
  aplicarPrincipalEnResultadoLocal(datos.seleccion || {});
  transcripcionActivaId = 'principal';
  if (ultimoResultadoEntendimiento) {
    renderKpis(ultimoResultadoEntendimiento);
    renderTranscripcion(ultimoResultadoEntendimiento);
  }
  setMensaje(datos.mensaje || `Transcripción ${motorBonito(opcion.motor)} seleccionada como principal.`, 'ok');
}

async function crearPlanPlaceholder() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Falta proyectoId para crear el plan.', 'warn'); return; }
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/plan/procesar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origen: 'pantalla-entendimiento' }) });
  setMensaje(datos.mensaje || 'Solicitud de plan registrada. El motor real se conectará en el bloque del Plan.', 'ok');
}

function manejarClickTranscripcion(evento) {
  const botonUsar = evento.target.closest('[data-usar-transcripcion-principal]');
  if (botonUsar) {
    usarTranscripcionActivaComoPrincipal().catch((error) => setMensaje(error.message, 'error'));
    return;
  }

  const boton = evento.target.closest('[data-transcripcion-tab]');
  if (!boton) return;
  transcripcionActivaId = boton.dataset.transcripcionTab || 'principal';
  if (ultimoResultadoEntendimiento) renderTranscripcion(ultimoResultadoEntendimiento);
}

function enlazarEventos() {
  const root = document.querySelector('[data-entendimiento-root]');
  if (!root || root.dataset.entendimientoInicializado === '1') return;
  root.dataset.entendimientoInicializado = '1';
  const input = $('entendimientoProyectoId');
  if (input && !input.value) input.value = localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
  $('entendimientoCargarBtn')?.addEventListener('click', () => cargarEntendimiento().catch((error) => setMensaje(error.message, 'error')));
  $('entendimientoProcesarBtn')?.addEventListener('click', () => procesarEntendimiento().catch((error) => setMensaje(error.message, 'error')));
  $('entendimientoDiagnosticarMotoresBtn')?.addEventListener('click', () => diagnosticarMotores().catch((error) => setMensaje(error.message, 'error')));
  $('entendimientoInstalarMotoresBtn')?.addEventListener('click', () => mostrarGuiaInstalacionMotores().catch((error) => setMensaje(error.message, 'error')));
  $('entendimientoCrearPlanBtn')?.addEventListener('click', () => crearPlanPlaceholder().catch((error) => setMensaje(error.message, 'error')));
  root.addEventListener('click', manejarClickTranscripcion);
}

export function inicializarEntendimientoUI() {
  if (typeof document === 'undefined') return;
  enlazarEventos();
  document.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'entendimiento') setTimeout(enlazarEventos, 0);
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarEntendimientoUI);
}
