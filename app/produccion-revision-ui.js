/*
  Bloque 17
  Funcion: revisar, reemplazar recursos y aprender correcciones desde Produccion.
*/

const CLAVE_ULTIMA_PRODUCCION = 'autovideojeff:ultima-produccion';
let estadoProduccionActual = null;

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

function crearPayload(produccion, extras = {}) {
  return {
    produccion,
    proyecto: extras.proyecto || estadoProduccionActual?.proyecto || null,
    resultadoPlataformas: extras.resultadoPlataformas || estadoProduccionActual?.resultadoPlataformas || null,
    guardadoEn: new Date().toISOString()
  };
}

function guardarPayloadLocal(payload) {
  try {
    window.localStorage.setItem(CLAVE_ULTIMA_PRODUCCION, JSON.stringify(payload));
    estadoProduccionActual = payload;
    return true;
  } catch (_error) {
    return false;
  }
}

export function guardarUltimaProduccion(datos = {}) {
  try {
    const produccion = datos.produccion || datos.modular?.produccion || null;
    if (!produccion) return false;
    const payload = crearPayload(produccion, {
      proyecto: datos.proyecto || datos.modular?.proyecto || null,
      resultadoPlataformas: datos.resultadoPlataformas || datos.modular?.resultadoPlataformas || null
    });
    return guardarPayloadLocal(payload);
  } catch (_error) {
    return false;
  }
}

export function cargarUltimaProduccion() {
  try {
    const texto = window.localStorage.getItem(CLAVE_ULTIMA_PRODUCCION);
    const payload = texto ? JSON.parse(texto) : null;
    if (payload) estadoProduccionActual = payload;
    return payload;
  } catch (_error) {
    return null;
  }
}

function crearResumenProduccion(plan = {}) {
  const elementos = Array.isArray(plan.elementos) ? plan.elementos : [];
  return {
    total: elementos.length,
    aprobados: elementos.filter((item) => item.aprobado).length,
    noUsados: elementos.filter((item) => item.rechazado).length,
    reemplazados: elementos.filter((item) => item.reemplazo || item.reemplazado).length,
    pendientes: elementos.filter((item) => !item.aprobado && !item.rechazado).length
  };
}

function obtenerEstadoElemento(elemento = {}) {
  if (elemento.reemplazo || elemento.reemplazado) return 'reemplazado';
  if (elemento.aprobado) return 'aprobado';
  if (elemento.rechazado) return 'no-usar';
  return 'pendiente';
}

function renderReemplazoActual(elemento = {}) {
  if (!elemento.reemplazo && !elemento.reemplazado) return '';
  const reemplazo = elemento.reemplazo || elemento.recursoElegido || {};
  return `<div class="production-replacement-current"><strong>Reemplazo:</strong> ${escapar(reemplazo.nombre || reemplazo.ruta || reemplazo.url || 'registrado')}</div>`;
}

function renderElementoProduccion(elemento = {}) {
  const estado = obtenerEstadoElemento(elemento);
  const tiempo = elemento.inicio !== null && elemento.inicio !== undefined ? ` · ${elemento.inicio}s${elemento.fin ? `-${elemento.fin}s` : ''}` : '';
  const id = escapar(elemento.id || 'sin-id');
  return `
    <article class="production-item-card is-${estado}" data-production-element="${id}">
      <header>
        <strong>${escapar(elemento.nombre || elemento.tipo || 'Elemento')}</strong>
        <span>${escapar(estado)}</span>
      </header>
      <p>${escapar(elemento.descripcion || elemento.datos?.texto || elemento.recurso?.nombre || 'Elemento generado automaticamente.')}</p>
      ${renderReemplazoActual(elemento)}
      <footer><small>${escapar(elemento.tipo || 'recurso')}${escapar(tiempo)}</small></footer>
      <div class="production-card-actions">
        <button type="button" data-production-mark="aprobar" data-element-id="${id}">Aprobar</button>
        <button type="button" data-production-mark="no-usar" data-element-id="${id}">No usar</button>
        <button type="button" data-production-mark="pendiente" data-element-id="${id}">Pendiente</button>
      </div>
      <details class="production-replace-box">
        <summary>Reemplazar y aprender</summary>
        <div class="production-replace-grid">
          <input data-replace-field="nombre" data-element-id="${id}" type="text" placeholder="Nombre del reemplazo" />
          <input data-replace-field="ruta" data-element-id="${id}" type="text" placeholder="Ruta local" />
          <input data-replace-field="url" data-element-id="${id}" type="text" placeholder="URL" />
          <input data-replace-field="motivo" data-element-id="${id}" type="text" placeholder="Motivo de la correccion" />
        </div>
        <button class="production-replace-button" type="button" data-production-replace="true" data-element-id="${id}">Aplicar reemplazo</button>
      </details>
    </article>
  `;
}

