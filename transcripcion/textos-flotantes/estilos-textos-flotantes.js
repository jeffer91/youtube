import { ESTILOS_TEXTOS_FLOTANTES, normalizarTexto } from '../transcripcion.config.js';

export const POSICIONES_TEXTO_FLOTANTE = Object.freeze({
  ARRIBA: 'arriba',
  CENTRO: 'centro',
  ABAJO: 'abajo'
});

export const ESTILOS_VISUALES_TEXTOS = Object.freeze({
  [ESTILOS_TEXTOS_FLOTANTES.BADGE]: Object.freeze({
    nombre: 'badge',
    fontSize: 54,
    fontColor: 'white',
    box: 1,
    boxColor: 'black@0.72',
    boxBorderW: 24,
    borderW: 2,
    borderColor: 'black',
    shadowColor: 'black',
    shadowX: 2,
    shadowY: 2,
    x: '(w-text_w)/2',
    yArriba: '170',
    yCentro: '(h-text_h)/2-180',
    yAbajo: 'h-430'
  }),
  [ESTILOS_TEXTOS_FLOTANTES.IMPACTO]: Object.freeze({
    nombre: 'impacto',
    fontSize: 68,
    fontColor: 'white',
    box: 1,
    boxColor: 'black@0.55',
    boxBorderW: 28,
    borderW: 4,
    borderColor: 'black',
    shadowColor: 'black',
    shadowX: 3,
    shadowY: 3,
    x: '(w-text_w)/2',
    yArriba: '150',
    yCentro: '(h-text_h)/2-130',
    yAbajo: 'h-455'
  }),
  [ESTILOS_TEXTOS_FLOTANTES.ELEGANTE]: Object.freeze({
    nombre: 'elegante',
    fontSize: 48,
    fontColor: 'white',
    box: 1,
    boxColor: 'black@0.45',
    boxBorderW: 18,
    borderW: 1,
    borderColor: 'black',
    shadowColor: 'black',
    shadowX: 1,
    shadowY: 1,
    x: '(w-text_w)/2',
    yArriba: '190',
    yCentro: '(h-text_h)/2-160',
    yAbajo: 'h-410'
  }),
  [ESTILOS_TEXTOS_FLOTANTES.ALERTA]: Object.freeze({
    nombre: 'alerta',
    fontSize: 58,
    fontColor: 'yellow',
    box: 1,
    boxColor: 'black@0.75',
    boxBorderW: 24,
    borderW: 3,
    borderColor: 'black',
    shadowColor: 'black',
    shadowX: 3,
    shadowY: 3,
    x: '(w-text_w)/2',
    yArriba: '165',
    yCentro: '(h-text_h)/2-150',
    yAbajo: 'h-440'
  })
});

export function obtenerEstiloTextoFlotante(estiloSolicitado) {
  const estilo = normalizarTexto(estiloSolicitado, ESTILOS_TEXTOS_FLOTANTES.BADGE).toLowerCase();
  return ESTILOS_VISUALES_TEXTOS[estilo] || ESTILOS_VISUALES_TEXTOS[ESTILOS_TEXTOS_FLOTANTES.BADGE];
}

export function obtenerYPorPosicion(estiloVisual, posicion) {
  const limpia = normalizarTexto(posicion, POSICIONES_TEXTO_FLOTANTE.ARRIBA).toLowerCase();
  if (limpia === POSICIONES_TEXTO_FLOTANTE.CENTRO) return estiloVisual.yCentro;
  if (limpia === POSICIONES_TEXTO_FLOTANTE.ABAJO) return estiloVisual.yAbajo;
  return estiloVisual.yArriba;
}

export function posicionPermitida(posicion) {
  const limpia = normalizarTexto(posicion, '').toLowerCase();
  return Object.values(POSICIONES_TEXTO_FLOTANTE).includes(limpia);
}

export default ESTILOS_VISUALES_TEXTOS;
