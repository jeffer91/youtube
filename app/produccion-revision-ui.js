const CLAVE_ULTIMA_PRODUCCION = 'autovideojeff:ultima-produccion';
let estadoProduccionActual = null;

function obtenerDocumento() { return typeof document === 'undefined' ? null : document; }
function escapar(texto = '') { return String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function numero(valor, respaldo = 0) { const n = Number(valor); return Number.isFinite(n) ? n : respaldo; }

function asegurarEstilosProduccion() {
  const doc = obtenerDocumento();
  if (!doc || doc.getElementById('productionReviewStyles')) return;
  const link = doc.createElement('link');
  link.id = 'productionReviewStyles';
  link.rel = 'stylesheet';
  link.href = './produccion-revision.css';
  doc.head.appendChild(link);
}

function crearPayload(produccion, extras = {}) { return { produccion, proyecto: extras.proyecto || estadoProduccionActual?.proyecto || null, resultado: extras.resultado || estadoProduccionActual?.resultado || null, antesDespues: extras.antesDespues || estadoProduccionActual?.antesDespues || null, resultadoPlataformas: extras.resultadoPlataformas || estadoProduccionActual?.resultadoPlataformas || null, guardadoEn: new Date().toISOString() }; }
function guardarPayloadLocal(payload) { try { window.localStorage.setItem(CLAVE_ULTIMA_PRODUCCION, JSON.stringify(payload)); estadoProduccionActual = payload; return true; } catch (_error) { return false; } }

export function guardarUltimaProduccion(datos = {}) {
  try {
    const produccion = datos.produccion || datos.modular?.produccion || null;
    if (!produccion) return false;
    const payload = crearPayload(produccion, { proyecto: datos.proyecto || datos.modular?.proyecto || null, resultado: datos.resultado || null, antesDespues: datos.resultado?.antesDespues || null, resultadoPlataformas: datos.resultadoPlataformas || datos.modular?.resultadoPlataformas || null });
    return guardarPayloadLocal(payload);
  } catch (_error) { return false; }
}

export function cargarUltimaProduccion() { try { const texto = window.localStorage.getItem(CLAVE_ULTIMA_PRODUCCION); const payload = texto ? JSON.parse(texto) : null; if (payload) estadoProduccionActual = payload; return payload; } catch (_error) { return null; } }

function crearResumenProduccion(plan = {}) {
  const elementos = Array.isArray(plan.elementos) ? plan.elementos : [];
  return { total: elementos.length, aprobados: elementos.filter((item) => item.aprobado).length, noUsados: elementos.filter((item) => item.rechazado).length, reemplazados: elementos.filter((item) => item.reemplazo || item.reemplazado).length, pendientes: elementos.filter((item) => !item.aprobado && !item.rechazado).length };
}

function obtenerEstadoElemento(elemento = {}) { if (elemento.reemplazo || elemento.reemplazado) return 'reemplazado'; if (elemento.aprobado) return 'aprobado'; if (elemento.rechazado) return 'no-usar'; return 'pendiente'; }
function pistaPorTipo(tipo = '') { if (tipo === 'subtitulo') return 'subtitulos'; if (tipo === 'texto') return 'textos-y-titulos'; if (tipo === 'imagen' || tipo === 'recurso' || tipo === 'grafico' || tipo === 'fondo') return 'imagenes-y-recursos'; if (tipo === 'animacion') return 'animaciones'; if (tipo === 'efecto' || tipo === 'zoom') return 'efectos-visuales'; if (tipo === 'audio') return 'audio'; return 'otros'; }
function obtenerDuracionPlan(plan = {}) { const elementos = Array.isArray(plan.elementos) ? plan.elementos : []; return numero(plan.duracionSegundos || plan.lineaTiempo?.duracionSegundos, 0) || Math.max(30, ...elementos.map((item) => numero(item.fin ?? item.datos?.fin ?? item.datos?.end, 0))); }
function obtenerTiempoElemento(elemento = {}, duracion = 30) { const inicio = Math.max(0, numero(elemento.inicio ?? elemento.datos?.inicio ?? elemento.datos?.start, 0)); let fin = numero(elemento.fin ?? elemento.datos?.fin ?? elemento.datos?.end, inicio + 2.5); if (fin <= inicio) fin = inicio + 2.5; return { inicio, fin: Math.min(fin, duracion) }; }

function construirTimeline(plan = {}) {
  const duracion = obtenerDuracionPlan(plan);
  const elementos = Array.isArray(plan.elementos) ? plan.elementos : [];
  const orden = ['subtitulos', 'textos-y-titulos', 'imagenes-y-recursos', 'animaciones', 'efectos-visuales', 'audio', 'otros'];
  const pistas = orden.map((pista) => ({ pista, items: [] }));
  elementos.forEach((elemento) => {
    const tiempos = obtenerTiempoElemento(elemento, duracion);
    const pista = elemento.pista || pistaPorTipo(elemento.tipo);
    const porcentajeInicio = duracion > 0 ? Math.max(0, Math.min(96, (tiempos.inicio / duracion) * 100)) : 0;
    const porcentajeAncho = duracion > 0 ? Math.max(4, Math.min(100 - porcentajeInicio, ((tiempos.fin - tiempos.inicio) / duracion) * 100)) : 8;
    const grupo = pistas.find((item) => item.pista === pista) || pistas[pistas.length - 1];
    grupo.items.push({ ...elemento, pista, inicio: tiempos.inicio, fin: tiempos.fin, porcentajeInicio, porcentajeAncho });
  });
  return { duracion, pistas: pistas.filter((pista) => pista.items.length > 0) };
}

function renderTimelineItem(item = {}) {
  const estado = obtenerEstadoElemento(item);
  return `<button type="button" class="production-timeline-item is-${estado}" style="left:${item.porcentajeInicio}%;width:${item.porcentajeAncho}%" title="${escapar(item.nombre || item.tipo)}" data-timeline-focus="${escapar(item.id)}"><span>${escapar(item.nombre || item.tipo || 'Elemento')}</span><small>${Number(item.inicio).toFixed(1)}s</small></button>`;
}

function renderTimeline(plan = {}) {
  const timeline = construirTimeline(plan);
  const doc = obtenerDocumento();
  const contenedor = doc?.getElementById('productionTimeline');
  const duracion = doc?.getElementById('productionTimelineDuration');
  if (!contenedor) return;
  if (duracion) duracion.textContent = `Duración: ${Number(timeline.duracion || 0).toFixed(1)}s`;
  contenedor.innerHTML = timeline.pistas.length ? timeline.pistas.map((pista) => `<section class="production-timeline-track"><strong>${escapar(pista.pista)}</strong><div class="production-timeline-lane">${pista.items.map(renderTimelineItem).join('')}</div></section>`).join('') : '<div class="production-empty">No hay elementos en la línea de tiempo.</div>';
}

function renderPreview(payload = {}) {
  const doc = obtenerDocumento();
  const panel = doc?.getElementById('productionPreviewPanel');
  const before = doc?.getElementById('productionBeforeVideo');
  const after = doc?.getElementById('productionAfterVideo');
  if (!panel || !before || !after) return;
  const antes = payload.antesDespues?.original?.copiaVista?.urlPublica || payload.antesDespues?.original?.urlPublica || '';
  const despues = payload.antesDespues?.final?.urlPublica || payload.resultado?.urlPublica || '';
  if (!antes && !despues) { panel.hidden = true; return; }
  panel.hidden = false;
  if (antes) before.src = antes;
  if (despues) after.src = despues;
}

function renderReemplazoActual(elemento = {}) { if (!elemento.reemplazo && !elemento.reemplazado) return ''; const reemplazo = elemento.reemplazo || elemento.recursoElegido || {}; return `<div class="production-replacement-current"><strong>Reemplazo:</strong> ${escapar(reemplazo.nombre || reemplazo.ruta || reemplazo.url || 'registrado')}</div>`; }

function renderElementoProduccion(elemento = {}) {
  const estado = obtenerEstadoElemento(elemento);
  const tiempo = elemento.inicio !== null && elemento.inicio !== undefined ? ` · ${elemento.inicio}s${elemento.fin ? `-${elemento.fin}s` : ''}` : '';
  const id = escapar(elemento.id || 'sin-id');
  return `<article class="production-item-card is-${estado}" data-production-element="${id}">
    <header><strong>${escapar(elemento.nombre || elemento.tipo || 'Elemento')}</strong><span>${escapar(estado)}</span></header>
    <p>${escapar(elemento.descripcion || elemento.datos?.texto || elemento.recurso?.nombre || 'Elemento generado automáticamente.')}</p>
    ${renderReemplazoActual(elemento)}
    <footer><small>${escapar(elemento.tipo || 'recurso')}${escapar(tiempo)}</small></footer>
    <div class="production-time-editor"><label>Inicio <input data-time-field="inicio" data-element-id="${id}" type="number" min="0" step="0.1" value="${elemento.inicio ?? 0}" /></label><label>Fin <input data-time-field="fin" data-element-id="${id}" type="number" min="0" step="0.1" value="${elemento.fin ?? ''}" /></label><button type="button" data-production-time="true" data-element-id="${id}">Cambiar tiempo</button></div>
    <div class="production-card-actions"><button type="button" data-production-mark="aprobar" data-element-id="${id}">Activar/Aprobar</button><button type="button" data-production-mark="no-usar" data-element-id="${id}">Eliminar/No usar</button><button type="button" data-production-mark="pendiente" data-element-id="${id}">Pendiente</button></div>
    <details class="production-replace-box"><summary>Reemplazar y aprender</summary><div class="production-replace-grid"><input data-replace-field="nombre" data-element-id="${id}" type="text" placeholder="Nombre del reemplazo" /><input data-replace-field="ruta" data-element-id="${id}" type="text" placeholder="Ruta local" /><input data-replace-field="url" data-element-id="${id}" type="text" placeholder="URL" /><input data-replace-field="motivo" data-element-id="${id}" type="text" placeholder="Motivo de la corrección" /></div><button class="production-replace-button" type="button" data-production-replace="true" data-element-id="${id}">Aplicar reemplazo</button></details>
  </article>`;
}

export function renderProduccionRevision(plan = {}) { const elementos = Array.isArray(plan.elementos) ? plan.elementos : []; if (!elementos.length) return '<div class="production-empty">No hay elementos de Producción para revisar todavía.</div>'; return elementos.map(renderElementoProduccion).join(''); }

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
  renderTimeline(plan);
  renderPreview(estadoProduccionActual);
  if (resumen) resumen.textContent = `${datos.total} elemento(s) · ${datos.pendientes} pendiente(s) · ${datos.aprobados} aprobado(s) · ${datos.noUsados} eliminado(s) · ${datos.reemplazados} reemplazado(s).`;
  if (estado) estado.textContent = `Plan cargado desde ${origen}.`;
  return true;
}

