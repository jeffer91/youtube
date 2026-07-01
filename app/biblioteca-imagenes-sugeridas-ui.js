const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';
const STORAGE_IMAGENES_SUGERIDAS = 'autovideojeff.bibliotecaImagenesSugeridas';
const STORAGE_INDICE_SUGERENCIA = 'autovideojeff.bibliotecaImagenesSugeridasIndice';

const SUGERENCIAS_BASE = Object.freeze({
  'tema-principal': {
    id: 'tema-principal',
    nombre: 'Tema principal del video',
    motivo: 'La app necesita una imagen principal para reforzar la idea central del video.',
    usoSugerido: 'imagen de apoyo para reforzar la idea central del video',
    busquedaCorta: 'tema principal',
    etiquetas: ['tema-principal', 'apoyo-visual', 'temporal'],
    categoria: 'otro'
  },
  'personaje-lugar-equipo': {
    id: 'personaje-lugar-equipo',
    nombre: 'Personaje, lugar, equipo o país mencionado',
    motivo: 'La transcripción puede mencionar personas, lugares, equipos o países que conviene mostrar visualmente.',
    usoSugerido: 'recurso visual cuando se mencione en la transcripción',
    busquedaCorta: 'persona lugar equipo',
    etiquetas: ['mencionado', 'apoyo-visual', 'temporal'],
    categoria: 'otro'
  },
  'grafico-tabla-mapa': {
    id: 'grafico-tabla-mapa',
    nombre: 'Tabla, mapa o gráfico de apoyo',
    motivo: 'Algunas explicaciones pueden necesitar una imagen tipo tabla, mapa o gráfico.',
    usoSugerido: 'imagen explicativa para partes difíciles del video',
    busquedaCorta: 'tabla mapa gráfico',
    etiquetas: ['grafico', 'tabla', 'mapa', 'temporal'],
    categoria: 'otro'
  }
});

const PALABRAS_RUIDO_BUSQUEDA = new Set([
  'auto', 'apoyo', 'visual', 'apoyo-visual', 'temporal', 'imagen', 'imagenes', 'imágenes', 'foto', 'fotos',
  'recurso', 'proyecto', 'video', 'cuando', 'mencione', 'menciona', 'seleccion', 'selección', 'pais', 'país',
  'para', 'con', 'sin', 'del', 'de', 'la', 'el', 'los', 'las', 'un', 'una', 'en', 'se', 'y', 'o'
]);

let inicializado = false;
let sugerenciaPendiente = null;
let esperaArchivoTimer = null;
let fetchInterceptado = false;
let sugerenciasActuales = [];
let indiceSugerenciaActual = 0;
let pegadoInicializado = false;

