/*
  Modulo: visual
  Funcion: estimar zona del rostro para cuidar recortes y textos.
*/

export function detectarRostro(datos = {}, sujeto = {}) {
  const caja = sujeto.caja || {};
  const ancho = Number(caja.ancho || 360);
  const alto = Number(caja.alto || 720);
  const x = Number(caja.x || 0);
  const y = Number(caja.y || 0);

  const rostro = datos.rostro || {
    x: x + ancho * 0.5,
    y: y + alto * 0.22,
    ancho: ancho * 0.34,
    alto: alto * 0.22,
    confianza: 0.72
  };

  return {
    ok: true,
    detectado: true,
    caja: {
      x: Math.round(Number(rostro.x) - Number(rostro.ancho) / 2),
      y: Math.round(Number(rostro.y) - Number(rostro.alto) / 2),
      ancho: Math.round(Number(rostro.ancho)),
      alto: Math.round(Number(rostro.alto))
    },
    centro: { x: Math.round(Number(rostro.x)), y: Math.round(Number(rostro.y)) },
    confianza: Number(rostro.confianza ?? 0.72),
    creadoEn: new Date().toISOString()
  };
}
