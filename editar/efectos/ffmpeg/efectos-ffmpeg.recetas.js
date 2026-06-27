/*
  Bloque 4: Compilador FFmpeg de efectos
  Funcion: traducir ids del catalogo a recetas renderizables.
*/

export const TIPOS_RECETA_FFMPEG = Object.freeze({
  ZOOM: 'zoom',
  COLOR: 'color',
  TEXTO: 'texto',
  CAJA: 'caja',
  BARRA: 'barra',
  FADE: 'fade',
  VINETA: 'vineta',
  NITIDEZ: 'nitidez',
  BLUR: 'blur',
  MARCA: 'marca'
});

function receta(id, tipo, config = {}) {
  return Object.freeze({ id, tipo, ...config });
}

export const RECETAS_FFMPEG_EFECTOS = Object.freeze({
  zoom_suave: receta('zoom_suave', TIPOS_RECETA_FFMPEG.ZOOM, { factor: 0.982 }),
  zoom_deportivo: receta('zoom_deportivo', TIPOS_RECETA_FFMPEG.ZOOM, { factor: 0.965 }),
  punch_in_fuerte: receta('punch_in_fuerte', TIPOS_RECETA_FFMPEG.ZOOM, { factor: 0.958 }),
  punch_in_suave: receta('punch_in_suave', TIPOS_RECETA_FFMPEG.ZOOM, { factor: 0.976 }),
  zoom_out_cierre: receta('zoom_out_cierre', TIPOS_RECETA_FFMPEG.ZOOM, { factor: 0.988 }),
  micro_movimiento: receta('micro_movimiento', TIPOS_RECETA_FFMPEG.ZOOM, { factor: 0.986 }),
  paneo_izquierda: receta('paneo_izquierda', TIPOS_RECETA_FFMPEG.ZOOM, { factor: 0.984 }),
  paneo_derecha: receta('paneo_derecha', TIPOS_RECETA_FFMPEG.ZOOM, { factor: 0.984 }),
  reencuadre_rostro: receta('reencuadre_rostro', TIPOS_RECETA_FFMPEG.ZOOM, { factor: 0.972 }),

  color_futbol_vibrante: receta('color_futbol_vibrante', TIPOS_RECETA_FFMPEG.COLOR, { contraste: 1.14, saturacion: 1.22, brillo: 0.015 }),
  color_cine_contraste: receta('color_cine_contraste', TIPOS_RECETA_FFMPEG.COLOR, { contraste: 1.10, saturacion: 0.94, brillo: -0.006 }),
  color_anime_vivo: receta('color_anime_vivo', TIPOS_RECETA_FFMPEG.COLOR, { contraste: 1.18, saturacion: 1.32, brillo: 0.018 }),
  color_institucional_limpio: receta('color_institucional_limpio', TIPOS_RECETA_FFMPEG.COLOR, { contraste: 1.06, saturacion: 1.04, brillo: 0.010 }),
  color_educacion_claro: receta('color_educacion_claro', TIPOS_RECETA_FFMPEG.COLOR, { contraste: 1.08, saturacion: 1.08, brillo: 0.012 }),
  brillo_controlado: receta('brillo_controlado', TIPOS_RECETA_FFMPEG.COLOR, { contraste: 1.04, saturacion: 1.03, brillo: 0.020 }),
  tono_calido: receta('tono_calido', TIPOS_RECETA_FFMPEG.COLOR, { contraste: 1.05, saturacion: 1.10, brillo: 0.012 }),
  tono_frio_profesional: receta('tono_frio_profesional', TIPOS_RECETA_FFMPEG.COLOR, { contraste: 1.05, saturacion: 0.96, brillo: 0.008 }),

  nitidez_rostro: receta('nitidez_rostro', TIPOS_RECETA_FFMPEG.NITIDEZ, { fuerza: 0.32 }),
  vineta_suave: receta('vineta_suave', TIPOS_RECETA_FFMPEG.VINETA, { fuerza: 0.22 }),

  titulo_inicial: receta('titulo_inicial', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'superior', tamano: 52 }),
  palabra_clave: receta('palabra_clave', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'centro', tamano: 58 }),
  texto_impacto: receta('texto_impacto', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'centro', tamano: 64 }),
  dato_rapido: receta('dato_rapido', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'inferior', tamano: 46 }),
  pregunta_en_pantalla: receta('pregunta_en_pantalla', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'centro', tamano: 54 }),
  marcador_futbol: receta('marcador_futbol', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'superior', tamano: 46 }),
  frase_destacada: receta('frase_destacada', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'centro', tamano: 50 }),
  aviso_importante: receta('aviso_importante', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'superior', tamano: 48 }),
  cta_final: receta('cta_final', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'inferior', tamano: 48 }),
  etiqueta_seccion: receta('etiqueta_seccion', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'superior', tamano: 44 }),

  barra_progreso: receta('barra_progreso', TIPOS_RECETA_FFMPEG.BARRA, { alto: 12 }),
  borde_deportivo: receta('borde_deportivo', TIPOS_RECETA_FFMPEG.CAJA, { grosor: 8, opacidad: 0.18 }),
  borde_institucional: receta('borde_institucional', TIPOS_RECETA_FFMPEG.CAJA, { grosor: 5, opacidad: 0.08 }),
  sombra_inferior: receta('sombra_inferior', TIPOS_RECETA_FFMPEG.CAJA, { zona: 'inferior', opacidad: 0.30 }),
  fondo_blur: receta('fondo_blur', TIPOS_RECETA_FFMPEG.BLUR, { radio: 8 }),
  tarjeta_resumen: receta('tarjeta_resumen', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'inferior', tamano: 44 }),
  lower_third: receta('lower_third', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'inferior', tamano: 42 }),
  bloque_contexto: receta('bloque_contexto', TIPOS_RECETA_FFMPEG.TEXTO, { posicion: 'superior', tamano: 42 }),

  fade_in: receta('fade_in', TIPOS_RECETA_FFMPEG.FADE, { modo: 'in' }),
  fade_out: receta('fade_out', TIPOS_RECETA_FFMPEG.FADE, { modo: 'out' }),
  flash_suave: receta('flash_suave', TIPOS_RECETA_FFMPEG.COLOR, { contraste: 1.12, saturacion: 1.08, brillo: 0.035 }),
  cambio_color_momento: receta('cambio_color_momento', TIPOS_RECETA_FFMPEG.COLOR, { contraste: 1.12, saturacion: 1.14, brillo: 0.010 }),

  cierre_visual_marca: receta('cierre_visual_marca', TIPOS_RECETA_FFMPEG.MARCA, { texto: 'AutoVideoJeff' }),
  marca_esquina: receta('marca_esquina', TIPOS_RECETA_FFMPEG.MARCA, { texto: 'AutoVideoJeff' }),
  identidad_perfil: receta('identidad_perfil', TIPOS_RECETA_FFMPEG.MARCA, { texto: 'AutoVideoJeff' })
});

export function obtenerRecetaFfmpeg(efectoId) {
  return RECETAS_FFMPEG_EFECTOS[String(efectoId || '').trim()] || null;
}

export function tieneRecetaFfmpeg(efectoId) {
  return Boolean(obtenerRecetaFfmpeg(efectoId));
}