function $(id) { return document.getElementById(id); }
function texto(valor = '', respaldo = '') { const limpio = String(valor ?? '').trim(); return limpio || respaldo; }
function escapar(valor = '') { return texto(valor, '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function quitarHtml(valor = '') { return texto(valor, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function limitarDescripcion(valor = '') { const limpio = texto(quitarHtml(valor), 'Imagen de apoyo para reforzar el video.'); return limpio.length > 150 ? `${limpio.slice(0, 147)}...` : limpio; }
function normalizarClave(valor = '') { return texto(valor, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

function limpiarFraseCorta(valor = '', respaldo = 'imagen apoyo') {
  const tokens = texto(valor, respaldo)
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !PALABRAS_RUIDO_BUSQUEDA.has(normalizarClave(item)));
  return texto(tokens.slice(0, 5).join(' '), respaldo);
}

function limpiarTituloArchivo(valor = '', respaldo = 'Imagen sugerida') {
  return texto(valor, respaldo)
    .replace(/^File:/i, '')
    .replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function crearFraseCorta(sugerencia = {}) {
  const directa = texto(sugerencia.fraseCorta || sugerencia.tituloCorto || sugerencia.nombre, 'Imagen sugerida');
  return limpiarFraseCorta(directa, 'Imagen sugerida');
}

function crearBusquedaCorta(sugerencia = {}) {
  const frase = crearFraseCorta(sugerencia);
  return limpiarFraseCorta(frase, 'imagen apoyo');
}

function crearDescripcionSugerencia(sugerencia = {}) {
  const estado = texto(sugerencia.detalle, '');
  if (estado && !/^estado:/i.test(estado)) return limitarDescripcion(estado);
  const uso = texto(sugerencia.usoSugerido || sugerencia.uso, '');
  if (uso) return limitarDescripcion(uso);
  const motivo = texto(sugerencia.motivo, '');
  if (motivo) return limitarDescripcion(motivo);
  return 'Imagen de apoyo para reforzar esta parte del video.';
}

function crearConsultaInternet(sugerencia = {}) {
  const frase = crearFraseCorta(sugerencia);
  const etiquetas = Array.isArray(sugerencia.etiquetas) ? sugerencia.etiquetas : [];
  const etiquetasUtiles = etiquetas
    .map((item) => String(item || '').replace(/[-_]+/g, ' ').trim())
    .filter(Boolean)
    .filter((item) => !PALABRAS_RUIDO_BUSQUEDA.has(normalizarClave(item)))
    .slice(0, 2);
  return texto([frase, ...etiquetasUtiles].join(' '), frase);
}

function obtenerProyectoId() { return $('projectLibraryProjectId')?.value?.trim() || localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || 'sin-proyecto'; }
function claveStorage() { return `${STORAGE_IMAGENES_SUGERIDAS}.${obtenerProyectoId()}`; }
function claveIndice() { return `${STORAGE_INDICE_SUGERENCIA}.${obtenerProyectoId()}`; }
function leerIndiceGuardado() { const n = Number(localStorage.getItem(claveIndice()) || 0); return Number.isFinite(n) && n >= 0 ? n : 0; }
function guardarIndice() { localStorage.setItem(claveIndice(), String(indiceSugerenciaActual)); }

async function obtenerBaseApi() {
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try {
      const estado = await apiElectron();
      if (estado?.url) return estado.url;
    } catch (error) {
      console.warn('[Biblioteca imágenes sugeridas] No se pudo leer servidor Electron:', error.message);
    }
  }
  return window.location.origin;
}

async function apiJson(ruta, opciones = {}) {
  const base = await obtenerBaseApi();
  const respuesta = await fetch(`${base}${ruta}`, opciones);
  const textoRespuesta = await respuesta.text();
  let datos = {};
  try { datos = textoRespuesta ? JSON.parse(textoRespuesta) : {}; } catch (_error) { datos = { ok: false, mensaje: textoRespuesta }; }
  if (!respuesta.ok || datos.ok === false) throw new Error(datos.mensaje || `Error HTTP ${respuesta.status}`);
  return datos;
}

function leerEstadoSugerenciasLocal() { try { return JSON.parse(localStorage.getItem(claveStorage()) || '{}') || {}; } catch (_error) { return {}; } }
function guardarEstadoSugerenciasLocal(estado = {}) { localStorage.setItem(claveStorage(), JSON.stringify(estado)); }

function setMensaje(mensaje, tipo = 'normal') {
  const box = $('projectLibraryMessage');
  if (!box) return;
  box.hidden = false;
  box.textContent = mensaje;
  box.className = `project-library-message is-${tipo}`;
}

function formatearPeso(bytes = 0) {
  const numero = Number(bytes || 0);
  if (!Number.isFinite(numero) || numero <= 0) return 'sin peso';
  if (numero < 1024 * 1024) return `${(numero / 1024).toFixed(1)} KB`;
  return `${(numero / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizarSugerencia(sugerencia = {}) {
  const base = SUGERENCIAS_BASE[sugerencia.id] || {};
  const nombre = texto(sugerencia.nombre || base.nombre, 'Imagen sugerida');
  const usoSugerido = texto(sugerencia.usoSugerido || sugerencia.uso || base.usoSugerido, 'apoyo visual del proyecto');
  const temporal = { ...base, ...sugerencia, nombre, usoSugerido };
  const fraseCorta = crearFraseCorta(temporal);
  return {
    id: texto(sugerencia.id || base.id, 'sugerencia-imagen'),
    nombre,
    fraseCorta,
    descripcion: crearDescripcionSugerencia(temporal),
    motivo: texto(sugerencia.motivo || base.motivo, 'Imagen sugerida para reforzar el video.'),
    usoSugerido,
    busquedaCorta: crearBusquedaCorta({ ...temporal, fraseCorta }),
    consultaInternet: crearConsultaInternet({ ...temporal, fraseCorta }),
    categoria: texto(sugerencia.categoria || base.categoria, 'otro'),
    etiquetas: Array.isArray(sugerencia.etiquetas) && sugerencia.etiquetas.length ? sugerencia.etiquetas : (base.etiquetas || ['apoyo-visual', 'temporal']),
    estado: texto(sugerencia.estado || base.estado, 'pendiente'),
    detalle: texto(sugerencia.detalle || '', '')
  };
}

function estadoTexto(sugerencia = {}) {
  if (sugerencia.estado === 'guardada') return 'Guardada';
  if (sugerencia.estado === 'subida') return 'Subida';
  if (sugerencia.estado === 'omitida') return 'No necesaria';
  return 'Pendiente';
}

function renderCardSugerencia(sugerenciaEntrada = {}) {
  const sugerencia = normalizarSugerencia(sugerenciaEntrada);
  const descripcion = limitarDescripcion(sugerencia.descripcion || sugerencia.usoSugerido || sugerencia.motivo);
  return `
    <article class="project-library-image-request-card" data-image-suggestion-card="${escapar(sugerencia.id)}" data-image-suggestion-state="${escapar(sugerencia.estado)}">
      <div class="project-library-image-request-top"><div class="project-library-image-request-title"><strong>${escapar(sugerencia.fraseCorta)}</strong></div><span class="project-library-image-chip">${escapar(estadoTexto(sugerencia))}</span></div>
      <div class="project-library-image-search-box"><span>Buscar</span><strong>${escapar(sugerencia.busquedaCorta)}</strong></div>
      <p class="project-library-image-description">${escapar(descripcion)}</p>
      <div id="projectLibrarySuggestedDropZone" class="project-library-smart-upload" data-suggested-image-upload-zone="true">
        <strong>Pega, arrastra o examina la imagen</strong>
        <span>Ctrl+V, soltar imagen aquí o usar Examinar.</span>
        <div class="project-library-smart-upload-actions">
          <button class="project-library-button is-save" type="button" data-suggested-image-action="upload">Examinar imagen</button>
          <button class="project-library-button is-muted" type="button" data-suggested-image-action="skip">No necesaria</button>
        </div>
      </div>
      <section class="project-library-internet-results" aria-label="Opciones de internet">
        <header><strong>Imágenes de internet</strong><button class="project-library-button" type="button" data-suggested-image-action="search-internet">Buscar 3 imágenes</button></header>
        <div class="project-library-internet-options" id="projectLibraryInternetImageOptions">
          <div class="project-library-internet-option">Presiona Buscar 3 imágenes</div>
          <div class="project-library-internet-option">Se mostrarán fotos reales</div>
          <div class="project-library-internet-option">Luego elige una</div>
        </div>
      </section>
    </article>`;
}

function actualizarContador() {
  const counter = $('projectLibrarySuggestedImagesCounter');
  if (!counter) return;
  const total = sugerenciasActuales.length;
  counter.textContent = total ? `${indiceSugerenciaActual + 1} de ${total}` : '0 de 0';
  const prev = $('projectLibrarySuggestedPrevBtn');
  const next = $('projectLibrarySuggestedNextBtn');
  if (prev) prev.disabled = total <= 1 || indiceSugerenciaActual <= 0;
  if (next) next.disabled = total <= 1 || indiceSugerenciaActual >= total - 1;
}

function renderSugerenciaActual() {
  const lista = $('projectLibrarySuggestedImagesList');
  if (!lista) return;
  const total = sugerenciasActuales.length;
  if (!total) {
    lista.innerHTML = `<div class="project-library-empty">Carga el proyecto para ver imágenes sugeridas.</div>`;
    actualizarContador();
    return;
  }
  indiceSugerenciaActual = Math.max(0, Math.min(indiceSugerenciaActual, total - 1));
  lista.innerHTML = renderCardSugerencia(sugerenciasActuales[indiceSugerenciaActual]);
  actualizarContador();
  guardarIndice();
}

function renderSugerencias(sugerencias = []) {
  const items = sugerencias.length ? sugerencias : Object.values(SUGERENCIAS_BASE).map((item) => ({ ...item, estado: 'pendiente' }));
  sugerenciasActuales = items.map(normalizarSugerencia);
  const indiceGuardado = leerIndiceGuardado();
  indiceSugerenciaActual = Math.max(0, Math.min(indiceGuardado, sugerenciasActuales.length - 1));
  renderSugerenciaActual();
}

function avanzarSugerencia(direccion = 1) {
  if (!sugerenciasActuales.length) return;
  indiceSugerenciaActual = Math.max(0, Math.min(indiceSugerenciaActual + direccion, sugerenciasActuales.length - 1));
  renderSugerenciaActual();
}

function obtenerSugerenciaDesdeCard(card) {
  const id = card?.dataset?.imageSuggestionCard || sugerenciasActuales[indiceSugerenciaActual]?.id || '';
  const base = SUGERENCIAS_BASE[id] || sugerenciasActuales.find((item) => item.id === id) || null;
  const titulo = texto(card?.querySelector('.project-library-image-request-title strong')?.textContent, base?.nombre || id);
  const busquedaCorta = texto(card?.querySelector('.project-library-image-search-box strong')?.textContent, base?.busquedaCorta || titulo);
  const uso = texto(card?.querySelector('.project-library-image-description')?.textContent, base?.usoSugerido || 'apoyo visual');
  return normalizarSugerencia({ ...(base || {}), id, nombre: titulo, fraseCorta: titulo, busquedaCorta, usoSugerido: uso, descripcion: uso, estado: card?.dataset?.imageSuggestionState || base?.estado || 'pendiente' });
}

function obtenerCardPorSugerencia(id) { return [...document.querySelectorAll('[data-image-suggestion-card]')].find((card) => card.dataset.imageSuggestionCard === id) || null; }

function actualizarEstadoCard(card, estado = 'pendiente', detalle = '') {
  if (!card) return;
  card.dataset.imageSuggestionState = estado;
  card.classList.toggle('is-subida', estado === 'subida' || estado === 'guardada');
  card.classList.toggle('is-omitida', estado === 'omitida');
  card.classList.toggle('is-pendiente', estado === 'pendiente');
  const chip = card.querySelector('.project-library-image-chip');
  if (chip) chip.textContent = estadoTexto({ estado });
  const descripcion = card.querySelector('.project-library-image-description');
  if (descripcion && detalle) descripcion.textContent = detalle;
  const actual = sugerenciasActuales.find((item) => item.id === card.dataset.imageSuggestionCard);
  if (actual) { actual.estado = estado; if (detalle) actual.detalle = detalle; }
}

function aplicarEstadoGuardadoEnCardsLocal() {
  const estado = leerEstadoSugerenciasLocal();
  const fusionadas = sugerenciasActuales.map((item) => ({ ...(item || {}), ...(estado[item.id] || {}) }));
  if (fusionadas.length) { sugerenciasActuales = fusionadas.map(normalizarSugerencia); renderSugerenciaActual(); }
}

async function cargarEstadoSugerenciasServidor() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId || proyectoId === 'sin-proyecto') { aplicarEstadoGuardadoEnCardsLocal(); return null; }
  try {
    const datos = await apiJson(`/api/proyectos/${encodeURIComponent(proyectoId)}/biblioteca-proyecto/imagenes-sugeridas`);
    const paquete = datos.imagenesSugeridas || {};
    renderSugerencias(Array.isArray(paquete.sugerencias) ? paquete.sugerencias : []);
    return paquete;
  } catch (error) {
    console.warn('[Biblioteca imágenes sugeridas] No se pudo cargar estado servidor:', error.message);
    aplicarEstadoGuardadoEnCardsLocal();
    return null;
  }
}

async function actualizarEstadoGuardado(id, datos) {
  const estado = leerEstadoSugerenciasLocal();
  estado[id] = { ...(estado[id] || {}), ...datos, actualizadoEn: new Date().toISOString() };
  guardarEstadoSugerenciasLocal(estado);
  const proyectoId = obtenerProyectoId();
  if (!proyectoId || proyectoId === 'sin-proyecto') return;
  try {
    await apiJson(`/api/proyectos/${encodeURIComponent(proyectoId)}/biblioteca-proyecto/imagenes-sugeridas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: datos.estado || 'actualizar', sugerencia: { id, ...datos } })
    });
  } catch (error) {
    console.warn('[Biblioteca imágenes sugeridas] Estado guardado localmente, pero no en servidor:', error.message);
  }
}

