/*
  Nombre completo: transcripcion.service.js
  Ruta o ubicación: AutoVideoJeff/entender/transcripcion-simple/transcripcion.service.js
  Función o funciones:
    - Crear una transcripción simple inicial preparada para crecer.
    - Dejar registrado un archivo transcripcion-simple.json dentro del proyecto.
    - No usar todavía IA pesada ni modelos externos.
    - Devolver una estructura compatible con futuros módulos de subtítulos.
  Con qué se conecta:
    - entender/entender.conexion.js
    - entender/analisis-simple/analisis.service.js
    - datos/proyectos/
    - comun/archivos.js
*/

import path from 'path';
import { escribirJson } from '../../comun/archivos.js';

function crearSegmentoInicial(analisis) {
  const duracion = analisis?.duracionSegundos || 0;

  return {
    inicio: 0,
    fin: duracion > 0 ? duracion : null,
    texto: '',
    confianza: 0,
    nota: 'Transcripción real pendiente para un bloque futuro. Esta versión deja la estructura lista.'
  };
}

export async function transcribirVideoSimple({ entrada, analisis }) {
  const rutaTranscripcion = path.join(
    entrada.rutas.carpetaProyecto,
    'transcripcion-simple.json'
  );

  const transcripcion = {
    tipo: 'estructura-preparada',
    motor: 'transcripcion-simple',
    idioma: 'es',
    textoCompleto: '',
    segmentos: [crearSegmentoInicial(analisis)],
    creadoEn: new Date().toISOString(),
    observacion:
      'Esta primera versión no usa IA pesada. Más adelante esta misma salida será reemplazada por Whisper u otro motor.'
  };

  await escribirJson(rutaTranscripcion, transcripcion);

  return {
    ...transcripcion,
    rutaTranscripcion
  };
}
