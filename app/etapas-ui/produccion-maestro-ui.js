/*
  Bloque 11: Pantalla Producción maestro
  Función: cargar, producir y mostrar el video maestro desde la UI por etapas.
*/

const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';

function $(id) { return document.getElementById(id); }
function texto(valor, respaldo = '—') { const limpio = String(valor ?? '').trim(); return limpio || respaldo; }
function escapar(valor) { return texto(valor, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function numero(valor) { const n = Number(valor); return Number.isFinite(n) ? n : null; }
function peso(bytes) { const n = numero(bytes, 0); if (!n) return '—'; if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`; return `${(n / (1024 * 1024)).toFixed(1)} MB`; }

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

async function renderKpis(produccion = {}) {
  const resumen = obtenerResumen(produccion);
  const video = produccion.videoMaestro || {};
  const elementos = elementosPlan(produccion);
  $('produccionMaestroNombre').textContent = texto(video.nombre || resumen.videoMaestro, '—');
  $('produccionMaestroPeso').textContent = peso(video.pesoBytes || resumen.pesoBytes);
  $('produccionMaestroModo').textContent = texto(resumen.modo || produccion.salida?.modo || produccion.edicion?.modo);
  $('produccionMaestroPlataforma').textContent = texto(resumen.plataformaBase || produccion.salida?.plataforma || produccion.edicion?.plataforma);
  $('produccionMaestroElementos').textContent = String(resumen.totalElementosPlan ?? elementos.length ?? 0);
  $('produccionMaestroListo').textContent = resumen.listoParaAdaptacion ? 'Sí' : 'Revisar';
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

function obtenerDuracionElementos(elementos = []) {
  return Math.max(30, ...elementos.map((item) => numero(item.fin ?? item.datos?.fin, 0)).filter((item) => item >= 0));
}

function renderTimelineItem(item = {}, duracion = 30) {
  const inicio = Math.max(0, numero(item.inicio ?? item.datos?.inicio, 0));
  const finBase = numero(item.fin ?? item.datos?.fin, inicio + 2);
  const fin = finBase <= inicio ? inicio + 2 : finBase;
  const left = duracion ? Math.max(0, Math.min(96, (inicio / duracion) * 100)) : 0;
  const width = duracion ? Math.max(4, Math.min(100 - left, ((fin - inicio) / duracion) * 100)) : 8;
  const estado = item.aprobado ? 'aprobado' : item.rechazado ? 'rechazado' : 'revision';
  return `<button class="produccion-maestro-timeline-item is-${estado}" style="left:${left}%;width:${width}%" type="button" title="${escapar(item.nombre || item.tipo)}"><span>${escapar(item.tipo || 'item')}</span><strong>${escapar(item.nombre || item.titulo || item.id || 'Elemento')}</strong><small>${inicio.toFixed(1)}s</small></button>`;
}

function renderTimeline(produccion = {}) {
  const contenedor = $('produccionMaestroTimeline');
  const estado = $('produccionMaestroTimelineEstado');
  const elementos = elementosPlan(produccion);
  const duracion = obtenerDuracionElementos(elementos);
  if (estado) estado.textContent = String(elementos.length);
  if (!contenedor) return;
  if (!elementos.length) {
    contenedor.innerHTML = '<div class="produccion-maestro-empty">No hay elementos de plan usados en esta producción.</div>';
    return;
  }
  const pistas = ['subtitulo', 'texto', 'recurso', 'efecto', 'zoom', 'animacion', 'audio', 'otros'].map((tipo) => ({ tipo, items: [] }));
  elementos.forEach((item) => {
    const tipo = ['subtitulo', 'texto', 'recurso', 'efecto', 'zoom', 'animacion', 'audio'].includes(item.tipo) ? item.tipo : 'otros';
    pistas.find((pista) => pista.tipo === tipo).items.push(item);
  });
  contenedor.innerHTML = pistas.filter((pista) => pista.items.length).map((pista) => `<section class="produccion-maestro-track"><strong>${escapar(pista.tipo)}</strong><div class="produccion-maestro-lane">${pista.items.map((item) => renderTimelineItem(item, duracion)).join('')}</div></section>`).join('');
}

function renderAuditoria(produccion = {}) {
  const auditoria = produccion.auditoria || {};
  const edicion = auditoria.edicion || {};
  const salida = auditoria.salida || {};
  const contenedor = $('produccionMaestroAuditoria');
  const estado = $('produccionMaestroAuditoriaEstado');
  if (estado) estado.textContent = auditoria.tipo ? 'Generada' : 'Sin datos';
  if (!contenedor) return;
  contenedor.innerHTML = `
    <article><span>Edición</span><strong>${edicion.ok ? 'OK' : 'Pendiente'}</strong><small>${escapar(edicion.tipo || 'sin tipo')}</small></article>
    <article><span>Sonidos</span><strong>${edicion.sonidosAplicados ? 'Sí' : 'No'}</strong><small>Audio de edición</small></article>
    <article><span>Animaciones</span><strong>${edicion.animacionesAplicadas ? 'Sí' : 'No'}</strong><small>Render visual</small></article>
    <article><span>Salida</span><strong>${salida.ok ? 'OK' : 'Pendiente'}</strong><small>${escapar(salida.nombreExportado || 'sin archivo')}</small></article>
  `;
}

function renderDetalle(produccion = {}) {
  const detalle = $('produccionMaestroDetalle');
  const estado = $('produccionMaestroDetalleEstado');
  const elementos = elementosPlan(produccion);
  if (estado) estado.textContent = String(elementos.length);
  if (!detalle) return;
  if (!elementos.length) {
    detalle.innerHTML = '<div class="produccion-maestro-empty">Sin elementos de plan para revisar.</div>';
    return;
  }
  detalle.innerHTML = `<div class="produccion-maestro-table-wrap"><table class="produccion-maestro-table"><thead><tr><th>Elemento</th><th>Tipo</th><th>Tiempo</th><th>Estado</th><th>Motivo</th></tr></thead><tbody>${elementos.slice(0, 120).map((item) => {
    const estadoItem = item.aprobado ? 'aprobado' : item.rechazado ? 'rechazado' : 'revisión';
    return `<tr><td><strong>${escapar(item.nombre || item.titulo || item.id)}</strong><small>${escapar(item.descripcion || '')}</small></td><td>${escapar(item.tipo)}</td><td>${escapar(item.inicio ?? '—')} - ${escapar(item.fin ?? '—')}</td><td><span class="produccion-maestro-pill is-${escapar(estadoItem)}">${escapar(estadoItem)}</span></td><td>${escapar(item.motivo || item.datos?.motivo || 'Elemento usado en producción.')}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

async function renderResultado(datos = {}) {
  const produccion = extraerProduccion(datos);
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
  setMensaje(datos.mensaje || 'Video maestro producido correctamente.', 'ok');
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