function seleccionarCategoriaDisponible(preferida = 'otro') {
  const select = $('projectLibraryNewCategory');
  if (!select) return;
  const opciones = [...select.options].map((option) => option.value);
  if (opciones.includes(preferida)) select.value = preferida;
  else if (opciones.includes('otro')) select.value = 'otro';
  else if (opciones.length) select.value = opciones[0];
}

function asegurarCampoSugerenciaActiva() {
  let input = $('projectLibrarySuggestionId');
  const form = $('projectLibraryForm');
  if (!input && form) {
    input = document.createElement('input');
    input.type = 'hidden';
    input.id = 'projectLibrarySuggestionId';
    form.appendChild(input);
  }
  return input;
}

function activarPanelGuardarTemporal() {
  const root = document.querySelector('[data-project-library-root]');
  if (!root) return;
  root.querySelectorAll('[data-project-library-wizard-panel]').forEach((panel) => {
    const activo = panel.dataset.projectLibraryWizardPanel === 'guardar';
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
    if (activo) panel.classList.remove('is-disabled');
  });
  const saveBtn = $('projectLibrarySaveBtn');
  const fieldset = $('projectLibraryFormFieldset');
  const form = $('projectLibraryForm');
  const saveCard = document.querySelector('[data-smart-section="guardar"]');
  if (saveBtn) saveBtn.disabled = false;
  if (fieldset) fieldset.disabled = false;
  if (form) form.classList.remove('is-disabled');
  if (saveCard) saveCard.classList.remove('is-disabled');
}

