/*
  Modulo: subtitulos
  Funcion: calcular posicion segura para no tapar al sujeto.
*/

function obtenerFormato(plataforma = {}) {
  if (plataforma.formato === '16:9') return 'horizontal';
  if (plataforma.formato === '1:1') return 'cuadrado';
  return 'vertical';
}

export function calcularPosicionSubtitulos({ plataforma = {}, sujeto = {}, preferencia = null } = {}) {
  const formato = obtenerFormato(plataforma);
  const width = plataforma.width || 1080;
  const height = plataforma.height || 1920;
  const zonaSegura = plataforma.zonaSegura || { top: 160, bottom: 280, left: 80, right: 80 };
  const ocupaInferior = sujeto.zona === 'inferior' || sujeto.ocupaZonaInferior === true;

  let y = height - zonaSegura.bottom;
  let alineacion = 'center';
  let zona = 'inferior_segura';

  if (ocupaInferior || preferencia === 'superior') {
    y = zonaSegura.top + Math.round(height * 0.12);
    zona = 'superior_segura';
  }

  if (formato === 'horizontal') {
    y = ocupaInferior ? zonaSegura.top + 120 : height - zonaSegura.bottom;
  }

  return {
    x: Math.round(width / 2),
    y,
    maxWidth: width - zonaSegura.left - zonaSegura.right,
    alineacion,
    zona,
    formato,
    evitaSujeto: true
  };
}
