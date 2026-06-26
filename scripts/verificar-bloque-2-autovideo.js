/* Verificacion agrupada Bloque 2 AutoVideoJeff. */

import { crearPlanAudio, diagnosticarPlanAudio } from '../audio/audio.conexion.js';
import { crearSubtitulosMultiplataforma } from '../subtitulos/subtitulos.conexion.js';
import { detectarTextosRelevantes, generarTextosPantalla } from '../textos/textos.conexion.js';

function main() {
  const planAudio = crearPlanAudio({ analisisAudio: { picoInicialDb: -10 } }, { permitirCorteInicio: true });
  const diagnosticoAudio = diagnosticarPlanAudio(planAudio);
  if (!diagnosticoAudio.ok) throw new Error('Audio no valido.');

  const segmentos = [
    { inicio: 0, fin: 2, texto: 'Esta parte es clave para abrir el video.' },
    { inicio: 2, fin: 4, texto: 'El resultado debe ser claro para cada plataforma.' }
  ];

  const subtitulos = crearSubtitulosMultiplataforma({ plataformas: ['tiktok', 'youtube'], segmentos, perfil: 'general' });
  if (subtitulos.length !== 2) throw new Error('Subtitulos por plataforma incompletos.');

  const detectados = detectarTextosRelevantes({ segmentos, perfil: 'general' });
  const capasTexto = generarTextosPantalla({ textos: detectados.textos, perfil: 'general', plataforma: 'tiktok' });
  if (!capasTexto.length) throw new Error('No se generaron textos de pantalla.');

  console.log('OK Bloque 2 AutoVideoJeff:', {
    audio: planAudio.limpieza.acciones.length,
    subtitulos: subtitulos.length,
    textos: capasTexto.length
  });
}

try {
  main();
} catch (error) {
  console.error('ERROR Bloque 2 AutoVideoJeff:', error.message);
  process.exit(1);
}
