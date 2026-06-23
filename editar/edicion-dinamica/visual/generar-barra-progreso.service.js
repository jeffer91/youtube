function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

export function generarFiltroBarraProgreso({ duracionSegundos = 0, alto = 10, color = 'white@0.40', opciones = {} } = {}) {
  if (opciones?.agregarBarraProgreso === false) {
    return { ok: true, omitido: true, filtro: null, mensaje: 'Barra de progreso desactivada.' };
  }

  const duracion = numero(duracionSegundos, 0);

  if (duracion <= 0) {
    return { ok: true, omitido: true, filtro: null, mensaje: 'Barra de progreso omitida porque no hay duración válida.' };
  }

  const altoFinal = Math.max(4, Math.min(24, Math.round(numero(alto, 10))));
  const filtro = `drawbox=x=0:y=0:w='iw*min(t/${duracion.toFixed(3)}\\,1)':h=${altoFinal}:color=${color}:t=fill`;

  return {
    ok: true,
    omitido: false,
    filtro,
    alto: altoFinal,
    duracionSegundos: duracion,
    mensaje: 'Barra de progreso dinámica generada.'
  };
}

export default generarFiltroBarraProgreso;
