/*
  Nombre completo: reporte-impacto-edicion.js
  Ruta: /motor/reporte-impacto-edicion.js

  Función:
  - Unir métricas de audio, textos, edición visual, cortes, exportación y entrega final.
  - Generar un reporte entendible para el frontend y la comparativa.
*/

import { calcularImpactoAudio } from './metricas/audio-impacto.service.js';
import { calcularImpactoTexto } from './metricas/texto-impacto.service.js';
import {
  calcularImpactoEdicionDinamica,
  calcularImpactoVisual,
  calcularImpactoExportacion
} from './metricas/video-impacto.service.js';
import { validarResultadoFinal } from './validar-resultado-final.js';
import { promedioPonderado, etiquetaEstado } from './metricas/metricas-comunes.js';

function obtenerListaModulos(modulos = {}) {
  return Object.values(modulos).filter(Boolean);
}

function calcularPorcentajeGeneral(modulos = {}, validacionFinal = {}) {
  const lista = obtenerListaModulos(modulos).filter((modulo) => !modulo.omitido);
  const pesos = lista.map((modulo) => ({
    valor: modulo.impacto,
    peso: modulo.id === 'exportacion' ? 2 : 1
  }));

  if (validacionFinal?.checks?.exportacionActiva) {
    pesos.push({ valor: validacionFinal.porcentajeEntrega || 0, peso: 2 });
  }

  return promedioPonderado(pesos);
}

function crearResumenEjecutivo({ porcentajeGeneral, modulos, validacionFinal }) {
  const destacados = obtenerListaModulos(modulos)
    .filter((modulo) => !modulo.omitido)
    .map((modulo) => `${modulo.nombre}: ejecutado ${modulo.ejecutado}%, impacto ${modulo.impacto}%`);

  const entrega = validacionFinal?.checks?.exportacionActiva
    ? `Entrega final: ${validacionFinal.porcentajeEntrega}% (${validacionFinal.ok ? 'validada' : 'incompleta'}).`
    : 'Entrega final: exportación omitida.';

  return `Resultado general: ${porcentajeGeneral}%. ${entrega} ${destacados.join(' · ')}`.trim();
}

export function crearReporteImpactoEdicion({
  entrada = null,
  entendimiento = {},
  audio = {},
  transcripcion = {},
  edicionDinamica = {},
  edicion = {},
  salida = {},
  opciones = {},
  historial = [],
  videoEditadoUrl = null
} = {}) {
  const audioImpacto = calcularImpactoAudio({ audio, salida, opciones, entendimiento });
  const textoImpacto = calcularImpactoTexto({ transcripcion, entendimiento, opciones });
  const cortesImpacto = calcularImpactoEdicionDinamica({ edicionDinamica, entendimiento, opciones });
  const visualImpacto = calcularImpactoVisual({ edicion, edicionDinamica, opciones });
  const exportacionImpacto = calcularImpactoExportacion({ salida, opciones });
  const validacionFinal = validarResultadoFinal({ salida, opciones, videoEditadoUrl });

  const modulos = {
    audio: audioImpacto,
    transcripcion: textoImpacto.transcripcion,
    subtitulos: textoImpacto.subtitulos,
    textosFlotantes: textoImpacto.textosFlotantes,
    cortes: cortesImpacto,
    zooms: visualImpacto.zooms,
    barraProgreso: visualImpacto.barraProgreso,
    etiquetasVisuales: visualImpacto.etiquetasVisuales,
    sonidos: visualImpacto.sonidos,
    exportacion: exportacionImpacto
  };

  const porcentajeGeneral = calcularPorcentajeGeneral(modulos, validacionFinal);
  const estadoGeneral = validacionFinal.ok ? 'completado' : 'error';

  return {
    ok: validacionFinal.ok,
    porcentajeGeneral,
    estadoGeneral,
    estadoGeneralEtiqueta: etiquetaEstado(estadoGeneral),
    resumen: crearResumenEjecutivo({ porcentajeGeneral, modulos, validacionFinal }),
    modulos,
    validacionFinal,
    entregaFinal: {
      ok: validacionFinal.ok,
      porcentaje: validacionFinal.porcentajeEntrega,
      estado: validacionFinal.estado,
      errores: validacionFinal.errores || []
    },
    proyectoId: entrada?.proyecto?.id || null,
    historialCantidad: Array.isArray(historial) ? historial.length : 0,
    creadoEn: new Date().toISOString()
  };
}

export default { crearReporteImpactoEdicion };
