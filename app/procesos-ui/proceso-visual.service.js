/*
  Procesos UI - Bloque 1
  Función: utilidades visuales para activar pasos progresivos sin cambiar funcionalidad existente.
*/

import { ESTADOS_PROCESO_UI, obtenerProcesoVisual, obtenerProcesosPorPantalla } from './procesos.config.js';

export const VERSION_PROCESO_VISUAL_SERVICE = '1.0.0';

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function buscarProcesoParaPantalla(pantallaId = '') {
  const procesos = obtenerProcesosPorPantalla(pantallaId);
  return procesos[0] || obtenerProcesoVisual(pantallaId) || null;
}

function obtenerIndicePaso(proceso, pasoActivoId = '') {
  if (!proceso?.pasos?.length) return 0;
  if (!pasoActivoId) return 0;
  const indice = proceso.pasos.findIndex((paso) => paso.id === pasoActivoId);
  return indice >= 0 ? indice : 0;
}

export function construirEstadoPasos(procesoId, pasoActivoId = '') {
  const proceso = obtenerProcesoVisual(procesoId);
  if (!proceso) return [];
  const activo = obtenerIndicePaso(proceso, pasoActivoId);
  return proceso.pasos.map((paso, indice) => ({
    ...paso,
    indice,
    numero: indice + 1,
    estado: paso.avanzado
      ? ESTADOS_PROCESO_UI.AVANZADO
      : indice < activo
        ? ESTADOS_PROCESO_UI.COMPLETADO
        : indice === activo
          ? ESTADOS_PROCESO_UI.ACTIVO
          : ESTADOS_PROCESO_UI.BLOQUEADO
  }));
}

export function renderizarResumenProceso(proceso, pasoActivoId = '') {
  if (!proceso) return '';
  const pasos = construirEstadoPasos(proceso.id, pasoActivoId);
  return `
    <section class="process-visual-summary" data-process-summary="${proceso.id}">
      <div class="process-visual-summary__head">
        <div>
          <p class="eyebrow">Proceso guiado</p>
          <h3>${proceso.titulo}</h3>
          <p>${proceso.descripcion || 'Proceso progresivo de AutoVideoJeff.'}</p>
        </div>
        <span>${pasos.filter((paso) => !paso.avanzado).length} pasos</span>
      </div>
      <ol class="process-visual-steps">
        ${pasos.map((paso) => `<li data-process-step-state="${paso.estado}"><b>${paso.numero}</b><span><strong>${paso.titulo}</strong><small>${paso.descripcion || paso.estado}</small></span></li>`).join('')}
      </ol>
    </section>
  `;
}

export function marcarPasosEnDom({ contenedor, procesoId, pasoActivoId = '' } = {}) {
  if (!contenedor || !procesoId) return false;
  const estados = construirEstadoPasos(procesoId, pasoActivoId);
  const mapa = new Map(estados.map((paso) => [paso.id, paso]));
  contenedor.querySelectorAll('[data-proceso-step]').forEach((elemento) => {
    const paso = mapa.get(elemento.dataset.procesoStep);
    if (!paso) return;
    elemento.dataset.procesoEstado = paso.estado;
    elemento.dataset.procesoNumero = String(paso.numero);
  });
  contenedor.querySelectorAll('[data-proceso-avanzado]').forEach((elemento) => {
    elemento.dataset.procesoEstado = ESTADOS_PROCESO_UI.AVANZADO;
  });
  return true;
}

export function aplicarProcesoVisual({ pantallaId = '', contenedor = null, procesoId = '', pasoActivoId = '' } = {}) {
  if (typeof document === 'undefined') return null;
  const proceso = procesoId ? obtenerProcesoVisual(procesoId) : buscarProcesoParaPantalla(pantallaId);
  if (!proceso) return null;
  const destino = contenedor || document;
  const paso = proceso.pasos[obtenerIndicePaso(proceso, pasoActivoId)] || proceso.pasos[0] || null;
  document.body.dataset.procesoVisualActivo = proceso.id;
  document.body.dataset.procesoVisualPaso = paso?.id || '';
  marcarPasosEnDom({ contenedor: destino, procesoId: proceso.id, pasoActivoId: paso?.id || pasoActivoId });
  destino.querySelectorAll?.('[data-proceso-resumen]').forEach((elemento) => {
    if (elemento.dataset.procesoResumen === proceso.id || elemento.dataset.procesoResumen === 'auto') {
      elemento.innerHTML = renderizarResumenProceso(proceso, paso?.id || pasoActivoId);
    }
  });
  return { proceso, paso };
}

export function inicializarProcesosVisuales({ contenedor = null } = {}) {
  if (typeof document === 'undefined') return false;
  const destino = contenedor || document;
  destino.querySelectorAll?.('[data-proceso-root]').forEach((root) => {
    const procesoId = texto(root.dataset.procesoRoot || root.dataset.procesoId, '');
    const pasoActivoId = texto(root.dataset.procesoPasoActivo, '');
    if (procesoId) aplicarProcesoVisual({ contenedor: root, procesoId, pasoActivoId });
  });
  return true;
}

export function conectarProcesosConNavegacion(contenedorVista = null) {
  if (typeof document === 'undefined') return false;
  document.addEventListener('autovideo:navegacion', (evento) => {
    setTimeout(() => aplicarProcesoVisual({ pantallaId: evento.detail?.pantallaId || '', contenedor: contenedorVista || document }), 0);
  });
  inicializarProcesosVisuales({ contenedor: contenedorVista || document });
  return true;
}

export default {
  VERSION_PROCESO_VISUAL_SERVICE,
  construirEstadoPasos,
  renderizarResumenProceso,
  aplicarProcesoVisual,
  inicializarProcesosVisuales,
  conectarProcesosConNavegacion
};
