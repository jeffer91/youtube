/* Verificacion Bloque 5: Gemini e inteligencia de edicion. */

import {
  prepararAnalisisTranscripcion,
  crearAnalisisTranscripcionFallback,
  prepararSugerenciaRecursos,
  prepararSugerenciaTextos,
  prepararSugerenciaGraficos,
  prepararSugerenciaEstiloEdicion,
  validarRespuestaGemini,
  crearPaqueteGeminiEdicion
} from '../gemini/gemini.conexion.js';
import { obtenerPerfil } from '../perfiles/perfiles.conexion.js';

function main() {
  const perfil = obtenerPerfil('creciaula');
  const proyecto = { id: 'gemini-prueba', nombre: 'Prueba Gemini', perfil: perfil.id };
  const transcripcion = {
    segmentos: [
      { inicio: 0, fin: 3, texto: 'Esta parte es clave para explicar el tema central del video.' },
      { inicio: 3, fin: 6, texto: 'El resultado debe ser claro y ordenado para publicar.' }
    ]
  };

  const analisisPrompt = prepararAnalisisTranscripcion({ transcripcion, perfil, proyecto });
  const analisisFallback = crearAnalisisTranscripcionFallback({ transcripcion, perfil: perfil.id });
  const recursos = prepararSugerenciaRecursos({ analisis: analisisFallback, perfil, biblioteca: [] });
  const textos = prepararSugerenciaTextos({ transcripcion, analisis: analisisFallback, perfil, plataforma: 'youtube' });
  const graficos = prepararSugerenciaGraficos({ analisis: analisisFallback, perfil });
  const estilo = prepararSugerenciaEstiloEdicion({ perfil, proyecto, plataformas: ['youtube'], analisis: analisisFallback });
  const validacion = validarRespuestaGemini('{"ok":true,"momentos":[]}', { requeridos: ['ok'] });
  const paquete = crearPaqueteGeminiEdicion({ proyecto, perfil, transcripcion, analisis: analisisFallback, plataformas: ['youtube'] });

  if (!analisisPrompt.payload.segmentos.length) throw new Error('No se preparo payload de transcripcion.');
  if (!analisisFallback.momentosImportantes.length) throw new Error('No se creo fallback de analisis.');
  if (!recursos.ok || !textos.ok || !graficos.ok || !estilo.ok) throw new Error('Fallo preparacion de tareas Gemini.');
  if (!validacion.ok) throw new Error(validacion.errores.join(' | '));
  if (!paquete.tareas?.analisis || !paquete.tareas?.estilo) throw new Error('No se creo paquete Gemini completo.');

  console.log('OK Gemini:', Object.keys(paquete.tareas).join(', '));
}

try {
  main();
} catch (error) {
  console.error('ERROR Gemini:', error.message);
  process.exit(1);
}
