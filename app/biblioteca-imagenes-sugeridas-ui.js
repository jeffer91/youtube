const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';
const STORAGE_IMAGENES_SUGERIDAS = 'autovideojeff.bibliotecaImagenesSugeridas';
const STORAGE_INDICE_SUGERENCIA = 'autovideojeff.bibliotecaImagenesSugeridasIndice';

const SUGERENCIAS_BASE = Object.freeze({
  'tema-principal': {
    id: 'tema-principal',
    nombre: 'Tema principal del video',
    motivo: 'La app necesita una imagen principal para reforzar la idea central del video.',
    usoSugerido: 'imagen de apoyo para reforzar la idea central del video',
    busquedaCorta: 'tema principal video',
    etiquetas: ['tema-principal', 'apoyo-visual', 'temporal'],
    categoria: 'otro'
  },
  'personaje-lugar-equipo': {
    id: 'personaje-lugar-equipo',
    nombre: 'Personaje, lugar, equipo o país mencionado',
    motivo: 'La transcripción puede mencionar personas, lugares, equipos o países que conviene mostrar visualmente.',
    usoSugerido: 'recurso visual cuando se mencione en la transcripción',
    busquedaCorta: 'personaje lugar equipo',
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

let inicializado = false;
let sugerenciaPendiente = null;
let esperaArchivoTimer = null;
let fetchInterceptado = false;
let sugerenciasActuales = [];
let indiceSugerenciaActual = 0;

function $(id) { return document.getElementById(id); }

function texto(valor = '', respaldo = '') {
  const limpio = String(valor ?? '').trim();
  return limpio || respaldo;
}

function escapar(valor = '') {
  return texto(valor, '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function limitarDescripcion(valor = '') {
  const limpio = texto(valor, 'Imagen de apoyo para reforzar el video.');
  return limpio.length > 170 ? `${limpio.slice(0, 167)}...` : limpio;
}

function crearBusquedaCorta(sugerencia = {}) {
  const valor = texto(sugerencia.busquedaCorta || sugerencia.busqueda || sugerencia.query || '', '');
  if (valor) return valor.split(/\s+/).slice(0, 8).join(' ');
  const nombre = texto(sugerencia.nombre, 'imagen apoyo');
  const etiquetas = Array.isArray(sugerencia.etiquetas) ? sugerencia.etiquetas.join(' ') : '';
  return texto(`${nombre} ${etiquetas}`.split(/\s+/).slice(0, 8).join(' '), nombre);
}

function obtenerProyectoId() {
  return $('projectLibraryProjectId')?.value?.trim() || localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || 'sin-proyecto';
}

function claveStorage() {
  return `${STORAGE_IMAGENES_SUGERIDAS}.${obtenerProyectoId()}`;
}

function claveIndice() {
  return `${STORAGE_INDICE_SUGERENCIA}.${obtenerProyectoId()}`;
}

function leerIndiceGuardado() {
  const n = Number(localStorage.getItem(claveIndice()) || 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function guardarIndice() {
  localStorage.setItem(claveIndice(), String(indiceSugerenciaActual));
}

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

function leerEstadoSugerenciasLocal() {
  try {
    return JSON.parse(localStorage.getItem(claveStorage()) || '{}') || {};
  } catch (_error) {
    return {};
  }
}

function guardarEstadoSugerenciasLocal(estado = {}) {
  localStorage.setItem(claveStorage(), JSON.stringify(estado));
}

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
  return {
    id: texto(sugerencia.id || base.id, 'sugerencia-imagen'),
    nombre,
    motivo: texto(sugerencia.motivo || base.motivo, 'Imagen sugerida para reforzar el video.'),
    usoSugerido,
    busquedaCorta: crearBusquedaCorta({ ...base, ...sugerencia, nombre, usoSugerido }),
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
  const descripcion = limitarDescripcion(sugerencia.detalle || sugerencia.usoSugerido || sugerencia.motivo);
  return `
    <article class="project-library-image-request-card" data-image-suggestion-card="${escapar(sugerencia.id)}" data-image-suggestion-state="${escapar(sugerencia.estado)}">
      <div class="project-library-image-request-top">
        <div class="project-library-image-request-title">
          <strong>${escapar(sugerencia.nombre)}</strong>
        </div>
        <span class="project-library-image-chip">${escapar(estadoTexto(sugerencia))}</span>
      </div>

      <div class="project-library-image-search-box">
        <span>Buscar</span>
        <strong>${escapar(sugerencia.busquedaCorta)}</strong>
      </div>

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
        <header>
          <strong>Imágenes de internet</strong>
          <button class="project-library-button" type="button" data-suggested-image-action="search-internet">Buscar 3 imágenes</button>
        </header>
        <div class="project-library-internet-options" id="projectLibraryInternetImageOptions">
          <div class="project-library-internet-option">Opción 1</div>
          <div class="project-library-internet-option">Opción 2</div>
          <div class="project-library-internet-option">Opción 3</div>
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
  const titulo = texto(card?.querySelector('strong')?.textContent, base?.nombre || id);
  const busquedaCorta = texto(card?.querySelector('.project-library-image-search-box strong')?.textContent, base?.busquedaCorta || titulo);
  const uso = texto(card?.querySelector('.project-library-image-description')?.textContent, base?.usoSugerido || 'apoyo visual');
  return normalizarSugerencia({ ...(base || {}), id, nombre: titulo, busquedaCorta, usoSugerido: uso, estado: card?.dataset?.imageSuggestionState || base?.estado || 'pendiente' });
}

function obtenerCardPorSugerencia(id) {
  return [...document.querySelectorAll('[data-image-suggestion-card]')].find((card) => card.dataset.imageSuggestionCard === id) || null;
}

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
  if (actual) {
    actual.estado = estado;
    if (detalle) actual.detalle = detalle;
  }
}

function aplicarEstadoGuardadoEnCardsLocal() {
  const estado = leerEstadoSugerenciasLocal();
  const fusionadas = sugerenciasActuales.map((item) => ({ ...(item || {}), ...(estado[item.id] || {}) }));
  if (fusionadas.length) {
    sugerenciasActuales = fusionadas.map(normalizarSugerencia);
    renderSugerenciaActual();
  }
}

async function cargarEstadoSugerenciasServidor() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId || proyectoId === 'sin-proyecto') {
    aplicarEstadoGuardadoEnCardsLocal();
    return null;
  }
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

function aplicarSugerenciaEnFormulario(sugerenciaEntrada, archivo = {}) {
  const sugerencia = normalizarSugerencia(sugerenciaEntrada);
  const nombreArchivo = archivo.name || archivo.nombreOriginal || archivo.ruta?.split(/[\\/]/).pop() || $('projectLibraryNewOriginalName')?.value || '';
  const ruta = archivo.path || archivo.ruta || $('projectLibraryNewPath')?.value || '';
  const nombreLimpio = sugerencia.nombre.replace(/^(imagen de|foto de)\s+/i, '').trim();

  if ($('projectLibrarySelectedFileName')) $('projectLibrarySelectedFileName').textContent = nombreArchivo || nombreLimpio;
  if ($('projectLibrarySelectedFileMeta')) $('projectLibrarySelectedFileMeta').textContent = `imagen · ${formatearPeso(archivo.size || archivo.pesoBytes || Number($('projectLibraryNewSize')?.value || 0))} · sugerencia: ${nombreLimpio}`;
  if ($('projectLibraryNewName')) $('projectLibraryNewName').value = nombreLimpio;
  if ($('projectLibraryNewType')) $('projectLibraryNewType').value = 'imagen';
  if ($('projectLibraryNewFormat')) $('projectLibraryNewFormat').value = 'imagen';
  if ($('projectLibraryNewUsage')) $('projectLibraryNewUsage').value = sugerencia.usoSugerido;
  if ($('projectLibraryNewTags')) $('projectLibraryNewTags').value = sugerencia.etiquetas.join(', ');
  if ($('projectLibraryNewPath') && ruta) $('projectLibraryNewPath').value = ruta;
  if ($('projectLibraryNewOriginalName') && nombreArchivo) $('projectLibraryNewOriginalName').value = nombreArchivo;
  if ($('projectLibraryNewMime') && archivo.type) $('projectLibraryNewMime').value = archivo.type;
  if ($('projectLibraryNewSize') && archivo.size) $('projectLibraryNewSize').value = archivo.size;
  const sugerenciaInput = asegurarCampoSugerenciaActiva();
  if (sugerenciaInput) sugerenciaInput.value = sugerencia.id;
  seleccionarCategoriaDisponible(sugerencia.categoria || 'otro');

  actualizarRevisionVisual();
  setTimeout(() => document.querySelector('[data-project-library-wizard-go="datos"]')?.click(), 80);
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

function esperarAplicacionArchivo(sugerencia, card, valorPrevio = '') {
  clearInterval(esperaArchivoTimer);
  let intentos = 0;
  esperaArchivoTimer = setInterval(async () => {
    intentos += 1;
    const actual = $('projectLibraryNewOriginalName')?.value || $('projectLibrarySelectedFileName')?.textContent || '';
    const hayArchivo = actual && actual !== valorPrevio && !/ningún archivo/i.test(actual);
    if (!hayArchivo && intentos < 40) return;
    clearInterval(esperaArchivoTimer);
    if (!hayArchivo) {
      setMensaje('No se detectó una imagen seleccionada para la sugerencia.', 'warn');
      return;
    }
    aplicarSugerenciaEnFormulario(sugerencia, {});
    actualizarEstadoCard(card, 'subida');
    await actualizarEstadoGuardado(sugerencia.id, {
      estado: 'subida',
      detalle: 'Estado: imagen seleccionada y formulario preparado.',
      nombre: sugerencia.nombre,
      usoSugerido: sugerencia.usoSugerido,
      busquedaCorta: sugerencia.busquedaCorta,
      categoria: sugerencia.categoria,
      etiquetas: sugerencia.etiquetas,
      archivoNombre: actual
    });
    setMensaje(`Imagen vinculada a la sugerencia: ${sugerencia.nombre}. Revisa los datos y guarda el temporal.`, 'ok');
  }, 250);
}

async function abrirSelectorParaSugerencia(card) {
  const sugerencia = obtenerSugerenciaDesdeCard(card);
  if (!sugerencia?.id) return;
  const proyectoId = obtenerProyectoId();
  if (!proyectoId || proyectoId === 'sin-proyecto') {
    setMensaje('Primero carga el proyecto para subir imágenes sugeridas.', 'warn');
    return;
  }

  sugerenciaPendiente = { sugerencia, card };
  const valorPrevio = $('projectLibraryNewOriginalName')?.value || $('projectLibrarySelectedFileName')?.textContent || '';
  const botonCargaNormal = document.querySelector('[data-project-library-action="choose-file"]');

  setMensaje(`Elige una imagen para: ${sugerencia.nombre}.`, 'normal');

  if (botonCargaNormal && !botonCargaNormal.disabled) {
    botonCargaNormal.click();
    esperarAplicacionArchivo(sugerencia, card, valorPrevio);
    return;
  }

  const input = $('projectLibraryFileInput');
  if (input) {
    input.click();
    esperarAplicacionArchivo(sugerencia, card, valorPrevio);
  }
}

async function marcarNoNecesaria(card) {
  const sugerencia = obtenerSugerenciaDesdeCard(card);
  if (!sugerencia?.id) return;
  actualizarEstadoCard(card, 'omitida');
  await actualizarEstadoGuardado(sugerencia.id, {
    estado: 'omitida',
    detalle: 'Estado: marcada como no necesaria.',
    nombre: sugerencia.nombre,
    usoSugerido: sugerencia.usoSugerido,
    busquedaCorta: sugerencia.busquedaCorta,
    categoria: sugerencia.categoria,
    etiquetas: sugerencia.etiquetas
  });
  setMensaje(`Sugerencia marcada como no necesaria: ${sugerencia.nombre}.`, 'ok');
  setTimeout(() => avanzarSugerencia(1), 350);
}

function mostrarBusquedaInternetPendiente(card) {
  const sugerencia = obtenerSugerenciaDesdeCard(card);
  const opciones = card?.querySelector('#projectLibraryInternetImageOptions');
  if (opciones) {
    opciones.innerHTML = `
      <div class="project-library-internet-option">Buscar: ${escapar(sugerencia.busquedaCorta)}</div>
      <div class="project-library-internet-option">Opción real en Bloque 3</div>
      <div class="project-library-internet-option">Elegir imagen después</div>`;
  }
  setMensaje('Bloque 1 dejó listo el espacio. La búsqueda real de 3 imágenes se conecta en el siguiente bloque.', 'normal');
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
      if (accion === 'search-internet') mostrarBusquedaInternetPendiente(card);
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
        actualizarEstadoCard(sugerenciaPendiente.card, 'subida');
        await actualizarEstadoGuardado(sugerenciaPendiente.sugerencia.id, {
          estado: 'subida',
          detalle: 'Estado: imagen seleccionada y formulario preparado.',
          nombre: sugerenciaPendiente.sugerencia.nombre,
          usoSugerido: sugerenciaPendiente.sugerencia.usoSugerido,
          busquedaCorta: sugerenciaPendiente.sugerencia.busquedaCorta,
          categoria: sugerenciaPendiente.sugerencia.categoria,
          etiquetas: sugerenciaPendiente.sugerencia.etiquetas,
          archivoNombre: archivo.name || ''
        });
        setMensaje(`Imagen vinculada a la sugerencia: ${sugerenciaPendiente.sugerencia.nombre}. Revisa los datos y guarda el temporal.`, 'ok');
        sugerenciaPendiente = null;
      }, 160);
    });
  }
}

async function activarImagenesSugeridas() {
  setTimeout(async () => {
    const root = document.querySelector('[data-project-library-image-requests]');
    conectarBotonesSugerencias(root);
    if (!sugerenciasActuales.length) renderSugerencias([]);
    await cargarEstadoSugerenciasServidor();
  }, 0);
}

export function inicializarBibliotecaImagenesSugeridasUI() {
  if (typeof document === 'undefined' || inicializado) return;
  inicializado = true;
  interceptarGuardadoRecursoTemporal();
  document.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'biblioteca' || evento.detail?.pantallaId === 'biblioteca-proyecto') activarImagenesSugeridas();
  });
  document.addEventListener('autovideo:biblioteca-area', (evento) => {
    if (evento.detail?.area === 'proyecto') activarImagenesSugeridas();
  });
  document.addEventListener('click', (evento) => {
    if (evento.target.closest('#projectLibraryLoadBtn') || evento.target.closest('#projectLibraryRefreshBtn')) {
      setTimeout(() => activarImagenesSugeridas(), 400);
    }
  });
  activarImagenesSugeridas();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarBibliotecaImagenesSugeridasUI);
}
