const TIPOS = ['video', 'imagen', 'audio'];
const FORMATOS = ['horizontal-16-9', 'vertical-9-16', 'cuadrado-1-1', 'audio', 'imagen', 'desconocido'];

let ultimoRecursoPendiente = null;

function obtenerDocumento() { return typeof document === 'undefined' ? null : document; }
function escapar(texto = '') { return String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function asegurarEstilosBiblioteca() {
  const doc = obtenerDocumento();
  if (!doc || doc.getElementById('libraryUiStyles')) return;
  const link = doc.createElement('link');
  link.id = 'libraryUiStyles';
  link.rel = 'stylesheet';
  link.href = './biblioteca-ui.css';
  doc.head.appendChild(link);
}

async function leerJsonSeguro(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return {};
  try { return JSON.parse(texto); } catch (_error) { return { ok: false, mensaje: texto }; }
}

function normalizarLista(valor = []) {
  if (Array.isArray(valor)) return valor.map((item) => String(item).trim()).filter(Boolean);
  if (typeof valor === 'string' && valor.trim()) return valor.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function formatearPeso(bytes = 0) {
  const numero = Number(bytes || 0);
  if (!Number.isFinite(numero) || numero <= 0) return 'Peso no detectado';
  if (numero < 1024 * 1024) return `${(numero / 1024).toFixed(1)} KB`;
  return `${(numero / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizarRecursoBiblioteca(recursoEntrada = {}) {
  const estilos = recursoEntrada.estilos || recursoEntrada.perfiles || (recursoEntrada.perfil ? [recursoEntrada.perfil] : ['general']);
  return {
    id: recursoEntrada.id || 'sin-id',
    nombre: recursoEntrada.nombre || recursoEntrada.titulo || 'Recurso sin nombre',
    tipo: recursoEntrada.tipo || 'video',
    categoria: recursoEntrada.categoria || 'otro',
    categoriaNombre: recursoEntrada.categoriaNombre || recursoEntrada.categoria || 'Otro',
    estilos,
    perfil: recursoEntrada.perfil || estilos[0] || 'general',
    formato: recursoEntrada.formato || recursoEntrada.tamanoFormato || recursoEntrada.tamañoFormato || 'desconocido',
    etiquetas: Array.isArray(recursoEntrada.etiquetas) ? recursoEntrada.etiquetas : [],
    ruta: recursoEntrada.ruta || recursoEntrada.archivo?.rutaAbsoluta || '',
    rutaRelativa: recursoEntrada.rutaRelativa || recursoEntrada.archivo?.rutaRelativa || '',
    url: recursoEntrada.url || '',
    licencia: recursoEntrada.licencia || 'propio',
    estadoTecnico: recursoEntrada.estadoTecnico || recursoEntrada.estado || 'pendiente',
    pesoBytes: recursoEntrada.archivo?.pesoBytes || 0,
    actualizadoEn: recursoEntrada.actualizadoEn || recursoEntrada.creadoEn || ''
  };
}

function renderRecursoCard(recursoEntrada = {}) {
  const recurso = normalizarRecursoBiblioteca(recursoEntrada);
  const ubicacion = recurso.rutaRelativa || recurso.ruta || recurso.url || 'sin ruta/url';
  return `<article class="library-resource-card" data-resource-id="${escapar(recurso.id)}">
    <header><strong>${escapar(recurso.nombre)}</strong><span>${escapar(recurso.tipo)}</span></header>
    <p>${escapar(recurso.categoriaNombre)} · ${escapar(recurso.formato)}</p>
    <dl>
      <div><dt>Estilo</dt><dd>${escapar(recurso.estilos.join(', '))}</dd></div>
      <div><dt>Categoría</dt><dd>${escapar(recurso.categoria)}</dd></div>
      <div><dt>Estado</dt><dd>${escapar(recurso.estadoTecnico)}</dd></div>
      <div><dt>Etiquetas</dt><dd>${escapar(recurso.etiquetas.slice(0, 3).join(', ') || 'sin etiquetas')}</dd></div>
    </dl>
    <footer title="${escapar(ubicacion)}">${escapar(ubicacion)}</footer>
  </article>`;
}

function renderRecursosTabla(recursos = []) {
  if (!recursos.length) return '<div class="library-empty">No hay recursos para mostrar con estos filtros.</div>';
  return `<div class="library-table-wrap"><table class="library-table"><thead><tr><th>Nombre</th><th>Tipo</th><th>Estilo</th><th>Categoría</th><th>Formato</th><th>Estado</th></tr></thead><tbody>${recursos.map((item) => {
    const recurso = normalizarRecursoBiblioteca(item);
    return `<tr><td>${escapar(recurso.nombre)}</td><td>${escapar(recurso.tipo)}</td><td>${escapar(recurso.estilos.join(', '))}</td><td>${escapar(recurso.categoria)}</td><td>${escapar(recurso.formato)}</td><td>${escapar(recurso.estadoTecnico)}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

export function renderRecursosBiblioteca(recursos = [], modo = 'cards') {
  if (!recursos.length) return '<div class="library-empty">No hay recursos para mostrar con estos filtros.</div>';
  if (modo === 'table') return renderRecursosTabla(recursos);
  return recursos.map(renderRecursoCard).join('');
}

function obtenerFiltrosBiblioteca() {
  const doc = obtenerDocumento();
  if (!doc) return {};
  return {
    q: doc.getElementById('librarySearchInput')?.value?.trim() || '',
    tipo: doc.getElementById('libraryTypeFilter')?.value || '',
    categoria: doc.getElementById('libraryCategoryFilter')?.value || '',
    estilo: doc.getElementById('libraryProfileFilter')?.value || ''
  };
}

function crearQuery(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => { if (valor) params.set(clave, valor); });
  const query = params.toString();
  return query ? `?${query}` : '';
}

async function cargarCategorias({ crearUrlApi }) {
  const respuesta = await fetch(await crearUrlApi('/api/autovideo/biblioteca/categorias'), { method: 'GET' });
  const datos = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudieron cargar categorías.');
  return datos.categorias || [];
}

async function cargarEstilos({ crearUrlApi }) {
  const respuesta = await fetch(await crearUrlApi('/api/autovideo/biblioteca/estilos'), { method: 'GET' });
  const datos = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudieron cargar estilos.');
  return datos.estilos || [];
}

async function cargarRecursos({ crearUrlApi, filtros = {} }) {
  const respuesta = await fetch(await crearUrlApi(`/api/autovideo/biblioteca${crearQuery(filtros)}`), { method: 'GET' });
  const datos = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo cargar biblioteca.');
  return datos.recursos || [];
}

function llenarCategorias(categorias = []) {
  const doc = obtenerDocumento();
  const selects = [doc?.getElementById('libraryCategoryFilter'), doc?.getElementById('libraryNewCategory')].filter(Boolean);
  selects.forEach((select) => {
    const esFiltro = select.id === 'libraryCategoryFilter';
    select.innerHTML = `${esFiltro ? '<option value="">Todas las categorías</option>' : ''}${categorias.map((item) => `<option value="${escapar(item.id)}">${escapar(item.nombre)}</option>`).join('')}`;
  });
  const nuevo = doc?.getElementById('libraryNewCategory');
  if (nuevo && !nuevo.value) nuevo.value = 'intro';
}

function llenarEstilos(estilos = []) {
  const doc = obtenerDocumento();
  const filtro = doc?.getElementById('libraryProfileFilter');
  const nuevo = doc?.getElementById('libraryNewStyles');
  if (filtro) filtro.innerHTML = '<option value="">Todos los estilos</option>' + estilos.map((item) => `<option value="${escapar(item.id)}">${escapar(item.nombre)}</option>`).join('');
  if (nuevo) {
    nuevo.innerHTML = estilos.map((item) => `<option value="${escapar(item.id)}">${escapar(item.nombre)}</option>`).join('');
    [...nuevo.options].forEach((option) => { option.selected = option.value === '11-contra-11'; });
  }
}

async function cargarOpcionesBase({ crearUrlApi }) {
  const [categorias, estilos] = await Promise.all([cargarCategorias({ crearUrlApi }), cargarEstilos({ crearUrlApi })]);
  llenarCategorias(categorias);
  llenarEstilos(estilos);
  return { categorias, estilos };
}

export async function recargarBibliotecaUI({ crearUrlApi } = {}) {
  const doc = obtenerDocumento(); if (!doc) return false; asegurarEstilosBiblioteca();
  const lista = doc.getElementById('libraryResourcesList'); const resumen = doc.getElementById('libraryResourcesSummary'); const estado = doc.getElementById('libraryStatus');
  if (!lista) return false;
  try {
    if (estado) estado.textContent = 'Cargando biblioteca...';
    const recursos = await cargarRecursos({ crearUrlApi, filtros: obtenerFiltrosBiblioteca() });
    const modo = doc.getElementById('libraryViewMode')?.value || 'cards';
    lista.className = modo === 'table' ? 'library-resources-list is-table' : 'library-resources-list';
    lista.innerHTML = renderRecursosBiblioteca(recursos, modo);
    if (resumen) resumen.textContent = `${recursos.length} recurso(s) encontrados.`;
    if (estado) estado.textContent = 'Biblioteca actualizada.';
    return true;
  } catch (error) {
    lista.innerHTML = `<div class="library-empty has-error">${escapar(error.message)}</div>`;
    if (resumen) resumen.textContent = 'No se pudo cargar biblioteca.';
    if (estado) estado.textContent = 'Error al cargar biblioteca.';
    return false;
  }
}

function inferirTipoPorExtension(nombre = '') {
  const ext = String(nombre).toLowerCase().split('.').pop();
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'imagen';
  if (['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(ext)) return 'audio';
  return 'video';
}

function inferirFormatoBasico(tipo) {
  if (tipo === 'audio') return 'audio';
  if (tipo === 'imagen') return 'imagen';
  return 'desconocido';
}

function aplicarArchivoSeleccionado(archivo) {
  const doc = obtenerDocumento();
  if (!archivo || !doc) return;
  const ruta = archivo.path || archivo.ruta || '';
  const nombre = archivo.name || archivo.nombreOriginal || ruta.split(/[\\/]/).pop() || 'Recurso nuevo';
  const tipo = inferirTipoPorExtension(nombre);
  doc.getElementById('libraryNewName').value = nombre.replace(/\.[a-z0-9]+$/i, '');
  doc.getElementById('libraryNewPath').value = ruta;
  doc.getElementById('libraryNewOriginalName').value = nombre;
  doc.getElementById('libraryNewMime').value = archivo.type || archivo.mime || '';
  doc.getElementById('libraryNewSize').value = archivo.size || 0;
  doc.getElementById('libraryNewType').value = tipo;
  doc.getElementById('libraryNewFormat').value = inferirFormatoBasico(tipo);
  doc.getElementById('librarySelectedFileName').textContent = nombre;
  doc.getElementById('librarySelectedFileMeta').textContent = `${tipo} · ${formatearPeso(archivo.size || 0)}${ruta ? ` · ${ruta}` : ' · ruta no disponible'}`;
  doc.getElementById('libraryStatus').textContent = ruta ? 'Archivo cargado. Completa la clasificación y guarda.' : 'Archivo seleccionado, pero no se pudo leer la ruta local. Usa el selector de escritorio.';
}

async function elegirArchivoBiblioteca() {
  const apiElectron = window.AutoVideoJeff?.biblioteca?.seleccionarArchivo;
  if (typeof apiElectron === 'function') {
    const resultado = await apiElectron();
    if (resultado?.ok && resultado.archivo) aplicarArchivoSeleccionado(resultado.archivo);
    return;
  }
  obtenerDocumento()?.getElementById('libraryFileInput')?.click();
}

function obtenerEstilosSeleccionados() {
  const select = obtenerDocumento()?.getElementById('libraryNewStyles');
  const estilos = select ? [...select.selectedOptions].map((option) => option.value).filter(Boolean) : [];
  return estilos.length ? estilos : ['general'];
}

function leerFormularioNuevoRecurso(accionDuplicado = 'preguntar') {
  const doc = obtenerDocumento();
  const categoriaBase = doc.getElementById('libraryNewCategory')?.value || 'otro';
  const categoriaPersonalizada = doc.getElementById('libraryNewCustomCategory')?.value?.trim() || '';
  const etiquetas = normalizarLista(doc.getElementById('libraryNewTags')?.value || '');
  return {
    nombre: doc.getElementById('libraryNewName')?.value?.trim() || '',
    tipo: doc.getElementById('libraryNewType')?.value || 'video',
    categoria: categoriaBase,
    categoriaEditable: categoriaPersonalizada || null,
    estilos: obtenerEstilosSeleccionados(),
    formato: doc.getElementById('libraryNewFormat')?.value || 'desconocido',
    formatoManual: true,
    etiquetas,
    rutaOrigen: doc.getElementById('libraryNewPath')?.value?.trim() || '',
    ruta: doc.getElementById('libraryNewPath')?.value?.trim() || '',
    nombreOriginal: doc.getElementById('libraryNewOriginalName')?.value || '',
    mime: doc.getElementById('libraryNewMime')?.value || '',
    pesoBytes: Number(doc.getElementById('libraryNewSize')?.value || 0) || 0,
    licencia: 'propio',
    fuente: 'biblioteca-general-ui',
    accionDuplicado
  };
}

function limpiarFormularioNuevoRecurso() {
  const doc = obtenerDocumento();
  ['libraryNewName', 'libraryNewCustomCategory', 'libraryNewTags', 'libraryNewPath', 'libraryNewOriginalName', 'libraryNewMime', 'libraryNewSize'].forEach((id) => {
    const control = doc?.getElementById(id);
    if (control) control.value = '';
  });
  const fileName = doc?.getElementById('librarySelectedFileName');
  const fileMeta = doc?.getElementById('librarySelectedFileMeta');
  if (fileName) fileName.textContent = 'Ningún archivo seleccionado.';
  if (fileMeta) fileMeta.textContent = 'Selecciona un archivo para clasificarlo.';
  const dup = doc?.getElementById('libraryDuplicateBox');
  if (dup) dup.hidden = true;
  ultimoRecursoPendiente = null;
}

function mostrarDuplicado(resultado = {}) {
  const doc = obtenerDocumento();
  const box = doc?.getElementById('libraryDuplicateBox');
  const texto = doc?.getElementById('libraryDuplicateText');
  if (!box) return;
  const duplicado = resultado.duplicado || resultado.recurso?.duplicado || null;
  if (texto) texto.textContent = duplicado?.nombre ? `Parece repetido con: ${duplicado.nombre}` : 'Decide si quieres reemplazarlo o guardarlo como copia.';
  box.hidden = false;
}

async function guardarRecurso({ crearUrlApi, accionDuplicado = 'preguntar' } = {}) {
  const datos = leerFormularioNuevoRecurso(accionDuplicado);
  if (!datos.nombre) throw new Error('Falta nombre del recurso.');
  if (!datos.rutaOrigen && !datos.ruta) throw new Error('Primero selecciona un archivo local.');
  if (!TIPOS.includes(datos.tipo)) throw new Error('Tipo de recurso no válido.');
  if (!FORMATOS.includes(datos.formato)) datos.formato = 'desconocido';

  ultimoRecursoPendiente = datos;
  const respuesta = await fetch(await crearUrlApi('/api/autovideo/biblioteca'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
  const resultado = await leerJsonSeguro(respuesta);
  if (resultado?.requiereDecisionDuplicado || resultado?.recurso?.requiereDecisionDuplicado) {
    mostrarDuplicado(resultado.recurso || resultado);
    throw new Error('Recurso repetido. Elige reemplazar o duplicar.');
  }
  if (!respuesta.ok || resultado.ok === false) throw new Error(resultado.mensaje || 'No se pudo guardar recurso.');
  limpiarFormularioNuevoRecurso();
  return resultado.recurso;
}

function cambiarTab(tabId) {
  const doc = obtenerDocumento();
  if (!doc) return;
  doc.querySelectorAll('[data-library-tab]').forEach((boton) => boton.classList.toggle('is-active', boton.dataset.libraryTab === tabId));
  doc.querySelectorAll('[data-library-panel]').forEach((panel) => {
    const activo = panel.dataset.libraryPanel === tabId;
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
  });
}

function inicializarDropZone() {
  const doc = obtenerDocumento(); const zona = doc?.getElementById('libraryDropZone'); const input = doc?.getElementById('libraryFileInput');
  if (!zona || !input || zona.dataset.inicializado === 'true') return;
  zona.dataset.inicializado = 'true';
  zona.addEventListener('dragover', (evento) => { evento.preventDefault(); zona.classList.add('is-dragover'); });
  zona.addEventListener('dragleave', () => zona.classList.remove('is-dragover'));
  zona.addEventListener('drop', (evento) => { evento.preventDefault(); zona.classList.remove('is-dragover'); aplicarArchivoSeleccionado(evento.dataTransfer?.files?.[0]); });
  input.addEventListener('change', () => aplicarArchivoSeleccionado(input.files?.[0]));
}

export function inicializarBibliotecaUI({ crearUrlApi } = {}) {
  const doc = obtenerDocumento(); if (!doc) return false; asegurarEstilosBiblioteca();
  doc.addEventListener('click', async (evento) => {
    const tab = evento.target.closest('[data-library-tab]')?.dataset.libraryTab;
    if (tab) { cambiarTab(tab); if (tab === 'recursos') await recargarBibliotecaUI({ crearUrlApi }); return; }

    const accion = evento.target.closest('[data-library-action]')?.dataset.libraryAction;
    if (!accion) return;
    const estado = doc.getElementById('libraryStatus');
    try {
      if (accion === 'choose-file') { await elegirArchivoBiblioteca(); return; }
      if (accion === 'clear-form') { limpiarFormularioNuevoRecurso(); if (estado) estado.textContent = 'Formulario limpio.'; return; }
      if (accion === 'reload') { await recargarBibliotecaUI({ crearUrlApi }); return; }
      if (accion === 'duplicate-replace') { if (estado) estado.textContent = 'Reemplazando recurso...'; await guardarRecurso({ crearUrlApi, accionDuplicado: 'reemplazar' }); if (estado) estado.textContent = 'Recurso reemplazado.'; await recargarBibliotecaUI({ crearUrlApi }); return; }
      if (accion === 'duplicate-copy') { if (estado) estado.textContent = 'Guardando copia...'; await guardarRecurso({ crearUrlApi, accionDuplicado: 'duplicar' }); if (estado) estado.textContent = 'Copia guardada.'; await recargarBibliotecaUI({ crearUrlApi }); return; }
      if (accion === 'save') { if (estado) estado.textContent = 'Guardando recurso...'; await guardarRecurso({ crearUrlApi }); if (estado) estado.textContent = 'Recurso guardado en biblioteca general.'; await recargarBibliotecaUI({ crearUrlApi }); }
    } catch (error) { if (estado) estado.textContent = error.message; }
  });
  doc.addEventListener('change', (evento) => { if (evento.target.closest('[data-library-filter]')) recargarBibliotecaUI({ crearUrlApi }); });
  doc.addEventListener('keydown', (evento) => { if (evento.key === 'Enter' && evento.target.id === 'librarySearchInput') recargarBibliotecaUI({ crearUrlApi }); });
  doc.addEventListener('autovideo:navegacion', async (evento) => {
    if (evento.detail?.pantallaId === 'biblioteca') {
      inicializarDropZone();
      await cargarOpcionesBase({ crearUrlApi }).catch((error) => { const estado = doc.getElementById('libraryStatus'); if (estado) estado.textContent = error.message; });
      recargarBibliotecaUI({ crearUrlApi });
    }
  });
  inicializarDropZone();
  cargarOpcionesBase({ crearUrlApi }).catch(() => {});
  return true;
}
