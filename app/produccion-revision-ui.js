/*
  Bloque 14
  Funcion: mostrar el plan de Produccion para revision desde la interfaz.
*/

const CLAVE_ULTIMA_PRODUCCION = 'autovideojeff:ultima-produccion';

function obtenerDocumento() {
  return typeof document === 'undefined' ? null : document;
}

function escapar(texto = '') {
  return String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function asegurarEstilosProduccion() {
  const doc = obtenerDocumento();
  if (!doc || doc.getElementById('productionReviewStyles')) return;
  const link = doc.createElement('link');
  link.id = 'productionReviewStyles';
  link.rel = 'stylesheet';
  link.href = './produccion-revision.css';
  doc.head.appendChild(link);
}

export function guardarUltimaProduccion(datos = {}) {
  try {
    const produccion = datos.produccion || datos.modular?.produccion || null;
    if (!produccion) return false;
    const payload = {
      produccion,
      proyecto: datos.proyecto || datos.modular?.proyecto || null,
      resultadoPlataformas: datos.resultadoPlataformas || datos.modular?.resultadoPlataformas || null,
      guardadoEn: new Date().toISOString()
    };
    window.localStorage.setItem(CLAVE_ULTIMA_PRODUCCION, JSON.stringify(payload));
    return true;
  } catch (_error) {
    return false;
  }
}

export function cargarUltimaProduccion() {
  try {
    const texto = window.localStorage.getItem(CLAVE_ULTIMA_PRODUCCION);
    return texto ? JSON.parse(texto) : null;
  } catch (_error) {
    return null;
  }
}

function crearResumenProduccion(plan = {}) {
  const elementos = Array.isArray(plan.elementos) ? plan.elementos : [];
  return {
    total: elementos.length,
    aprobados: elementos.filter((item) => item.aprobado).length,
    rechazados: elementos.filter((item) => item.rechazado).length,
    pendientes: elementos.filter((item) => !item.aprobado && !item.rechazado).length
  };
}

function renderElementoProduccion(elemento = {}) {
  const estado = elemento.aprobado ? 'aprobado' : elemento.rechazado ? 'rechazado' : 'pendiente';
  const tiempo = elemento.inicio !== null && elemento.inicio !== undefined ? ` · ${elemento.inicio}s${elemento.fin ? `-${elemento.fin}s` : ''}` : '';
  return `
    <article class="production-item-card is-${estado}">
      <header>
        <strong>${escapar(elemento.nombre || elemento.tipo || 'Elemento')}</strong>
        <span>${escapar(estado)}</span>
      </header>
      <p>${escapar(elemento.descripcion || elemento.datos?.texto || elemento.recurso?.nombre || 'Elemento generado automaticamente.')}</p>
      <footer><small>${escapar(elemento.tipo || 'recurso')}${escapar(tiempo)}</small></footer>
    </article>
  `;
}

export function renderProduccionRevision(plan = {}) {
  const elementos = Array.isArray(plan.elementos) ? plan.elementos : [];
  if (!elementos.length) {
    return '<div class="production-empty">No hay elementos de Produccion para revisar todavia.</div>';
  }
  return elementos.map(renderElementoProduccion).join('');
}

function pintarPlan(plan = {}, origen = 'local') {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilosProduccion();
  const lista = doc.getElementById('productionReviewList');
  const resumen = doc.getElementById('productionReviewSummary');
  const estado = doc.getElementById('productionReviewStatus');
  if (!lista) return false;

  const datos = crearResumenProduccion(plan);
  lista.innerHTML = renderProduccionRevision(plan);
  if (resumen) resumen.textContent = `${datos.total} elemento(s) · ${datos.pendientes} pendiente(s) · ${datos.aprobados} aprobado(s) · ${datos.rechazados} rechazado(s).`;
  if (estado) estado.textContent = `Plan cargado desde ${origen}.`;
  return true;
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

async function cargarProduccionServidor({ crearUrlApi, proyectoId } = {}) {
  if (typeof crearUrlApi !== 'function') throw new Error('No se configuro crearUrlApi para Produccion.');
  if (!proyectoId) throw new Error('Falta id del proyecto.');
  const respuesta = await fetch(await crearUrlApi(`/api/autovideo/proyectos/${encodeURIComponent(proyectoId)}/produccion`), { method: 'GET' });
  const datos = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo cargar plan de Produccion.');
  return datos.plan;
}

export async function recargarProduccionRevisionUI({ crearUrlApi } = {}) {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilosProduccion();
  const input = doc.getElementById('productionProjectIdInput');
  const estado = doc.getElementById('productionReviewStatus');
  const proyectoId = input?.value?.trim() || '';

  try {
    if (estado) estado.textContent = 'Cargando Produccion...';
    if (proyectoId) {
      const plan = await cargarProduccionServidor({ crearUrlApi, proyectoId });
      return pintarPlan(plan, `servidor/proyecto ${proyectoId}`);
    }

    const ultima = cargarUltimaProduccion();
    if (ultima?.produccion) return pintarPlan(ultima.produccion, 'ultimo resultado procesado');
    return pintarPlan({ elementos: [] }, 'sin datos');
  } catch (error) {
    const lista = doc.getElementById('productionReviewList');
    if (lista) lista.innerHTML = `<div class="production-empty has-error">${escapar(error.message)}</div>`;
    if (estado) estado.textContent = 'Error al cargar Produccion.';
    return false;
  }
}

export function inicializarProduccionRevisionUI({ crearUrlApi } = {}) {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilosProduccion();

  doc.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-production-action="reload"]');
    if (!boton) return;
    recargarProduccionRevisionUI({ crearUrlApi });
  });

  doc.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'produccion') {
      recargarProduccionRevisionUI({ crearUrlApi });
    }
  });

  return true;
}
