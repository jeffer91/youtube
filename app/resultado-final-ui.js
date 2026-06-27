/*
  Bloque 17: Resultado final
  Función: cargar y generar resultado final desde el flujo por etapas.
*/

const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';
const CLAVE_ULTIMA_PRODUCCION = 'autovideojeff:ultima-produccion';

function obtenerDocumento() { return typeof document === 'undefined' ? null : document; }
function $(id) { return document.getElementById(id); }
function texto(valor, respaldo = '—') { const limpio = String(valor ?? '').trim(); return limpio || respaldo; }
function escapar(valor = '') { return String(valor).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function numero(valor) { const n = Number(valor); return Number.isFinite(n) ? n : null; }
function peso(bytes) { const n = numero(bytes); if (!n) return '—'; if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`; return `${(n / (1024 * 1024)).toFixed(1)} MB`; }

function cargarUltimoPayloadLegacy() {
  try { const raw = window.localStorage.getItem(CLAVE_ULTIMA_PRODUCCION); return raw ? JSON.parse(raw) : null; } catch (_error) { return null; }
}

async function obtenerBaseApi() {
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try { const estado = await apiElectron(); if (estado?.url) return estado.url; } catch (_error) {}
  }
  return window.location.origin;
}

async function crearUrlPublica(ruta = '') {
  if (!ruta) return '';
  if (/^https?:\/\//i.test(ruta)) return ruta;
  const base = await obtenerBaseApi();
  return `${base}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
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
  const input = $('resultadoFinalProyectoId');
  const desdeInput = input?.value?.trim();
  if (desdeInput) return desdeInput;
  return localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
}

function guardarProyectoId(proyectoId) {
  if (!proyectoId) return;
  localStorage.setItem(STORAGE_PROYECTO_ETAPAS, proyectoId);
  const input = $('resultadoFinalProyectoId');
  if (input && !input.value) input.value = proyectoId;
}

function setMensaje(mensaje, tipo = 'normal') {
  const box = $('resultadoFinalMensaje');
  if (!box) return;
  box.hidden = false;
  box.textContent = mensaje;
  box.className = `result-final-message is-${tipo}`;
}

function ocultarMensaje() {
  const box = $('resultadoFinalMensaje');
  if (!box) return;
  box.hidden = true;
  box.textContent = '';
}

function setChip(textoChip, tipo = 'normal') {
  const chip = $('resultadoFinalEstadoChip');
  if (!chip) return;
  chip.textContent = textoChip;
  chip.className = `aj-status-chip result-final-chip is-${tipo}`;
}

function extraerResultadoFinal(payload = {}) {
  const wrapper = payload.resultado || payload;
  if (wrapper?.resultado?.resumen) return wrapper.resultado;
  if (wrapper?.datos?.resultado?.resumen) return wrapper.datos.resultado;
  if (wrapper?.resumen) return wrapper;
  return wrapper?.resultado || wrapper;
}

function renderKpis(resultado = {}) {
  const resumen = resultado.resumen || {};
  $('resultadoFinalPlataformas').textContent = `${resumen.plataformasExportadas ?? 0}/${resumen.plataformasTotales ?? 0}`;
  $('resultadoFinalElementos').textContent = String(resumen.elementosPlan ?? 0);
  $('resultadoFinalEfectos').textContent = String(resumen.efectosUsados ?? 0);
  $('resultadoFinalTextos').textContent = String(resumen.textosUsados ?? 0);
  $('resultadoFinalPeso').textContent = peso(resumen.pesoTotalBytes);
  $('resultadoFinalListo').textContent = resumen.listoParaPublicar ? 'Sí' : 'Revisar';
}

async function renderVideoMaestro(resultado = {}) {
  const video = resultado.videos?.maestro || {};
  const nodoVideo = $('resultadoFinalVideo');
  const estado = $('resultadoFinalVideoEstado');
  const info = $('resultadoFinalVideoInfo');
  const url = await crearUrlPublica(video.urlPublica || '');
  if (nodoVideo) {
    if (url) { nodoVideo.hidden = false; nodoVideo.src = url; }
    else { nodoVideo.hidden = true; nodoVideo.removeAttribute('src'); nodoVideo.load?.(); }
  }
  if (estado) estado.textContent = url ? 'Disponible' : 'Sin video';
  if (info) {
    info.innerHTML = `
      <article><strong>Archivo</strong><span>${escapar(video.nombre || '—')}</span></article>
      <article><strong>Plataforma base</strong><span>${escapar(video.plataforma || '—')}</span></article>
      <article><strong>Formato</strong><span>${escapar(video.formato || '—')}</span></article>
      <article><strong>Peso</strong><span>${escapar(peso(video.pesoBytes))}</span></article>
      ${url ? `<a href="${escapar(url)}" target="_blank" rel="noreferrer">Abrir video maestro</a>` : ''}
    `;
  }
}

function renderChecklist(resultado = {}) {
  const checklist = Array.isArray(resultado.checklist) ? resultado.checklist : [];
  const estado = $('resultadoFinalChecklistEstado');
  const contenedor = $('resultadoFinalChecklist');
  if (estado) estado.textContent = String(checklist.length);
  if (!contenedor) return;
  contenedor.innerHTML = checklist.length ? checklist.map((item) => `<article class="result-final-check ${item.ok ? 'is-ok' : 'is-warn'}"><strong>${item.ok ? 'OK' : 'Revisar'} · ${escapar(item.nombre)}</strong><span>${escapar(item.detalle || '')}</span></article>`).join('') : '<div class="result-final-empty">Sin checklist final.</div>';
}

async function renderVersiones(resultado = {}) {
  const versiones = Array.isArray(resultado.videos?.plataformas) ? resultado.videos.plataformas : [];
  const estado = $('resultadoFinalVersionesEstado');
  const contenedor = $('resultadoFinalVersiones');
  if (estado) estado.textContent = String(versiones.length);
  if (!contenedor) return;
  if (!versiones.length) {
    contenedor.innerHTML = '<div class="result-final-empty">Sin versiones por plataforma.</div>';
    return;
  }
  const cards = await Promise.all(versiones.map(async (item) => {
    const url = await crearUrlPublica(item.urlPublica || '');
    const clase = item.estado === 'exportado' ? 'is-ok' : item.estado === 'error_render' ? 'is-bad' : 'is-warn';
    return `<article class="result-final-platform ${clase}"><header><strong>${escapar(item.nombre || item.plataforma)}</strong><span>${escapar(item.estado || 'pendiente')}</span></header><p>${escapar(item.formato || '')} · ${escapar(peso(item.pesoBytes))}</p>${url ? `<a href="${escapar(url)}" target="_blank" rel="noreferrer">Abrir exportación</a>` : '<small>Sin URL pública</small>'}</article>`;
  }));
  contenedor.innerHTML = cards.join('');
}

function renderReporte(resultado = {}) {
  const contenedor = $('resultadoFinalContent');
  const estado = $('resultadoFinalReporteEstado');
  const recomendaciones = Array.isArray(resultado.recomendaciones) ? resultado.recomendaciones : [];
  const publicacion = Array.isArray(resultado.publicacionSugerida) ? resultado.publicacionSugerida : [];
  const entregables = resultado.entregables || {};
  if (estado) estado.textContent = String(recomendaciones.length + publicacion.length);
  if (!contenedor) return;
  contenedor.innerHTML = `
    <article class="result-final-report-card"><h3>Recomendaciones</h3>${recomendaciones.length ? `<ul>${recomendaciones.map((item) => `<li>${escapar(item)}</li>`).join('')}</ul>` : '<p>No hay recomendaciones.</p>'}</article>
    <article class="result-final-report-card"><h3>Publicación sugerida</h3>${publicacion.length ? `<ul>${publicacion.map((item) => `<li><strong>${escapar(item.plataforma)}</strong> · ${escapar(item.sugerencia)}</li>`).join('')}</ul>` : '<p>No hay publicación sugerida.</p>'}</article>
    <article class="result-final-report-card"><h3>Entregables</h3>
      <ul>
        ${entregables.json?.rutaRelativa ? `<li>JSON: ${escapar(entregables.json.rutaRelativa)}</li>` : ''}
        ${entregables.html?.rutaRelativa ? `<li>HTML: ${escapar(entregables.html.rutaRelativa)}</li>` : ''}
        ${entregables.manifest?.rutaRelativa ? `<li>Manifest: ${escapar(entregables.manifest.rutaRelativa)}</li>` : ''}
      </ul>
    </article>
  `;
}

async function renderResultadoFinal(datos = {}) {
  const resultado = extraerResultadoFinal(datos);
  renderKpis(resultado);
  await renderVideoMaestro(resultado);
  renderChecklist(resultado);
  await renderVersiones(resultado);
  renderReporte(resultado);
  const status = $('resultadoFinalStatus');
  if (status) status.textContent = resultado.resumen?.listoParaPublicar ? 'Resultado final listo para revisión y publicación.' : 'Resultado final con pendientes de revisión.';
  setChip(resultado.resumen?.listoParaPublicar ? 'Finalizado' : 'Revisar', resultado.resumen?.listoParaPublicar ? 'ok' : 'warn');
}

async function cargarResultadoFinal() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Escribe o pega el proyectoId para cargar el resultado final.', 'warn'); return false; }
  guardarProyectoId(proyectoId);
  ocultarMensaje();
  setChip('Cargando...', 'normal');
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/resultado`);
  if (!datos.resultado) {
    setMensaje('Todavía no existe resultado final. Presiona Generar resultado final.', 'warn');
    setChip('Sin resultado', 'warn');
    return false;
  }
  await renderResultadoFinal(datos);
  setMensaje('Resultado final cargado correctamente.', 'ok');
  return true;
}

async function generarResultadoFinal() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Primero necesitas el proyectoId del flujo por etapas.', 'warn'); return false; }
  guardarProyectoId(proyectoId);
  ocultarMensaje();
  setChip('Generando...', 'normal');
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/resultado/exportar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origen: 'pantalla-resultado-final' }) });
  await renderResultadoFinal(datos);
  setMensaje(datos.mensaje || 'Resultado final generado correctamente.', 'ok');
  return true;
}

export async function renderizarResultadoFinalUI() {
  const doc = obtenerDocumento();
  if (!doc) return false;
  const input = $('resultadoFinalProyectoId');
  if (input && !input.value) input.value = localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
  const proyectoId = obtenerProyectoId();
  if (proyectoId) return await cargarResultadoFinal().catch((error) => { setMensaje(error.message, 'error'); return false; });

  const payload = cargarUltimoPayloadLegacy();
  const contenedor = $('resultadoFinalContent');
  if (!payload?.resultado || !contenedor) return false;
  contenedor.innerHTML = '<div class="result-final-empty">Hay un resultado legacy en memoria, pero este bloque usa proyectoId por etapas.</div>';
  return false;
}

function enlazarEventos() {
  const root = document.querySelector('[data-resultado-final-root]');
  if (!root || root.dataset.resultadoFinalInicializado === '1') return;
  root.dataset.resultadoFinalInicializado = '1';
  const input = $('resultadoFinalProyectoId');
  if (input && !input.value) input.value = localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
  $('resultadoFinalCargarBtn')?.addEventListener('click', () => cargarResultadoFinal().catch((error) => setMensaje(error.message, 'error')));
  $('resultadoFinalGenerarBtn')?.addEventListener('click', () => generarResultadoFinal().catch((error) => setMensaje(error.message, 'error')));
}

export function inicializarResultadoFinalUI() {
  const doc = obtenerDocumento();
  if (!doc) return false;
  enlazarEventos();
  doc.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'resultado') setTimeout(() => { enlazarEventos(); renderizarResultadoFinalUI(); }, 0);
  });
  return true;
}
