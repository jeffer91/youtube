/* Modulo recursos externos: prepara busquedas de clips de apoyo. */

import { FUENTES_RECURSOS_CONFIG, listarFuentesRecursos } from './fuentes-recursos.config.js';

export function construirConsultaClip({ tema = '', frase = '', perfil = 'general' } = {}) {
  return [perfil, tema, frase, 'clip'].filter(Boolean).join(' ').trim();
}

export function prepararBusquedaClips(datos = {}, opciones = {}) {
  const consulta = construirConsultaClip(datos);
  const fuentes = listarFuentesRecursos().filter((fuente) => fuente.tipos?.includes('video'));
  return {
    ok: true,
    tipo: 'video',
    consulta,
    perfil: datos.perfil || 'general',
    fuentes: opciones.fuentes || fuentes.map((fuente) => fuente.id),
    maxResultados: opciones.maxResultados || 6,
    duracionMaxima: opciones.duracionMaxima || 15,
    descargarAutomatico: opciones.descargarAutomatico ?? FUENTES_RECURSOS_CONFIG.descargarAutomatico,
    requiereAprobacionProduccion: true,
    creadoEn: new Date().toISOString()
  };
}

export function normalizarResultadoClip(resultado = {}, contexto = {}) {
  return {
    nombre: resultado.nombre || contexto.consulta || 'Clip de apoyo',
    tipo: 'video',
    url: resultado.url || resultado.downloadUrl || '',
    fuente: resultado.fuente || 'fuente_configurada',
    licencia: resultado.licencia || 'pendiente_revision',
    tema: contexto.tema || '',
    fraseRelacionada: contexto.frase || '',
    perfil: contexto.perfil || 'general',
    duracion: resultado.duracion || null,
    estado: 'pendiente'
  };
}
