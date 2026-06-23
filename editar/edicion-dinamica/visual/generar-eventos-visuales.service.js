import { generarZoomsDinamicos } from './generar-zooms.service.js';
import { generarPunchInDinamicos } from './generar-punch-in.service.js';
import { redondearTiempo } from '../edicion-dinamica.config.js';

function obtenerTextos(transcripcion) {
  if (Array.isArray(transcripcion?.textosFlotantes?.textos)) return transcripcion.textosFlotantes.textos;
  return [];
}

function eventosDesdeTextos(textos = []) {
  return textos.slice(0, 10).map((texto, index) => ({
    id: index + 1,
    tipo: 'texto-flotante',
    inicio: redondearTiempo(texto.inicio || 0),
    fin: redondearTiempo(texto.fin || Number(texto.inicio || 0) + 1.5),
    texto: texto.texto || texto.titulo || 'CLAVE',
    prioridad: texto.prioridad || 20 + index,
    motivo: texto.motivo || 'Texto flotante sincronizado.'
  }));
}

export function generarEventosVisualesDinamicos({ edicionDinamica = null, transcripcion = null, opciones = {} } = {}) {
  const zooms = generarZoomsDinamicos({ edicionDinamica, opciones });
  const punchIn = generarPunchInDinamicos({ transcripcion, opciones });
  const textos = eventosDesdeTextos(obtenerTextos(transcripcion));

  const eventos = [
    ...(zooms.eventos || []),
    ...(punchIn.eventos || []),
    ...textos
  ]
    .filter((evento) => Number.isFinite(Number(evento.inicio)) && Number.isFinite(Number(evento.fin)) && Number(evento.fin) > Number(evento.inicio))
    .sort((a, b) => Number(a.inicio) - Number(b.inicio) || Number(a.prioridad || 99) - Number(b.prioridad || 99))
    .map((evento, index) => ({ ...evento, id: index + 1 }));

  return {
    ok: true,
    omitido: eventos.length === 0,
    eventos,
    fuentes: {
      zooms: zooms.eventos?.length || 0,
      punchIn: punchIn.eventos?.length || 0,
      textos: textos.length
    },
    mensaje: eventos.length > 0 ? 'Eventos visuales dinámicos generados.' : 'No se generaron eventos visuales dinámicos.'
  };
}

export default generarEventosVisualesDinamicos;
