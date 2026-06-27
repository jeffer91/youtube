/*
  Bloque 1: Catalogo de efectos
  Funcion: biblioteca base con mas de 50 efectos seleccionables por IA o por reglas locales.
*/

import { CATEGORIAS_EFECTO, SOPORTES_FORMATO_EFECTO } from './efectos.schema.js';

const TODOS = [SOPORTES_FORMATO_EFECTO.TODOS];
const REDES = [SOPORTES_FORMATO_EFECTO.VERTICAL, SOPORTES_FORMATO_EFECTO.CUADRADO];
const VIDEO_COMPLETO = [SOPORTES_FORMATO_EFECTO.VERTICAL, SOPORTES_FORMATO_EFECTO.HORIZONTAL, SOPORTES_FORMATO_EFECTO.CUADRADO];

function efecto({ id, nombre, categoria, descripcion, perfiles, intensidades = ['suave', 'normal', 'fuerte'], formatos = TODOS, requiereTexto = false, requiereTranscripcion = false, requiereMomentoClave = false, pesoBase = 50, tags = [] }) {
  return Object.freeze({
    id,
    nombre,
    categoria,
    descripcion,
    perfilesRecomendados: perfiles,
    intensidadesPermitidas: intensidades,
    formatosCompatibles: formatos,
    requiereTexto,
    requiereTranscripcion,
    requiereMomentoClave,
    pesoBase,
    tags
  });
}

