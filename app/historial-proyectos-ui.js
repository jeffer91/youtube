/*
  Bloque 13
  Funcion: cargar y mostrar proyectos recientes desde el servidor local.
*/

function obtenerDocumento() {
  return typeof document === 'undefined' ? null : document;
}

function asegurarEstilosHistorial() {
  const doc = obtenerDocumento();
  if (!doc || doc.getElementById('historyProjectsStyles')) return;
  const link = doc.createElement('link');
  link.id = 'historyProjectsStyles';
  link.rel = 'stylesheet';
  link.href = './historial-proyectos.css';
  doc.head.appendChild(link);
}

function escapar(texto = '') {
  return String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
}

export function normalizarProyectoHistorial(proyecto = {}) {
  return {
    id: proyecto.id || proyecto.proyectoId || 'sin-id',
    nombre: proyecto.nombre || proyecto.titulo || proyecto.id || 'Proyecto sin nombre',
    perfil: proyecto.perfil || proyecto.configuracion?.perfil || 'general',
    estado: proyecto.estado || 'activo',
    plataformas: Array.isArray(proyecto.plataformas) ? proyecto.plataformas : [],
    actualizadoEn: proyecto.actualizadoEn || proyecto.creadoEn || proyecto.fecha || '',
    error: proyecto.error || ''
  };
}

export function renderProyectoHistorialCard(proyectoEntrada = {}) {
  const proyecto = normalizarProyectoHistorial(proyectoEntrada);
  const plataformas = proyecto.plataformas.length ? proyecto.plataformas.join(', ') : 'sin plataformas registradas';
  const estado = proyecto.error ? 'error' : proyecto.estado;
  return `
    <article class="history-project-card ${proyecto.error ? 'has-error' : ''}" data-project-id="${escapar(proyecto.id)}">
      <div>
        <strong>${escapar(proyecto.nombre)}</strong>
        <span>${escapar(proyecto.id)}</span>
      </div>
      <p>Perfil: ${escapar(proyecto.perfil)} · Plataformas: ${escapar(plataformas)}</p>
      <footer><small>Estado: ${escapar(estado)} · ${escapar(formatearFecha(proyecto.actualizadoEn))}</small></footer>
      ${proyecto.error ? `<p class="history-error">${escapar(proyecto.error)}</p>` : ''}
    </article>
  `;
}

export function renderHistorialProyectos(proyectos = []) {
  if (!proyectos.length) {
    return '<div class="history-empty">Todavia no hay proyectos guardados en el historial local.</div>';
  }
  return proyectos.map(renderProyectoHistorialCard).join('');
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

async function cargarProyectos({ crearUrlApi } = {}) {
  if (typeof crearUrlApi !== 'function') throw new Error('No se configuro crearUrlApi para historial.');
  const respuesta = await fetch(await crearUrlApi('/api/autovideo/proyectos'), { method: 'GET' });
  const datos = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo cargar historial de proyectos.');
  return Array.isArray(datos.proyectos) ? datos.proyectos : [];
}

export async function recargarHistorialProyectosUI({ crearUrlApi } = {}) {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilosHistorial();
  const lista = doc.getElementById('historyProjectsList');
  const resumen = doc.getElementById('historyProjectsSummary');
  const estado = doc.getElementById('historyProjectsStatus');
  if (!lista) return false;

  try {
    if (estado) estado.textContent = 'Cargando historial...';
    const proyectos = await cargarProyectos({ crearUrlApi });
    lista.innerHTML = renderHistorialProyectos(proyectos);
    if (resumen) resumen.textContent = `${proyectos.length} proyecto(s) en historial local.`;
    if (estado) estado.textContent = proyectos.length ? 'Historial actualizado.' : 'Sin proyectos guardados.';
    return true;
  } catch (error) {
    lista.innerHTML = `<div class="history-empty has-error">${escapar(error.message)}</div>`;
    if (resumen) resumen.textContent = 'No se pudo leer el historial.';
    if (estado) estado.textContent = 'Error al cargar historial.';
    return false;
  }
}

export function inicializarHistorialProyectosUI({ crearUrlApi } = {}) {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilosHistorial();

  doc.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-history-action="reload"]');
    if (!boton) return;
    recargarHistorialProyectosUI({ crearUrlApi });
  });

  doc.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'historial') {
      recargarHistorialProyectosUI({ crearUrlApi });
    }
  });

  return true;
}
