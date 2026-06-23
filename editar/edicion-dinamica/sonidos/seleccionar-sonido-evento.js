import { SONIDOS_EDICION } from './sonidos.config.js';

export function seleccionarSonidoParaEvento(evento = {}) {
  const tipo = String(evento.tipo || '').toLowerCase();

  if (tipo.includes('texto-flotante')) {
    return SONIDOS_EDICION.POP;
  }

  if (tipo.includes('etiqueta')) {
    return SONIDOS_EDICION.CLICK;
  }

  if (tipo.includes('punch')) {
    return SONIDOS_EDICION.HIT;
  }

  if (tipo.includes('zoom')) {
    return SONIDOS_EDICION.WHOOSH;
  }

  if (tipo.includes('intro') || tipo.includes('titulo')) {
    return SONIDOS_EDICION.INTRO;
  }

  if (tipo.includes('outro') || tipo.includes('cierre')) {
    return SONIDOS_EDICION.OUTRO;
  }

  return SONIDOS_EDICION.POP;
}

export default seleccionarSonidoParaEvento;
