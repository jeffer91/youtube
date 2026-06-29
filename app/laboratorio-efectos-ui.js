/*
  Laboratorio de efectos - UI guiada
  Función: cargar catálogo, seleccionar efecto, renderizar prueba y comparar usando videos normalizados por backend.
*/

import { aplicarProcesoVisual } from './procesos-ui/proceso-visual.service.js';

const STORAGE_LAB_STEP = 'autovideojeff.laboratorioEfectosPaso';
const PASOS_LAB = ['video', 'catalogo', 'efecto', 'esperado', 'probar', 'comparar'];
const MAPA_PASO_PROCESO = Object.freeze({
  video: 'video-corto',
  catalogo: 'categoria-efecto',
  efecto: 'efecto',
  esperado: 'esperado',
  probar: 'probar',
  comparar: 'comparar'
});

let catalogoLab = null;
let efectoSeleccionado = null;
let inicializado = false;
let urlObjetoEntrada = '';
let duracionEntrada = null;
let ultimaComparacion = { original: '', resultado: '' };

function $(id) { return document.getElementById(id); }
function texto(valor, respaldo = '') { const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim(); return limpio || respaldo; }
function escapar(valor) { return texto(valor, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function normalizar(valor = '') { return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function segundos(valor) { const n = Number(valor); return Number.isFinite(n) ? n : 0; }
function tieneVideoEntrada() { return Boolean($('labEfectosVideoInput')?.files?.[0]); }
function tieneResultado() { return Boolean(ultimaComparacion.resultado || $('labEfectosResultadoVideo')?.src || ($('labEfectosResultadoPanel') && !$('labEfectosResultadoPanel').hidden)); }

function asegurarCssLaboratorio() {
  for (const item of [
    ['data-lab-efectos-css', './laboratorio-efectos.css'],
    ['data-lab-efectos-guiado-css', './laboratorio-efectos-guiado.css']
  ]) {
    if (document.querySelector(`link[${item[0]}]`)) continue;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = item[1];
    link.setAttribute(item[0], '1');
    document.head.appendChild(link);
  }
}

async function obtenerBaseApi() {
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try {
      const estado = await apiElectron();
      if (estado?.url) return estado.url;
    } catch (error) {
      console.warn('[Laboratorio efectos UI] No se pudo leer servidor Electron:', error.message);
    }
  }
  return window.location.origin;
}

async function urlApi(ruta) {
  const base = await obtenerBaseApi();
  const normalizada = String(ruta).startsWith('/') ? ruta : `/${ruta}`;
  return `${base}${normalizada}`;
}

async function urlPublica(ruta) {
  if (!ruta) return '';
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return await urlApi(ruta);
}

function urlPreviewSinCache(url = '') {
  const limpia = texto(url, '');
  if (!limpia || /^blob:/i.test(limpia) || /^data:/i.test(limpia)) return limpia;
  const separador = limpia.includes('?') ? '&' : '?';
  return `${limpia}${separador}v=${Date.now()}`;
}

async function apiJson(ruta, opciones = {}) {
  const respuesta = await fetch(await urlApi(ruta), opciones);
  const cuerpo = await respuesta.text();
  let datos = {};
  try { datos = cuerpo ? JSON.parse(cuerpo) : {}; } catch (_error) { datos = { ok: false, mensaje: cuerpo }; }
  if (!respuesta.ok || datos.ok === false) throw new Error(datos.mensaje || `Error HTTP ${respuesta.status}`);
  return datos;
}

function setEstado(mensaje, tipo = 'normal') {
  const estado = $('labEfectosEstado');
  if (!estado) return;
  estado.textContent = mensaje;
  estado.className = `lab-effects-status is-${tipo}`;
}

function setMensaje(mensaje, tipo = 'normal') {
  const box = $('labEfectosMensaje');
  if (!box) return;
  box.hidden = false;
  box.textContent = mensaje;
  box.className = `lab-effects-message is-${tipo}`;
}

function ocultarMensaje() {
  const box = $('labEfectosMensaje');
  if (!box) return;
  box.hidden = true;
  box.textContent = '';
}

function estadoPaso(paso, activo) {
  const video = tieneVideoEntrada();
  const efecto = Boolean(efectoSeleccionado);
  const resultado = tieneResultado();
  if (activo === paso) return 'active';
  if (paso === 'video') return video ? 'done' : 'active';
  if (paso === 'catalogo') return !video ? 'locked' : efecto ? 'done' : 'active';
  if (paso === 'efecto') return !efecto ? 'locked' : 'done';
  if (paso === 'esperado') return !efecto ? 'locked' : 'done';
  if (paso === 'probar') return !video || !efecto ? 'locked' : resultado ? 'done' : 'active';
  if (paso === 'comparar') return !resultado ? 'locked' : 'done';
  return 'locked';
}

export function activarPasoLaboratorioEfectos(paso = 'video', { guardar = true } = {}) {
  const root = document.querySelector('[data-lab-efectos-root]');
  if (!root) return false;
  const pasoFinal = PASOS_LAB.includes(paso) ? paso : 'video';
  root.dataset.procesoPasoActivo = MAPA_PASO_PROCESO[pasoFinal] || 'video-corto';

  root.querySelectorAll('[data-lab-wizard-panel]').forEach((panel) => {
    const activo = panel.dataset.labWizardPanel === pasoFinal;
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
  });

  root.querySelectorAll('[data-lab-wizard-go]').forEach((boton) => {
    const id = boton.dataset.labWizardGo;
    const estado = estadoPaso(id, pasoFinal);
    boton.classList.toggle('is-active', estado === 'active');
    boton.classList.toggle('is-done', estado === 'done');
    boton.classList.toggle('is-locked', estado === 'locked');
  });

  const pendiente = $('labEfectosResultadoPendiente');
  if (pendiente) pendiente.hidden = tieneResultado();

  aplicarProcesoVisual({ contenedor: root, procesoId: 'laboratorio-efectos', pasoActivoId: root.dataset.procesoPasoActivo });
  if (guardar) localStorage.setItem(STORAGE_LAB_STEP, pasoFinal);
  return true;
}

async function irAPasoLaboratorioEfectos(paso = 'video') {
  if (paso !== 'video' && !tieneVideoEntrada()) {
    setMensaje('Primero sube un video corto.', 'warn');
    activarPasoLaboratorioEfectos('video');
    return;
  }
  if (['efecto', 'esperado', 'probar'].includes(paso) && !efectoSeleccionado) {
    setMensaje('Primero selecciona un efecto del catálogo.', 'warn');
    activarPasoLaboratorioEfectos('catalogo');
    return;
  }
  if (paso === 'comparar' && !tieneResultado()) {
    setMensaje('Primero ejecuta la prueba para comparar.', 'warn');
    activarPasoLaboratorioEfectos('probar');
    return;
  }
  ocultarMensaje();
  activarPasoLaboratorioEfectos(paso);
  if (paso === 'comparar') refrescarComparacionVisible();
}

function liberarUrlEntrada() {
  if (!urlObjetoEntrada) return;
  try { URL.revokeObjectURL(urlObjetoEntrada); } catch (_error) {}
  urlObjetoEntrada = '';
}

function formatearDuracion(valor) {
  const total = Math.max(0, segundos(valor));
  const min = Math.floor(total / 60);
  const sec = Math.round(total % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function evaluarDuracionEntrada(duracion) {
  const aviso = $('labEfectosAvisoDuracion');
  const etiqueta = $('labEfectosDuracionEntrada');
  const dur = segundos(duracion);
  duracionEntrada = dur;
  if (etiqueta) etiqueta.textContent = `Duración: ${formatearDuracion(dur)}`;
  if (!aviso) return;
  aviso.className = 'lab-effects-duration-hint';
  if (dur >= 4 && dur <= 14) {
    aviso.textContent = 'Duración válida para laboratorio de efectos.';
    aviso.classList.add('is-ok');
  } else if (dur > 14 && dur <= 25) {
    aviso.textContent = 'El clip sirve, pero para pruebas rápidas es mejor 5 a 12 segundos.';
    aviso.classList.add('is-warn');
  } else if (dur > 25) {
    aviso.textContent = 'El clip es largo para laboratorio; se recomienda cortar a 5 o 12 segundos.';
    aviso.classList.add('is-warn');
  } else {
    aviso.textContent = 'El clip ideal para esta prueba es de 5 a 12 segundos.';
  }
}

function limpiarVideo(video) {
  if (!video) return;
  try {
    video.pause?.();
    video.removeAttribute('src');
    video.load?.();
  } catch (_error) {}
}

function puntoVisible(video, preferido = 0.45) {
  const duracion = Number(video?.duration);
  if (!Number.isFinite(duracion) || duracion <= 0) return 0;
  if (duracion <= 0.8) return 0;
  return Math.min(preferido, Math.max(0, duracion - 0.35));
}

function forzarFrameVisible(video, preferido = 0.45) {
  if (!video || !video.src) return;
  try {
    video.pause?.();
    const punto = puntoVisible(video, preferido);
    if (Number.isFinite(punto) && Math.abs((video.currentTime || 0) - punto) > 0.05) {
      video.currentTime = punto;
    }
  } catch (_error) {}
}

function prepararFrameVisible(video, preferido = 0.45) {
  if (!video) return;
  const ejecutar = () => forzarFrameVisible(video, preferido);
  video.addEventListener('loadedmetadata', ejecutar, { once: true });
  video.addEventListener('loadeddata', ejecutar, { once: true });
  video.addEventListener('canplay', ejecutar, { once: true });
  [60, 220, 600, 1100].forEach((ms) => setTimeout(ejecutar, ms));
}

function asignarFuenteVideo(video, url, { muted = false, resetearFrame = true, preferido = 0.45 } = {}) {
  if (!video) return;
  const limpia = texto(url, '');
  if (!limpia) {
    limpiarVideo(video);
    return;
  }
  try {
    video.preload = 'auto';
    video.muted = Boolean(muted);
    video.playsInline = true;
    video.src = urlPreviewSinCache(limpia);
    if (resetearFrame) prepararFrameVisible(video, preferido);
    video.load?.();
  } catch (_error) {
    limpiarVideo(video);
  }
}

function asignarPreviewOriginal(url) {
  const panelEntrada = $('labEfectosPreviewEntradaPanel');
  const preview = $('labEfectosPreviewEntradaVideo');
  const comparacion = $('labEfectosComparacionOriginal');
  if (panelEntrada) panelEntrada.hidden = !url;
  asignarFuenteVideo(preview, url, { muted: true, resetearFrame: true, preferido: 0.45 });
  asignarFuenteVideo(comparacion, url, { muted: true, resetearFrame: true, preferido: 0.45 });
}

function ocultarResultadoAnterior() {
  const panel = $('labEfectosResultadoPanel');
  const video = $('labEfectosResultadoVideo');
  const original = $('labEfectosComparacionOriginal');
  const descarga = $('labEfectosDescarga');
  const resumen = $('labEfectosResultadoResumen');
  ultimaComparacion = { original: '', resultado: '' };
  if (panel) panel.hidden = true;
  limpiarVideo(video);
  limpiarVideo(original);
  if (descarga) {
    descarga.hidden = true;
    descarga.removeAttribute('href');
    descarga.removeAttribute('download');
  }
  if (resumen) resumen.textContent = '';
  activarPasoLaboratorioEfectos(localStorage.getItem(STORAGE_LAB_STEP) || 'video', { guardar: false });
}

function actualizarArchivoSeleccionado() {
  const input = $('labEfectosVideoInput');
  const fileName = $('labEfectosFileName');
  const archivo = input?.files?.[0] || null;
  liberarUrlEntrada();
  duracionEntrada = null;
  ocultarResultadoAnterior();
  if (!archivo) {
    asignarPreviewOriginal('');
    if (fileName) fileName.textContent = 'Ningún video seleccionado.';
    actualizarBotonProbar();
    activarPasoLaboratorioEfectos('video');
    return;
  }
  urlObjetoEntrada = URL.createObjectURL(archivo);
  if (fileName) fileName.textContent = `${archivo.name} · ${(archivo.size / (1024 * 1024)).toFixed(1)} MB`;
  asignarPreviewOriginal(urlObjetoEntrada);
  actualizarBotonProbar();
  activarPasoLaboratorioEfectos('catalogo');
}

function actualizarBotonProbar() {
  const boton = $('labEfectosProbarBtn');
  const archivo = $('labEfectosVideoInput')?.files?.[0] || null;
  if (boton) boton.disabled = !archivo || !efectoSeleccionado;
}

function efectoCoincideBusqueda(efecto, busqueda = '') {
  if (!busqueda) return true;
  const textoEfecto = normalizar([
    efecto.id,
    efecto.nombre,
    efecto.descripcion,
    efecto.queDebeSalir,
    efecto.tipoRender,
    ...(efecto.tags || [])
  ].join(' '));
  return textoEfecto.includes(busqueda);
}

function renderEfectoCard(efecto) {
  const activo = efectoSeleccionado?.id === efecto.id ? ' is-active' : '';
  const requiereTexto = efecto.requiereTexto ? '<small>Texto</small>' : '';
  return `
    <button class="lab-effects-effect-card${activo}" type="button" data-efecto-id="${escapar(efecto.id)}">
      <span>${escapar(efecto.tipoRender || 'efecto')}</span>
      <strong>${escapar(efecto.nombre)}</strong>
      <p>${escapar(efecto.descripcion)}</p>
      <div>${requiereTexto}<small>${escapar(efecto.intensidadBase || 'normal')}</small><small>${escapar(efecto.duracionSugeridaSegundos || 10)}s</small></div>
    </button>
  `;
}

function renderCatalogo() {
  const contenedor = $('labEfectosAcordeones');
  if (!contenedor) return;
  const acordeones = catalogoLab?.acordeones || [];
  const busqueda = normalizar($('labEfectosBuscar')?.value || '');
  if (!acordeones.length) {
    contenedor.innerHTML = '<div class="lab-effects-empty">No se pudo cargar el catálogo.</div>';
    return;
  }
  const html = acordeones.map((categoria, index) => {
    const efectos = (categoria.efectos || []).filter((efecto) => efectoCoincideBusqueda(efecto, busqueda));
    if (!efectos.length && busqueda) return '';
    return `
      <details class="lab-effects-accordion" ${index === 0 || busqueda ? 'open' : ''}>
        <summary>
          <div>
            <strong>${escapar(categoria.nombre)}</strong>
            <span>${escapar(categoria.descripcion)}</span>
          </div>
          <b>${efectos.length}</b>
        </summary>
        <div class="lab-effects-grid">
          ${efectos.map(renderEfectoCard).join('') || '<div class="lab-effects-empty">Sin efectos visibles.</div>'}
        </div>
      </details>
    `;
  }).join('');
  contenedor.innerHTML = html || '<div class="lab-effects-empty">No hay efectos que coincidan con la búsqueda.</div>';
}

function crearChecklistEfecto() {
  if (!efectoSeleccionado) return ['Selecciona un efecto.', 'Sube un clip corto.', 'Compara original contra resultado.'];
  return [
    `Debe verse: ${efectoSeleccionado.queDebeSalir}`,
    efectoSeleccionado.requiereTexto ? 'Este efecto usa texto; puedes cambiarlo en el campo opcional.' : 'Este efecto no necesita texto.',
    'Después de producir, compara el original con el resultado lado a lado.'
  ];
}

function renderChecklist() {
  const lista = $('labEfectosChecklist');
  if (!lista) return;
  lista.innerHTML = crearChecklistEfecto().map((item) => `<li>${escapar(item)}</li>`).join('');
}

function renderSeleccion() {
  const resumen = $('labEfectosResumenSeleccion');
  const esperado = $('labEfectosQueDebeSalir');
  const hidden = $('labEfectosSeleccionado');
  if (hidden) hidden.value = efectoSeleccionado?.id || '';
  if (!efectoSeleccionado) {
    if (resumen) resumen.innerHTML = '<strong>Sin efecto seleccionado</strong><span>Elige un efecto del catálogo.</span>';
    if (esperado) esperado.textContent = 'Selecciona un efecto para ver la explicación esperada.';
    renderChecklist();
    actualizarBotonProbar();
    return;
  }
  if (resumen) {
    resumen.innerHTML = `
      <strong>${escapar(efectoSeleccionado.nombre)}</strong>
      <span>${escapar(efectoSeleccionado.descripcion)}</span>
      <em>${escapar(efectoSeleccionado.categoriaId)} · ${escapar(efectoSeleccionado.tipoRender)} · intensidad ${escapar(efectoSeleccionado.intensidadBase)}</em>
    `;
  }
  if (esperado) esperado.textContent = efectoSeleccionado.queDebeSalir || 'Debe verse el efecto seleccionado en el clip.';
  renderChecklist();
  actualizarBotonProbar();
}

function seleccionarEfecto(efectoId) {
  const efecto = (catalogoLab?.acordeones || []).flatMap((cat) => cat.efectos || []).find((item) => item.id === efectoId) || null;
  if (!efecto) return;
  efectoSeleccionado = efecto;
  renderSeleccion();
  renderCatalogo();
  ocultarMensaje();
  activarPasoLaboratorioEfectos('efecto');
}

async function cargarCatalogo() {
  setEstado('Cargando catálogo...', 'normal');
  const datos = await apiJson('/api/laboratorio-efectos/catalogo');
  catalogoLab = datos.catalogo;
  setEstado(`${catalogoLab.totalEfectos || 0} efectos`, 'ok');
  renderCatalogo();
}

function bloquearFormulario(bloqueado) {
  const boton = $('labEfectosProbarBtn');
  const recargar = $('labEfectosRecargarBtn');
  if (boton) {
    boton.disabled = bloqueado || !($('labEfectosVideoInput')?.files?.[0]) || !efectoSeleccionado;
    boton.textContent = bloqueado ? 'Procesando efecto...' : 'Probar efecto';
  }
  if (recargar) recargar.disabled = bloqueado;
}

function pintarComparacion({ originalUrl, resultadoUrl, nombreSalida = '' } = {}) {
  const panel = $('labEfectosResultadoPanel');
  const video = $('labEfectosResultadoVideo');
  const original = $('labEfectosComparacionOriginal');
  const descarga = $('labEfectosDescarga');
  if (panel) panel.hidden = false;
  if (resultadoUrl) {
    if (descarga) {
      descarga.hidden = false;
      descarga.href = resultadoUrl;
      descarga.download = nombreSalida || 'laboratorio-efecto.mp4';
    }
  }
  asignarFuenteVideo(original, originalUrl, { muted: true, resetearFrame: true, preferido: 0.45 });
  asignarFuenteVideo(video, resultadoUrl, { muted: false, resetearFrame: true, preferido: 0.45 });
}

function refrescarComparacionVisible() {
  if (!ultimaComparacion.original && !ultimaComparacion.resultado) return;
  const ejecutar = () => pintarComparacion({
    originalUrl: ultimaComparacion.original,
    resultadoUrl: ultimaComparacion.resultado,
    nombreSalida: ultimaComparacion.nombreSalida
  });
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(ejecutar);
  else setTimeout(ejecutar, 0);
}

async function enviarPrueba(evento) {
  evento.preventDefault();
  const archivo = $('labEfectosVideoInput')?.files?.[0] || null;
  if (!archivo) { setMensaje('Sube un video corto para probar.', 'warn'); activarPasoLaboratorioEfectos('video'); return; }
  if (!efectoSeleccionado) { setMensaje('Selecciona un efecto del catálogo.', 'warn'); activarPasoLaboratorioEfectos('catalogo'); return; }

  const formData = new FormData();
  formData.append('video', archivo);
  formData.append('efectoId', efectoSeleccionado.id);
  formData.append('textoPersonalizado', $('labEfectosTextoPersonalizado')?.value || '');
  formData.append('intensidad', $('labEfectosIntensidad')?.value || '');

  try {
    ocultarMensaje();
    activarPasoLaboratorioEfectos('probar');
    bloquearFormulario(true);
    setEstado('Renderizando...', 'normal');
    setMensaje(`Normalizando original y aplicando ${efectoSeleccionado.nombre}.`, 'normal');

    const datos = await apiJson('/api/laboratorio-efectos/probar', { method: 'POST', body: formData });
    const resultado = datos.resultado || {};
    const resumen = $('labEfectosResultadoResumen');
    const urlResultado = await urlPublica(resultado.urlPublica || resultado.rutaRelativa || '');
    const urlOriginal = await urlPublica(
      resultado.original?.urlPublica ||
      resultado.original?.rutaRelativa ||
      resultado.videoEntrada?.urlPublica ||
      resultado.videoEntrada?.rutaRelativa ||
      ''
    );

    ultimaComparacion = {
      original: urlOriginal || urlObjetoEntrada,
      resultado: urlResultado,
      nombreSalida: resultado.nombreSalida || 'laboratorio-efecto.mp4'
    };

    activarPasoLaboratorioEfectos('comparar');
    refrescarComparacionVisible();

    if (resumen) {
      const duracion = duracionEntrada ? ` Duración original: ${formatearDuracion(duracionEntrada)}.` : '';
      const originalOk = urlOriginal ? ' Original normalizado para comparación.' : ' Original local usado como respaldo.';
      resumen.textContent = `${datos.mensaje || 'Efecto generado.'}${duracion}${originalOk} Debe salir: ${datos.queDebeSalir || efectoSeleccionado.queDebeSalir}`;
    }
    setEstado('Prueba lista', 'ok');
    setMensaje('Video generado correctamente. Compara el antes/después.', 'ok');
  } catch (error) {
    setEstado('Error', 'error');
    setMensaje(error.message || 'No se pudo probar el efecto.', 'error');
    activarPasoLaboratorioEfectos('probar');
  } finally {
    bloquearFormulario(false);
  }
}

function enlazarEventos() {
  const root = document.querySelector('[data-lab-efectos-root]');
  if (!root || root.dataset.labInicializado === '1') return;
  root.dataset.labInicializado = '1';
  root.addEventListener('click', async (evento) => {
    const paso = evento.target.closest('[data-lab-wizard-go]')?.dataset.labWizardGo;
    if (paso) await irAPasoLaboratorioEfectos(paso);
  });
  $('labEfectosVideoInput')?.addEventListener('change', actualizarArchivoSeleccionado);
  $('labEfectosPreviewEntradaVideo')?.addEventListener('loadedmetadata', (evento) => evaluarDuracionEntrada(evento.target.duration));
  $('labEfectosComparacionOriginal')?.addEventListener('loadedmetadata', (evento) => {
    if (!duracionEntrada) evaluarDuracionEntrada(evento.target.duration);
  });
  $('labEfectosBuscar')?.addEventListener('input', renderCatalogo);
  $('labEfectosRecargarBtn')?.addEventListener('click', () => cargarCatalogo().catch((error) => setMensaje(error.message, 'error')));
  $('labEfectosAcordeones')?.addEventListener('click', (evento) => {
    const boton = evento.target?.closest?.('[data-efecto-id]');
    if (!boton) return;
    seleccionarEfecto(boton.dataset.efectoId || '');
  });
  $('labEfectosForm')?.addEventListener('submit', enviarPrueba);
  renderChecklist();
  activarPasoLaboratorioEfectos(localStorage.getItem(STORAGE_LAB_STEP) || 'video', { guardar: false });
  cargarCatalogo().catch((error) => {
    setEstado('Error catálogo', 'error');
    setMensaje(error.message, 'error');
  });
}

export function inicializarLaboratorioEfectosUI() {
  if (typeof document === 'undefined') return;
  asegurarCssLaboratorio();
  enlazarEventos();
  if (!inicializado) {
    inicializado = true;
    window.addEventListener('beforeunload', liberarUrlEntrada);
    document.addEventListener('autovideo:navegacion', (evento) => {
      if (evento.detail?.pantallaId === 'laboratorio-efectos') setTimeout(enlazarEventos, 0);
    });
  }
}

export default inicializarLaboratorioEfectosUI;
