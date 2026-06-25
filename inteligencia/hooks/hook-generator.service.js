import { extraerSegmentosTranscripcion, puntuarSegmento, recortarTexto } from '../utilidades-extraer-texto.js';
import { INTELIGENCIA_CONFIG } from '../inteligencia.config.js';

function obtenerTiempo(segmento, campo, respaldo = 0) {
  const valor = Number(segmento?.[campo] ?? segmento?.[campo === 'inicio' ? 'start' : 'end'] ?? respaldo);
  return Number.isFinite(valor) ? valor : respaldo;
}

function crearHookVacio(motivo = 'No hay transcripción suficiente para sugerir hook.') {
  return {
    ok: true,
    estado: 'PENDIENTE_TRANSCRIPCION',
    activo: false,
    inicio: 0,
    fin: null,
    texto: '',
    tituloCorto: '',
    motivo,
    puntaje: 0
  };
}

export function generarHookInicial({ transcripcion = {}, opciones = {} } = {}) {
  const segmentos = extraerSegmentosTranscripcion(transcripcion)
    .filter((segmento) => String(segmento?.texto || '').trim().length > 0);

  if (!segmentos.length) return crearHookVacio();

  const maxDuracion = Number(opciones.maxDuracionHook || INTELIGENCIA_CONFIG.maxDuracionHook);
  const candidatos = segmentos.map((segmento, index) => {
    const inicio = obtenerTiempo(segmento, 'inicio', index * 3);
    const fin = obtenerTiempo(segmento, 'fin', inicio + 3);
    return {
      segmento,
      inicio,
      fin,
      duracion: Math.max(fin - inicio, 1),
      puntaje: puntuarSegmento(segmento) + (index === 0 ? 1 : 0)
    };
  }).filter((item) => item.duracion <= Math.max(maxDuracion, 3) || item.inicio <= 15);

  const mejor = (candidatos.length ? candidatos : segmentos.map((segmento, index) => ({ segmento, inicio: obtenerTiempo(segmento, 'inicio', index * 3), fin: obtenerTiempo(segmento, 'fin', index * 3 + 3), puntaje: puntuarSegmento(segmento) })))
    .sort((a, b) => b.puntaje - a.puntaje || a.inicio - b.inicio)[0];

  const texto = recortarTexto(mejor.segmento.texto || '', 140);
  return {
    ok: true,
    estado: 'SUGERIDO_LOCAL',
    activo: true,
    inicio: mejor.inicio,
    fin: mejor.fin,
    texto,
    tituloCorto: recortarTexto(texto.replace(/[¿?¡!]/g, ''), 58),
    motivo: 'Hook sugerido localmente desde el segmento con mayor potencial de retención.',
    puntaje: mejor.puntaje
  };
}

export default generarHookInicial;
