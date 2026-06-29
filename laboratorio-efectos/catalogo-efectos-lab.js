/*
  Laboratorio de efectos - Bloque 1
  Función: catálogo único para probar un solo efecto sobre un video corto.
  Este archivo no renderiza todavía; define categorías, efectos, explicación esperada y metadatos para UI/API.
*/

export const VERSION_CATALOGO_EFECTOS_LAB = '1.0.0';

export const CATEGORIAS_LABORATORIO_EFECTOS = Object.freeze([
  {
    id: 'zooms',
    nombre: 'Zooms',
    descripcion: 'Acercamientos, alejamiento y énfasis de cámara para revisar si el movimiento se ve claro.',
    orden: 1
  },
  {
    id: 'impactos',
    nombre: 'Impactos',
    descripcion: 'Golpes visuales rápidos para probar energía, shake, flash y énfasis fuerte.',
    orden: 2
  },
  {
    id: 'transiciones',
    nombre: 'Transiciones',
    descripcion: 'Cambios visibles entre momentos: flash, barras, barrido y corte con estilo.',
    orden: 3
  },
  {
    id: 'movimiento',
    nombre: 'Movimiento',
    descripcion: 'Sensación de cámara activa: paneo, pulso, foco central y movimiento suave.',
    orden: 4
  },
  {
    id: 'color-luz',
    nombre: 'Color / luz',
    descripcion: 'Correcciones y looks visibles: cine, viñeta, contraste, blanco y negro.',
    orden: 5
  },
  {
    id: 'texto-simple',
    nombre: 'Texto simple',
    descripcion: 'Textos de prueba quemados en el video para validar títulos, lower thirds y etiquetas.',
    orden: 6
  },
  {
    id: 'cine-redes',
    nombre: 'Cine / redes',
    descripcion: 'Recursos vistosos para contenido corto: barras, etiqueta viral, pulso y look social.',
    orden: 7
  }
]);

