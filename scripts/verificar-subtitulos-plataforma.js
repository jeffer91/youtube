/* Verificacion Bloque 2: subtitulos por plataforma. */

import { crearSubtitulosMultiplataforma, validarSubtitulos, convertirSubtitulosASrt } from '../subtitulos/subtitulos.conexion.js';

function main() {
  const segmentos = [
    { inicio: 0, fin: 2.5, texto: 'Este es un texto de prueba para subtitulos dinamicos' },
    { inicio: 2.5, fin: 5, texto: 'La app debe cuidar la zona segura del sujeto' }
  ];

  const resultado = crearSubtitulosMultiplataforma({
    plataformas: ['tiktok', 'youtube', 'instagram'],
    segmentos,
    sujeto: { zona: 'centro' },
    perfil: 'general'
  });

  if (resultado.length !== 3) throw new Error('No se generaron subtitulos para todas las plataformas.');
  resultado.forEach((item) => {
    const validacion = validarSubtitulos(item.subtitulos);
    if (!validacion.ok) throw new Error(validacion.errores.join(' | '));
  });

  const srt = convertirSubtitulosASrt(resultado[0].subtitulos);
  if (!srt.includes('-->')) throw new Error('No se pudo convertir a SRT.');

  console.log('OK subtitulos:', resultado.map((item) => item.plataforma).join(', '));
}

try {
  main();
} catch (error) {
  console.error('ERROR subtitulos:', error.message);
  process.exit(1);
}