function aplicarSugerenciaEnFormulario(sugerenciaEntrada, archivo = {}) {
  const sugerencia = normalizarSugerencia(sugerenciaEntrada);
  const nombreArchivo = archivo.name || archivo.nombreOriginal || archivo.ruta?.split(/[\\/]/).pop() || $('projectLibraryNewOriginalName')?.value || '';
  const ruta = archivo.path || archivo.ruta || $('projectLibraryNewPath')?.value || '';
  const nombreLimpio = sugerencia.fraseCorta.replace(/^(imagen de|foto de)\s+/i, '').trim();
  if ($('projectLibrarySelectedFileName')) $('projectLibrarySelectedFileName').textContent = nombreArchivo || nombreLimpio;
  if ($('projectLibrarySelectedFileMeta')) $('projectLibrarySelectedFileMeta').textContent = `imagen · ${formatearPeso(archivo.size || archivo.pesoBytes || Number($('projectLibraryNewSize')?.value || 0))} · sugerencia: ${nombreLimpio}`;
  if ($('projectLibraryNewName')) $('projectLibraryNewName').value = nombreLimpio;
  if ($('projectLibraryNewType')) $('projectLibraryNewType').value = 'imagen';
  if ($('projectLibraryNewFormat')) $('projectLibraryNewFormat').value = 'imagen';
  if ($('projectLibraryNewUsage')) $('projectLibraryNewUsage').value = sugerencia.descripcion || sugerencia.usoSugerido;
  if ($('projectLibraryNewTags')) $('projectLibraryNewTags').value = sugerencia.etiquetas.join(', ');
  if ($('projectLibraryNewPath') && ruta) $('projectLibraryNewPath').value = ruta;
  if ($('projectLibraryNewOriginalName') && nombreArchivo) $('projectLibraryNewOriginalName').value = nombreArchivo;
  if ($('projectLibraryNewMime') && (archivo.type || archivo.mime)) $('projectLibraryNewMime').value = archivo.type || archivo.mime;
  if ($('projectLibraryNewSize') && archivo.size) $('projectLibraryNewSize').value = archivo.size;
  const sugerenciaInput = asegurarCampoSugerenciaActiva();
  if (sugerenciaInput) sugerenciaInput.value = sugerencia.id;
  seleccionarCategoriaDisponible(sugerencia.categoria || 'otro');
  actualizarRevisionVisual();
  activarPanelGuardarTemporal();
}

