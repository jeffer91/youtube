/*
  Modulo: visual
  Funcion: preparar lectura del sujeto principal en pantalla.
*/

export function detectarSujeto(datos = {}, opciones = {}) {
  const video = datos.video || {};
  const width = Number(video.width || opciones.width || 1080);
  const height = Number(video.height || opciones.height || 1920);
  const centroX = Number(datos.sujeto?.x ?? width / 2);
  const centroY = Number(datos.sujeto?.y ?? height / 2);
  const ancho = Number(datos.sujeto?.ancho ?? width * 0.48);
  const alto = Number(datos.sujeto?.alto ?? height * 0.58);

  const zona = centroY > height * 0.62 ? 'inferior' : centroY < height * 0.38 ? 'superior' : 'centro';

  return {
    ok: true,
    detectado: true,
    caja: {
      x: Math.round(centroX - ancho / 2),
      y: Math.round(centroY - alto / 2),
      ancho: Math.round(ancho),
      alto: Math.round(alto)
    },
    centro: { x: Math.round(centroX), y: Math.round(centroY) },
    zona,
    ocupaCentro: zona === 'centro',
    ocupaZonaInferior: zona === 'inferior',
    confianza: Number(datos.sujeto?.confianza ?? 0.75),
    creadoEn: new Date().toISOString()
  };
}

export function resumirSujeto(sujeto = {}) {
  return {
    detectado: Boolean(sujeto.detectado),
    zona: sujeto.zona || 'desconocida',
    caja: sujeto.caja || null,
    confianza: sujeto.confianza || 0
  };
}
