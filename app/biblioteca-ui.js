/*
  Bloque 16
  Funcion: pantalla viva para consultar y registrar recursos de la biblioteca local.
*/

const TIPOS = ['imagen', 'video', 'audio', 'fondo', 'overlay', 'transicion', 'plantilla'];

function obtenerDocumento() {
  return typeof document === 'undefined' ? null : document;
}

function escapar(texto = '') {
  return String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

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
  try {
    return JSON.parse(texto);
  } catch (_error) {
    return { ok: false, mensaje: texto };
  }
}

function normalizarRecursoBiblioteca(recurso = {}) {
  return {
    id: recurso.id || 'sin-id',
    nombre: recurso.nombre || recurso.titulo || 'Recurso sin nombre',
    tipo: recurso.tipo || 'imagen',
    categoria: recurso.categoria || 'general',
    perfil: recurso.perfil || 'general',
    tema: recurso.tema || '',
    ruta: recurso.ruta || '',
    url: recurso.url || '',
    licencia: recurso.licencia || 'pendiente_revision',
    estado: recurso.estado || 'pendiente',
    aprobado: recurso.aprobado === true,
    rechazado: recurso.rechazado === true,
    actualizadoEn: recurso.actualizadoEn || recurso.creadoEn || ''
  };
}

function renderRecursoCard(recursoEntrada = {}) {
  const recurso = normalizarRecursoBiblioteca(recursoEntrada);
  const ubicacion = recurso.ruta || recurso.url || 'sin ruta/url';
  const estado = recurso.aprobado ? 'aprobado' : recurso.rechazado ? 'rechazado' : recurso.estado;
  return `
    <article class="library-resource-card" data-resource-id="${escapar(recurso.id)}">
      <header>
        <strong>${escapar(recurso.nombre)}</strong>
        <span>${escapar(recurso.tipo)}</span>
      </header>
      <p>${escapar(recurso.tema || 'Sin tema definido')}</p>
      <dl>
        <div><dt>Categoria</dt><dd>${escapar(recurso.categoria)}</dd></div>
        <div><dt>Perfil</dt><dd>${escapar(recurso.perfil || 'general')}</dd></div>
        <div><dt>Licencia</dt><dd>${escapar(recurso.licencia)}</dd></div>
        <div><dt>Estado</dt><dd>${escapar(estado)}</dd></div>
      </dl>
      <footer title="${escapar(ubicacion)}">${escapar(ubicacion)}</footer>
    </article>
  `;
}

export function renderRecursosBiblioteca(recursos = []) {
  if (!recursos.length) return '<div class="library-empty">No hay recursos para mostrar con estos filtros.</div>';
  return recursos.map(renderRecursoCard).join('');
}

function obtenerFiltrosBiblioteca() {
  const doc = obtenerDocumento();
  if (!doc) return {};
  return {
    q: doc.getElementById('librarySearchInput')?.value?.trim() || '',
    tipo: doc.getElementById('libraryTypeFilter')?.value || '',
    categoria: doc.getElementById('libraryCategoryFilter')?.value || '',
    perfil: doc.getElementById('libraryProfileFilter')?.value || ''
  };
}

function crearQuery(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor) params.set(clave, valor);
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

async function cargarCategorias({ crearUrlApi }) {
  const respuesta = await fetch(await crearUrlApi('/api/autovideo/biblioteca/categorias'), { method: 'GET' });
  const datos = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudieron cargar categorias.');
  return datos.categorias || [];
}

async function cargarRecursos({ crearUrlApi, filtros = {} }) {
  const respuesta = await fetch(await crearUrlApi(`/api/autovideo/biblioteca${crearQuery(filtros)}`), { method: 'GET' });
  const datos = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo cargar biblioteca.');
  return datos.recursos || [];
}

function llenarCategorias(categorias = []) {
  const doc = obtenerDocumento();
  const select = doc?.getElementById('libraryCategoryFilter');
  const inputCategoria = doc?.getElementById('libraryNewCategory');
  if (select) {
    select.innerHTML = '<option value="">Todas</option>' + categorias.map((item) => `<option value="${escapar(item.id)}">${escapar(item.nombre)}</option>`).join('');
  }
  if (inputCategoria && !inputCategoria.value) inputCategoria.value = 'general';
}