function actualizarRevisionVisual() {
  const titulo = $('projectLibrarySaveReviewTitle');
  const texto = $('projectLibrarySaveReviewText');
  const nombre = $('projectLibraryNewName')?.value || 'imagen sugerida';
  const uso = $('projectLibraryNewUsage')?.value || 'apoyo visual';
  if (titulo) titulo.textContent = `Imagen lista: ${nombre}`;
  if (texto) texto.textContent = `Se guardará como imagen temporal del proyecto. Uso sugerido: ${uso}.`;
}

function cuerpoConSugerenciaActiva(opciones = {}) {
  const sugerenciaId = $('projectLibrarySuggestionId')?.value?.trim() || '';
  if (!sugerenciaId || typeof opciones?.body !== 'string') return { opciones, sugerenciaId };
  try {
    const cuerpo = JSON.parse(opciones.body || '{}');
    if (!cuerpo.sugerenciaId) cuerpo.sugerenciaId = sugerenciaId;
    return { opciones: { ...opciones, body: JSON.stringify(cuerpo) }, sugerenciaId };
  } catch (_error) {
    return { opciones, sugerenciaId };
  }
}

function esGuardadoRecursoProyecto(recurso, opciones = {}) {
  const metodo = String(opciones?.method || 'GET').toUpperCase();
  const url = typeof recurso === 'string' ? recurso : recurso?.url || '';
  const limpia = String(url || '').split('?')[0];
  return metodo === 'POST' && /\/api\/proyectos\/[^/]+\/biblioteca-proyecto$/.test(limpia);
}