export const EFECTOS_LABORATORIO = Object.freeze([
  {
    id: 'zoom-in-centro',
    categoriaId: 'zooms',
    nombre: 'Zoom in centro',
    descripcion: 'Acercamiento suave hacia el centro del video.',
    queDebeSalir: 'El video debe acercarse ligeramente hacia el centro durante casi todo el clip, sin cortar bordes importantes.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.3,
    intensidadBase: 'normal',
    tipoRender: 'movimiento',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { zoomInicial: 1.0, zoomFinal: 1.12, suavidad: 'lineal' },
    tags: ['zoom', 'camara', 'enfasis']
  },
  {
    id: 'zoom-out-centro',
    categoriaId: 'zooms',
    nombre: 'Zoom out centro',
    descripcion: 'Empieza más cerca y se aleja suavemente.',
    queDebeSalir: 'El clip debe iniciar levemente acercado y luego abrirse hasta el encuadre normal.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.2,
    intensidadBase: 'suave',
    tipoRender: 'movimiento',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { zoomInicial: 1.14, zoomFinal: 1.0, suavidad: 'lineal' },
    tags: ['zoom', 'salida', 'camara']
  },
  {
    id: 'zoom-pulso',
    categoriaId: 'zooms',
    nombre: 'Zoom pulso',
    descripcion: 'Pequeños pulsos de zoom para dar ritmo.',
    queDebeSalir: 'El video debe respirar con acercamientos cortos y suaves, como un pulso visual.',
    duracionSugeridaSegundos: 12,
    segundoInicioPrueba: 0.5,
    intensidadBase: 'normal',
    tipoRender: 'movimiento',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { amplitud: 0.055, periodo: 2.2 },
    tags: ['zoom', 'pulso', 'ritmo']
  },
  {
    id: 'punch-in-rapido',
    categoriaId: 'zooms',
    nombre: 'Punch in rápido',
    descripcion: 'Acercamiento rápido en un momento puntual.',
    queDebeSalir: 'En el segundo indicado debe verse un acercamiento rápido por menos de un segundo y luego volver al encuadre normal.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 2.0,
    intensidadBase: 'fuerte',
    tipoRender: 'movimiento-overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { zoom: 1.18, duracion: 0.75 },
    tags: ['punch', 'zoom', 'impacto']
  },
  {
    id: 'zoom-dramatico-final',
    categoriaId: 'zooms',
    nombre: 'Zoom dramático final',
    descripcion: 'Acercamiento progresivo para cerrar el clip.',
    queDebeSalir: 'En los últimos segundos debe verse un acercamiento más notorio, útil para remates o frases fuertes.',
    duracionSugeridaSegundos: 12,
    segundoInicioPrueba: 7.5,
    intensidadBase: 'fuerte',
    tipoRender: 'movimiento',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { zoomInicial: 1.0, zoomFinal: 1.22, soloFinal: true },
    tags: ['zoom', 'drama', 'final']
  },
  {
    id: 'shake-suave',
    categoriaId: 'impactos',
    nombre: 'Shake suave',
    descripcion: 'Temblor corto y controlado.',
    queDebeSalir: 'Durante el impacto debe notarse una vibración ligera, sin deformar demasiado el video.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 2.0,
    intensidadBase: 'normal',
    tipoRender: 'movimiento-overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { amplitudPixeles: 10, duracion: 0.55 },
    tags: ['shake', 'impacto', 'golpe']
  },
  {
    id: 'flash-blanco-impacto',
    categoriaId: 'impactos',
    nombre: 'Flash blanco impacto',
    descripcion: 'Destello blanco rápido sobre toda la pantalla.',
    queDebeSalir: 'Debe aparecer un flash blanco breve que cubre la pantalla y desaparece rápido.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 2.0,
    intensidadBase: 'normal',
    tipoRender: 'overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { color: 'white@0.55', duracion: 0.45 },
    tags: ['flash', 'impacto', 'luz']
  },
  {
    id: 'golpe-rojo',
    categoriaId: 'impactos',
    nombre: 'Golpe rojo',
    descripcion: 'Flash rojo con sensación de alerta.',
    queDebeSalir: 'Debe verse un golpe rojo breve en pantalla, útil para errores, polémica o alerta.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 2.2,
    intensidadBase: 'fuerte',
    tipoRender: 'overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { color: 'red@0.38', duracion: 0.5 },
    tags: ['rojo', 'alerta', 'impacto']
  },
  {
    id: 'explosion-texto-boom',
    categoriaId: 'impactos',
    nombre: 'Explosión texto BOOM',
    descripcion: 'Texto grande de impacto en el centro.',
    queDebeSalir: 'Debe aparecer un texto grande tipo BOOM en el centro, con borde fuerte y sensación de golpe.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 1.5,
    intensidadBase: 'fuerte',
    tipoRender: 'texto-overlay',
    compatibleFfmpeg: true,
    requiereTexto: true,
    textoPrueba: 'BOOM',
    parametros: { fuenteTamano: 82, duracion: 0.9, posicion: 'centro' },
    tags: ['texto', 'boom', 'impacto']
  },
  {
    id: 'flash-barras-cine',
    categoriaId: 'impactos',
    nombre: 'Flash + barras cine',
    descripcion: 'Destello con líneas superiores e inferiores.',
    queDebeSalir: 'Debe verse un flash rápido y dos barras horizontales blancas cerca de la parte superior e inferior.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 2.0,
    intensidadBase: 'normal',
    tipoRender: 'overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { barras: true, duracion: 0.55 },
    tags: ['barras', 'flash', 'cine']
  },
  {
    id: 'transicion-flash-blanco',
    categoriaId: 'transiciones',
    nombre: 'Transición flash blanco',
    descripcion: 'Flash blanco para simular cambio de escena.',
    queDebeSalir: 'A mitad del clip debe aparecer un flash blanco breve como si hubiera cambiado de bloque.',
    duracionSugeridaSegundos: 12,
    segundoInicioPrueba: 5.5,
    intensidadBase: 'normal',
    tipoRender: 'overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { color: 'white@0.60', duracion: 0.5 },
    tags: ['transicion', 'flash', 'cambio']
  },
  {
    id: 'transicion-fundido-negro',
    categoriaId: 'transiciones',
    nombre: 'Fundido negro breve',
    descripcion: 'Oscurecimiento rápido para separar partes.',
    queDebeSalir: 'Debe oscurecerse el video por un instante y luego volver a la imagen normal.',
    duracionSugeridaSegundos: 12,
    segundoInicioPrueba: 5.0,
    intensidadBase: 'suave',
    tipoRender: 'overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { color: 'black@0.62', duracion: 0.65 },
    tags: ['transicion', 'negro', 'fundido']
  },
  {
    id: 'transicion-barras-horizontales',
    categoriaId: 'transiciones',
    nombre: 'Barras horizontales',
    descripcion: 'Dos líneas rápidas cruzan visualmente el cambio.',
    queDebeSalir: 'Deben aparecer barras horizontales arriba y abajo durante el cambio.',
    duracionSugeridaSegundos: 12,
    segundoInicioPrueba: 5.5,
    intensidadBase: 'normal',
    tipoRender: 'overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { grosor: 20, duracion: 0.6 },
    tags: ['transicion', 'barras', 'horizontal']
  },
  {
    id: 'transicion-glitch-rgb',
    categoriaId: 'transiciones',
    nombre: 'Glitch RGB simple',
    descripcion: 'Look de error digital con cambio de color.',
    queDebeSalir: 'Debe verse un parpadeo de color tipo glitch digital en el momento de transición.',
    duracionSugeridaSegundos: 12,
    segundoInicioPrueba: 5.2,
    intensidadBase: 'fuerte',
    tipoRender: 'color-overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { color: 'magenta@0.22', duracion: 0.55, ruido: 'suave' },
    tags: ['glitch', 'rgb', 'transicion']
  },
  {
    id: 'transicion-wipe-lateral',
    categoriaId: 'transiciones',
    nombre: 'Wipe lateral simple',
    descripcion: 'Barrido lateral visible.',
    queDebeSalir: 'Debe verse una franja que cruza de izquierda a derecha como barrido de cambio.',
    duracionSugeridaSegundos: 12,
    segundoInicioPrueba: 5.0,
    intensidadBase: 'normal',
    tipoRender: 'overlay-animado',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { direccion: 'izquierda-derecha', duracion: 0.7 },
    tags: ['wipe', 'transicion', 'barrido']
  },
  {
    id: 'paneo-suave-horizontal',
    categoriaId: 'movimiento',
    nombre: 'Paneo suave horizontal',
    descripcion: 'Movimiento sutil de cámara de izquierda a derecha.',
    queDebeSalir: 'El encuadre debe moverse suavemente hacia un lado sin saltos bruscos.',
    duracionSugeridaSegundos: 12,
    segundoInicioPrueba: 0.0,
    intensidadBase: 'suave',
    tipoRender: 'movimiento',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { direccion: 'horizontal', desplazamiento: 28 },
    tags: ['paneo', 'camara', 'movimiento']
  },
  {
    id: 'pulso-camara-suave',
    categoriaId: 'movimiento',
    nombre: 'Pulso cámara suave',
    descripcion: 'Movimiento de respiración lento.',
    queDebeSalir: 'La cámara debe moverse con un pulso casi imperceptible, más elegante que el zoom pulso.',
    duracionSugeridaSegundos: 12,
    segundoInicioPrueba: 0.0,
    intensidadBase: 'suave',
    tipoRender: 'movimiento',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { amplitud: 0.025, periodo: 3.5 },
    tags: ['pulso', 'suave', 'camara']
  },
  {
    id: 'foco-centro',
    categoriaId: 'movimiento',
    nombre: 'Foco centro',
    descripcion: 'Oscurece bordes para dirigir atención al centro.',
    queDebeSalir: 'Los bordes deben verse ligeramente oscuros y la atención debe quedar en el centro.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.0,
    intensidadBase: 'normal',
    tipoRender: 'color-overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { vignette: 0.35 },
    tags: ['foco', 'centro', 'viñeta']
  },
  {
    id: 'rebote-mini',
    categoriaId: 'movimiento',
    nombre: 'Rebote mini',
    descripcion: 'Pequeño rebote visual como énfasis.',
    queDebeSalir: 'Debe verse un pequeño rebote o salto visual durante menos de un segundo.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 2.5,
    intensidadBase: 'normal',
    tipoRender: 'movimiento-overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { amplitud: 14, duracion: 0.8 },
    tags: ['rebote', 'movimiento', 'enfasis']
  },
  {
    id: 'camara-energia-redes',
    categoriaId: 'movimiento',
    nombre: 'Cámara energía redes',
    descripcion: 'Pulso de cámara más activo para video corto.',
    queDebeSalir: 'Debe sentirse más dinámico, con movimiento sutil pero constante de cámara.',
    duracionSugeridaSegundos: 12,
    segundoInicioPrueba: 0.0,
    intensidadBase: 'fuerte',
    tipoRender: 'movimiento',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { amplitud: 0.06, periodo: 1.8 },
    tags: ['redes', 'energia', 'camara']
  },
  {
    id: 'look-cine-calido',
    categoriaId: 'color-luz',
    nombre: 'Look cine cálido',
    descripcion: 'Color cálido con contraste moderado.',
    queDebeSalir: 'El video debe verse más cálido, con una sensación tipo cine suave.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.0,
    intensidadBase: 'normal',
    tipoRender: 'color',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { saturacion: 1.12, contraste: 1.06, brillo: 0.01, temperatura: 'calida' },
    tags: ['cine', 'color', 'calido']
  },
  {
    id: 'blanco-negro-drama',
    categoriaId: 'color-luz',
    nombre: 'Blanco y negro drama',
    descripcion: 'Convierte el video a blanco y negro con contraste.',
    queDebeSalir: 'El clip debe verse en blanco y negro con más contraste, tipo momento dramático.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.0,
    intensidadBase: 'normal',
    tipoRender: 'color',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { saturacion: 0, contraste: 1.18 },
    tags: ['bn', 'drama', 'color']
  },
  {
    id: 'contraste-redes',
    categoriaId: 'color-luz',
    nombre: 'Contraste redes',
    descripcion: 'Aumenta contraste y nitidez visual percibida.',
    queDebeSalir: 'El video debe verse un poco más fuerte, con colores más vivos y mejor presencia.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.0,
    intensidadBase: 'normal',
    tipoRender: 'color',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { contraste: 1.16, saturacion: 1.18, brillo: 0.015 },
    tags: ['contraste', 'redes', 'color']
  },
  {
    id: 'viñeta-cine',
    categoriaId: 'color-luz',
    nombre: 'Viñeta cine',
    descripcion: 'Oscurece bordes para look cinematográfico.',
    queDebeSalir: 'Deben oscurecerse los bordes y el centro debe mantenerse visible.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.0,
    intensidadBase: 'suave',
    tipoRender: 'color-overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { vignette: 0.45 },
    tags: ['viñeta', 'cine', 'foco']
  },
  {
    id: 'luz-flash-suave',
    categoriaId: 'color-luz',
    nombre: 'Luz flash suave',
    descripcion: 'Destello luminoso ligero.',
    queDebeSalir: 'Debe sentirse un brillo temporal suave, no un flash agresivo.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 2.0,
    intensidadBase: 'suave',
    tipoRender: 'overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { color: 'white@0.24', duracion: 0.8 },
    tags: ['luz', 'flash', 'suave']
  },
  {
    id: 'titulo-centro-grande',
    categoriaId: 'texto-simple',
    nombre: 'Título centro grande',
    descripcion: 'Texto grande en el centro para validar drawtext.',
    queDebeSalir: 'Debe aparecer un título grande centrado con borde oscuro y lectura clara.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.8,
    intensidadBase: 'normal',
    tipoRender: 'texto-overlay',
    compatibleFfmpeg: true,
    requiereTexto: true,
    textoPrueba: 'TEXTO DE PRUEBA',
    parametros: { posicion: 'centro', fuenteTamano: 64, duracion: 2.2 },
    tags: ['texto', 'titulo', 'drawtext']
  },
  {
    id: 'lower-third-simple',
    categoriaId: 'texto-simple',
    nombre: 'Lower third simple',
    descripcion: 'Caja inferior con texto corto.',
    queDebeSalir: 'Debe aparecer una caja inferior con texto, como rótulo profesional.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 1.0,
    intensidadBase: 'normal',
    tipoRender: 'texto-overlay',
    compatibleFfmpeg: true,
    requiereTexto: true,
    textoPrueba: 'DATO CLAVE',
    parametros: { posicion: 'inferior', fuenteTamano: 46, duracion: 3.0, caja: true },
    tags: ['texto', 'lower-third', 'rotulo']
  },
  {
    id: 'subtitulo-muestra',
    categoriaId: 'texto-simple',
    nombre: 'Subtítulo muestra',
    descripcion: 'Subtítulo quemado en parte baja.',
    queDebeSalir: 'Debe verse una línea de subtítulo legible en la parte baja del video.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 1.0,
    intensidadBase: 'normal',
    tipoRender: 'texto-overlay',
    compatibleFfmpeg: true,
    requiereTexto: true,
    textoPrueba: 'Este es un subtítulo de prueba',
    parametros: { posicion: 'subtitulo', fuenteTamano: 42, duracion: 4.0 },
    tags: ['subtitulo', 'texto', 'lectura']
  },
  {
    id: 'etiqueta-superior',
    categoriaId: 'texto-simple',
    nombre: 'Etiqueta superior',
    descripcion: 'Badge pequeño arriba.',
    queDebeSalir: 'Debe aparecer una etiqueta pequeña arriba, tipo categoría o alerta.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.5,
    intensidadBase: 'suave',
    tipoRender: 'texto-overlay',
    compatibleFfmpeg: true,
    requiereTexto: true,
    textoPrueba: 'CLAVE',
    parametros: { posicion: 'superior', fuenteTamano: 34, duracion: 3.0, caja: true },
    tags: ['badge', 'texto', 'etiqueta']
  },
  {
    id: 'texto-alerta-rojo',
    categoriaId: 'texto-simple',
    nombre: 'Texto alerta rojo',
    descripcion: 'Texto de alerta con caja roja.',
    queDebeSalir: 'Debe aparecer una alerta roja clara, útil para advertencias o errores.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 1.2,
    intensidadBase: 'fuerte',
    tipoRender: 'texto-overlay',
    compatibleFfmpeg: true,
    requiereTexto: true,
    textoPrueba: 'ATENCIÓN',
    parametros: { posicion: 'centro', fuenteTamano: 58, duracion: 1.8, colorCaja: 'red@0.35' },
    tags: ['alerta', 'texto', 'rojo']
  },
  {
    id: 'formato-viral-gancho',
    categoriaId: 'cine-redes',
    nombre: 'Formato viral gancho',
    descripcion: 'Texto superior + pulso visual para abrir un clip.',
    queDebeSalir: 'Debe aparecer un texto superior fuerte y un pulso de cámara para simular apertura de video corto.',
    duracionSugeridaSegundos: 12,
    segundoInicioPrueba: 0.3,
    intensidadBase: 'fuerte',
    tipoRender: 'combo',
    compatibleFfmpeg: true,
    requiereTexto: true,
    textoPrueba: 'NO TE PIERDAS ESTO',
    parametros: { textoSuperior: true, pulso: true, duracionTexto: 2.4 },
    tags: ['viral', 'gancho', 'redes']
  },
  {
    id: 'barras-cinematograficas',
    categoriaId: 'cine-redes',
    nombre: 'Barras cinematográficas',
    descripcion: 'Barras negras superior e inferior.',
    queDebeSalir: 'Deben aparecer barras negras arriba y abajo, dando look cinematográfico.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.0,
    intensidadBase: 'normal',
    tipoRender: 'overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { barrasNegras: true, altoRelativo: 0.08 },
    tags: ['cine', 'barras', 'look']
  },
  {
    id: 'marco-social',
    categoriaId: 'cine-redes',
    nombre: 'Marco social',
    descripcion: 'Marco sutil tipo contenido social.',
    queDebeSalir: 'Debe verse un borde o marco suave alrededor del video.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.0,
    intensidadBase: 'suave',
    tipoRender: 'overlay',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { borde: true, grosor: 8, color: 'white@0.55' },
    tags: ['marco', 'social', 'redes']
  },
  {
    id: 'look-shorts-brillante',
    categoriaId: 'cine-redes',
    nombre: 'Look Shorts brillante',
    descripcion: 'Look más vivo para clips verticales.',
    queDebeSalir: 'El clip debe verse más brillante y vivo, sin cambiar la estructura del video.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.0,
    intensidadBase: 'normal',
    tipoRender: 'color',
    compatibleFfmpeg: true,
    requiereTexto: false,
    parametros: { brillo: 0.025, saturacion: 1.20, contraste: 1.10 },
    tags: ['shorts', 'brillo', 'redes']
  },
  {
    id: 'callout-superior',
    categoriaId: 'cine-redes',
    nombre: 'Callout superior',
    descripcion: 'Texto corto arriba con caja llamativa.',
    queDebeSalir: 'Debe aparecer un llamado arriba, como frase de gancho o etiqueta viral.',
    duracionSugeridaSegundos: 10,
    segundoInicioPrueba: 0.7,
    intensidadBase: 'normal',
    tipoRender: 'texto-overlay',
    compatibleFfmpeg: true,
    requiereTexto: true,
    textoPrueba: 'MIRA ESTO',
    parametros: { posicion: 'superior', fuenteTamano: 48, caja: true, duracion: 2.5 },
    tags: ['callout', 'texto', 'redes']
  }
]);

