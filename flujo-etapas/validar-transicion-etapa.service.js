/*
  Bloque 3: Estado de proyecto por etapas
  Función: validar que el proyecto avance de forma ordenada entre pantallas/procesos.
*/

import { ETAPAS_AUTOVIDEO, ORDEN_ETAPAS_AUTOVIDEO, etapaEsValida, obtenerIndiceEtapa, obtenerSiguienteEtapa } from './estado-proyecto.modelo.js';

export function validarTransicionEtapa({ etapaActual, etapaDestino, permitirRetroceso = true, permitirMismaEtapa = true } = {}) {
  if (!etapaEsValida(etapaActual)) {
    return {
      ok: false,
      mensaje: `Etapa actual inválida: ${etapaActual || 'sin etapa'}`,
      etapaActual,
      etapaDestino
    };
  }

  if (!etapaEsValida(etapaDestino)) {
    return {
      ok: false,
      mensaje: `Etapa destino inválida: ${etapaDestino || 'sin etapa'}`,
      etapaActual,
      etapaDestino
    };
  }

  if (permitirMismaEtapa && etapaActual === etapaDestino) {
    return {
      ok: true,
      tipo: 'misma-etapa',
      mensaje: 'La transición permanece en la misma etapa.',
      etapaActual,
      etapaDestino
    };
  }

  const indiceActual = obtenerIndiceEtapa(etapaActual);
  const indiceDestino = obtenerIndiceEtapa(etapaDestino);
  const siguienteEsperada = obtenerSiguienteEtapa(etapaActual);

  if (indiceDestino === indiceActual + 1) {
    return {
      ok: true,
      tipo: 'avance',
      mensaje: 'Transición válida hacia la siguiente etapa.',
      etapaActual,
      etapaDestino,
      siguienteEsperada
    };
  }

  if (permitirRetroceso && indiceDestino < indiceActual) {
    return {
      ok: true,
      tipo: 'retroceso',
      mensaje: 'Transición válida hacia una etapa anterior para revisión.',
      etapaActual,
      etapaDestino,
      siguienteEsperada
    };
  }

  return {
    ok: false,
    tipo: 'salto-no-permitido',
    mensaje: `No se puede saltar de ${etapaActual} a ${etapaDestino}. La siguiente etapa esperada es ${siguienteEsperada || ETAPAS_AUTOVIDEO.RESULTADO}.`,
    etapaActual,
    etapaDestino,
    ordenPermitido: ORDEN_ETAPAS_AUTOVIDEO
  };
}

export function exigirTransicionEtapa(argumentos = {}) {
  const validacion = validarTransicionEtapa(argumentos);
  if (!validacion.ok) throw new Error(validacion.mensaje);
  return validacion;
}