function interceptarGuardadoRecursoTemporal() {
  if (fetchInterceptado || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  fetchInterceptado = true;
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = async (recurso, opciones = {}) => {
    const interceptar = esGuardadoRecursoProyecto(recurso, opciones);
    const preparado = interceptar ? cuerpoConSugerenciaActiva(opciones) : { opciones, sugerenciaId: '' };
    const respuesta = await fetchOriginal(recurso, preparado.opciones);
    if (interceptar && preparado.sugerenciaId && respuesta.ok) {
      setTimeout(async () => {
        const card = obtenerCardPorSugerencia(preparado.sugerenciaId);
        actualizarEstadoCard(card, 'guardada');
        await actualizarEstadoGuardado(preparado.sugerenciaId, {
          estado: 'guardada',
          detalle: 'Estado: imagen guardada como recurso temporal del proyecto.',
          archivoNombre: $('projectLibraryNewOriginalName')?.value || $('projectLibraryNewName')?.value || ''
        });
        const input = $('projectLibrarySuggestionId');
        if (input) input.value = '';
        setTimeout(() => avanzarSugerencia(1), 650);
      }, 350);
    }
    return respuesta;
  };
}

async function convertirFileAArchivoTemporal(file, origen = 'archivo') {
  if (!file) throw new Error('No se recibió una imagen válida.');
  if (!String(file.type || '').startsWith('image/') && !/\.(png|jpe?g|webp|gif)$/i.test(file.name || '')) throw new Error('Solo se aceptan imágenes en esta sección.');
  if (file.path || file.ruta) return { ...file, origenSubidaInteligente: origen };
  const guardar = window.AutoVideoJeff?.biblioteca?.guardarArchivoTemporal;
  if (typeof guardar !== 'function') throw new Error('Para pegar imágenes o arrastrarlas sin ruta, abre la app en modo Electron.');
  const bytes = await file.arrayBuffer();
  const resultado = await guardar({ bytes, mime: file.type || 'image/png', nombreOriginal: file.name || `imagen-${Date.now()}.png`, origen });
  if (!resultado?.ok || !resultado.archivo) throw new Error(resultado?.mensaje || 'No se pudo guardar la imagen temporal.');
  return { ...resultado.archivo, origenSubidaInteligente: origen };
}

async function procesarArchivoInteligente(file, card, origen = 'archivo') {
  const sugerencia = obtenerSugerenciaDesdeCard(card);
  if (!sugerencia?.id) return;
  const proyectoId = obtenerProyectoId();
  if (!proyectoId || proyectoId === 'sin-proyecto') { setMensaje('Primero carga el proyecto para subir imágenes sugeridas.', 'warn'); return; }
  try {
    setMensaje(origen === 'pegado' ? 'Pegando imagen...' : origen === 'arrastre' ? 'Cargando imagen arrastrada...' : origen === 'internet' ? 'Cargando imagen de internet...' : 'Cargando imagen...', 'normal');
    const archivo = await convertirFileAArchivoTemporal(file, origen);
    aplicarSugerenciaEnFormulario(sugerencia, archivo);
    actualizarEstadoCard(card, 'subida', 'Estado: imagen seleccionada y lista para guardar.');
    await actualizarEstadoGuardado(sugerencia.id, {
      estado: 'subida',
      detalle: 'Estado: imagen seleccionada y lista para guardar.',
      nombre: sugerencia.fraseCorta,
      descripcion: sugerencia.descripcion,
      usoSugerido: sugerencia.usoSugerido,
      busquedaCorta: sugerencia.busquedaCorta,
      categoria: sugerencia.categoria,
      etiquetas: sugerencia.etiquetas,
      archivoNombre: archivo.name || archivo.nombreOriginal || ''
    });
    setMensaje('Imagen lista. Presiona Guardar temporal para finalizar y pasar a la siguiente.', 'ok');
  } catch (error) {
    setMensaje(error.message, 'error');
  }
}

function esperarAplicacionArchivo(sugerencia, card, valorPrevio = '') {
  clearInterval(esperaArchivoTimer);
  let intentos = 0;
  esperaArchivoTimer = setInterval(async () => {
    intentos += 1;
    const actual = $('projectLibraryNewOriginalName')?.value || $('projectLibrarySelectedFileName')?.textContent || '';
    const hayArchivo = actual && actual !== valorPrevio && !/ningún archivo/i.test(actual);
    if (!hayArchivo && intentos < 40) return;
    clearInterval(esperaArchivoTimer);
    if (!hayArchivo) { setMensaje('No se detectó una imagen seleccionada para la sugerencia.', 'warn'); return; }
    aplicarSugerenciaEnFormulario(sugerencia, {});
    actualizarEstadoCard(card, 'subida', 'Estado: imagen seleccionada y lista para guardar.');
    await actualizarEstadoGuardado(sugerencia.id, {
      estado: 'subida',
      detalle: 'Estado: imagen seleccionada y lista para guardar.',
      nombre: sugerencia.fraseCorta || sugerencia.nombre,
      descripcion: sugerencia.descripcion,
      usoSugerido: sugerencia.usoSugerido,
      busquedaCorta: sugerencia.busquedaCorta,
      categoria: sugerencia.categoria,
      etiquetas: sugerencia.etiquetas,
      archivoNombre: actual
    });
    setMensaje('Imagen lista. Presiona Guardar temporal para finalizar y pasar a la siguiente.', 'ok');
  }, 250);
}

async function abrirSelectorParaSugerencia(card) {
  const sugerencia = obtenerSugerenciaDesdeCard(card);
  if (!sugerencia?.id) return;
  const proyectoId = obtenerProyectoId();
  if (!proyectoId || proyectoId === 'sin-proyecto') { setMensaje('Primero carga el proyecto para subir imágenes sugeridas.', 'warn'); return; }
  sugerenciaPendiente = { sugerencia, card };
  const valorPrevio = $('projectLibraryNewOriginalName')?.value || $('projectLibrarySelectedFileName')?.textContent || '';
  const botonCargaNormal = document.querySelector('[data-project-library-action="choose-file"]');
  setMensaje(`Elige una imagen para: ${sugerencia.fraseCorta}.`, 'normal');
  if (botonCargaNormal && !botonCargaNormal.disabled) { botonCargaNormal.click(); esperarAplicacionArchivo(sugerencia, card, valorPrevio); return; }
  const input = $('projectLibraryFileInput');
  if (input) { input.click(); esperarAplicacionArchivo(sugerencia, card, valorPrevio); }
}

async function marcarNoNecesaria(card) {
  const sugerencia = obtenerSugerenciaDesdeCard(card);
  if (!sugerencia?.id) return;
  actualizarEstadoCard(card, 'omitida');
  await actualizarEstadoGuardado(sugerencia.id, { estado: 'omitida', detalle: 'Estado: marcada como no necesaria.', nombre: sugerencia.fraseCorta, descripcion: sugerencia.descripcion, usoSugerido: sugerencia.usoSugerido, busquedaCorta: sugerencia.busquedaCorta, categoria: sugerencia.categoria, etiquetas: sugerencia.etiquetas });
  setMensaje(`Sugerencia marcada como no necesaria: ${sugerencia.fraseCorta}.`, 'ok');
  setTimeout(() => avanzarSugerencia(1), 350);
}

function pintarOpcionesInternet(opcionesContainer, html) {
  if (opcionesContainer) opcionesContainer.innerHTML = html;
}

function crearHtmlCargandoInternet(sugerencia) {
  return `<div class="project-library-internet-option">Buscando imágenes para ${escapar(sugerencia.busquedaCorta)}...</div><div class="project-library-internet-option">Conectando con internet</div><div class="project-library-internet-option">Preparando opciones</div>`;
}

function crearUrlBusquedaImagenes(consulta) {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(consulta)}`;
}

function crearHtmlSinResultados(sugerencia, mensaje = '') {
  const url = crearUrlBusquedaImagenes(sugerencia.consultaInternet || sugerencia.busquedaCorta);
  return `<button class="project-library-internet-option" type="button" data-suggested-image-action="open-image-search" data-search-url="${escapar(url)}">Abrir búsqueda externa</button><div class="project-library-internet-option">${escapar(mensaje || 'No se encontraron imágenes automáticas.')}</div><div class="project-library-internet-option">También puedes pegar o arrastrar una imagen</div>`;
}

function renderOpcionInternet(opcion = {}) {
  return `<button class="project-library-internet-option is-loaded" type="button" data-suggested-image-action="choose-internet" data-image-url="${escapar(opcion.url)}" data-image-title="${escapar(opcion.titulo)}" data-image-description="${escapar(opcion.descripcion)}">
    <img src="${escapar(opcion.url)}" alt="${escapar(opcion.titulo)}" loading="lazy" referrerpolicy="no-referrer" style="width:100%;height:120px;object-fit:cover;border-radius:12px;display:block;margin-bottom:8px;" />
    <strong style="display:block;color:#0f172a;font-size:13px;line-height:1.2;margin-bottom:4px;">${escapar(opcion.titulo)}</strong>
    <span style="display:block;color:#64748b;font-size:11px;line-height:1.25;">${escapar(opcion.descripcion)}</span>
    <small style="display:block;margin-top:6px;color:#1d4ed8;font-weight:950;">Elegir esta imagen</small>
  </button>`;
}

function opcionDesdeWikimediaPage(pagina = {}, sugerencia = {}, indice = 0) {
  const info = pagina.imageinfo?.[0] || {};
  const meta = info.extmetadata || {};
  const url = info.thumburl || info.url || '';
  const tituloBase = limpiarTituloArchivo(meta.ObjectName?.value || pagina.title || sugerencia.fraseCorta, sugerencia.fraseCorta);
  const descripcionBase = quitarHtml(meta.ImageDescription?.value || meta.ObjectName?.value || '');
  return {
    id: `wikimedia-${pagina.pageid || indice}`,
    url,
    originalUrl: info.descriptionurl || info.url || url,
    titulo: limpiarFraseCorta(tituloBase, sugerencia.fraseCorta),
    descripcion: limitarDescripcion(descripcionBase || `Imagen de internet para: ${sugerencia.descripcion || sugerencia.usoSugerido}.`)
  };
}

async function buscarImagenesInternet(sugerenciaEntrada = {}) {
  const sugerencia = normalizarSugerencia(sugerenciaEntrada);
  const consulta = crearConsultaInternet(sugerencia);
  const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(consulta)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=520&format=json&origin=*`;
  const respuesta = await fetch(endpoint, { method: 'GET' });
  if (!respuesta.ok) throw new Error(`No se pudo buscar imágenes de internet. HTTP ${respuesta.status}`);
  const datos = await respuesta.json();
  const paginas = Object.values(datos?.query?.pages || {});
  return paginas
    .map((pagina, indice) => opcionDesdeWikimediaPage(pagina, sugerencia, indice))
    .filter((item) => item.url && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(item.url))
    .slice(0, 3);
}

