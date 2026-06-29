/*
  Bloque 11: Pantalla Producción maestro
  Función: cargar, producir y mostrar el video maestro desde la UI por etapas.
*/

const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';

const PISTAS_FALLBACK = Object.freeze([
  { id: 'global', nombre: 'Global' },
  { id: 'cortes', nombre: 'Cortes' },
  { id: 'subtitulos', nombre: 'Subtítulos' },
  { id: 'textos', nombre: 'Textos' },
  { id: 'zooms', nombre: 'Zooms' },
  { id: 'efectos', nombre: 'Efectos' },
  { id: 'animaciones', nombre: 'Animaciones' },
  { id: 'transiciones', nombre: 'Transiciones' },
  { id: 'audio-sfx', nombre: 'Audio / SFX' },
  { id: 'recursos', nombre: 'Recursos' },
  { id: 'diagnostico', nombre: 'Diagnóstico' },
  { id: 'otros', nombre: 'Otros' }
]);

let produccionActual = null;

function $(id) { return document.getElementById(id); }
function texto(valor, respaldo = '—') { const limpio = String(valor ?? '').trim(); return limpio || respaldo; }
function escapar(valor) { return texto(valor, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function numero(valor, respaldo = null) { const n = Number(valor); return Number.isFinite(n) ? n : respaldo; }
function arr(valor) { return Array.isArray(valor) ? valor : []; }
function peso(bytes) { const n = numero(bytes, 0); if (!n) return '—'; if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`; return `${(n / (1024 * 1024)).toFixed(1)} MB`; }
function setTexto(id, valor) { const el = $(id); if (el) el.textContent = String(valor ?? '—'); }

async function obtenerBaseApi() {
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try {
      const estado = await apiElectron();
      if (estado?.url) return estado.url;
    } catch (error) {
      console.warn('[Producción maestro UI] No se pudo leer servidor Electron:', error.message);
    }
  }
  return window.location.origin;
}

async function urlPublica(ruta) {
  if (!ruta) return '';
  if (/^https?:\/\//i.test(ruta)) return ruta;
  const base = await obtenerBaseApi();
  const normalizada = String(ruta).startsWith('/') ? ruta : `/${ruta}`;
  return `${base}${normalizada}`;
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
  const input = $('produccionMaestroProyectoId');
  const desdeInput = input?.value?.trim();
  if (desdeInput) return desdeInput;
  return localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
}

function guardarProyectoId(proyectoId) {
  if (!proyectoId) return;
  localStorage.setItem(STORAGE_PROYECTO_ETAPAS, proyectoId);
  const input = $('produccionMaestroProyectoId');
  if (input && !input.value) input.value = proyectoId;
  const legacy = $('productionProjectIdInput');
  if (legacy) legacy.value = proyectoId;
}

function setMensaje(mensaje, tipo = 'normal') {
  const box = $('produccionMaestroMensaje');
  if (!box) return;
  box.hidden = false;
  box.textContent = mensaje;
  box.className = `produccion-maestro-message is-${tipo}`;
}

function ocultarMensaje() {
  const box = $('produccionMaestroMensaje');
  if (!box) return;
  box.hidden = true;
  box.textContent = '';
}

function setChip(textoChip, tipo = 'normal') {
  const chip = $('produccionMaestroEstadoChip');
  if (!chip) return;
  chip.textContent = textoChip;
  chip.className = `aj-status-chip produccion-maestro-chip is-${tipo}`;
}

function extraerProduccion(payload = {}) {
  const wrapper = payload.resultado || payload;
  if (wrapper?.resultado?.videoMaestro) return wrapper.resultado;
  if (wrapper?.datos?.resultado?.videoMaestro) return wrapper.datos.resultado;
  if (wrapper?.videoMaestro) return wrapper;
  return wrapper?.resultado || wrapper;
}

function elementosPlan(produccion = {}) {
  const elementos = produccion.planProduccion?.elementos || produccion.planProduccionUsado?.elementos || [];
  return Array.isArray(elementos) ? elementos : [];
}

function obtenerResumen(produccion = {}) {
  return produccion.resumen || {};
}

function obtenerResumenMarcadores(produccion = {}) {
  return produccion.resumenMarcadores || produccion.timelineEditorial?.resumen || produccion.resumen?.marcadores || {};
}

function obtenerMarcadores(produccion = {}) {
  const marcadores = produccion.marcadoresProduccion || produccion.timelineEditorial?.marcadores || [];
  if (Array.isArray(marcadores) && marcadores.length) return marcadores;
  return elementosPlan(produccion).map((item, index) => {
    const inicio = numero(item.inicio ?? item.datos?.inicio, 0) ?? 0;
    const finBase = numero(item.fin ?? item.datos?.fin, inicio + 2) ?? inicio + 2;
    return {
      id: `legacy-${index + 1}`,
      orden: index + 1,
      tipo: item.tipo || 'elemento',
      pista: ['subtitulo', 'texto', 'recurso', 'efecto', 'zoom', 'animacion', 'audio'].includes(item.tipo) ? `${item.tipo}s` : 'otros',
      nombre: item.nombre || item.titulo || item.id || 'Elemento del plan',
      descripcion: item.descripcion || item.motivo || item.datos?.motivo || '',
      inicio,
      fin: finBase <= inicio ? inicio + 2 : finBase,
      duracion: Math.max(0.5, finBase - inicio),
      estado: item.aprobado ? 'aprobado' : item.rechazado ? 'rechazado' : 'revision',
      aplicado: false,
      global: false,
      origen: 'plan-produccion-legacy',
      fuente: 'planProduccion.elementos',
      datos: item
    };
  });
}

function obtenerPistas(produccion = {}) {
  const pistas = produccion.pistasProduccion || produccion.timelineEditorial?.pistas || [];
  if (Array.isArray(pistas) && pistas.length) return pistas;
  const marcadores = obtenerMarcadores(produccion);
  return PISTAS_FALLBACK.map((pista) => ({
    ...pista,
    total: marcadores.filter((item) => item.pista === pista.id || item.tipo === pista.id).length,
    marcadores: marcadores.filter((item) => item.pista === pista.id || item.tipo === pista.id)
  })).filter((pista) => pista.total > 0);
}

function obtenerDuracionTimeline(produccion = {}, marcadores = []) {
  const resumen = obtenerResumenMarcadores(produccion);
  const resumenProduccion = obtenerResumen(produccion);
  const maxMarcador = Math.max(0, ...marcadores.map((item) => numero(item.fin, numero(item.inicio, 0) + 2) || 0));
  return Math.max(30, numero(resumen.duracionSegundos, 0) || 0, numero(produccion.timelineEditorial?.duracionSegundos, 0) || 0, numero(resumenProduccion.duracionTotalSegundos, 0) || 0, maxMarcador);
}

function etiquetaPista(pistaId = '') {
  return PISTAS_FALLBACK.find((item) => item.id === pistaId)?.nombre || texto(pistaId, 'Pista');
}

function etiquetaTipo(tipo = '') {
  const mapa = {
    corte: 'Corte',
    subtitulo: 'Subtítulo',
    texto: 'Texto',
    zoom: 'Zoom',
    efecto: 'Efecto',
    animacion: 'Animación',
    transicion: 'Transición',
    'audio-sfx': 'Audio / SFX',
    recurso: 'Recurso',
    diagnostico: 'Diagnóstico',
    otro: 'Otro'
  };
  return mapa[tipo] || texto(tipo, 'Marcador');
}

function claseEstadoMarcador(marcador = {}) {
  const estado = String(marcador.estado || '').toLowerCase();
  if (marcador.aplicado || estado.includes('aplicado') || estado.includes('ok')) return 'aplicado';
  if (estado.includes('omitido') || estado.includes('rechazado')) return 'omitido';
  if (estado.includes('fallback')) return 'fallback';
  if (estado.includes('revision') || estado.includes('revisión')) return 'revision';
  return 'planificado';
}

async function renderKpis(produccion = {}) {
  const resumen = obtenerResumen(produccion);
  const resumenMarcadores = obtenerResumenMarcadores(produccion);
  const video = produccion.videoMaestro || {};
  const elementos = elementosPlan(produccion);
  setTexto('produccionMaestroNombre', texto(video.nombre || resumen.videoMaestro, '—'));
  setTexto('produccionMaestroPeso', peso(video.pesoBytes || resumen.pesoBytes));
  setTexto('produccionMaestroModo', texto(resumen.modo || produccion.salida?.modo || produccion.edicion?.modo));
  setTexto('produccionMaestroPlataforma', texto(resumen.plataformaBase || produccion.salida?.plataforma || produccion.edicion?.plataforma));
  setTexto('produccionMaestroElementos', String(resumen.totalElementosPlan ?? elementos.length ?? 0));
  setTexto('produccionMaestroMarcadores', String(resumenMarcadores.totalMarcadores ?? resumen.marcadores?.total ?? obtenerMarcadores(produccion).length ?? 0));
  setTexto('produccionMaestroGlobales', String(resumenMarcadores.globales ?? resumen.marcadores?.globales ?? 0));
  setTexto('produccionMaestroCortes', String(resumenMarcadores.cortes ?? resumen.marcadores?.cortes ?? 0));
  setTexto('produccionMaestroZooms', String(resumenMarcadores.zooms ?? resumen.marcadores?.zooms ?? 0));
  setTexto('produccionMaestroEfectos', String(resumenMarcadores.efectos ?? resumen.marcadores?.efectos ?? 0));
  setTexto('produccionMaestroAnimaciones', String(resumenMarcadores.animaciones ?? resumen.marcadores?.animaciones ?? 0));
  setTexto('produccionMaestroTransiciones', String(resumenMarcadores.transiciones ?? resumen.marcadores?.transiciones ?? 0));
  setTexto('produccionMaestroAudioSfx', String(resumenMarcadores.audioSfx ?? resumen.marcadores?.audioSfx ?? 0));
  setTexto('produccionMaestroListo', resumen.listoParaAdaptacion ? 'Sí' : 'Revisar');
}

async function renderPreview(produccion = {}) {
  const video = $('produccionMaestroVideo');
  const estado = $('produccionMaestroPreviewEstado');
  const descarga = $('produccionMaestroDescarga');
  const url = await urlPublica(produccion.videoMaestro?.urlPublica || produccion.salida?.urlPublica || '');
  if (!video || !estado || !descarga) return;
  if (!url) {
    video.removeAttribute('src');
    video.load?.();
    estado.textContent = 'Sin video';
    descarga.hidden = true;
    descarga.removeAttribute('href');
    return;
  }
  video.src = url;
  estado.textContent = 'Maestro listo';
  descarga.hidden = false;
  descarga.href = url;
}

async function renderComparacion(produccion = {}) {
  const antes = $('produccionMaestroAntes');
  const despues = $('produccionMaestroDespues');
  const estado = $('produccionMaestroComparacionEstado');
  const antesUrl = await urlPublica(produccion.salida?.antesDespues?.original?.copiaVista?.urlPublica || produccion.salida?.antesDespues?.original?.urlPublica || '');
  const despuesUrl = await urlPublica(produccion.salida?.antesDespues?.final?.urlPublica || produccion.videoMaestro?.urlPublica || produccion.salida?.urlPublica || '');
  if (antesUrl) antes.src = antesUrl; else { antes.removeAttribute('src'); antes.load?.(); }
  if (despuesUrl) despues.src = despuesUrl; else { despues.removeAttribute('src'); despues.load?.(); }
  if (estado) estado.textContent = antesUrl || despuesUrl ? 'Disponible' : 'Pendiente';
}

function renderTimelineResumen(produccion = {}, marcadores = []) {
  const contenedor = $('produccionMaestroTimelineResumen');
  const resumen = obtenerResumenMarcadores(produccion);
  if (!contenedor) return;
  if (!marcadores.length) {
    contenedor.innerHTML = '<div class="produccion-maestro-empty">Sin resumen de timeline.</div>';
    return;
  }
  const items = [
    ['Aplicados', resumen.aplicados ?? marcadores.filter((item) => item.aplicado).length],
    ['Planificados', resumen.planificados ?? marcadores.filter((item) => !item.aplicado).length],
    ['Globales', resumen.globales ?? marcadores.filter((item) => item.global).length],
    ['Omitidos', resumen.omitidos ?? 0],
    ['Duración', `${Number(obtenerDuracionTimeline(produccion, marcadores)).toFixed(1)}s`]
  ];
  contenedor.innerHTML = `<div class="produccion-maestro-timeline-metrics">${items.map(([label, value]) => `<article><span>${escapar(label)}</span><strong>${escapar(value)}</strong></article>`).join('')}</div>`;
}

function renderTimelineLeyenda(pistas = []) {
  const contenedor = $('produccionMaestroTimelineLeyenda');
  if (!contenedor) return;
  const visibles = pistas.length ? pistas : PISTAS_FALLBACK.slice(0, 8).map((pista) => ({ ...pista, total: 0 }));
  contenedor.innerHTML = visibles.map((pista) => `<span class="produccion-maestro-legend-chip is-${escapar(pista.id)}"><b></b>${escapar(pista.nombre || pista.id)} <small>${escapar(pista.total ?? 0)}</small></span>`).join('');
}

function renderTimelineItem(marcador = {}, duracion = 30) {
  const inicio = Math.max(0, numero(marcador.inicio, 0) ?? 0);
  const finBase = numero(marcador.fin, inicio + 2) ?? inicio + 2;
  const fin = finBase <= inicio ? inicio + 0.5 : finBase;
  const left = duracion ? Math.max(0, Math.min(97, (inicio / duracion) * 100)) : 0;
  const width = duracion ? Math.max(3, Math.min(100 - left, ((fin - inicio) / duracion) * 100)) : 8;
  const estado = claseEstadoMarcador(marcador);
  const global = marcador.global || marcador.pista === 'global';
  const title = `${etiquetaTipo(marcador.tipo)} · ${marcador.nombre || marcador.id} · ${inicio.toFixed(1)}s-${fin.toFixed(1)}s`;
  return `<button class="produccion-maestro-timeline-item is-${escapar(estado)} is-${escapar(marcador.pista || 'otros')}" data-marcador-id="${escapar(marcador.id)}" style="left:${left}%;width:${width}%" type="button" title="${escapar(title)}"><span>${global ? 'GLOBAL' : escapar(etiquetaTipo(marcador.tipo))}</span><strong>${escapar(marcador.nombre || marcador.id || 'Marcador')}</strong><small>${inicio.toFixed(1)}s</small></button>`;
}

function renderTimeline(produccion = {}) {
  const contenedor = $('produccionMaestroTimeline');
  const estado = $('produccionMaestroTimelineEstado');
  const marcadores = obtenerMarcadores(produccion);
  const pistas = obtenerPistas(produccion);
  const duracion = obtenerDuracionTimeline(produccion, marcadores);
  if (estado) estado.textContent = `${marcadores.length} marcador(es)`;
  renderTimelineResumen(produccion, marcadores);
  renderTimelineLeyenda(pistas);
  renderMarcadorSeleccionado(null);
  if (!contenedor) return;
  if (!marcadores.length) {
    contenedor.innerHTML = '<div class="produccion-maestro-empty">No hay marcadores editoriales en esta producción. Vuelve a producir para generar la timeline editorial.</div>';
    return;
  }
  contenedor.innerHTML = pistas.map((pista) => {
    const items = arr(pista.marcadores).length ? pista.marcadores : marcadores.filter((item) => item.pista === pista.id);
    return `<section class="produccion-maestro-track is-${escapar(pista.id)}"><strong>${escapar(pista.nombre || etiquetaPista(pista.id))}<small>${items.length}</small></strong><div class="produccion-maestro-lane">${items.map((item) => renderTimelineItem(item, duracion)).join('')}</div></section>`;
  }).join('');
}

function renderMarcadorSeleccionado(marcador = null) {
  const contenedor = $('produccionMaestroMarcadorSeleccionado');
  if (!contenedor) return;
  if (!marcador) {
    contenedor.innerHTML = '<div class="produccion-maestro-empty">Selecciona un marcador para ver su detalle.</div>';
    return;
  }
  const estado = claseEstadoMarcador(marcador);
  contenedor.innerHTML = `
    <article class="produccion-maestro-marker-card is-${escapar(estado)}">
      <header><div><span>${escapar(etiquetaPista(marcador.pista))}</span><strong>${escapar(marcador.nombre || marcador.id)}</strong></div><b>${marcador.global ? 'GLOBAL' : escapar(etiquetaTipo(marcador.tipo))}</b></header>
      <p>${escapar(marcador.descripcion || marcador.datos?.motivo || marcador.datos?.descripcion || 'Sin descripción adicional.')}</p>
      <dl>
        <div><dt>Tiempo</dt><dd>${escapar(marcador.inicio)}s - ${escapar(marcador.fin)}s</dd></div>
        <div><dt>Estado</dt><dd>${escapar(marcador.estado || estado)}</dd></div>
        <div><dt>Aplicado</dt><dd>${marcador.aplicado ? 'Sí' : 'No / planificado'}</dd></div>
        <div><dt>Origen</dt><dd>${escapar(marcador.origen || 'producción')}</dd></div>
        <div><dt>Fuente</dt><dd>${escapar(marcador.fuente || 'timeline')}</dd></div>
        <div><dt>Video</dt><dd>${escapar(marcador.videoId || 'global / único')}</dd></div>
      </dl>
    </article>
  `;
}

function seleccionarMarcador(marcadorId = '') {
  const marcador = obtenerMarcadores(produccionActual || {}).find((item) => item.id === marcadorId);
  renderMarcadorSeleccionado(marcador || null);
}

function renderAuditoria(produccion = {}) {
  const auditoria = produccion.auditoria || {};
  const edicion = auditoria.edicion || {};
  const salida = auditoria.salida || {};
  const timeline = auditoria.timelineEditorial || produccion.timelineEditorial || {};
  const resumenMarcadores = obtenerResumenMarcadores(produccion);
  const contenedor = $('produccionMaestroAuditoria');
  const estado = $('produccionMaestroAuditoriaEstado');
  if (estado) estado.textContent = auditoria.tipo ? 'Generada' : 'Sin datos';
  if (!contenedor) return;
  contenedor.innerHTML = `
    <article><span>Edición</span><strong>${edicion.ok ? 'OK' : 'Pendiente'}</strong><small>${escapar(edicion.tipo || 'sin tipo')}</small></article>
    <article><span>Sonidos</span><strong>${edicion.sonidosAplicados ? 'Sí' : 'No'}</strong><small>Audio de edición</small></article>
    <article><span>Animaciones</span><strong>${edicion.animacionesAplicadas ? 'Sí' : 'No'}</strong><small>Render visual</small></article>
    <article><span>Timeline</span><strong>${timeline.ok || produccion.timelineEditorial?.ok ? 'OK' : 'Pendiente'}</strong><small>${escapar(resumenMarcadores.totalMarcadores || 0)} marcador(es)</small></article>
    <article><span>Globales</span><strong>${escapar(resumenMarcadores.globales || 0)}</strong><small>Indicadores globales</small></article>
    <article><span>Salida</span><strong>${salida.ok ? 'OK' : 'Pendiente'}</strong><small>${escapar(salida.nombreExportado || 'sin archivo')}</small></article>
  `;
}

function renderDetalle(produccion = {}) {
  const detalle = $('produccionMaestroDetalle');
  const estado = $('produccionMaestroDetalleEstado');
  const marcadores = obtenerMarcadores(produccion);
  const elementos = elementosPlan(produccion);
  if (estado) estado.textContent = String(marcadores.length || elementos.length);
  if (!detalle) return;
  if (!marcadores.length && !elementos.length) {
    detalle.innerHTML = '<div class="produccion-maestro-empty">Sin marcadores ni elementos de plan para revisar.</div>';
    return;
  }
  const rows = marcadores.length ? marcadores : elementos;
  detalle.innerHTML = `<div class="produccion-maestro-table-wrap"><table class="produccion-maestro-table"><thead><tr><th>Marcador</th><th>Pista</th><th>Tipo</th><th>Tiempo</th><th>Estado</th><th>Origen / motivo</th></tr></thead><tbody>${rows.slice(0, 160).map((item) => {
    const estadoItem = item.estado || (item.aprobado ? 'aprobado' : item.rechazado ? 'rechazado' : 'revisión');
    const inicio = item.inicio ?? item.datos?.inicio ?? '—';
    const fin = item.fin ?? item.datos?.fin ?? '—';
    const pista = item.pista ? etiquetaPista(item.pista) : etiquetaTipo(item.tipo);
    return `<tr><td><strong>${escapar(item.nombre || item.titulo || item.id)}</strong><small>${item.global ? 'GLOBAL · ' : ''}${escapar(item.descripcion || item.datos?.descripcion || '')}</small></td><td>${escapar(pista)}</td><td>${escapar(etiquetaTipo(item.tipo))}</td><td>${escapar(inicio)} - ${escapar(fin)}</td><td><span class="produccion-maestro-pill is-${escapar(claseEstadoMarcador(item))}">${escapar(estadoItem)}</span></td><td>${escapar(item.origen || 'plan')}<small>${escapar(item.motivo || item.datos?.motivo || 'Elemento usado en producción.')}</small></td></tr>`;
  }).join('')}</tbody></table></div>`;
}

async function renderResultado(datos = {}) {
  const produccion = extraerProduccion(datos);
  produccionActual = produccion;
  await renderKpis(produccion);
  await renderPreview(produccion);
  await renderComparacion(produccion);
  renderTimeline(produccion);
  renderAuditoria(produccion);
  renderDetalle(produccion);
  const listo = Boolean(produccion.resumen?.listoParaAdaptacion || produccion.videoMaestro?.urlPublica || produccion.salida?.ok);
  const adaptar = $('produccionMaestroAdaptarBtn');
  if (adaptar) adaptar.disabled = !listo;
  setChip(listo ? 'Producido' : 'Revisar', listo ? 'ok' : 'warn');
}

async function cargarProduccion() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Escribe o pega el proyectoId para cargar la producción.', 'warn'); return; }
  guardarProyectoId(proyectoId);
  ocultarMensaje();
  setChip('Cargando...', 'normal');
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/produccion`);
  if (!datos.resultado) {
    setMensaje('Todavía no existe producción maestro para este proyecto. Presiona Producir video maestro.', 'warn');
    setChip('Sin resultado', 'warn');
    return;
  }
  await renderResultado(datos);
  setMensaje('Producción maestro cargada correctamente.', 'ok');
}

async function procesarProduccion() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Primero necesitas el proyectoId creado en Nuevo proyecto.', 'warn'); return; }
  guardarProyectoId(proyectoId);
  ocultarMensaje();
  setChip('Produciendo...', 'normal');
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/produccion/procesar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origen: 'pantalla-produccion-maestro' }) });
  await renderResultado(datos);
  const resumenMarcadores = obtenerResumenMarcadores(extraerProduccion(datos));
  setMensaje(datos.mensaje || `Video maestro producido correctamente. Timeline editorial: ${resumenMarcadores.totalMarcadores || 0} marcador(es), ${resumenMarcadores.globales || 0} global(es).`, 'ok');
}

