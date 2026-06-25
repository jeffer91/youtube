import { PLAN_EDICION_VERSION } from './estados-plan.js';

export const PLAN_EDICION_CONFIG = Object.freeze({
  nombre: 'Plan de edición automático',
  version: PLAN_EDICION_VERSION,
  archivoPlan: 'plan-edicion.json',
  archivoHistorial: 'plan-edicion-historial.json',
  revisionRequeridaPorDefecto: true,
  renderAutomaticoPorDefecto: false,
  perfilPredeterminado: 'educacion',
  nivelEdicionPredeterminado: 2,
  plataformaPredeterminada: 'tiktok',
  formatoPredeterminado: 'vertical-9-16',
  maxTextosFlotantes: 8,
  maxBrollSugeridos: 8,
  formatosDisponibles: Object.freeze(['vertical-9-16', 'horizontal-16-9', 'cuadrado-1-1']),
  nivelesDisponibles: Object.freeze([1, 2, 3, 4])
});

function convertirBooleano(valor, respaldo = false) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo', 'activado'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(limpio)) return false;
  }
  return respaldo;
}

function normalizarTexto(valor, respaldo = '') {
  if (typeof valor !== 'string') return respaldo;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : respaldo;
}

function limitarNumero(valor, minimo, maximo, respaldo) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return respaldo;
  return Math.min(Math.max(Math.round(numero), minimo), maximo);
}

function normalizarLista(valor, respaldo = []) {
  if (Array.isArray(valor)) return valor.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
  if (typeof valor === 'string' && valor.trim()) return valor.split(',').map((item) => item.trim()).filter(Boolean);
  return respaldo;
}

export function obtenerConfigPlanEdicion(opciones = {}) {
  const nivelEdicion = limitarNumero(
    opciones.nivelEdicion || opciones.nivel || PLAN_EDICION_CONFIG.nivelEdicionPredeterminado,
    1,
    4,
    PLAN_EDICION_CONFIG.nivelEdicionPredeterminado
  );

  const formatosSolicitados = normalizarLista(opciones.formatosExportacion || opciones.formatos || [], []);
  const formatosValidos = formatosSolicitados.filter((formato) => PLAN_EDICION_CONFIG.formatosDisponibles.includes(formato));

  return {
    ...PLAN_EDICION_CONFIG,
    perfil: normalizarTexto(opciones.perfilVisual || opciones.perfil || PLAN_EDICION_CONFIG.perfilPredeterminado, PLAN_EDICION_CONFIG.perfilPredeterminado),
    plataforma: normalizarTexto(opciones.plataforma || PLAN_EDICION_CONFIG.plataformaPredeterminada, PLAN_EDICION_CONFIG.plataformaPredeterminada),
    nivelEdicion,
    formatoPrincipal: normalizarTexto(opciones.formatoPrincipal || opciones.formato || PLAN_EDICION_CONFIG.formatoPredeterminado, PLAN_EDICION_CONFIG.formatoPredeterminado),
    formatosExportacion: formatosValidos.length > 0 ? formatosValidos : [PLAN_EDICION_CONFIG.formatoPredeterminado],
    requiereRevision: convertirBooleano(opciones.requiereRevision ?? opciones.draftMode, PLAN_EDICION_CONFIG.revisionRequeridaPorDefecto),
    renderAutomatico: convertirBooleano(opciones.renderAutomatico, PLAN_EDICION_CONFIG.renderAutomaticoPorDefecto),
    maxTextosFlotantes: limitarNumero(opciones.maxTextosFlotantes || PLAN_EDICION_CONFIG.maxTextosFlotantes, 1, 12, PLAN_EDICION_CONFIG.maxTextosFlotantes),
    maxBrollSugeridos: limitarNumero(opciones.maxBrollSugeridos || PLAN_EDICION_CONFIG.maxBrollSugeridos, 0, 20, PLAN_EDICION_CONFIG.maxBrollSugeridos)
  };
}

export default PLAN_EDICION_CONFIG;
