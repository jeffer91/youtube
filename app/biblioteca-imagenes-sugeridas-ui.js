const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';
const STORAGE_IMAGENES_SUGERIDAS = 'autovideojeff.bibliotecaImagenesSugeridas';

const SUGERENCIAS_BASE = Object.freeze({
  'tema-principal': {
    id: 'tema-principal',
    nombre: 'Tema principal del video',
    usoSugerido: 'imagen de apoyo para reforzar la idea central del video',
    etiquetas: ['tema-principal', 'apoyo-visual', 'temporal'],
    categoria: 'otro'
  },
  'personaje-lugar-equipo': {
    id: 'personaje-lugar-equipo',
    nombre: 'Personaje, lugar, equipo o país mencionado',
    usoSugerido: 'recurso visual cuando se mencione en la transcripción',
    etiquetas: ['mencionado', 'apoyo-visual', 'temporal'],
    categoria: 'otro'
  },
  'grafico-tabla-mapa': {
    id: 'grafico-tabla-mapa',
    nombre: 'Tabla, mapa o gráfico de apoyo',
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

function obtenerProyectoId() {
  return $('projectLibraryProjectId')?.value?.trim() || localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || 'sin-proyecto';
}

function claveStorage() {
  return `${STORAGE_IMAGENES_SUGERIDAS}.${obtenerProyectoId()}`;
}

function leerEstadoSugerencias() {
  try {
    return JSON.parse(localStorage.getItem(claveStorage()) || '{}') || {};
  } catch (_error) {
    return {};
  }
}

function guardarEstadoSugerencias(estado = {}) {
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

function obtenerSugerenciaDesdeCard(card) {
  const id = card?.dataset?.imageSuggestionCard || '';
  const base = SUGERENCIAS_BASE[id] || null;
  if (!base) return null;
  const titulo = texto(card.querySelector('strong')?.textContent, base.nombre);
  const uso = texto(card.querySelector('span')?.textContent, base.usoSugerido).replace(/^Uso sugerido:\s*/i, '');
  return { ...base, nombre: titulo, usoSugerido: uso };
}

function actualizarEstadoCard(card, estado = 'pendiente', detalle = '') {
  if (!card) return;
  card.dataset.imageSuggestionState = estado;
  card.classList.toggle('is-subida', estado === 'subida');
  card.classList.toggle('is-omitida', estado === 'omitida');
  card.classList.toggle('is-pendiente', estado === 'pendiente');
  const small = card.querySelector('small');
  if (small) {
    if (estado === 'subida') small.textContent = detalle || 'Estado: imagen seleccionada y formulario preparado.';
    else if (estado === 'omitida') small.textContent = detalle || 'Estado: marcada como no necesaria.';
    else small.textContent = detalle || 'Estado: pendiente de imagen.';
  }
}

function aplicarEstadoGuardadoEnCards() {
  const estado = leerEstadoSugerencias();
  document.querySelectorAll('[data-image-suggestion-card]').forEach((card) => {
    const id = card.dataset.imageSuggestionCard;
    actualizarEstadoCard(card, estado[id]?.estado || 'pendiente', estado[id]?.detalle || '');
  });
}

function actualizarEstadoGuardado(id, datos) {
  const estado = leerEstadoSugerencias();
  estado[id] = { ...(estado[id] || {}), ...datos, actualizadoEn: new Date().toISOString() };
  guardarEstadoSugerencias(estado);
}

function seleccionarCategoriaDisponible(preferida = 'otro') {
  const select = $('projectLibraryNewCategory');
  if (!select) return;
  const opciones = [...select.options].map((option) => option.value);
  if (opciones.includes(preferida)) select.value = preferida;
  else if (opciones.includes('otro')) select.value = 'otro';
  else if (opciones.length) select.value = opciones[0];
}

function aplicarSugerenciaEnFormulario(sugerencia, archivo = {}) {
  if (!sugerencia) return;
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
  esperaArchivoTimer = setInterval(() => {
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
    actualizarEstadoGuardado(sugerencia.id, {
      estado: 'subida',
      detalle: 'Estado: imagen seleccionada y formulario preparado.',
      nombre: sugerencia.nombre
    });
    setMensaje(`Imagen vinculada a la sugerencia: ${sugerencia.nombre}. Revisa los datos y guarda el temporal.`, 'ok');
  }, 250);
}

async function abrirSelectorParaSugerencia(card) {
  const sugerencia = obtenerSugerenciaDesdeCard(card);
  if (!sugerencia) return;
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

function marcarNoNecesaria(card) {
  const sugerencia = obtenerSugerenciaDesdeCard(card);
  if (!sugerencia) return;
  actualizarEstadoCard(card, 'omitida');
  actualizarEstadoGuardado(sugerencia.id, {
    estado: 'omitida',
    detalle: 'Estado: marcada como no necesaria.',
    nombre: sugerencia.nombre
  });
  setMensaje(`Sugerencia marcada como no necesaria: ${sugerencia.nombre}.`, 'ok');
}

function conectarBotonesSugerencias(root) {
  if (!root || root.dataset.imagenesSugeridasInicializado === '1') return;
  root.dataset.imagenesSugeridasInicializado = '1';

  root.querySelectorAll('[data-image-suggestion-card]').forEach((card) => {
    const botones = card.querySelectorAll('button');
    botones.forEach((boton) => boton.disabled = false);
    if (botones[0]) botones[0].dataset.suggestedImageAction = 'upload';
    if (botones[1]) botones[1].dataset.suggestedImageAction = 'skip';
  });

  root.addEventListener('click', async (evento) => {
    const accion = evento.target.closest('[data-suggested-image-action]')?.dataset.suggestedImageAction;
    if (!accion) return;
    const card = evento.target.closest('[data-image-suggestion-card]');
    if (accion === 'upload') await abrirSelectorParaSugerencia(card);
    if (accion === 'skip') marcarNoNecesaria(card);
  });

  const input = $('projectLibraryFileInput');
  if (input && input.dataset.imagenesSugeridasChange !== '1') {
    input.dataset.imagenesSugeridasChange = '1';
    input.addEventListener('change', () => {
      if (!sugerenciaPendiente?.sugerencia) return;
      const archivo = input.files?.[0] || {};
      setTimeout(() => {
        aplicarSugerenciaEnFormulario(sugerenciaPendiente.sugerencia, archivo);
        actualizarEstadoCard(sugerenciaPendiente.card, 'subida');
        actualizarEstadoGuardado(sugerenciaPendiente.sugerencia.id, {
          estado: 'subida',
          detalle: 'Estado: imagen seleccionada y formulario preparado.',
          nombre: sugerenciaPendiente.sugerencia.nombre
        });
        setMensaje(`Imagen vinculada a la sugerencia: ${sugerenciaPendiente.sugerencia.nombre}. Revisa los datos y guarda el temporal.`, 'ok');
        sugerenciaPendiente = null;
      }, 160);
    });
  }

  aplicarEstadoGuardadoEnCards();
}

function activarImagenesSugeridas() {
  setTimeout(() => {
    const root = document.querySelector('[data-project-library-image-requests]');
    conectarBotonesSugerencias(root);
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
  activarImagenesSugeridas();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarBibliotecaImagenesSugeridasUI);
}