export async function recargarBibliotecaUI({ crearUrlApi } = {}) {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilosBiblioteca();
  const lista = doc.getElementById('libraryResourcesList');
  const resumen = doc.getElementById('libraryResourcesSummary');
  const estado = doc.getElementById('libraryStatus');
  if (!lista) return false;

  try {
    if (estado) estado.textContent = 'Cargando biblioteca...';
    const [categorias, recursos] = await Promise.all([
      cargarCategorias({ crearUrlApi }),
      cargarRecursos({ crearUrlApi, filtros: obtenerFiltrosBiblioteca() })
    ]);
    llenarCategorias(categorias);
    lista.innerHTML = renderRecursosBiblioteca(recursos);
    if (resumen) resumen.textContent = `${recursos.length} recurso(s) encontrados · ${categorias.length} categoria(s).`;
    if (estado) estado.textContent = 'Biblioteca actualizada.';
    return true;
  } catch (error) {
    lista.innerHTML = `<div class="library-empty has-error">${escapar(error.message)}</div>`;
    if (resumen) resumen.textContent = 'No se pudo cargar biblioteca.';
    if (estado) estado.textContent = 'Error al cargar biblioteca.';
    return false;
  }
}

function leerFormularioNuevoRecurso() {
  const doc = obtenerDocumento();
  return {
    nombre: doc.getElementById('libraryNewName')?.value?.trim() || '',
    tipo: doc.getElementById('libraryNewType')?.value || 'imagen',
    categoria: doc.getElementById('libraryNewCategory')?.value?.trim() || 'general',
    perfil: doc.getElementById('libraryNewProfile')?.value?.trim() || '',
    tema: doc.getElementById('libraryNewTopic')?.value?.trim() || '',
    ruta: doc.getElementById('libraryNewPath')?.value?.trim() || '',
    url: doc.getElementById('libraryNewUrl')?.value?.trim() || '',
    licencia: doc.getElementById('libraryNewLicense')?.value?.trim() || 'pendiente_revision',
    fuente: 'biblioteca-ui'
  };
}

function limpiarFormularioNuevoRecurso() {
  const doc = obtenerDocumento();
  ['libraryNewName', 'libraryNewTopic', 'libraryNewPath', 'libraryNewUrl'].forEach((id) => {
    const control = doc?.getElementById(id);
    if (control) control.value = '';
  });
}

async function guardarRecurso({ crearUrlApi } = {}) {
  const datos = leerFormularioNuevoRecurso();
  if (!datos.nombre) throw new Error('Falta nombre del recurso.');
  if (!datos.ruta && !datos.url) throw new Error('Agrega ruta local o URL del recurso.');
  if (!TIPOS.includes(datos.tipo)) throw new Error('Tipo de recurso no valido.');

  const respuesta = await fetch(await crearUrlApi('/api/autovideo/biblioteca'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  const resultado = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !resultado.ok) throw new Error(resultado.mensaje || 'No se pudo guardar recurso.');
  limpiarFormularioNuevoRecurso();
  return resultado.recurso;
}

export function inicializarBibliotecaUI({ crearUrlApi } = {}) {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilosBiblioteca();

  doc.addEventListener('click', async (evento) => {
    const accion = evento.target.closest('[data-library-action]')?.dataset.libraryAction;
    if (!accion) return;
    const estado = doc.getElementById('libraryStatus');
    try {
      if (accion === 'reload') await recargarBibliotecaUI({ crearUrlApi });
      if (accion === 'save') {
        if (estado) estado.textContent = 'Guardando recurso...';
        await guardarRecurso({ crearUrlApi });
        if (estado) estado.textContent = 'Recurso guardado.';
        await recargarBibliotecaUI({ crearUrlApi });
      }
    } catch (error) {
      if (estado) estado.textContent = error.message;
    }
  });

  doc.addEventListener('change', (evento) => {
    if (evento.target.closest('[data-library-filter]')) recargarBibliotecaUI({ crearUrlApi });
  });

  doc.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' && evento.target.id === 'librarySearchInput') recargarBibliotecaUI({ crearUrlApi });
  });

  doc.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'biblioteca') recargarBibliotecaUI({ crearUrlApi });
  });

  return true;
}
