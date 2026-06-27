const TIPOS = ['imagen', 'video', 'audio', 'fondo', 'overlay', 'transicion', 'plantilla'];
const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';

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

function normalizarRecursoBiblioteca(recursoEntrada = {}) {
  return {
    id: recursoEntrada.id || 'sin-id',
    nombre: recursoEntrada.nombre || recursoEntrada.titulo || 'Recurso sin nombre',
    tipo: recursoEntrada.tipo || 'imagen',
    categoria: recursoEntrada.categoria || 'general',
    perfil: recursoEntrada.perfil || 'general',
    tipoEdicion: recursoEntrada.tipoEdicion || recursoEntrada.usoEdicion || 'apoyo_visual',
    tono: recursoEntrada.tono || 'neutral',
    momentoSugerido: recursoEntrada.momentoSugerido || '',
    tema: recursoEntrada.tema || '',
    ruta: recursoEntrada.ruta || '',
    url: recursoEntrada.url || '',
    licencia: recursoEntrada.licencia || 'pendiente_revision',
    estado: recursoEntrada.estado || 'pendiente',
    aprobado: recursoEntrada.aprobado === true,
    rechazado: recursoEntrada.rechazado === true,
    actualizadoEn: recursoEntrada.actualizadoEn || recursoEntrada.creadoEn || ''
  };
}

function renderRecursoCard(recursoEntrada = {}) {
  const recurso = normalizarRecursoBiblioteca(recursoEntrada);
  const ubicacion = recurso.ruta || recurso.url || 'sin ruta/url';
  const estado = recurso.aprobado ? 'aprobado' : recurso.rechazado ? 'rechazado' : recurso.estado;
  return `<article class="library-resource-card" data-resource-id="${escapar(recurso.id)}"><header><strong>${escapar(recurso.nombre)}</strong><span>${escapar(recurso.tipo)}</span></header><p>${escapar(recurso.tema || 'Sin tema definido')}</p><dl><div><dt>Categoría</dt><dd>${escapar(recurso.categoria)}</dd></div><div><dt>Perfil</dt><dd>${escapar(recurso.perfil || 'general')}</dd></div><div><dt>Edición</dt><dd>${escapar(recurso.tipoEdicion)}</dd></div><div><dt>Tono</dt><dd>${escapar(recurso.tono)}</dd></div><div><dt>Momento</dt><dd>${escapar(recurso.momentoSugerido || 'libre')}</dd></div><div><dt>Estado</dt><dd>${escapar(estado)}</dd></div></dl><footer title="${escapar(ubicacion)}">${escapar(ubicacion)}</footer></article>`;
}

export function renderRecursosBiblioteca(recursos = []) { if (!recursos.length) return '<div class="library-empty">No hay recursos para mostrar con estos filtros.</div>'; return recursos.map(renderRecursoCard).join(''); }

function obtenerFiltrosBiblioteca() {
  const doc = obtenerDocumento();
  if (!doc) return {};
  return { q: doc.getElementById('librarySearchInput')?.value?.trim() || '', tipo: doc.getElementById('libraryTypeFilter')?.value || '', categoria: doc.getElementById('libraryCategoryFilter')?.value || '', perfil: doc.getElementById('libraryProfileFilter')?.value || '' };
}