export function renderProduccionRevision(plan = {}) {
  const elementos = Array.isArray(plan.elementos) ? plan.elementos : [];
  if (!elementos.length) return '<div class="production-empty">No hay elementos de Produccion para revisar todavia.</div>';
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

  estadoProduccionActual = crearPayload(plan);
  const datos = crearResumenProduccion(plan);
  lista.innerHTML = renderProduccionRevision(plan);
  if (resumen) resumen.textContent = `${datos.total} elemento(s) · ${datos.pendientes} pendiente(s) · ${datos.aprobados} aprobado(s) · ${datos.noUsados} no usado(s) · ${datos.reemplazados} reemplazado(s).`;
  if (estado) estado.textContent = `Plan cargado desde ${origen}.`;
  return true;
}

async function leerJsonSeguro(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return {};
  try { return JSON.parse(texto); } catch (_error) { return { ok: false, mensaje: texto }; }
}

async function cargarProduccionServidor({ crearUrlApi, proyectoId } = {}) {
  if (typeof crearUrlApi !== 'function') throw new Error('No se configuro crearUrlApi para Produccion.');
  if (!proyectoId) throw new Error('Falta id del proyecto.');
  const respuesta = await fetch(await crearUrlApi(`/api/autovideo/proyectos/${encodeURIComponent(proyectoId)}/produccion`), { method: 'GET' });
  const datos = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo cargar plan de Produccion.');
  return datos.plan;
}

async function guardarProduccionServidor({ crearUrlApi, proyectoId, plan } = {}) {
  if (typeof crearUrlApi !== 'function') throw new Error('No se configuro crearUrlApi para guardar Produccion.');
  if (!proyectoId) return null;
  const respuesta = await fetch(await crearUrlApi(`/api/autovideo/proyectos/${encodeURIComponent(proyectoId)}/produccion`), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan })
  });
  const datos = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo guardar plan de Produccion.');
  return datos.plan;
}

async function guardarAprendizajeServidor({ crearUrlApi, correccion } = {}) {
  if (typeof crearUrlApi !== 'function') return null;
  const respuesta = await fetch(await crearUrlApi('/api/autovideo/aprendizaje'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(correccion)
  });
  const datos = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo guardar aprendizaje.');
  return datos.regla;
}

function marcarElementoProduccion(plan = {}, elementoId = '', marca = 'pendiente') {
  const elementos = Array.isArray(plan.elementos) ? plan.elementos : [];
  return { ...plan, elementos: elementos.map((elemento) => {
    if (elemento.id !== elementoId) return elemento;
    const base = { ...elemento, actualizadoEn: new Date().toISOString() };
    if (marca === 'aprobar') return { ...base, aprobado: true, rechazado: false, estado: 'aprobado' };
    if (marca === 'no-usar') return { ...base, aprobado: false, rechazado: true, estado: 'no_usar' };
    return { ...base, aprobado: false, rechazado: false, estado: 'en_revision' };
  }), actualizadoEn: new Date().toISOString() };
}

function obtenerProyectoIdActual() {
  const doc = obtenerDocumento();
  const input = doc?.getElementById('productionProjectIdInput');
  return input?.value?.trim() || estadoProduccionActual?.proyecto?.id || estadoProduccionActual?.produccion?.proyectoId || '';
}

async function guardarPlanActual({ crearUrlApi, mostrarEstado = true } = {}) {
  const doc = obtenerDocumento();
  const estado = doc?.getElementById('productionReviewStatus');
  if (!estadoProduccionActual?.produccion) throw new Error('No hay plan cargado para guardar.');
  const payload = crearPayload(estadoProduccionActual.produccion);
  guardarPayloadLocal(payload);
  const proyectoId = obtenerProyectoIdActual();
  if (proyectoId) await guardarProduccionServidor({ crearUrlApi, proyectoId, plan: payload.produccion });
  if (estado && mostrarEstado) estado.textContent = proyectoId ? 'Cambios guardados localmente y en servidor.' : 'Cambios guardados localmente.';
  return payload.produccion;
}

export async function aplicarMarcaProduccionUI({ elementoId, marca, crearUrlApi } = {}) {
  if (!estadoProduccionActual?.produccion) cargarUltimaProduccion();
  if (!estadoProduccionActual?.produccion) return false;
  const planActualizado = marcarElementoProduccion(estadoProduccionActual.produccion, elementoId, marca);
  estadoProduccionActual = crearPayload(planActualizado);
  guardarPayloadLocal(estadoProduccionActual);
  pintarPlan(planActualizado, 'revision actual');
  await guardarPlanActual({ crearUrlApi, mostrarEstado: false }).catch(() => null);
  return true;
}