async function mostrarBusquedaInternet(card) {
  const sugerencia = obtenerSugerenciaDesdeCard(card);
  const opciones = card?.querySelector('#projectLibraryInternetImageOptions');
  if (!opciones || !sugerencia?.id) return;
  pintarOpcionesInternet(opciones, crearHtmlCargandoInternet(sugerencia));
  setMensaje(`Buscando 3 imágenes reales para: ${sugerencia.busquedaCorta}.`, 'normal');
  try {
    const resultados = await buscarImagenesInternet(sugerencia);
    if (!resultados.length) {
      pintarOpcionesInternet(opciones, crearHtmlSinResultados(sugerencia));
      setMensaje('No se encontraron imágenes automáticas. Puedes abrir búsqueda externa o pegar una imagen.', 'warn');
      return;
    }
    pintarOpcionesInternet(opciones, resultados.map(renderOpcionInternet).join(''));
    setMensaje('Se encontraron imágenes. Elige una opción o pega tu propia imagen.', 'ok');
  } catch (error) {
    pintarOpcionesInternet(opciones, crearHtmlSinResultados(sugerencia, error.message));
    setMensaje(`No se pudo cargar imágenes automáticas: ${error.message}`, 'warn');
  }
}

function extensionDesdeMime(mime = '') {
  const limpio = String(mime || '').toLowerCase();
  if (limpio.includes('png')) return '.png';
  if (limpio.includes('webp')) return '.webp';
  if (limpio.includes('gif')) return '.gif';
  return '.jpg';
}

function nombreArchivoSeguro(valor = 'imagen-internet') {
  return limpiarFraseCorta(valor, 'imagen-internet')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'imagen-internet';
}

async function crearFileDesdeImagenInternet(boton) {
  const url = boton?.dataset?.imageUrl || '';
  if (!url) throw new Error('La opción de internet no tiene URL de imagen.');
  const titulo = texto(boton.dataset.imageTitle, 'imagen-internet');
  const respuesta = await fetch(url, { method: 'GET', mode: 'cors' });
  if (!respuesta.ok) throw new Error(`No se pudo descargar la imagen seleccionada. HTTP ${respuesta.status}`);
  const blob = await respuesta.blob();
  const nombre = `${nombreArchivoSeguro(titulo)}${extensionDesdeMime(blob.type)}`;
  return new File([blob], nombre, { type: blob.type || 'image/jpeg' });
}

async function elegirImagenInternet(card, boton) {
  try {
    setMensaje('Preparando imagen seleccionada desde internet...', 'normal');
    const file = await crearFileDesdeImagenInternet(boton);
    await procesarArchivoInteligente(file, card, 'internet');
  } catch (error) {
    setMensaje(`${error.message}. Puedes abrir la imagen, copiarla y pegarla en la zona de carga.`, 'error');
  }
}

