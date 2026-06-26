/*
  Modulo: subtitulos
  Funcion: adaptar subtitulos a cada plataforma exportada.
*/

import { obtenerPlataformaExportacion } from '../exportacion/exportacion.conexion.js';
import { SUBTITULOS_CONFIG } from './subtitulos.config.js';
import { resolverEstiloSubtitulo } from './estilos-subtitulos.service.js';
import { calcularPosicionSubtitulos } from './posicionar-subtitulos.service.js';
import { generarSubtitulosDesdeSegmentos } from './generar-subtitulos.service.js';

export function crearSubtitulosParaPlataforma({ plataformaId, segmentos = [], sujeto = {}, perfil = 'general' } = {}) {
  const plataforma = obtenerPlataformaExportacion(plataformaId);
  if (!plataforma) throw new Error(`Plataforma no soportada para subtitulos: ${plataformaId}`);

  const maxCaracteres = SUBTITULOS_CONFIG.maxCaracteresPorLinea[plataforma.formato] || 32;
  const estilo = resolverEstiloSubtitulo({ plataforma: plataforma.id, perfil });
  const posicion = calcularPosicionSubtitulos({ plataforma, sujeto });
  const subtitulos = generarSubtitulosDesdeSegmentos(segmentos, { maxCaracteres });

  return {
    plataforma: plataforma.id,
    formato: plataforma.formato,
    estilo,
    posicion,
    subtitulos,
    total: subtitulos.length,
    creadoEn: new Date().toISOString()
  };
}

export function crearSubtitulosMultiplataforma({ plataformas = [], segmentos = [], sujeto = {}, perfil = 'general' } = {}) {
  return plataformas.map((plataformaId) => crearSubtitulosParaPlataforma({ plataformaId, segmentos, sujeto, perfil }));
}