function crearQuery(filtros = {}) { const params = new URLSearchParams(); Object.entries(filtros).forEach(([clave, valor]) => { if (valor) params.set(clave, valor); }); const query = params.toString(); return query ? `?${query}` : ''; }
async function cargarCategorias({ crearUrlApi }) { const respuesta = await fetch(await crearUrlApi('/api/autovideo/biblioteca/categorias'), { method: 'GET' }); const datos = await leerJsonSeguro(respuesta); if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudieron cargar categorías.'); return datos.categorias || []; }
async function cargarRecursos({ crearUrlApi, filtros = {} }) { const respuesta = await fetch(await crearUrlApi(`/api/autovideo/biblioteca${crearQuery(filtros)}`), { method: 'GET' }); const datos = await leerJsonSeguro(respuesta); if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo cargar biblioteca.'); return datos.recursos || []; }

function llenarCategorias(categorias = []) {
  const doc = obtenerDocumento();
  const select = doc?.getElementById('libraryCategoryFilter');
  const inputCategoria = doc?.getElementById('libraryNewCategory');
  if (select) select.innerHTML = '<option value="">Todas</option>' + categorias.map((item) => `<option value="${escapar(item.id)}">${escapar(item.nombre)}</option>`).join('');
  if (inputCategoria && !inputCategoria.value) inputCategoria.value = 'general';
}

export async function recargarBibliotecaUI({ crearUrlApi } = {}) {
  const doc = obtenerDocumento(); if (!doc) return false; asegurarEstilosBiblioteca();
  const lista = doc.getElementById('libraryResourcesList'); const resumen = doc.getElementById('libraryResourcesSummary'); const estado = doc.getElementById('libraryStatus');
  if (!lista) return false;
  try {
    if (estado) estado.textContent = 'Cargando biblioteca...';
    const [categorias, recursos] = await Promise.all([cargarCategorias({ crearUrlApi }), cargarRecursos({ crearUrlApi, filtros: obtenerFiltrosBiblioteca() })]);
    llenarCategorias(categorias);
    lista.innerHTML = renderRecursosBiblioteca(recursos);
    if (resumen) resumen.textContent = `${recursos.length} recurso(s) encontrados · ${categorias.length} categoría(s).`;
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
  if (['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext)) return 'audio';
  return 'imagen';
}

function aplicarArchivoSeleccionado(archivo) {
  const doc = obtenerDocumento();
  if (!archivo || !doc) return;
  const ruta = archivo.path || archivo.name || '';
  const nombre = archivo.name || ruta.split(/[\\/]/).pop() || 'Recurso nuevo';
  doc.getElementById('libraryNewName').value = nombre.replace(/\.[a-z0-9]+$/i, '');
  doc.getElementById('libraryNewPath').value = ruta;
  doc.getElementById('libraryNewType').value = inferirTipoPorExtension(nombre);
  doc.getElementById('libraryStatus').textContent = 'Recurso cargado. Ahora define categoría, tipo de edición y tono antes de guardar.';
}

function leerFormularioNuevoRecurso() {
  const doc = obtenerDocumento();
  return {
    nombre: doc.getElementById('libraryNewName')?.value?.trim() || '',
    tipo: doc.getElementById('libraryNewType')?.value || 'imagen',
    categoria: doc.getElementById('libraryNewCategory')?.value?.trim() || 'general',
    tipoEdicion: doc.getElementById('libraryNewEditType')?.value || 'apoyo_visual',
    tono: doc.getElementById('libraryNewTone')?.value || 'neutral',
    perfil: doc.getElementById('libraryNewProfile')?.value?.trim() || '',
    tema: doc.getElementById('libraryNewTopic')?.value?.trim() || '',
    momentoSugerido: doc.getElementById('libraryNewMoment')?.value?.trim() || '',
    ruta: doc.getElementById('libraryNewPath')?.value?.trim() || '',
    url: doc.getElementById('libraryNewUrl')?.value?.trim() || '',
    licencia: doc.getElementById('libraryNewLicense')?.value?.trim() || 'pendiente_revision',
    fuente: 'biblioteca-ui-arrastre'
  };
}

function limpiarFormularioNuevoRecurso() { const doc = obtenerDocumento(); ['libraryNewName', 'libraryNewTopic', 'libraryNewMoment', 'libraryNewPath', 'libraryNewUrl'].forEach((id) => { const control = doc?.getElementById(id); if (control) control.value = ''; }); }
async function guardarRecurso({ crearUrlApi } = {}) {
  const datos = leerFormularioNuevoRecurso();
  if (!datos.nombre) throw new Error('Falta nombre del recurso.');
  if (!datos.ruta && !datos.url) throw new Error('Agrega ruta local o URL del recurso.');
  if (!TIPOS.includes(datos.tipo)) throw new Error('Tipo de recurso no válido.');
  const respuesta = await fetch(await crearUrlApi('/api/autovideo/biblioteca'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
  const resultado = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !resultado.ok) throw new Error(resultado.mensaje || 'No se pudo guardar recurso.');
  limpiarFormularioNuevoRecurso();
  return resultado.recurso;
}

function obtenerProyectoIdBiblioteca() {
  const doc = obtenerDocumento();
  const input = doc?.getElementById('libraryProjectIdInput');
  const desdeInput = input?.value?.trim() || '';
  if (desdeInput) return desdeInput;
  return localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
}

function sincronizarProyectoIdBiblioteca() {
  const doc = obtenerDocumento();
  const input = doc?.getElementById('libraryProjectIdInput');
  if (input && !input.value) input.value = localStorage.getItem(STORAGE_PROYECTO_ETAPAS) || '';
}

function actualizarKpisRecomendacion(resumen = {}) {
  const doc = obtenerDocumento();
  const set = (id, valor) => { const nodo = doc?.getElementById(id); if (nodo) nodo.textContent = String(valor ?? '—'); };
  set('libraryRecommendNeeds', resumen.necesidadesAnalizadas);
  set('libraryRecommendAnalyzed', resumen.recursosDisponibles);
  set('libraryRecommendSuggestions', resumen.sugerenciasGeneradas);
  set('libraryRecommendMissing', resumen.necesidadesSinRecurso);
}

function renderRecomendacionItem(item = {}) {
  const recursos = Array.isArray(item.recursos) ? item.recursos : [];
  return `<article class="library-recommend-card is-${escapar(item.estado || 'pendiente')}">
    <header><div><strong>${escapar(item.necesidad?.nombre || 'Necesidad')}</strong><small>${escapar(item.necesidad?.tipo || 'recurso')} · ${escapar(item.necesidad?.fuente || 'plan')}</small></div><span>${recursos.length} sugerencia(s)</span></header>
    <p>${escapar(item.necesidad?.descripcion || 'Sin descripción.')}</p>
    <div class="library-recommend-resources">${recursos.length ? recursos.map((sugerencia) => {
      const recurso = sugerencia.recurso || {};
      const riesgos = (sugerencia.riesgos || []).join(' · ');
      return `<section><div><strong>${escapar(recurso.nombre || 'Recurso')}</strong><span>${escapar(recurso.tipo || 'tipo')} · ${escapar(recurso.categoria || 'general')} · ${escapar(sugerencia.puntaje)} pts</span></div><small>${escapar((sugerencia.razones || []).slice(0, 3).join(' · ') || 'Sin razones')}</small>${riesgos ? `<em>${escapar(riesgos)}</em>` : ''}</section>`;
    }).join('') : '<div class="library-empty">Sin recurso sugerido. Agrega recursos compatibles a la biblioteca.</div>'}</div>
  </article>`;
}

function renderRecomendaciones(resultado = {}) {
  const doc = obtenerDocumento();
  const lista = doc?.getElementById('libraryRecommendList');
  if (!lista) return;
  const recomendaciones = Array.isArray(resultado.recomendaciones) ? resultado.recomendaciones : [];
  actualizarKpisRecomendacion(resultado.resumen || {});
  lista.innerHTML = recomendaciones.length ? recomendaciones.map(renderRecomendacionItem).join('') : '<div class="library-empty">No se generaron recomendaciones con este proyecto.</div>';
}

async function recomendarRecursosProyecto({ crearUrlApi } = {}) {
  const doc = obtenerDocumento();
  const estado = doc?.getElementById('libraryStatus');
  const proyectoId = obtenerProyectoIdBiblioteca();
  if (!proyectoId) throw new Error('Falta proyectoId para recomendar recursos.');
  localStorage.setItem(STORAGE_PROYECTO_ETAPAS, proyectoId);
  const consulta = doc?.getElementById('libraryRecommendQuery')?.value?.trim() || '';
  const limitePorNecesidad = Number(doc?.getElementById('libraryRecommendLimit')?.value || 4);
  if (estado) estado.textContent = 'Recomendando recursos para producción...';
  const respuesta = await fetch(await crearUrlApi(`/api/proyectos/${encodeURIComponent(proyectoId)}/biblioteca/recomendar`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filtros: { consulta }, limitePorNecesidad })
  });
  const datos = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudieron recomendar recursos.');
  renderRecomendaciones(datos.recomendaciones || {});
  if (estado) estado.textContent = 'Recomendaciones de producción generadas.';
  return datos.recomendaciones;
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
    const accion = evento.target.closest('[data-library-action]')?.dataset.libraryAction;
    if (!accion) return;
    const estado = doc.getElementById('libraryStatus');
    try {
      if (accion === 'choose-file') { doc.getElementById('libraryFileInput')?.click(); return; }
      if (accion === 'reload') await recargarBibliotecaUI({ crearUrlApi });
      if (accion === 'recommend-project') await recomendarRecursosProyecto({ crearUrlApi });
      if (accion === 'save') { if (estado) estado.textContent = 'Guardando recurso...'; await guardarRecurso({ crearUrlApi }); if (estado) estado.textContent = 'Recurso guardado.'; await recargarBibliotecaUI({ crearUrlApi }); }
    } catch (error) { if (estado) estado.textContent = error.message; }
  });
  doc.addEventListener('change', (evento) => { if (evento.target.closest('[data-library-filter]')) recargarBibliotecaUI({ crearUrlApi }); });
  doc.addEventListener('keydown', (evento) => { if (evento.key === 'Enter' && evento.target.id === 'librarySearchInput') recargarBibliotecaUI({ crearUrlApi }); if (evento.key === 'Enter' && evento.target.id === 'libraryRecommendQuery') recomendarRecursosProyecto({ crearUrlApi }).catch((error) => { const estado = doc.getElementById('libraryStatus'); if (estado) estado.textContent = error.message; }); });
  doc.addEventListener('autovideo:navegacion', (evento) => { if (evento.detail?.pantallaId === 'biblioteca') { sincronizarProyectoIdBiblioteca(); inicializarDropZone(); recargarBibliotecaUI({ crearUrlApi }); } });
  sincronizarProyectoIdBiblioteca();
  inicializarDropZone();
  return true;
}
