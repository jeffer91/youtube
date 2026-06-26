/* Verificacion agrupada Bloque 5 AutoVideoJeff. */

import { crearPaqueteGeminiEdicion, crearAnalisisTranscripcionFallback } from '../gemini/gemini.conexion.js';
import { obtenerPerfil } from '../perfiles/perfiles.conexion.js';
import { prepararExportaciones } from '../exportacion/exportacion.conexion.js';

function main() {
  const perfil = obtenerPerfil('11-contra-11');
  const proyecto = { id: 'bloque5', nombre: 'Bloque 5', perfil: perfil.id, plataformas: ['tiktok', 'youtube'] };
  const transcripcion = {
    segmentos: [
      { inicio: 0, fin: 3, texto: 'Este arranque tiene fuerza para enganchar al publico.' },
      { inicio: 3, fin: 7, texto: 'La jugada cambia el partido y explica el resultado final.' }
    ]
  };
  const analisis = crearAnalisisTranscripcionFallback({ transcripcion, perfil: perfil.id });
  const exportaciones = prepararExportaciones(proyecto);
  const plataformas = exportaciones.map((item) => item.plataforma);
  const paquete = crearPaqueteGeminiEdicion({ proyecto, perfil, transcripcion, analisis, plataformas });

  const tareas = Object.keys(paquete.tareas || {});
  if (tareas.length !== 5) throw new Error('El paquete Gemini no tiene las 5 tareas esperadas.');
  if (!paquete.tareas.recursos.payload.momentos.length) throw new Error('No se pasaron momentos a sugerencia de recursos.');
  if (!paquete.tareas.estilo.payload.plataformas.length) throw new Error('No se pasaron plataformas al estilo.');

  console.log('OK Bloque 5 AutoVideoJeff:', tareas.join(', '));
}

try {
  main();
} catch (error) {
  console.error('ERROR Bloque 5 AutoVideoJeff:', error.message);
  process.exit(1);
}
