/*
  Modulo: recursos-externos
  Funcion: crear solicitudes de busqueda de imagenes externas.
*/

import { FUENTES_RECURSOS_CONFIG, listarFuentesRecursos } from './fuentes-recursos.config.js';

export function construirConsultaImagen({ tema = '', frase = '', perfil = 'general' } = {}) {
  return [perfil, tema, frase].filter(Boolean).join(' ').trim();
}

export function prepararBusquedaImagenes(datos = {}, opciones = {}) {
  const consulta = construirConsultaImagen(datos);
  const fuentes = listarFuentesRecursos().filter((fuente) => fuente.tipos?.includes('imagen'));
  return {
    ok: true,
    tipo: 'imagen',
    consulta,
    perfil: datos.perfil || 'general',
    fuentes: opciones.fuentes || fuentes.map((fuente) => fuente.id),
    maxResultados: opciones.maxResultados || 8,
    descargarAutomatico: opciones.descargarAutomatico ?? FUENTES_RECURSOS_CONFIG.descargarAutomatico,
    requiereAprobacionProduccion: true,
    creadoEn: new Date().toISOString()
  };
}

export function normalizarResultadoImagen(resultado = {}, contexto = {}) {
  return {
    nombre: resultado.nombre || contexto.consulta || 'Imagen externa',
    tipo: 'imagen',
    url: resultado.url || resultado.downloadUrl || '',
    fuente: resultado.fuente || 'fuente_externa',
    licencia: resultado.licencia || 'pendiente_revision',
    tema: contexto.tema || '',
    fraseRelacionada: contexto.frase || '',
    perfil: contexto.perfil || 'general',
    estado: 'pendiente'
  };
}
