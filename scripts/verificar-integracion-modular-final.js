/* Verificacion Bloque 10: integracion modular final sin render pesado. */

import { validarTodosLosPerfiles } from '../perfiles/perfiles.conexion.js';
import { prepararExportaciones, crearResultadoPlataformas } from '../exportacion/exportacion.conexion.js';
import { crearPlanAudio } from '../audio/audio.conexion.js';
import { crearSubtitulosMultiplataforma } from '../subtitulos/subtitulos.conexion.js';
import { detectarTextosRelevantes, generarTextosPantalla } from '../textos/textos.conexion.js';
import { detectarSujeto, detectarRostro, detectarZonasSeguras } from '../visual/visual.conexion.js';
import { clasificarRecurso } from '../biblioteca/biblioteca.conexion.js';
import { prepararBusquedaImagenes } from '../recursos-externos/recursos-externos.conexion.js';
import { crearPaqueteGeminiEdicion, crearAnalisisTranscripcionFallback } from '../gemini/gemini.conexion.js';
import { crearPlanProduccion } from '../produccion/produccion.conexion.js';
import { crearReglaAprendizaje } from '../aprendizaje/aprendizaje.conexion.js';

async function main() {
  const perfiles = validarTodosLosPerfiles();
  if (!perfiles.ok) throw new Error(perfiles.errores.join(' | '));

  const proyecto = { id: 'integracion-final', nombre: 'Integracion Final', perfil: 'general', plataformas: ['tiktok', 'youtube', 'instagram'] };
  const segmentos = [
    { inicio: 0, fin: 3, texto: 'Esta idea es clave para abrir el video.' },
    { inicio: 3, fin: 7, texto: 'El resultado debe verse claro para cada plataforma.' }
  ];

  const exportaciones = prepararExportaciones(proyecto);
  const resultadoPlataformas = crearResultadoPlataformas({ salida: { plataforma: 'tiktok', urlPublica: '/exports/final.mp4', formato: '9:16' }, exportaciones, plataformas: proyecto.plataformas });
  const audio = crearPlanAudio({ analisisAudio: { picoInicialDb: -10 } });
  const subtitulos = crearSubtitulosMultiplataforma({ plataformas: proyecto.plataformas, segmentos, perfil: proyecto.perfil });
  const textosDetectados = detectarTextosRelevantes({ segmentos, perfil: proyecto.perfil });
  const textos = generarTextosPantalla({ textos: textosDetectados.textos, perfil: proyecto.perfil, plataforma: 'tiktok' });
  const sujeto = detectarSujeto({ video: { width: 1080, height: 1920 } });
  const rostro = detectarRostro({}, sujeto);
  const zonas = detectarZonasSeguras({ plataforma: { width: 1080, height: 1920, formato: '9:16' }, sujeto, rostro });
  const recurso = clasificarRecurso({ nombre: 'Recurso prueba', tipo: 'imagen', perfil: proyecto.perfil, ruta: 'biblioteca/recurso.jpg', fuente: 'propio', licencia: 'propio' });
  const busqueda = prepararBusquedaImagenes({ tema: 'video educativo', perfil: proyecto.perfil });
  const analisis = crearAnalisisTranscripcionFallback({ transcripcion: { segmentos }, perfil: proyecto.perfil });
  const gemini = crearPaqueteGeminiEdicion({ proyecto, perfil: { id: proyecto.perfil, nombre: 'General' }, transcripcion: { segmentos }, analisis, plataformas: proyecto.plataformas });
  const produccion = crearPlanProduccion({ proyecto, recursos: [recurso], subtitulos: subtitulos[0].subtitulos, textos, audio });
  const regla = crearReglaAprendizaje({ perfil: proyecto.perfil, motivo: 'Prueba final', regla: 'Mantener claridad visual.' });

  if (exportaciones.length !== 3 || resultadoPlataformas.total !== 3) throw new Error('Exportacion multiplataforma incompleta.');
  if (!audio.ok || !subtitulos.length || !textos.length) throw new Error('Audio, subtitulos o textos incompletos.');
  if (!zonas.recomendada) throw new Error('Zonas seguras incompletas.');
  if (!recurso.id || !busqueda.consulta) throw new Error('Biblioteca o recursos externos incompletos.');
  if (!gemini.tareas?.analisis || !produccion.elementos.length || !regla.id) throw new Error('Gemini, Produccion o Aprendizaje incompletos.');

  console.log('OK integracion modular final:', { perfiles: perfiles.total, exportaciones: exportaciones.length, elementosProduccion: produccion.elementos.length });
}

main().catch((error) => {
  console.error('ERROR integracion modular final:', error.message);
  process.exit(1);
});