function leerDatosReemplazo(elementoId = '') {
  const doc = obtenerDocumento();
  const campos = {};
  doc?.querySelectorAll(`[data-replace-field][data-element-id="${CSS.escape(elementoId)}"]`).forEach((control) => { campos[control.dataset.replaceField] = control.value.trim(); });
  return campos;
}

function aplicarReemplazoPlan(plan = {}, elementoId = '', datos = {}) {
  const elementos = Array.isArray(plan.elementos) ? plan.elementos : [];
  return { ...plan, elementos: elementos.map((elemento) => {
    if (elemento.id !== elementoId) return elemento;
    const reemplazo = { nombre: datos.nombre || 'Reemplazo sin nombre', ruta: datos.ruta || '', url: datos.url || '', motivo: datos.motivo || '', creadoEn: new Date().toISOString() };
    return { ...elemento, reemplazo, reemplazado: true, recursoElegido: reemplazo, recursoRechazado: elemento.recurso || elemento.datos || { nombre: elemento.nombre || elemento.tipo }, aprobado: false, rechazado: false, estado: 'reemplazado', actualizadoEn: new Date().toISOString() };
  }), actualizadoEn: new Date().toISOString() };
}

function crearCorreccionAprendizaje(plan = {}, elementoId = '', datos = {}) {
  const elemento = (plan.elementos || []).find((item) => item.id === elementoId) || {};
  return {
    tipo: 'reemplazo_recurso',
    perfil: estadoProduccionActual?.proyecto?.perfil || plan.proyecto?.perfil || 'general',
    tema: elemento.tema || elemento.datos?.tema || '',
    frase: elemento.fraseRelacionada || elemento.datos?.texto || elemento.descripcion || '',
    recursoRechazado: elemento.recurso || elemento.datos || { nombre: elemento.nombre || elemento.tipo },
    recursoElegido: { nombre: datos.nombre || 'Reemplazo sin nombre', ruta: datos.ruta || '', url: datos.url || '' },
    motivo: datos.motivo || 'Jeff reemplazo un recurso desde Produccion.',
    regla: `Cuando el recurso similar no funcione, priorizar ${datos.nombre || datos.url || datos.ruta || 'el reemplazo elegido por Jeff'}.`,
    impacto: 'medio'
  };
}

export async function aplicarReemplazoProduccionUI({ elementoId, crearUrlApi } = {}) {
  const doc = obtenerDocumento();
  const estado = doc?.getElementById('productionReviewStatus');
  if (!estadoProduccionActual?.produccion) cargarUltimaProduccion();
  if (!estadoProduccionActual?.produccion) return false;
  const datos = leerDatosReemplazo(elementoId);
  if (!datos.nombre && !datos.ruta && !datos.url) {
    if (estado) estado.textContent = 'Agrega nombre, ruta o URL para reemplazar.';
    return false;
  }
  const planAnterior = estadoProduccionActual.produccion;
  const correccion = crearCorreccionAprendizaje(planAnterior, elementoId, datos);
  const planActualizado = aplicarReemplazoPlan(planAnterior, elementoId, datos);
  estadoProduccionActual = crearPayload(planActualizado);
  guardarPayloadLocal(estadoProduccionActual);
  pintarPlan(planActualizado, 'reemplazo aplicado');
  await guardarPlanActual({ crearUrlApi, mostrarEstado: false }).catch(() => null);
  await guardarAprendizajeServidor({ crearUrlApi, correccion }).catch((error) => {
    if (estado) estado.textContent = `Reemplazo guardado. Aprendizaje pendiente: ${error.message}`;
  });
  if (estado) estado.textContent = 'Reemplazo aplicado y aprendizaje registrado.';
  return true;
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
    if (proyectoId) return pintarPlan(await cargarProduccionServidor({ crearUrlApi, proyectoId }), `servidor/proyecto ${proyectoId}`);
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
    const botonCarga = evento.target.closest('[data-production-action="reload"]');
    if (botonCarga) { recargarProduccionRevisionUI({ crearUrlApi }); return; }
    const botonGuardar = evento.target.closest('[data-production-action="save"]');
    if (botonGuardar) { guardarPlanActual({ crearUrlApi }).catch((error) => { const estado = doc.getElementById('productionReviewStatus'); if (estado) estado.textContent = error.message; }); return; }
    const botonReemplazo = evento.target.closest('[data-production-replace]');
    if (botonReemplazo) { aplicarReemplazoProduccionUI({ elementoId: botonReemplazo.dataset.elementId, crearUrlApi }); return; }
    const botonMarca = evento.target.closest('[data-production-mark]');
    if (botonMarca) aplicarMarcaProduccionUI({ elementoId: botonMarca.dataset.elementId, marca: botonMarca.dataset.productionMark, crearUrlApi });
  });
  doc.addEventListener('autovideo:navegacion', (evento) => { if (evento.detail?.pantallaId === 'produccion') recargarProduccionRevisionUI({ crearUrlApi }); });
  return true;
}