function compararOrden(a, b) {
  return Number(a.orden || 0) - Number(b.orden || 0);
}

function normalizarId(valor = '') {
  return String(valor || '').trim().toLowerCase();
}

export function listarCategoriasEfectosLab() {
  return [...CATEGORIAS_LABORATORIO_EFECTOS].sort(compararOrden);
}

export function listarEfectosLab() {
  return [...EFECTOS_LABORATORIO];
}

export function obtenerEfectoLabPorId(efectoId = '') {
  const id = normalizarId(efectoId);
  return EFECTOS_LABORATORIO.find((efecto) => efecto.id === id) || null;
}

export function listarEfectosLabPorCategoria(categoriaId = '') {
  const id = normalizarId(categoriaId);
  return EFECTOS_LABORATORIO.filter((efecto) => efecto.categoriaId === id);
}

export function construirAcordeonesEfectosLab() {
  return listarCategoriasEfectosLab().map((categoria) => {
    const efectos = listarEfectosLabPorCategoria(categoria.id);
    return {
      ...categoria,
      totalEfectos: efectos.length,
      efectos
    };
  });
}

export function validarEfectoLab(efecto = null) {
  if (!efecto || typeof efecto !== 'object') return { ok: false, mensaje: 'Efecto no válido.' };
  const requeridos = ['id', 'categoriaId', 'nombre', 'descripcion', 'queDebeSalir', 'tipoRender'];
  const faltantes = requeridos.filter((campo) => !String(efecto[campo] || '').trim());
  if (faltantes.length) return { ok: false, mensaje: `Efecto incompleto: ${faltantes.join(', ')}`, faltantes };
  if (!obtenerEfectoLabPorId(efecto.id)) return { ok: false, mensaje: `El efecto ${efecto.id} no existe en el catálogo.` };
  return { ok: true, mensaje: 'Efecto listo para prueba individual.' };
}

export function crearRespuestaCatalogoEfectosLab() {
  const acordeones = construirAcordeonesEfectosLab();
  return {
    ok: true,
    tipo: 'catalogo-laboratorio-efectos',
    version: VERSION_CATALOGO_EFECTOS_LAB,
    totalCategorias: acordeones.length,
    totalEfectos: EFECTOS_LABORATORIO.length,
    acordeones,
    creadoPara: 'prueba individual de efectos sobre videos cortos de 10 a 12 segundos'
  };
}

export default {
  VERSION_CATALOGO_EFECTOS_LAB,
  CATEGORIAS_LABORATORIO_EFECTOS,
  EFECTOS_LABORATORIO,
  listarCategoriasEfectosLab,
  listarEfectosLab,
  obtenerEfectoLabPorId,
  listarEfectosLabPorCategoria,
  construirAcordeonesEfectosLab,
  validarEfectoLab,
  crearRespuestaCatalogoEfectosLab
};