async function solicitarAdaptacion() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Falta proyectoId para adaptar.', 'warn'); return; }
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/adaptacion/procesar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origen: 'pantalla-produccion-maestro' }) });
  setMensaje(datos.mensaje || 'Solicitud de adaptación registrada. El motor real se conectará en el bloque de Adaptación.', 'ok');
}

function enlazarEventos() {
  const root = document.querySelector('[data-produccion-maestro-root]');
  if (!root || root.dataset.produccionMaestroInicializado === '1') return;
  root.dataset.produccionMaestroInicializado = '1';
  const input = $('produccionMaestroProyectoId');
  if (input && !input.value) input.value = localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
  $('produccionMaestroCargarBtn')?.addEventListener('click', () => cargarProduccion().catch((error) => setMensaje(error.message, 'error')));
  $('produccionMaestroProcesarBtn')?.addEventListener('click', () => procesarProduccion().catch((error) => setMensaje(error.message, 'error')));
  $('produccionMaestroAdaptarBtn')?.addEventListener('click', () => solicitarAdaptacion().catch((error) => setMensaje(error.message, 'error')));
  $('produccionMaestroTimeline')?.addEventListener('click', (evento) => {
    const boton = evento.target?.closest?.('[data-marcador-id]');
    if (!boton) return;
    seleccionarMarcador(boton.dataset.marcadorId || '');
  });
}

export function inicializarProduccionMaestroUI() {
  if (typeof document === 'undefined') return;
  enlazarEventos();
  document.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'produccion') setTimeout(enlazarEventos, 0);
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarProduccionMaestroUI);
}
