/*
  Modulo: textos
  Funcion: posicionar textos, graficos y tablas en zonas seguras.
*/

export function calcularPosicionTexto({ plataforma = {}, sujeto = {}, tipo = 'frase' } = {}) {
  const width = plataforma.width || 1080;
  const height = plataforma.height || 1920;
  const zona = plataforma.zonaSegura || { top: 150, bottom: 260, left: 80, right: 80 };
  const sujetoCentro = sujeto.zona === 'centro' || sujeto.ocupaCentro === true;

  if (tipo === 'grafico' || tipo === 'tabla') {
    return {
      x: Math.round(width / 2),
      y: sujetoCentro ? zona.top + 140 : Math.round(height * 0.42),
      maxWidth: width - zona.left - zona.right,
      zona: sujetoCentro ? 'superior_segura' : 'centro_seguro'
    };
  }

  return {
    x: Math.round(width / 2),
    y: sujetoCentro ? zona.top + 110 : Math.round(height * 0.25),
    maxWidth: width - zona.left - zona.right,
    zona: sujetoCentro ? 'superior_segura' : 'tercio_superior'
  };
}

export function aplicarPosicionesTextos({ textos = [], plataforma = {}, sujeto = {} } = {}) {
  return textos.map((texto) => ({
    ...texto,
    posicion: calcularPosicionTexto({ plataforma, sujeto, tipo: texto.tipo })
  }));
}
