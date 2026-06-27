import path from 'path';
import { escribirJson } from '../../comun/archivos.js';

export async function transcribirVideoSimple({ entrada, analisis, opciones = {} } = {}) {
  const rutaTranscripcion = path.join(entrada.rutas.carpetaProyecto, 'transcripcion-simple.json');
  const textoManual = String(opciones.textoTranscripcionManual || opciones.transcripcionManual || opciones.textoManual || '').trim();
  const duracion = analisis?.duracionSegundos || 0;
  const transcripcion = {
    tipo: textoManual ? 'transcripcion-manual' : 'estructura-preparada',
    motor: textoManual ? 'manual' : 'transcripcion-simple',
    idioma: opciones.idiomaTranscripcion || opciones.idioma || 'es',
    textoCompleto: textoManual,
    segmentos: textoManual ? [{ inicio: 0, fin: duracion > 0 ? duracion : null, texto: textoManual, confianza: 1 }] : [{ inicio: 0, fin: duracion > 0 ? duracion : null, texto: '', confianza: 0, nota: 'Transcripción pendiente.' }],
    creadoEn: new Date().toISOString(),
    observacion: textoManual ? 'Texto manual disponible.' : 'Pendiente de motor automático.'
  };
  await escribirJson(rutaTranscripcion, transcripcion);
  return { ...transcripcion, rutaTranscripcion };
}

export default transcribirVideoSimple;