export const CATALOGO_EFECTOS = Object.freeze([
  efecto({ id: 'zoom_suave', nombre: 'Zoom suave', categoria: CATEGORIAS_EFECTO.MOVIMIENTO, descripcion: 'Acercamiento leve para evitar imagen plana.', perfiles: ['general', 'creciaula', 'institucional'], pesoBase: 75, tags: ['camara', 'hablado'] }),
  efecto({ id: 'zoom_deportivo', nombre: 'Zoom deportivo', categoria: CATEGORIAS_EFECTO.MOVIMIENTO, descripcion: 'Acercamiento mas rapido para momentos energicos.', perfiles: ['11-contra-11'], intensidades: ['normal', 'fuerte'], pesoBase: 92, tags: ['futbol', 'energia'] }),
  efecto({ id: 'punch_in_fuerte', nombre: 'Punch-in fuerte', categoria: CATEGORIAS_EFECTO.MOVIMIENTO, descripcion: 'Acercamiento corto para remarcar una frase.', perfiles: ['11-contra-11', 'jeff-isekai'], intensidades: ['normal', 'fuerte'], requiereMomentoClave: true, pesoBase: 90, tags: ['enfasis'] }),
  efecto({ id: 'punch_in_suave', nombre: 'Punch-in suave', categoria: CATEGORIAS_EFECTO.MOVIMIENTO, descripcion: 'Acercamiento discreto para ideas importantes.', perfiles: ['general', 'creciaula', 'institucional'], requiereMomentoClave: true, pesoBase: 74, tags: ['enfasis'] }),
  efecto({ id: 'zoom_out_cierre', nombre: 'Zoom out de cierre', categoria: CATEGORIAS_EFECTO.MOVIMIENTO, descripcion: 'Alejamiento suave para cerrar una idea.', perfiles: ['general', 'el-don-historia', 'institucional'], pesoBase: 62, tags: ['cierre'] }),
  efecto({ id: 'micro_movimiento', nombre: 'Micro movimiento', categoria: CATEGORIAS_EFECTO.MOVIMIENTO, descripcion: 'Movimiento minimo para videos estaticos.', perfiles: ['general', 'creciaula', 'institucional'], pesoBase: 86, tags: ['estatico'] }),
  efecto({ id: 'paneo_izquierda', nombre: 'Paneo izquierda', categoria: CATEGORIAS_EFECTO.MOVIMIENTO, descripcion: 'Desplazamiento suave hacia la izquierda.', perfiles: ['general', 'el-don-historia'], pesoBase: 54, tags: ['camara'] }),
  efecto({ id: 'paneo_derecha', nombre: 'Paneo derecha', categoria: CATEGORIAS_EFECTO.MOVIMIENTO, descripcion: 'Desplazamiento suave hacia la derecha.', perfiles: ['general', 'el-don-historia'], pesoBase: 54, tags: ['camara'] }),
  efecto({ id: 'shake_sutil', nombre: 'Shake sutil', categoria: CATEGORIAS_EFECTO.MOVIMIENTO, descripcion: 'Vibracion leve para enfatizar un punto.', perfiles: ['11-contra-11', 'jeff-isekai'], intensidades: ['fuerte'], requiereMomentoClave: true, pesoBase: 70, tags: ['energia'] }),
  efecto({ id: 'reencuadre_rostro', nombre: 'Reencuadre rostro', categoria: CATEGORIAS_EFECTO.MOVIMIENTO, descripcion: 'Ajuste de encuadre para priorizar rostro o sujeto.', perfiles: ['general', 'creciaula', 'institucional'], pesoBase: 88, tags: ['rostro'] }),

  efecto({ id: 'color_futbol_vibrante', nombre: 'Color futbol vibrante', categoria: CATEGORIAS_EFECTO.COLOR, descripcion: 'Contraste y saturacion para estilo deportivo.', perfiles: ['11-contra-11'], intensidades: ['normal', 'fuerte'], pesoBase: 94, tags: ['futbol', 'color'] }),
  efecto({ id: 'color_cine_contraste', nombre: 'Color cine contraste', categoria: CATEGORIAS_EFECTO.COLOR, descripcion: 'Contraste sobrio para estilo narrativo.', perfiles: ['el-don-historia'], pesoBase: 84, tags: ['cine'] }),
  efecto({ id: 'color_anime_vivo', nombre: 'Color anime vivo', categoria: CATEGORIAS_EFECTO.COLOR, descripcion: 'Saturacion alta para estilo anime o dinamico.', perfiles: ['jeff-isekai'], intensidades: ['normal', 'fuerte'], pesoBase: 88, tags: ['anime'] }),
  efecto({ id: 'color_institucional_limpio', nombre: 'Color institucional limpio', categoria: CATEGORIAS_EFECTO.COLOR, descripcion: 'Mejora clara y sobria sin exagerar.', perfiles: ['institucional'], intensidades: ['suave', 'normal'], pesoBase: 86, tags: ['limpio'] }),
  efecto({ id: 'color_educacion_claro', nombre: 'Color educacion claro', categoria: CATEGORIAS_EFECTO.COLOR, descripcion: 'Brillo y contraste moderado para clases o explicaciones.', perfiles: ['creciaula'], pesoBase: 82, tags: ['educacion'] }),
  efecto({ id: 'nitidez_rostro', nombre: 'Nitidez rostro', categoria: CATEGORIAS_EFECTO.COLOR, descripcion: 'Enfoque ligero para mejorar presencia del rostro.', perfiles: ['general', 'creciaula', 'institucional'], pesoBase: 78, tags: ['rostro'] }),
  efecto({ id: 'vineta_suave', nombre: 'Vineta suave', categoria: CATEGORIAS_EFECTO.COLOR, descripcion: 'Oscurecimiento leve de bordes para concentrar atencion.', perfiles: ['general', 'el-don-historia', '11-contra-11'], pesoBase: 60, tags: ['atencion'] }),
  efecto({ id: 'brillo_controlado', nombre: 'Brillo controlado', categoria: CATEGORIAS_EFECTO.COLOR, descripcion: 'Ajuste de brillo para videos oscuros o planos.', perfiles: ['general', 'creciaula', 'institucional'], pesoBase: 76, tags: ['luz'] }),
  efecto({ id: 'tono_calido', nombre: 'Tono calido', categoria: CATEGORIAS_EFECTO.COLOR, descripcion: 'Apariencia ligeramente calida para cercania.', perfiles: ['jeff-verso', 'general'], weightBase: 58, pesoBase: 58, tags: ['tono'] }),
  efecto({ id: 'tono_frio_profesional', nombre: 'Tono frio profesional', categoria: CATEGORIAS_EFECTO.COLOR, descripcion: 'Apariencia fria y ordenada para contenido formal.', perfiles: ['institucional'], intensidades: ['suave', 'normal'], pesoBase: 58, tags: ['formal'] }),

  efecto({ id: 'titulo_inicial', nombre: 'Titulo inicial', categoria: CATEGORIAS_EFECTO.TEXTO, descripcion: 'Texto breve al inicio para ubicar el tema.', perfiles: ['general', 'creciaula', 'el-don-historia'], formatos: REDES, requiereTexto: true, pesoBase: 84, tags: ['inicio'] }),
  efecto({ id: 'palabra_clave', nombre: 'Palabra clave', categoria: CATEGORIAS_EFECTO.TEXTO, descripcion: 'Palabra corta para reforzar una idea.', perfiles: ['general', 'creciaula', '11-contra-11'], requiereTexto: true, requiereMomentoClave: true, pesoBase: 86, tags: ['texto'] }),
  efecto({ id: 'texto_impacto', nombre: 'Texto de impacto', categoria: CATEGORIAS_EFECTO.TEXTO, descripcion: 'Frase corta de alto impacto para retencion.', perfiles: ['11-contra-11', 'jeff-isekai', 'jeff-verso'], intensidades: ['normal', 'fuerte'], requiereTexto: true, requiereMomentoClave: true, pesoBase: 90, tags: ['retencion'] }),
  efecto({ id: 'dato_rapido', nombre: 'Dato rapido', categoria: CATEGORIAS_EFECTO.TEXTO, descripcion: 'Dato puntual mostrado como tarjeta corta.', perfiles: ['creciaula', 'el-don-historia', 'general'], requiereTexto: true, pesoBase: 78, tags: ['dato'] }),
  efecto({ id: 'pregunta_en_pantalla', nombre: 'Pregunta en pantalla', categoria: CATEGORIAS_EFECTO.TEXTO, descripcion: 'Pregunta breve para enganchar al espectador.', perfiles: ['general', '11-contra-11', 'creciaula'], requiereTexto: true, requiereMomentoClave: true, pesoBase: 80, tags: ['hook'] }),
  efecto({ id: 'marcador_futbol', nombre: 'Marcador tipo futbol', categoria: CATEGORIAS_EFECTO.TEXTO, descripcion: 'Rotulo estilo marcador deportivo.', perfiles: ['11-contra-11'], intensidades: ['normal', 'fuerte'], requiereTexto: true, pesoBase: 88, tags: ['futbol'] }),
  efecto({ id: 'frase_destacada', nombre: 'Frase destacada', categoria: CATEGORIAS_EFECTO.TEXTO, descripcion: 'Resalta una frase central del video.', perfiles: ['general', 'jeff-verso', 'el-don-historia'], requiereTexto: true, requiereTranscripcion: true, pesoBase: 82, tags: ['frase'] }),
  efecto({ id: 'aviso_importante', nombre: 'Aviso importante', categoria: CATEGORIAS_EFECTO.TEXTO, descripcion: 'Aviso corto para un punto critico.', perfiles: ['creciaula', 'institucional', 'general'], requiereTexto: true, pesoBase: 72, tags: ['aviso'] }),
  efecto({ id: 'cta_final', nombre: 'CTA final', categoria: CATEGORIAS_EFECTO.TEXTO, descripcion: 'Llamado final a comentar, guardar o seguir.', perfiles: ['general', '11-contra-11', 'jeff-verso'], requiereTexto: true, pesoBase: 68, tags: ['cierre'] }),
  efecto({ id: 'etiqueta_seccion', nombre: 'Etiqueta de seccion', categoria: CATEGORIAS_EFECTO.TEXTO, descripcion: 'Divide el video por partes o temas.', perfiles: ['creciaula', 'el-don-historia', 'institucional'], requiereTexto: true, pesoBase: 70, tags: ['estructura'] }),

  efecto({ id: 'barra_progreso', nombre: 'Barra de progreso', categoria: CATEGORIAS_EFECTO.OVERLAY, descripcion: 'Barra superior que muestra avance del video.', perfiles: ['general', '11-contra-11', 'creciaula'], formatos: REDES, pesoBase: 80, tags: ['retencion'] }),
  efecto({ id: 'borde_deportivo', nombre: 'Borde deportivo', categoria: CATEGORIAS_EFECTO.OVERLAY, descripcion: 'Borde visual para estilo futbol o energia.', perfiles: ['11-contra-11'], intensidades: ['normal', 'fuerte'], pesoBase: 72, tags: ['futbol'] }),
  efecto({ id: 'borde_institucional', nombre: 'Borde institucional', categoria: CATEGORIAS_EFECTO.OVERLAY, descripcion: 'Borde sobrio y casi transparente.', perfiles: ['institucional'], intensidades: ['suave'], pesoBase: 55, tags: ['formal'] }),
  efecto({ id: 'tarjeta_resumen', nombre: 'Tarjeta resumen', categoria: CATEGORIAS_EFECTO.OVERLAY, descripcion: 'Tarjeta breve con resumen de una idea.', perfiles: ['creciaula', 'general', 'el-don-historia'], requiereTexto: true, pesoBase: 74, tags: ['resumen'] }),
  efecto({ id: 'lower_third', nombre: 'Lower third', categoria: CATEGORIAS_EFECTO.OVERLAY, descripcion: 'Rotulo inferior para nombre, tema o contexto.', perfiles: ['institucional', 'creciaula', 'general'], requiereTexto: true, pesoBase: 70, tags: ['rotulo'] }),
  efecto({ id: 'flecha_enfoque', nombre: 'Flecha de enfoque', categoria: CATEGORIAS_EFECTO.OVERLAY, descripcion: 'Flecha discreta para dirigir la mirada.', perfiles: ['creciaula', 'general'], requiereMomentoClave: true, pesoBase: 52, tags: ['enfoque'] }),
  efecto({ id: 'circulo_resaltado', nombre: 'Circulo resaltado', categoria: CATEGORIAS_EFECTO.OVERLAY, descripcion: 'Circulo visual para remarcar un objeto o zona.', perfiles: ['creciaula', 'general'], requiereMomentoClave: true, pesoBase: 50, tags: ['enfoque'] }),
  efecto({ id: 'bloque_contexto', nombre: 'Bloque de contexto', categoria: CATEGORIAS_EFECTO.OVERLAY, descripcion: 'Caja lateral con contexto o antecedente.', perfiles: ['el-don-historia', 'institucional'], requiereTexto: true, pesoBase: 62, tags: ['contexto'] }),
  efecto({ id: 'sombra_inferior', nombre: 'Sombra inferior', categoria: CATEGORIAS_EFECTO.OVERLAY, descripcion: 'Degradado inferior para mejorar legibilidad.', perfiles: ['general', 'creciaula', 'institucional'], pesoBase: 64, tags: ['legibilidad'] }),
  efecto({ id: 'fondo_blur', nombre: 'Fondo blur', categoria: CATEGORIAS_EFECTO.OVERLAY, descripcion: 'Fondo desenfocado para formatos verticales.', perfiles: ['general', '11-contra-11', 'creciaula'], formatos: REDES, pesoBase: 78, tags: ['formato'] }),

  efecto({ id: 'fade_in', nombre: 'Fade in', categoria: CATEGORIAS_EFECTO.TRANSICION, descripcion: 'Entrada suave al inicio.', perfiles: ['general', 'institucional', 'el-don-historia'], intensidades: ['suave', 'normal'], pesoBase: 58, tags: ['inicio'] }),
  efecto({ id: 'fade_out', nombre: 'Fade out', categoria: CATEGORIAS_EFECTO.TRANSICION, descripcion: 'Salida suave al final.', perfiles: ['general', 'institucional', 'el-don-historia'], intensities: ['suave', 'normal'], pesoBase: 58, tags: ['cierre'] }),
  efecto({ id: 'flash_suave', nombre: 'Flash suave', categoria: CATEGORIAS_EFECTO.TRANSICION, descripcion: 'Cambio luminoso breve para transicion.', perfiles: ['11-contra-11', 'jeff-isekai'], intensidades: ['normal', 'fuerte'], requiereMomentoClave: true, pesoBase: 60, tags: ['ritmo'] }),
  efecto({ id: 'cambio_escena', nombre: 'Cambio de escena', categoria: CATEGORIAS_EFECTO.TRANSICION, descripcion: 'Transicion limpia entre ideas completas.', perfiles: ['general', 'el-don-historia', 'creciaula'], requiereMomentoClave: true, pesoBase: 70, tags: ['estructura'] }),
  efecto({ id: 'pausa_visual', nombre: 'Pausa visual', categoria: CATEGORIAS_EFECTO.TRANSICION, descripcion: 'Pequena pausa visual para dar peso a una idea.', perfiles: ['el-don-historia', 'institucional', 'jeff-verso'], intensidades: ['suave', 'normal'], requiereMomentoClave: true, pesoBase: 54, tags: ['pausa'] }),

  efecto({ id: 'entrada_texto', nombre: 'Entrada de texto', categoria: CATEGORIAS_EFECTO.RITMO, descripcion: 'Animacion de entrada para texto importante.', perfiles: ['general', 'creciaula', '11-contra-11'], requiereTexto: true, pesoBase: 66, tags: ['texto'] }),
  efecto({ id: 'salida_texto', nombre: 'Salida de texto', categoria: CATEGORIAS_EFECTO.RITMO, descripcion: 'Salida limpia para texto en pantalla.', perfiles: ['general', 'creciaula', 'institucional'], requiereTexto: true, pesoBase: 54, tags: ['texto'] }),
  efecto({ id: 'cambio_color_momento', nombre: 'Cambio de color por momento', categoria: CATEGORIAS_EFECTO.RITMO, descripcion: 'Cambio leve de color en momento importante.', perfiles: ['11-contra-11', 'jeff-isekai', 'el-don-historia'], requiereMomentoClave: true, pesoBase: 62, tags: ['momento'] }),
  efecto({ id: 'cierre_visual_marca', nombre: 'Cierre visual de marca', categoria: CATEGORIAS_EFECTO.MARCA, descripcion: 'Cierre final con identidad de la app o perfil.', perfiles: ['general', '11-contra-11', 'jeff-verso'], pesoBase: 64, tags: ['marca'] }),
  efecto({ id: 'marca_esquina', nombre: 'Marca en esquina', categoria: CATEGORIAS_EFECTO.MARCA, descripcion: 'Marca pequena para identidad visual.', perfiles: ['general', 'institucional', '11-contra-11'], intensidades: ['suave', 'normal'], pesoBase: 48, tags: ['marca'] }),
  efecto({ id: 'separador_capitulo', nombre: 'Separador de capitulo', categoria: CATEGORIAS_EFECTO.MARCA, descripcion: 'Pantalla breve para separar secciones.', perfiles: ['el-don-historia', 'creciaula'], requiereTexto: true, pesoBase: 52, tags: ['capitulo'] }),
  efecto({ id: 'resumen_final', nombre: 'Resumen final', categoria: CATEGORIAS_EFECTO.MARCA, descripcion: 'Pantalla o texto con conclusiones finales.', perfiles: ['creciaula', 'institucional', 'general'], requiereTexto: true, pesoBase: 60, tags: ['cierre'] }),
  efecto({ id: 'identidad_perfil', nombre: 'Identidad por perfil', categoria: CATEGORIAS_EFECTO.MARCA, descripcion: 'Sello visual distinto segun el perfil elegido.', perfiles: ['general', '11-contra-11', 'jeff-isekai', 'creciaula', 'institucional', 'el-don-historia', 'jeff-verso'], pesoBase: 72, tags: ['perfil'] })
]);

export const TOTAL_EFECTOS_CATALOGO = CATALOGO_EFECTOS.length;

export function listarEfectosCatalogo() {
  return CATALOGO_EFECTOS;
}

export function buscarEfectoPorId(id) {
  const efectoId = String(id || '').trim();
  return CATALOGO_EFECTOS.find((item) => item.id === efectoId) || null;
}

export function filtrarEfectosPorPerfil(perfil = 'general') {
  const perfilId = String(perfil || 'general').trim().toLowerCase();
  return CATALOGO_EFECTOS.filter((efecto) => efecto.perfilesRecomendados.includes(perfilId) || efecto.perfilesRecomendados.includes('general'));
}