async function leerJsonSeguro(respuesta) { const texto = await respuesta.text(); if (!texto) return {}; try { return JSON.parse(texto); } catch (_error) { return { ok: false, mensaje: texto }; } }
async function cargarProduccionServidor({ crearUrlApi, proyectoId } = {}) { if (typeof crearUrlApi !== 'function') throw new Error('No se configuró crearUrlApi para Producción.'); if (!proyectoId) throw new Error('Falta id del proyecto.'); const respuesta = await fetch(await crearUrlApi(`/api/autovideo/proyectos/${encodeURIComponent(proyectoId)}/produccion`), { method: 'GET' }); const datos = await leerJsonSeguro(respuesta); if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo cargar plan de Producción.'); return datos.plan; }
async function guardarProduccionServidor({ crearUrlApi, proyectoId, plan } = {}) { if (typeof crearUrlApi !== 'function') throw new Error('No se configuró crearUrlApi para guardar Producción.'); if (!proyectoId) return null; const respuesta = await fetch(await crearUrlApi(`/api/autovideo/proyectos/${encodeURIComponent(proyectoId)}/produccion`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) }); const datos = await leerJsonSeguro(respuesta); if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo guardar plan de Producción.'); return datos.plan; }
async function guardarAprendizajeServidor({ crearUrlApi, correccion } = {}) { if (typeof crearUrlApi !== 'function') return null; const respuesta = await fetch(await crearUrlApi('/api/autovideo/aprendizaje'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(correccion) }); const datos = await leerJsonSeguro(respuesta); if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo guardar aprendizaje.'); return datos.regla; }

function marcarElementoProduccion(plan = {}, elementoId = '', marca = 'pendiente') { const elementos = Array.isArray(plan.elementos) ? plan.elementos : []; return { ...plan, elementos: elementos.map((elemento) => { if (elemento.id !== elementoId) return elemento; const base = { ...elemento, actualizadoEn: new Date().toISOString() }; if (marca === 'aprobar') return { ...base, visible: true, aprobado: true, rechazado: false, estado: 'aprobado' }; if (marca === 'no-usar') return { ...base, visible: false, aprobado: false, rechazado: true, estado: 'no_usar' }; return { ...base, visible: true, aprobado: false, rechazado: false, estado: 'en_revision' }; }), actualizadoEn: new Date().toISOString() }; }
function obtenerProyectoIdActual() { const doc = obtenerDocumento(); const input = doc?.getElementById('productionProjectIdInput'); return input?.value?.trim() || estadoProduccionActual?.proyecto?.id || estadoProduccionActual?.produccion?.proyectoId || ''; }
async function guardarPlanActual({ crearUrlApi, mostrarEstado = true } = {}) { const doc = obtenerDocumento(); const estado = doc?.getElementById('productionReviewStatus'); if (!estadoProduccionActual?.produccion) throw new Error('No hay plan cargado para guardar.'); const payload = crearPayload(estadoProduccionActual.produccion); guardarPayloadLocal(payload); const proyectoId = obtenerProyectoIdActual(); if (proyectoId) await guardarProduccionServidor({ crearUrlApi, proyectoId, plan: payload.produccion }); if (estado && mostrarEstado) estado.textContent = proyectoId ? 'Cambios guardados localmente y en servidor.' : 'Cambios guardados localmente.'; return payload.produccion; }

export async function aplicarMarcaProduccionUI({ elementoId, marca, crearUrlApi } = {}) { if (!estadoProduccionActual?.produccion) cargarUltimaProduccion(); if (!estadoProduccionActual?.produccion) return false; const planActualizado = marcarElementoProduccion(estadoProduccionActual.produccion, elementoId, marca); estadoProduccionActual = crearPayload(planActualizado); guardarPayloadLocal(estadoProduccionActual); pintarPlan(planActualizado, 'revisión actual'); await guardarPlanActual({ crearUrlApi, mostrarEstado: false }).catch(() => null); return true; }

function leerDatosTiempo(elementoId = '') { const doc = obtenerDocumento(); const datos = {}; doc?.querySelectorAll(`[data-time-field][data-element-id="${CSS.escape(elementoId)}"]`).forEach((control) => { datos[control.dataset.timeField] = control.value; }); return datos; }
export async function aplicarTiempoProduccionUI({ elementoId, crearUrlApi } = {}) { if (!estadoProduccionActual?.produccion) cargarUltimaProduccion(); if (!estadoProduccionActual?.produccion) return false; const datos = leerDatosTiempo(elementoId); const inicio = Math.max(0, numero(datos.inicio, 0)); const fin = Math.max(inicio + 0.2, numero(datos.fin, inicio + 2.5)); const plan = estadoProduccionActual.produccion; const actualizado = { ...plan, elementos: (plan.elementos || []).map((elemento) => elemento.id === elementoId ? { ...elemento, inicio, fin, actualizadoEn: new Date().toISOString() } : elemento), actualizadoEn: new Date().toISOString() }; estadoProduccionActual = crearPayload(actualizado); guardarPayloadLocal(estadoProduccionActual); pintarPlan(actualizado, 'tiempo ajustado'); await guardarPlanActual({ crearUrlApi, mostrarEstado: false }).catch(() => null); return true; }

function leerDatosReemplazo(elementoId = '') { const doc = obtenerDocumento(); const campos = {}; doc?.querySelectorAll(`[data-replace-field][data-element-id="${CSS.escape(elementoId)}"]`).forEach((control) => { campos[control.dataset.replaceField] = control.value.trim(); }); return campos; }
function aplicarReemplazoPlan(plan = {}, elementoId = '', datos = {}) { const elementos = Array.isArray(plan.elementos) ? plan.elementos : []; return { ...plan, elementos: elementos.map((elemento) => { if (elemento.id !== elementoId) return elemento; const reemplazo = { nombre: datos.nombre || 'Reemplazo sin nombre', ruta: datos.ruta || '', url: datos.url || '', motivo: datos.motivo || '', creadoEn: new Date().toISOString() }; return { ...elemento, reemplazo, reemplazado: true, recursoElegido: reemplazo, recursoRechazado: elemento.recurso || elemento.datos || { nombre: elemento.nombre || elemento.tipo }, aprobado: false, rechazado: false, estado: 'reemplazado', actualizadoEn: new Date().toISOString() }; }), actualizadoEn: new Date().toISOString() }; }
function crearCorreccionAprendizaje(plan = {}, elementoId = '', datos = {}) { const elemento = (plan.elementos || []).find((item) => item.id === elementoId) || {}; return { tipo: 'reemplazo_recurso', perfil: estadoProduccionActual?.proyecto?.perfil || plan.proyecto?.perfil || 'general', tema: elemento.tema || elemento.datos?.tema || '', frase: elemento.fraseRelacionada || elemento.datos?.texto || elemento.descripcion || '', recursoRechazado: elemento.recurso || elemento.datos || { nombre: elemento.nombre || elemento.tipo }, recursoElegido: { nombre: datos.nombre || 'Reemplazo sin nombre', ruta: datos.ruta || '', url: datos.url || '' }, motivo: datos.motivo || 'Jeff reemplazó un recurso desde Producción.', regla: `Cuando el recurso similar no funcione, priorizar ${datos.nombre || datos.url || datos.ruta || 'el reemplazo elegido por Jeff'}.`, impacto: 'medio' }; }

export async function aplicarReemplazoProduccionUI({ elementoId, crearUrlApi } = {}) { const doc = obtenerDocumento(); const estado = doc?.getElementById('productionReviewStatus'); if (!estadoProduccionActual?.produccion) cargarUltimaProduccion(); if (!estadoProduccionActual?.produccion) return false; const datos = leerDatosReemplazo(elementoId); if (!datos.nombre && !datos.ruta && !datos.url) { if (estado) estado.textContent = 'Agrega nombre, ruta o URL para reemplazar.'; return false; } const planAnterior = estadoProduccionActual.produccion; const correccion = crearCorreccionAprendizaje(planAnterior, elementoId, datos); const planActualizado = aplicarReemplazoPlan(planAnterior, elementoId, datos); estadoProduccionActual = crearPayload(planActualizado); guardarPayloadLocal(estadoProduccionActual); pintarPlan(planActualizado, 'reemplazo aplicado'); await guardarPlanActual({ crearUrlApi, mostrarEstado: false }).catch(() => null); await guardarAprendizajeServidor({ crearUrlApi, correccion }).catch((error) => { if (estado) estado.textContent = `Reemplazo guardado. Aprendizaje pendiente: ${error.message}`; }); if (estado) estado.textContent = 'Reemplazo aplicado y aprendizaje registrado.'; return true; }

export async function recargarProduccionRevisionUI({ crearUrlApi } = {}) { const doc = obtenerDocumento(); if (!doc) return false; asegurarEstilosProduccion(); const input = doc.getElementById('productionProjectIdInput'); const estado = doc.getElementById('productionReviewStatus'); const proyectoId = input?.value?.trim() || ''; try { if (estado) estado.textContent = 'Cargando Producción...'; if (proyectoId) return pintarPlan(await cargarProduccionServidor({ crearUrlApi, proyectoId }), `servidor/proyecto ${proyectoId}`); const ultima = cargarUltimaProduccion(); if (ultima?.produccion) return pintarPlan(ultima.produccion, 'último resultado procesado'); return pintarPlan({ elementos: [] }, 'sin datos'); } catch (error) { const lista = doc.getElementById('productionReviewList'); if (lista) lista.innerHTML = `<div class="production-empty has-error">${escapar(error.message)}</div>`; if (estado) estado.textContent = 'Error al cargar Producción.'; return false; } }

export function inicializarProduccionRevisionUI({ crearUrlApi } = {}) {
  const doc = obtenerDocumento(); if (!doc) return false; asegurarEstilosProduccion();
  doc.addEventListener('click', (evento) => {
    const focoTimeline = evento.target.closest('[data-timeline-focus]');
    if (focoTimeline) { const card = doc.querySelector(`[data-production-element="${CSS.escape(focoTimeline.dataset.timelineFocus)}"]`); card?.scrollIntoView({ behavior: 'smooth', block: 'center' }); card?.classList.add('is-focused'); setTimeout(() => card?.classList.remove('is-focused'), 1400); return; }
    const botonCarga = evento.target.closest('[data-production-action="reload"]');
    if (botonCarga) { recargarProduccionRevisionUI({ crearUrlApi }); return; }
    const botonGuardar = evento.target.closest('[data-production-action="save"]');
    if (botonGuardar) { guardarPlanActual({ crearUrlApi }).catch((error) => { const estado = doc.getElementById('productionReviewStatus'); if (estado) estado.textContent = error.message; }); return; }
    const botonTiempo = evento.target.closest('[data-production-time]');
    if (botonTiempo) { aplicarTiempoProduccionUI({ elementoId: botonTiempo.dataset.elementId, crearUrlApi }); return; }
    const botonReemplazo = evento.target.closest('[data-production-replace]');
    if (botonReemplazo) { aplicarReemplazoProduccionUI({ elementoId: botonReemplazo.dataset.elementId, crearUrlApi }); return; }
    const botonMarca = evento.target.closest('[data-production-mark]');
    if (botonMarca) aplicarMarcaProduccionUI({ elementoId: botonMarca.dataset.elementId, marca: botonMarca.dataset.productionMark, crearUrlApi });
  });
  doc.addEventListener('autovideo:navegacion', (evento) => { if (evento.detail?.pantallaId === 'produccion') recargarProduccionRevisionUI({ crearUrlApi }); });
  return true;
}
