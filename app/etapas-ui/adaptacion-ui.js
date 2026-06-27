/*
  Bloque 16: Pantalla Adaptación
  Función: cargar, procesar y mostrar adaptaciones por plataforma desde la UI.
*/

const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';

function $(id) { return document.getElementById(id); }
function texto(valor, respaldo = '—') { const limpio = String(valor ?? '').trim(); return limpio || respaldo; }
function escapar(valor) { return texto(valor, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function numero(valor) { const n = Number(valor); return Number.isFinite(n) ? n : null; }
function peso(bytes) { const n = numero(bytes); if (!n) return '—'; if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`; return `${(n / (1024 * 1024)).toFixed(1)} MB`; }

async function obtenerBaseApi() {
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try {
      const estado = await apiElectron();
      if (estado?.url) return estado.url;
    } catch (error) {
      console.warn('[Adaptación UI] No se pudo leer servidor Electron:', error.message);
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
  const input = $('adaptacionProyectoId');
  const desdeInput = input?.value?.trim();
  if (desdeInput) return desdeInput;
  return localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
}

function guardarProyectoId(proyectoId) {
  if (!proyectoId) return;
  localStorage.setItem(STORAGE_PROYECTO_ETAPAS, proyectoId);
  const input = $('adaptacionProyectoId');
  if (input && !input.value) input.value = proyectoId;
}

function setMensaje(mensaje, tipo = 'normal') {
  const box = $('adaptacionMensaje');
  if (!box) return;
  box.hidden = false;
  box.textContent = mensaje;
  box.className = `adaptacion-message is-${tipo}`;
}

function ocultarMensaje() {
  const box = $('adaptacionMensaje');
  if (!box) return;
  box.hidden = true;
  box.textContent = '';
}

function setChip(textoChip, tipo = 'normal') {
  const chip = $('adaptacionEstadoChip');
  if (!chip) return;
  chip.textContent = textoChip;
  chip.className = `aj-status-chip adaptacion-chip is-${tipo}`;
}

function extraerAdaptacion(payload = {}) {
  const wrapper = payload.resultado || payload;
  if (wrapper?.resultado?.resultadoPlataformas) return wrapper.resultado;
  if (wrapper?.datos?.resultado?.resultadoPlataformas) return wrapper.datos.resultado;
  if (wrapper?.resultadoPlataformas) return wrapper;
  return wrapper?.resultado || wrapper;
}

function plataformasResultado(adaptacion = {}) {
  const lista = adaptacion.resultadoPlataformas?.resultados || adaptacion.resumen?.plataformas || [];
  return Array.isArray(lista) ? lista : [];
}

function exportacionesPreparadas(adaptacion = {}) {
  return Array.isArray(adaptacion.exportaciones) ? adaptacion.exportaciones : [];
}

function obtenerPlataformasSeleccionadas() {
  const checks = [...document.querySelectorAll('input[name="adaptacionPlataforma"]')];
  const seleccionadas = checks.filter((check) => check.checked).map((check) => check.value);
  return seleccionadas.length ? seleccionadas : ['tiktok', 'reels', 'shorts', 'youtube'];
}

function renderKpis(adaptacion = {}) {
  const resumen = adaptacion.resumen || {};
  const plataformas = plataformasResultado(adaptacion);
  $('adaptacionTotal').textContent = String(resumen.total ?? plataformas.length ?? 0);
  $('adaptacionExportadas').textContent = String(resumen.exportadas ?? plataformas.filter((item) => item.estado === 'exportado').length);
  $('adaptacionPendientes').textContent = String(resumen.pendientes ?? plataformas.filter((item) => item.estado !== 'exportado').length);
  $('adaptacionErrores').textContent = String(resumen.errores ?? plataformas.filter((item) => item.estado === 'error_render').length);
  $('adaptacionPeso').textContent = peso(resumen.pesoTotalBytes);
  $('adaptacionListo').textContent = resumen.listoParaResultado ? 'Sí' : 'Revisar';
}

async function renderBase(adaptacion = {}) {
  const salida = adaptacion.salidaBase || {};
  const video = $('adaptacionBaseVideo');
  const estado = $('adaptacionBaseEstado');
  const info = $('adaptacionBaseInfo');
  const url = await urlPublica(salida.urlPublica || '');
  if (video) {
    if (url) video.src = url;
    else { video.removeAttribute('src'); video.load?.(); }
  }
  if (estado) estado.textContent = url ? 'Disponible' : 'Sin preview';
  if (info) {
    info.innerHTML = `
      <article><strong>Archivo</strong><span>${escapar(salida.nombreExportado || '—')}</span></article>
      <article><strong>Plataforma base</strong><span>${escapar(salida.plataforma || '—')}</span></article>
      <article><strong>Formato base</strong><span>${escapar(salida.formato || '—')}</span></article>
      <article><strong>Peso</strong><span>${escapar(peso(salida.pesoBytes))}</span></article>
    `;
  }
}

function renderLectura(adaptacion = {}) {
  const lectura = Array.isArray(adaptacion.lectura) ? adaptacion.lectura : [];
  const estado = $('adaptacionLecturaEstado');
  const contenedor = $('adaptacionLectura');
  if (estado) estado.textContent = String(lectura.length);
  if (!contenedor) return;
  contenedor.innerHTML = lectura.length ? `<ol>${lectura.map((item) => `<li>${escapar(item)}</li>`).join('')}</ol>` : '<div class="adaptacion-empty">Sin lectura de adaptación.</div>';
}

async function renderPlataformas(adaptacion = {}) {
  const plataformas = plataformasResultado(adaptacion);
  const estado = $('adaptacionPlataformasEstado');
  const contenedor = $('adaptacionPlataformas');
  if (estado) estado.textContent = String(plataformas.length);
  if (!contenedor) return;
  if (!plataformas.length) {
    contenedor.innerHTML = '<div class="adaptacion-empty">No hay plataformas adaptadas todavía.</div>';
    return;
  }
  const cards = await Promise.all(plataformas.map(async (item) => {
    const url = await urlPublica(item.urlPublica || '');
    const estadoClase = item.estado === 'exportado' ? 'is-ok' : item.estado === 'error_render' ? 'is-bad' : 'is-warn';
    return `<article class="adaptacion-platform-card ${estadoClase}">
      <header><div><strong>${escapar(item.nombre || item.plataforma)}</strong><small>${escapar(item.formato || 'formato')}</small></div><span>${escapar(item.estado || 'pendiente')}</span></header>
      ${url ? `<video src="${escapar(url)}" controls playsinline></video>` : '<div class="adaptacion-platform-empty">Sin render</div>'}
      <dl>
        <div><dt>Resolución</dt><dd>${escapar(item.width || '—')} × ${escapar(item.height || '—')}</dd></div>
        <div><dt>Peso</dt><dd>${escapar(peso(item.pesoBytes))}</dd></div>
        <div><dt>Archivo</dt><dd>${escapar(item.nombreExportado || item.destinoPlaneado || '—')}</dd></div>
      </dl>
      ${url ? `<a href="${escapar(url)}" target="_blank" rel="noreferrer">Abrir exportación</a>` : ''}
      <p>${escapar(item.mensaje || '')}</p>
    </article>`;
  }));
  contenedor.innerHTML = cards.join('');
}

function renderExportaciones(adaptacion = {}) {
  const exportaciones = exportacionesPreparadas(adaptacion);
  const estado = $('adaptacionExportacionesEstado');
  const contenedor = $('adaptacionExportaciones');
  if (estado) estado.textContent = String(exportaciones.length);
  if (!contenedor) return;
  if (!exportaciones.length) {
    contenedor.innerHTML = '<div class="adaptacion-empty">Sin exportaciones preparadas.</div>';
    return;
  }
  const rows = exportaciones.map((item) => `
    <tr>
      <td><strong>${escapar(item.nombre || item.plataforma)}</strong><small>${escapar(item.plataforma)}</small></td>
      <td>${escapar(item.formato)}</td>
      <td>${escapar(item.width)} × ${escapar(item.height)}</td>
      <td>${escapar(item.estado)}</td>
      <td>${escapar(item.videoDestino || '—')}</td>
    </tr>
  `).join('');
  contenedor.innerHTML = `<div class="adaptacion-table-wrap"><table class="adaptacion-table"><thead><tr><th>Plataforma</th><th>Formato</th><th>Tamaño</th><th>Estado</th><th>Destino</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

async function renderResultado(datos = {}) {
  const adaptacion = extraerAdaptacion(datos);
  renderKpis(adaptacion);
  await renderBase(adaptacion);
  renderLectura(adaptacion);
  await renderPlataformas(adaptacion);
  renderExportaciones(adaptacion);
  const listo = Boolean(adaptacion.resumen?.listoParaResultado || adaptacion.resultadoPlataformas?.exportadas > 0);
  const resultadoBtn = $('adaptacionResultadoBtn');
  if (resultadoBtn) resultadoBtn.disabled = !listo;
  setChip(listo ? 'Adaptado' : 'Revisar', listo ? 'ok' : 'warn');
}

async function cargarAdaptacion() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Escribe o pega el proyectoId para cargar la adaptación.', 'warn'); return; }
  guardarProyectoId(proyectoId);
  ocultarMensaje();
  setChip('Cargando...', 'normal');
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/adaptacion`);
  if (!datos.resultado) {
    setMensaje('Todavía no existe adaptación para este proyecto. Presiona Adaptar plataformas.', 'warn');
    setChip('Sin resultado', 'warn');
    return;
  }
  await renderResultado(datos);
  setMensaje('Adaptación cargada correctamente.', 'ok');
}

async function procesarAdaptacion() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Primero necesitas el proyectoId creado en Nuevo proyecto.', 'warn'); return; }
  guardarProyectoId(proyectoId);
  ocultarMensaje();
  setChip('Adaptando...', 'normal');
  const plataformas = obtenerPlataformasSeleccionadas();
  const renderizarBaseOtraVez = Boolean($('adaptacionRenderBaseOtraVez')?.checked);
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/adaptacion/procesar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origen: 'pantalla-adaptacion', plataformas, renderizarBaseOtraVez })
  });
  await renderResultado(datos);
  setMensaje(datos.mensaje || 'Adaptación a plataformas completada correctamente.', 'ok');
}

async function solicitarResultadoFinal() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Falta proyectoId para preparar resultado final.', 'warn'); return; }
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/resultado/exportar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origen: 'pantalla-adaptacion' }) });
  setMensaje(datos.mensaje || 'Solicitud de resultado final registrada. El motor real se conectará en el bloque de Resultado.', 'ok');
}

function enlazarEventos() {
  const root = document.querySelector('[data-adaptacion-root]');
  if (!root || root.dataset.adaptacionInicializada === '1') return;
  root.dataset.adaptacionInicializada = '1';
  const input = $('adaptacionProyectoId');
  if (input && !input.value) input.value = localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
  $('adaptacionCargarBtn')?.addEventListener('click', () => cargarAdaptacion().catch((error) => setMensaje(error.message, 'error')));
  $('adaptacionProcesarBtn')?.addEventListener('click', () => procesarAdaptacion().catch((error) => setMensaje(error.message, 'error')));
  $('adaptacionResultadoBtn')?.addEventListener('click', () => solicitarResultadoFinal().catch((error) => setMensaje(error.message, 'error')));
}

export function inicializarAdaptacionUI() {
  if (typeof document === 'undefined') return;
  enlazarEventos();
  document.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'adaptacion') setTimeout(enlazarEventos, 0);
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarAdaptacionUI);
}
