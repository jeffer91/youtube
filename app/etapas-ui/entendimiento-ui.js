/*
  Bloque 7: Pantalla Entendimiento
  Función: cargar, mostrar y procesar la etapa de entendimiento desde la UI.
*/

const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';

function $(id) { return document.getElementById(id); }
function texto(valor, respaldo = '—') { const limpio = String(valor ?? '').trim(); return limpio || respaldo; }
function escapar(valor) { return texto(valor, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function numero(valor) { const n = Number(valor); return Number.isFinite(n) ? n : null; }

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

function renderKpis(resultado = {}) {
  const resumen = obtenerResumen(resultado);
  const duracion = numero(resumen.duracionSegundos);
  $('entendimientoOrientacion').textContent = texto(resumen.orientacion || resultado.analisis?.orientacion);
  $('entendimientoDuracion').textContent = duracion !== null ? `${duracion}s` : '—';
  $('entendimientoAudio').textContent = resumen.tieneAudio ? 'Sí' : 'No / pendiente';
  $('entendimientoFotogramas').textContent = String(resumen.fotogramasExtraidos ?? resultado.fotogramas?.cantidadExtraida ?? 0);
  $('entendimientoMomentos').textContent = String(resumen.momentosClave ?? resultado.analisisVideo?.momentosClave?.length ?? 0);
  $('entendimientoListo').textContent = resumen.listoParaEditar ? 'Sí' : 'Revisar';
}

function renderTranscripcion(resultado = {}) {
  const transcripcion = resultado.transcripcion || {};
  const textoCompleto = texto(transcripcion.textoCompleto, 'Sin texto transcrito todavía. La estructura de segmentos está preparada para el plan de edición.');
  const segmentos = Array.isArray(transcripcion.segmentos) ? transcripcion.segmentos : [];
  $('entendimientoTranscripcionEstado').textContent = transcripcion.textoCompleto ? 'Texto real' : `${segmentos.length} segmento(s)`;
  $('entendimientoTranscripcion').innerHTML = `<p>${escapar(textoCompleto)}</p>` + (segmentos.length ? `<ol>${segmentos.slice(0, 8).map((s) => `<li><strong>${escapar(s.inicio)}s - ${escapar(s.fin ?? 'fin')}s</strong><span>${escapar(s.texto || s.nota || 'Segmento preparado')}</span></li>`).join('')}</ol>` : '');
}

function renderFrames(resultado = {}) {
  const frames = Array.isArray(resultado.fotogramas?.fotogramas) ? resultado.fotogramas.fotogramas : [];
  $('entendimientoFramesEstado').textContent = String(frames.length);
  const contenedor = $('entendimientoFrames');
  if (!frames.length) {
    contenedor.innerHTML = '<div class="entendimiento-empty">No hay fotogramas disponibles para este proyecto.</div>';
    return;
  }
  contenedor.innerHTML = frames.slice(0, 8).map((frame) => {
    const src = frame.rutaRelativa || '';
    return `<article class="entendimiento-frame"><div>${src ? `<img src="${escapar(src)}" alt="Fotograma ${escapar(frame.id)}" />` : '<span>Sin preview</span>'}</div><strong>${escapar(frame.id)}</strong><small>${escapar(frame.segundo)}s · ${escapar(frame.estado)}</small></article>`;
  }).join('');
}

function renderGlobal(resultado = {}) {
  const analisis = resultado.analisisVideo || {};
  const editorial = analisis.resumenEditorial || resultado.reporteEntendimiento?.resumen?.editorial || {};
  const momentos = Array.isArray(analisis.momentosClave) ? analisis.momentosClave : [];
  $('entendimientoGlobalEstado').textContent = analisis.ok ? 'Generado' : 'Pendiente';
  $('entendimientoGlobal').innerHTML = `
    <article><strong>Formato detectado</strong><span>${escapar(editorial.formatoDetectado || 'desconocido')}</span></article>
    <article><strong>Tipo de duración</strong><span>${escapar(editorial.duracionTipo || 'desconocida')}</span></article>
    <article><strong>Lectura</strong><span>${escapar(editorial.lectura || 'Sin lectura editorial todavía.')}</span></article>
    <article><strong>Recomendación</strong><span>${escapar(editorial.recomendacionInicial || 'Revisar entendimiento antes de planificar.')}</span></article>
    <article><strong>Momentos principales</strong><span>${momentos.slice(0, 5).map((m) => `${m.inicio}s ${m.tipo}`).join(' · ') || 'Sin momentos'}</span></article>
  `;
}

function renderNecesidades(resultado = {}) {
  const necesidades = resultado.analisisVideo?.necesidades || resultado.reporteEntendimiento?.resumen?.necesidades || obtenerResumen(resultado).necesidades || [];
  $('entendimientoNecesidadesEstado').textContent = String(necesidades.length);
  $('entendimientoNecesidades').innerHTML = necesidades.length ? necesidades.map((item) => `<span>${escapar(item)}</span>`).join('') : '<span>Sin necesidades críticas</span>';
}

function renderResultado(datos = {}) {
  const resultado = extraerResultado(datos);
  renderKpis(resultado);
  renderTranscripcion(resultado);
  renderFrames(resultado);
  renderGlobal(resultado);
  renderNecesidades(resultado);
  const listo = Boolean(obtenerResumen(resultado).listoParaEditar || resultado.reporteEntendimiento?.listoParaEditar);
  const planBtn = $('entendimientoCrearPlanBtn');
  if (planBtn) planBtn.disabled = !listo;
  setChip(listo ? 'Entendido' : 'Revisar', listo ? 'ok' : 'warn');
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
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/entendimiento/procesar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origen: 'pantalla-entendimiento' }) });
  renderResultado(datos);
  setMensaje(datos.mensaje || 'Entendimiento procesado correctamente.', 'ok');
}

async function crearPlanPlaceholder() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Falta proyectoId para crear el plan.', 'warn'); return; }
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/plan/procesar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origen: 'pantalla-entendimiento' }) });
  setMensaje(datos.mensaje || 'Solicitud de plan registrada. El motor real se conectará en el bloque del Plan.', 'ok');
}

function enlazarEventos() {
  const root = document.querySelector('[data-entendimiento-root]');
  if (!root || root.dataset.entendimientoInicializado === '1') return;
  root.dataset.entendimientoInicializado = '1';
  const input = $('entendimientoProyectoId');
  if (input && !input.value) input.value = localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
  $('entendimientoCargarBtn')?.addEventListener('click', () => cargarEntendimiento().catch((error) => setMensaje(error.message, 'error')));
  $('entendimientoProcesarBtn')?.addEventListener('click', () => procesarEntendimiento().catch((error) => setMensaje(error.message, 'error')));
  $('entendimientoCrearPlanBtn')?.addEventListener('click', () => crearPlanPlaceholder().catch((error) => setMensaje(error.message, 'error')));
}

export function inicializarEntendimientoUI() {
  enlazarEventos();
  document.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'entendimiento') setTimeout(enlazarEventos, 0);
  });
}

document.addEventListener('DOMContentLoaded', inicializarEntendimientoUI);
