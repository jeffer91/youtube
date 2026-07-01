const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';
const STORAGE_IMAGENES_SUGERIDAS = 'autovideojeff.bibliotecaImagenesSugeridas';

const SUGERENCIAS_BASE = Object.freeze({
  'tema-principal': {
    id: 'tema-principal',
    nombre: 'Tema principal del video',
    motivo: 'La app necesita una imagen principal para reforzar la idea central del video.',
    usoSugerido: 'imagen de apoyo para reforzar la idea central del video',
    etiquetas: ['tema-principal', 'apoyo-visual', 'temporal'],
    categoria: 'otro'
  },
  'personaje-lugar-equipo': {
    id: 'personaje-lugar-equipo',
    nombre: 'Personaje, lugar, equipo o país mencionado',
    motivo: 'La transcripción puede mencionar personas, lugares, equipos o países que conviene mostrar visualmente.',
    usoSugerido: 'recurso visual cuando se mencione en la transcripción',
    etiquetas: ['mencionado', 'apoyo-visual', 'temporal'],
    categoria: 'otro'
  },
  'grafico-tabla-mapa': {
    id: 'grafico-tabla-mapa',
    nombre: 'Tabla, mapa o gráfico de apoyo',
    motivo: 'Algunas explicaciones pueden necesitar una imagen tipo tabla, mapa o gráfico.',
    usoSugerido: 'imagen explicativa para partes difíciles del video',
    etiquetas: ['grafico', 'tabla', 'mapa', 'temporal'],
    categoria: 'otro'
  }
});

let inicializado = false;
let sugerenciaPendiente = null;
let esperaArchivoTimer = null;

function $(id) { return document.getElementById(id); }

function texto(valor = '', respaldo = '') {
  const limpio = String(valor ?? '').trim();
  return limpio || respaldo;
}

function escapar(valor = '') {
  return texto(valor, '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function obtenerProyectoId() {
  return $('projectLibraryProjectId')?.value?.trim() || localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || 'sin-proyecto';
}

function claveStorage() {
  return `${STORAGE_IMAGENES_SUGERIDAS}.${obtenerProyectoId()}`;
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
  return {
    id: texto(sugerencia.id || base.id, 'sugerencia-imagen'),
    nombre: texto(sugerencia.nombre || base.nombre, 'Imagen sugerida'),
    motivo: texto(sugerencia.motivo || base.motivo, 'Imagen sugerida para reforzar el video.'),
    usoSugerido: texto(sugerencia.usoSugerido || sugerencia.uso || base.usoSugerido, 'apoyo visual del proyecto'),
    categoria: texto(sugerencia.categoria || base.categoria, 'otro'),
    etiquetas: Array.isArray(sugerencia.etiquetas) && sugerencia.etiquetas.length ? sugerencia.etiquetas : (base.etiquetas || ['apoyo-visual', 'temporal']),
    estado: texto(sugerencia.estado || base.estado, 'pendiente'),
    detalle: texto(sugerencia.detalle || '', '')
  };
}

function renderCardSugerencia(sugerenciaEntrada = {}) {
  const sugerencia = normalizarSugerencia(sugerenciaEntrada);
  const estadoTexto = sugerencia.estado === 'guardada'
    ? 'Estado: imagen guardada como recurso temporal.'
    : sugerencia.estado === 'subida'
      ? 'Estado: imagen seleccionada y formulario preparado.'
      : sugerencia.estado === 'omitida'
        ? 'Estado: marcada como no necesaria.'
        : 'Estado: pendiente de imagen.';
  return `
    <article class="project-library-image-request-card" data-image-suggestion-card="${escapar(sugerencia.id)}" data-image-suggestion-state="${escapar(sugerencia.estado)}">
      <div>
        <strong>${escapar(sugerencia.nombre)}</strong>
        <span>Uso sugerido: ${escapar(sugerencia.usoSugerido)}</span>
        <small>${escapar(sugerencia.detalle || estadoTexto)}</small>
      </div>
      <div class="project-library-image-request-actions">
        <button class="project-library-button is-save" type="button" data-suggested-image-action="upload">Subir imagen</button>
        <button class="project-library-button is-muted" type="button" data-suggested-image-action="skip">No necesaria</button>
      </div>
    </article>`;
}

function renderSugerencias(sugerencias = []) {
  const lista = $('projectLibrarySuggestedImagesList');
  if (!lista) return;
  const items = sugerencias.length ? sugerencias : Object.values(SUGERENCIAS_BASE).map((item) => ({ ...item, estado: 'pendiente' }));
  lista.innerHTML = items.map(renderCardSugerencia).join('');
}

function obtenerSugerenciaDesdeCard(card) {
  const id = card?.dataset?.imageSuggestionCard || '';
  const base = SUGERENCIAS_BASE[id] || null;
  const titulo = texto(card?.querySelector('strong')?.textContent, base?.nombre || id);
  const uso = texto(card?.querySelector('span')?.textContent, base?.usoSugerido || 'apoyo visual').replace(/^Uso sugerido:\s*/i, '');
  return normalizarSugerencia({ ...(base || {}), id, nombre: titulo, usoSugerido: uso, estado: card?.dataset?.imageSuggestionState || 'pendiente' });
}

function actualizarEstadoCard(card, estado = 'pendiente', detalle = '') {
  if (!card) return;
  card.dataset.imageSuggestionState = estado;
  card.classList.toggle('is-subida', estado === 'subida' || estado === 'guardada');
  card.classList.toggle('is-omitida', estado === 'omitida');
  card.classList.toggle('is-pendiente', estado === 'pendiente');
  const small = card.querySelector('small');
  if (small) {
    if (estado === 'guardada') small.textContent = detalle || 'Estado: imagen guardada como recurso temporal.';
    else if (estado === 'subida') small.textContent = detalle || 'Estado: imagen seleccionada y formulario preparado.';
    else if (estado === 'omitida') small.textContent = detalle || 'Estado: marcada como no necesaria.';
    else small.textContent = detalle || 'Estado: pendiente de imagen.';
  }
}

function aplicarEstadoGuardadoEnCardsLocal() {
  const estado = leerEstadoSugerenciasLocal();
  document.querySelectorAll('[data-image-suggestion-card]').forEach((card) => {
    const id = card.dataset.imageSuggestionCard;
    actualizarEstadoCard(card, estado[id]?.estado || card.dataset.imageSuggestionState || 'pendiente', estado[id]?.detalle || '');
  });
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
    categoria: sugerencia.categoria,
    etiquetas: sugerencia.etiquetas
  });
  setMensaje(`Sugerencia marcada como no necesaria: ${sugerencia.nombre}.`, 'ok');
}

function conectarBotonesSugerencias(root) {
  if (!root) return;
  if (root.dataset.imagenesSugeridasInicializado !== '1') {
    root.dataset.imagenesSugeridasInicializado = '1';
    root.addEventListener('click', async (evento) => {
      const accion = evento.target.closest('[data-suggested-image-action]')?.dataset.suggestedImageAction;
      if (!accion) return;
      const card = evento.target.closest('[data-image-suggestion-card]');
      if (accion === 'upload') await abrirSelectorParaSugerencia(card);
      if (accion === 'skip') await marcarNoNecesaria(card);
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
    await cargarEstadoSugerenciasServidor();
  }, 0);
}

export function inicializarBibliotecaImagenesSugeridasUI() {
  if (typeof document === 'undefined' || inicializado) return;
  inicializado = true;
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