function abrirBusquedaExterna(boton) {
  const url = boton?.dataset?.searchUrl || '';
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function imagenDesdeClipboard(evento) {
  const items = [...(evento.clipboardData?.items || [])];
  const item = items.find((entrada) => String(entrada.type || '').startsWith('image/'));
  return item?.getAsFile?.() || null;
}

function conectarPegadoGlobal() {
  if (pegadoInicializado) return;
  pegadoInicializado = true;
  document.addEventListener('paste', async (evento) => {
    const root = document.querySelector('[data-project-library-image-requests]');
    if (!root) return;
    const file = imagenDesdeClipboard(evento);
    if (!file) return;
    evento.preventDefault();
    const card = obtenerCardPorSugerencia(sugerenciasActuales[indiceSugerenciaActual]?.id);
    await procesarArchivoInteligente(file, card, 'pegado');
  });
}

function conectarBotonesSugerencias(root) {
  if (!root) return;
  if (root.dataset.imagenesSugeridasInicializado !== '1') {
    root.dataset.imagenesSugeridasInicializado = '1';
    root.addEventListener('click', async (evento) => {
      const accion = evento.target.closest('[data-suggested-image-action]')?.dataset.suggestedImageAction;
      if (!accion) return;
      if (accion === 'prev') return avanzarSugerencia(-1);
      if (accion === 'next') return avanzarSugerencia(1);
      const card = evento.target.closest('[data-image-suggestion-card]') || obtenerCardPorSugerencia(sugerenciasActuales[indiceSugerenciaActual]?.id);
      if (accion === 'upload') await abrirSelectorParaSugerencia(card);
      if (accion === 'skip') await marcarNoNecesaria(card);
      if (accion === 'search-internet') await mostrarBusquedaInternet(card);
      if (accion === 'choose-internet') await elegirImagenInternet(card, evento.target.closest('[data-suggested-image-action]'));
      if (accion === 'open-image-search') abrirBusquedaExterna(evento.target.closest('[data-suggested-image-action]'));
    });
    root.addEventListener('dragover', (evento) => {
      const zona = evento.target.closest('[data-suggested-image-upload-zone]');
      if (!zona) return;
      evento.preventDefault();
      zona.classList.add('is-dragover');
    });
    root.addEventListener('dragleave', (evento) => {
      const zona = evento.target.closest('[data-suggested-image-upload-zone]');
      if (zona) zona.classList.remove('is-dragover');
    });
    root.addEventListener('drop', async (evento) => {
      const zona = evento.target.closest('[data-suggested-image-upload-zone]');
      if (!zona) return;
      evento.preventDefault();
      zona.classList.remove('is-dragover');
      const file = [...(evento.dataTransfer?.files || [])].find((archivo) => String(archivo.type || '').startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(archivo.name || ''));
      if (!file) { setMensaje('Arrastra una imagen válida: JPG, PNG, WEBP o GIF.', 'warn'); return; }
      const card = zona.closest('[data-image-suggestion-card]') || obtenerCardPorSugerencia(sugerenciasActuales[indiceSugerenciaActual]?.id);
      await procesarArchivoInteligente(file, card, 'arrastre');
    });
  }

  const input = $('projectLibraryFileInput');
  if (input && input.dataset.imagenesSugeridasChange !== '1') {
    input.dataset.imagenesSugeridasChange = '1';
    input.addEventListener('change', () => {
      if (!sugerenciaPendiente?.sugerencia) return;
      const archivo = input.files?.[0] || {};
      setTimeout(async () => {
        aplicarSugerenciaEnFormulario(sugerenciaPendiente.sugerencia, archivo);
        actualizarEstadoCard(sugerenciaPendiente.card, 'subida', 'Estado: imagen seleccionada y lista para guardar.');
        await actualizarEstadoGuardado(sugerenciaPendiente.sugerencia.id, { estado: 'subida', detalle: 'Estado: imagen seleccionada y lista para guardar.', nombre: sugerenciaPendiente.sugerencia.fraseCorta || sugerenciaPendiente.sugerencia.nombre, descripcion: sugerenciaPendiente.sugerencia.descripcion, usoSugerido: sugerenciaPendiente.sugerencia.usoSugerido, busquedaCorta: sugerenciaPendiente.sugerencia.busquedaCorta, categoria: sugerenciaPendiente.sugerencia.categoria, etiquetas: sugerenciaPendiente.sugerencia.etiquetas, archivoNombre: archivo.name || '' });
        setMensaje('Imagen lista. Presiona Guardar temporal para finalizar y pasar a la siguiente.', 'ok');
        sugerenciaPendiente = null;
      }, 160);
    });
  }
}

async function activarImagenesSugeridas() {
  setTimeout(async () => {
    const root = document.querySelector('[data-project-library-image-requests]');
    conectarBotonesSugerencias(root);
    conectarPegadoGlobal();
    if (!sugerenciasActuales.length) renderSugerencias([]);
    await cargarEstadoSugerenciasServidor();
  }, 0);
}

export function inicializarBibliotecaImagenesSugeridasUI() {
  if (typeof document === 'undefined' || inicializado) return;
  inicializado = true;
  interceptarGuardadoRecursoTemporal();
  document.addEventListener('autovideo:navegacion', (evento) => { if (evento.detail?.pantallaId === 'biblioteca' || evento.detail?.pantallaId === 'biblioteca-proyecto') activarImagenesSugeridas(); });
  document.addEventListener('autovideo:biblioteca-area', (evento) => { if (evento.detail?.area === 'proyecto') activarImagenesSugeridas(); });
  document.addEventListener('click', (evento) => { if (evento.target.closest('#projectLibraryLoadBtn') || evento.target.closest('#projectLibraryRefreshBtn')) setTimeout(() => activarImagenesSugeridas(), 400); });
  activarImagenesSugeridas();
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', inicializarBibliotecaImagenesSugeridasUI);
