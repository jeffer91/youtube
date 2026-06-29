import { SONIDOS_EDICION } from './sonidos.config.js';

function limpiar(valor = '') {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function normalizarNombreSonido(valor = '') {
  const base = limpiar(valor);

  if (base.includes('whoosh') || base.includes('swish') || base.includes('desliz') || base.includes('barrido')) return SONIDOS_EDICION.WHOOSH;
  if (base.includes('riser') || base.includes('rise') || base.includes('subida') || base.includes('tension')) return SONIDOS_EDICION.RISER;
  if (base.includes('hit') || base.includes('impact') || base.includes('golpe') || base.includes('boom')) return SONIDOS_EDICION.HIT;
  if (base.includes('click') || base.includes('tap') || base.includes('clic')) return SONIDOS_EDICION.CLICK;
  if (base.includes('notification') || base.includes('notificacion') || base.includes('notify')) return SONIDOS_EDICION.NOTIFICATION;
  if (base.includes('beep') || base.includes('bip')) return SONIDOS_EDICION.BEEP;
  if (base.includes('intro') || base.includes('entrada')) return SONIDOS_EDICION.INTRO;
  if (base.includes('outro') || base.includes('cierre') || base.includes('final')) return SONIDOS_EDICION.OUTRO;
  if (base.includes('pop') || base.includes('popup')) return SONIDOS_EDICION.POP;

  return '';
}

export function seleccionarSonidoParaEvento(evento = {}) {
  const solicitado = normalizarNombreSonido(evento.sonido || evento.audio || evento.tipoSonido || evento.nombre || evento.texto || evento.efecto || evento.transicion);
  if (solicitado) return solicitado;

  const tipo = limpiar(evento.tipo || '');

  if (tipo.includes('texto-flotante') || tipo.includes('texto-plan') || tipo.includes('subtitulo')) return SONIDOS_EDICION.POP;
  if (tipo.includes('etiqueta')) return SONIDOS_EDICION.CLICK;
  if (tipo.includes('punch') || tipo.includes('impact') || tipo.includes('hit')) return SONIDOS_EDICION.HIT;
  if (tipo.includes('zoom')) return SONIDOS_EDICION.WHOOSH;
  if (tipo.includes('riser')) return SONIDOS_EDICION.RISER;
  if (tipo.includes('notification')) return SONIDOS_EDICION.NOTIFICATION;
  if (tipo.includes('beep')) return SONIDOS_EDICION.BEEP;
  if (tipo.includes('transicion') || tipo.includes('transition')) return SONIDOS_EDICION.WHOOSH;
  if (tipo.includes('intro') || tipo.includes('titulo')) return SONIDOS_EDICION.INTRO;
  if (tipo.includes('outro') || tipo.includes('cierre')) return SONIDOS_EDICION.OUTRO;

  return SONIDOS_EDICION.POP;
}

export default seleccionarSonidoParaEvento;
