const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';
const TIPOS = ['video', 'imagen', 'audio'];
const FORMATOS = ['horizontal-16-9', 'vertical-9-16', 'cuadrado-1-1', 'audio', 'imagen', 'desconocido'];

let puenteEntendimientoRegistrado = false;

function $(id) { return document.getElementById(id); }
function texto(valor = '', respaldo = '') { const limpio = String(valor ?? '').trim(); return limpio || respaldo; }
function escapar(valor = '') { return texto(valor, '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function lista(valor = []) { if (Array.isArray(valor)) return valor.map((item) => texto(item)).filter(Boolean); if (typeof valor === 'string' && valor.trim()) return valor.split(',').map((item) => item.trim()).filter(Boolean); return []; }

async function obtenerBaseApi() {
  const apiElectron = window.AutoVideoJeff?.servidor?.obtenerEstado;
  if (typeof apiElectron === 'function') {
    try {
      const estado = await apiElectron();
      if (estado?.url) return estado.url;
    } catch (error) {
      console.warn('[Biblioteca proyecto] No se pudo leer servidor Electron:', error.message);
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

function formatearPeso(bytes = 0) {
  const numero = Number(bytes || 0);
  if (!Number.isFinite(numero) || numero <= 0) return 'sin peso';
  if (numero < 1024 * 1024) return `${(numero / 1024).toFixed(1)} KB`;
  return `${(numero / (1024 * 1024)).toFixed(1)} MB`;
}

function formatearDuracion(segundos = null) {
  const total = Number(segundos);
  if (!Number.isFinite(total) || total <= 0) return 'sin duración';
  const min = Math.floor(total / 60);
  const seg = Math.round(total % 60).toString().padStart(2, '0');
  return `${min}:${seg}`;
}

function inferirTipo(nombre = '') {
  const ext = String(nombre).toLowerCase().split('.').pop();
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'imagen';
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(ext)) return 'audio';
  return 'video';
}

function inferirFormato(tipo) {
  if (tipo === 'audio') return 'audio';
  if (tipo === 'imagen') return 'imagen';
  return 'desconocido';
}

function sugerirCategoria(nombre = '', tipo = '') {
  const n = nombre.toLowerCase();
  if (/intro|inicio|opening/.test(n)) return 'intro';
  if (/ending|outro|final|cierre/.test(n)) return 'ending';
  if (/logo|marca|escudo/.test(n)) return 'logo';
  if (/transicion|transition|wipe/.test(n)) return 'transicion';
  if (/miniatura|thumbnail|portada/.test(n)) return 'miniatura';
  if (/musica|music|song/.test(n) || tipo === 'audio') return 'musica';
  if (/sfx|sonido|efecto/.test(n)) return 'efecto-sonoro';
  if (/top.?1/.test(n)) return 'top-1';
  if (/top.?2/.test(n)) return 'top-2';
  if (/top.?3/.test(n)) return 'top-3';
  return 'otro';
}

function sugerirUso(nombre = '', categoria = '', tipo = '') {
  if (categoria === 'logo') return 'marca visual del proyecto';
  if (categoria === 'intro') return 'apertura temporal del video';
  if (categoria === 'ending') return 'cierre temporal del video';
  if (categoria === 'transicion') return 'separador visual';
  if (categoria === 'musica') return 'música de apoyo';
  if (categoria === 'efecto-sonoro') return 'efecto sonoro puntual';
  if (tipo === 'imagen') return 'apoyo visual del proyecto';
  if (tipo === 'video') return 'clip de apoyo del proyecto';
  return `recurso temporal: ${nombre || 'apoyo'}`;
}

function obtenerProyectoId() {
  const input = $('projectLibraryProjectId');
  const desdeInput = input?.value?.trim();
  if (desdeInput) return desdeInput;
  return localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
}

function guardarProyectoId(proyectoId) {
  if (!proyectoId) return;
  localStorage.setItem(STORAGE_PROYECTO_ETAPAS, proyectoId);
  const input = $('projectLibraryProjectId');
  if (input && !input.value) input.value = proyectoId;
}

function setMensaje(mensaje, tipo = 'normal') {
  const box = $('projectLibraryMessage');
  if (!box) return;
  box.hidden = false;
  box.textContent = mensaje;
  box.className = `project-library-message is-${tipo}`;
}

function setChip(mensaje, tipo = 'normal') {
  const chip = $('projectLibraryStateChip');
  if (!chip) return;
  chip.textContent = mensaje;
  chip.className = `aj-status-chip project-library-chip is-${tipo}`;
}

function aplicarHabilitada(habilitada) {
  const guardar = document.querySelector('[data-project-library-action="save"]');
  const elegir = document.querySelector('[data-project-library-action="choose-file"]');
  const plan = $('projectLibraryCreatePlanBtn');
  if (guardar) guardar.disabled = !habilitada;
  if (elegir) elegir.disabled = !habilitada;
  if (plan) plan.disabled = !habilitada;
  $('projectLibraryEnabledKpi').textContent = habilitada ? 'Activa' : 'Bloqueada';
  $('projectLibraryReadyKpi').textContent = habilitada ? 'Sí' : 'No';
}

async function cargarCategorias() {
  const datos = await api('/api/autovideo/biblioteca/categorias');
  const select = $('projectLibraryNewCategory');
  if (!select) return;
  const categorias = datos.categorias || [];
  select.innerHTML = categorias.map((item) => `<option value="${escapar(item.id)}">${escapar(item.nombre)}</option>`).join('');
  if (!select.value) select.value = 'otro';
}

function normalizarRecurso(recurso = {}) {
  const analisis = recurso.analisisArchivo || {};
  return {
    id: recurso.id || 'sin-id',
    nombre: recurso.nombre || 'Recurso temporal',
    tipo: recurso.tipo || analisis.tipo || 'video',
    categoria: recurso.categoria || 'otro',
    formato: recurso.formato || recurso.tamanoFormato || analisis.formatoDetectado || 'desconocido',
    usoSugerido: recurso.usoSugerido || recurso.tipoEdicion || recurso.estadoUso || 'sugerido',
    etiquetas: Array.isArray(recurso.etiquetas) ? recurso.etiquetas : [],
    resolucion: recurso.resolucion || analisis.resolucion || '',
    duracionSegundos: recurso.duracionSegundos ?? analisis.duracionSegundos ?? null,
    tieneAudio: Boolean(recurso.tieneAudio ?? analisis.tieneAudio ?? false),
    pesoBytes: recurso.archivo?.pesoBytes || analisis.pesoBytes || 0,
    estadoTecnico: recurso.estadoTecnico || recurso.estado || analisis.estadoTecnico || 'pendiente',
    ruta: recurso.rutaRelativa || recurso.ruta || recurso.archivo?.rutaRelativa || recurso.archivo?.rutaAbsoluta || ''
  };
}

function renderTarjetas(recursos = []) {
  if (!recursos.length) return '<div class="project-library-empty">No hay recursos temporales en este proyecto.</div>';
  return recursos.map((item) => {
    const recurso = normalizarRecurso(item);
    return `<article class="project-library-resource-card">
      <header><strong>${escapar(recurso.nombre)}</strong><span>${escapar(recurso.tipo)}</span></header>
      <p>${escapar(recurso.categoria)} · ${escapar(recurso.formato)} · ${escapar(recurso.estadoTecnico)}</p>
      <dl>
        <div><dt>Uso</dt><dd>${escapar(recurso.usoSugerido)}</dd></div>
        <div><dt>Resolución</dt><dd>${escapar(recurso.resolucion || '—')}</dd></div>
        <div><dt>Duración</dt><dd>${escapar(formatearDuracion(recurso.duracionSegundos))}</dd></div>
        <div><dt>Audio</dt><dd>${escapar(recurso.tieneAudio ? 'sí' : 'no')}</dd></div>
        <div><dt>Peso</dt><dd>${escapar(formatearPeso(recurso.pesoBytes))}</dd></div>
        <div><dt>Etiquetas</dt><dd>${escapar(recurso.etiquetas.slice(0, 3).join(', ') || 'sin etiquetas')}</dd></div>
      </dl>
      <footer title="${escapar(recurso.ruta)}">${escapar(recurso.ruta || 'sin ruta')}</footer>
    </article>`;
  }).join('');
}

function renderTabla(recursos = []) {
  if (!recursos.length) return '<div class="project-library-empty">No hay recursos temporales en este proyecto.</div>';
  return `<div class="project-library-table-wrap"><table class="project-library-table"><thead><tr><th>Nombre</th><th>Tipo</th><th>Categoría</th><th>Formato</th><th>Resolución</th><th>Uso</th><th>Estado</th></tr></thead><tbody>${recursos.map((item) => {
    const recurso = normalizarRecurso(item);
    return `<tr><td>${escapar(recurso.nombre)}</td><td>${escapar(recurso.tipo)}</td><td>${escapar(recurso.categoria)}</td><td>${escapar(recurso.formato)}</td><td>${escapar(recurso.resolucion || '—')}</td><td>${escapar(recurso.usoSugerido)}</td><td>${escapar(recurso.estadoTecnico)}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

export function renderRecursosBibliotecaProyecto(recursos = [], modo = 'cards') {
  return modo === 'table' ? renderTabla(recursos) : renderTarjetas(recursos);
}

function renderRecursos(recursos = []) {
  const lista = $('projectLibraryResourcesList');
  if (!lista) return;
  const modo = $('projectLibraryViewMode')?.value || 'cards';
  lista.className = modo === 'table' ? 'project-library-resources-list is-table' : 'project-library-resources-list';
  lista.innerHTML = renderRecursosBibliotecaProyecto(recursos, modo);
}

async function cargarBibliotecaProyecto() {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) { setMensaje('Falta proyectoId. Crea o carga un proyecto primero.', 'warn'); return null; }
  guardarProyectoId(proyectoId);
  setChip('Cargando...', 'normal');
  const datos = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/biblioteca-proyecto`);
  aplicarHabilitada(Boolean(datos.habilitada));
  $('projectLibraryTotalKpi').textContent = String(datos.totalRecursos || datos.recursos?.length || 0);
  $('projectLibraryVideosKpi').textContent = String(datos.videos?.totalValidos ?? datos.videos?.total ?? '—');
  $('projectLibraryUploadState').textContent = datos.habilitada ? 'Activa' : 'Bloqueada';
  renderRecursos(datos.recursos || []);
  setChip(datos.habilitada ? 'Activa' : 'Bloqueada', datos.habilitada ? 'ok' : 'warn');
  setMensaje(datos.habilitada ? 'Biblioteca proyecto activa. Puedes subir recursos temporales.' : 'Primero procesa Entendimiento para activar esta biblioteca.', datos.habilitada ? 'ok' : 'warn');
  return datos;
}

function aplicarArchivoSeleccionado(archivo = {}) {
  const ruta = archivo.path || archivo.ruta || '';
  const nombre = archivo.name || archivo.nombreOriginal || ruta.split(/[\\/]/).pop() || '';
  const tipo = inferirTipo(nombre);
  const categoria = sugerirCategoria(nombre, tipo);
  $('projectLibrarySelectedFileName').textContent = nombre || 'Archivo seleccionado';
  $('projectLibrarySelectedFileMeta').textContent = `${tipo} · ${formatearPeso(archivo.size || 0)} · se analizará al guardar`;
  $('projectLibraryNewName').value = nombre ? nombre.replace(/\.[a-z0-9]+$/i, '') : 'Recurso temporal';
  $('projectLibraryNewType').value = tipo;
  $('projectLibraryNewCategory').value = categoria;
  $('projectLibraryNewFormat').value = inferirFormato(tipo);
  $('projectLibraryNewUsage').value = sugerirUso(nombre, categoria, tipo);
  $('projectLibraryNewTags').value = lista([categoria, tipo, 'temporal']).join(', ');
  $('projectLibraryNewPath').value = ruta;
  $('projectLibraryNewOriginalName').value = nombre;
  $('projectLibraryNewMime').value = archivo.type || archivo.mime || '';
  $('projectLibraryNewSize').value = archivo.size || 0;
}

async function elegirArchivo() {
  const selector = window.AutoVideoJeff?.biblioteca?.seleccionarArchivo;
  if (typeof selector === 'function') {
    const resultado = await selector();
    if (resultado?.ok && resultado.archivo) aplicarArchivoSeleccionado(resultado.archivo);
    return;
  }
  $('projectLibraryFileInput')?.click();
}

function leerFormulario(accionDuplicado = 'preguntar') {
  return {
    nombre: $('projectLibraryNewName')?.value?.trim() || '',
    tipo: $('projectLibraryNewType')?.value || 'video',
    categoria: $('projectLibraryNewCategory')?.value || 'otro',
    formato: $('projectLibraryNewFormat')?.value || 'desconocido',
    formatoManual: ($('projectLibraryNewFormat')?.value || 'desconocido') !== 'desconocido',
    etiquetas: lista($('projectLibraryNewTags')?.value || ''),
    usoSugerido: $('projectLibraryNewUsage')?.value?.trim() || 'recurso_temporal_proyecto',
    tipoEdicion: $('projectLibraryNewUsage')?.value?.trim() || 'recurso_temporal_proyecto',
    rutaOrigen: $('projectLibraryNewPath')?.value?.trim() || '',
    ruta: $('projectLibraryNewPath')?.value?.trim() || '',
    nombreOriginal: $('projectLibraryNewOriginalName')?.value || '',
    mime: $('projectLibraryNewMime')?.value || '',
    pesoBytes: Number($('projectLibraryNewSize')?.value || 0) || 0,
    fuente: 'biblioteca-proyecto-ui',
    licencia: 'propio',
    estadoUso: 'sugerido',
    accionDuplicado
  };
}

function limpiarFormulario() {
  ['projectLibraryNewName', 'projectLibraryNewUsage', 'projectLibraryNewTags', 'projectLibraryNewPath', 'projectLibraryNewOriginalName', 'projectLibraryNewMime', 'projectLibraryNewSize'].forEach((id) => {
    const input = $(id);
    if (input) input.value = '';
  });
  $('projectLibrarySelectedFileName').textContent = 'Ningún archivo seleccionado.';
  $('projectLibrarySelectedFileMeta').textContent = 'Selecciona un archivo temporal para el proyecto.';
  const duplicado = $('projectLibraryDuplicateBox');
  if (duplicado) duplicado.hidden = true;
}

function mostrarDuplicado(resultado = {}) {
  const box = $('projectLibraryDuplicateBox');
  const textoBox = $('projectLibraryDuplicateText');
  if (!box) return;
  const duplicado = resultado.duplicado || resultado.recurso?.duplicado || null;
  if (textoBox) textoBox.textContent = duplicado?.nombre ? `Parece repetido con: ${duplicado.nombre}` : 'Decide si reemplazarlo o duplicarlo.';
  box.hidden = false;
}

async function guardarRecurso(accionDuplicado = 'preguntar') {
  const proyectoId = obtenerProyectoId();
  if (!proyectoId) throw new Error('Falta proyectoId.');
  const datos = leerFormulario(accionDuplicado);
  if (!datos.nombre) throw new Error('Falta nombre del recurso temporal.');
  if (!datos.rutaOrigen) throw new Error('Primero selecciona un archivo.');
  if (!TIPOS.includes(datos.tipo)) throw new Error('Tipo de archivo no válido.');
  if (!FORMATOS.includes(datos.formato)) datos.formato = 'desconocido';

  const resultado = await api(`/api/proyectos/${encodeURIComponent(proyectoId)}/biblioteca-proyecto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (resultado?.requiereDecisionDuplicado || resultado?.recurso?.requiereDecisionDuplicado) {
    mostrarDuplicado(resultado.recurso || resultado);
    throw new Error('Recurso temporal repetido. Elige reemplazar o duplicar.');
  }
  limpiarFormulario();
  await cargarBibliotecaProyecto();
  return resultado;
}

function irAPlan() {
  const proyectoId = obtenerProyectoId();
  if (proyectoId) localStorage.setItem(STORAGE_PROYECTO_ETAPAS, proyectoId);
  document.querySelector('[data-pantalla="plan-edicion"]')?.click();
  setTimeout(() => {
    const input = $('planProyectoId');
    if (input && proyectoId) input.value = proyectoId;
    $('planCargarBtn')?.click();
  }, 160);
}

function irABibliotecaProyectoDesdeEntendimiento(evento) {
  const boton = evento.target.closest?.('#entendimientoCrearPlanBtn');
  if (!boton) return;
  evento.preventDefault();
  evento.stopPropagation();
  evento.stopImmediatePropagation();
  const proyectoId = $('entendimientoProyectoId')?.value?.trim() || localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
  if (proyectoId) localStorage.setItem(STORAGE_PROYECTO_ETAPAS, proyectoId);
  document.querySelector('[data-pantalla="biblioteca-proyecto"]')?.click();
  setTimeout(() => {
    const input = $('projectLibraryProjectId');
    if (input && proyectoId) input.value = proyectoId;
    $('projectLibraryLoadBtn')?.click();
  }, 160);
}

function inicializarPuenteEntendimiento() {
  if (puenteEntendimientoRegistrado) return;
  puenteEntendimientoRegistrado = true;
  document.addEventListener('click', irABibliotecaProyectoDesdeEntendimiento, true);
}

function inicializarDropZone() {
  const zona = $('projectLibraryDropZone');
  const input = $('projectLibraryFileInput');
  if (!zona || !input || zona.dataset.inicializado === 'true') return;
  zona.dataset.inicializado = 'true';
  zona.addEventListener('dragover', (evento) => { evento.preventDefault(); zona.classList.add('is-dragover'); });
  zona.addEventListener('dragleave', () => zona.classList.remove('is-dragover'));
  zona.addEventListener('drop', (evento) => { evento.preventDefault(); zona.classList.remove('is-dragover'); aplicarArchivoSeleccionado(evento.dataTransfer?.files?.[0]); });
  input.addEventListener('change', () => aplicarArchivoSeleccionado(input.files?.[0]));
}

function enlazarEventos() {
  const root = document.querySelector('[data-project-library-root]');
  if (!root || root.dataset.inicializado === '1') return;
  root.dataset.inicializado = '1';
  const input = $('projectLibraryProjectId');
  if (input && !input.value) input.value = localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
  inicializarDropZone();
  cargarCategorias().catch((error) => setMensaje(error.message, 'error'));
  $('projectLibraryLoadBtn')?.addEventListener('click', () => cargarBibliotecaProyecto().catch((error) => setMensaje(error.message, 'error')));
  $('projectLibraryRefreshBtn')?.addEventListener('click', () => cargarBibliotecaProyecto().catch((error) => setMensaje(error.message, 'error')));
  $('projectLibraryViewMode')?.addEventListener('change', () => cargarBibliotecaProyecto().catch((error) => setMensaje(error.message, 'error')));
  $('projectLibraryCreatePlanBtn')?.addEventListener('click', irAPlan);
  root.addEventListener('click', async (evento) => {
    const accion = evento.target.closest('[data-project-library-action]')?.dataset.projectLibraryAction;
    if (!accion) return;
    try {
      if (accion === 'choose-file') { await elegirArchivo(); return; }
      if (accion === 'clear-form') { limpiarFormulario(); return; }
      if (accion === 'save') { setMensaje('Guardando y analizando recurso temporal...', 'normal'); await guardarRecurso('preguntar'); setMensaje('Recurso temporal guardado y analizado.', 'ok'); return; }
      if (accion === 'duplicate-replace') { setMensaje('Reemplazando recurso temporal...', 'normal'); await guardarRecurso('reemplazar'); setMensaje('Recurso temporal reemplazado.', 'ok'); return; }
      if (accion === 'duplicate-copy') { setMensaje('Guardando copia temporal...', 'normal'); await guardarRecurso('duplicar'); setMensaje('Copia temporal guardada.', 'ok'); }
    } catch (error) {
      setMensaje(error.message, 'error');
    }
  });
  cargarBibliotecaProyecto().catch((error) => setMensaje(error.message, 'warn'));
}

export function inicializarBibliotecaProyectoUI() {
  if (typeof document === 'undefined') return;
  inicializarPuenteEntendimiento();
  document.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'biblioteca-proyecto') setTimeout(enlazarEventos, 0);
  });
  enlazarEventos();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarBibliotecaProyectoUI);
}
