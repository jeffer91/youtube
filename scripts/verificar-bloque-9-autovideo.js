/* Verificacion agrupada Bloque 9 AutoVideoJeff. */

import { crearResultadoPlataformas } from '../exportacion/exportacion.conexion.js';
import { crearIntegracionModularAutoVideoJeff } from '../motor/flujo-modular-autovideo.service.js';

async function main() {
  const resultadoDirecto = crearResultadoPlataformas({
    salida: { plataforma: 'tiktok', formato: '9:16', urlPublica: '/exports/final.mp4' },
    plataformas: ['tiktok', 'youtube']
  });
  if (resultadoDirecto.total !== 2) throw new Error('Resultado directo incompleto.');

  const modular = await crearIntegracionModularAutoVideoJeff({
    entrada: { proyecto: { id: 'bloque9', nombre: 'Bloque 9', perfil: 'general', rutas: { exportaciones: 'salida/bloque9/exportaciones' } } },
    entendimiento: { analisis: { audio: {}, duracionSegundos: 8 } },
    transcripcion: { transcripcion: { segmentos: [{ inicio: 0, fin: 3, texto: 'Frase clave del resultado final.' }] } },
    salida: { plataforma: 'tiktok', formato: '9:16', urlPublica: '/exports/final.mp4', nombreExportado: 'final.mp4' },
    opciones: { perfil: 'general', plataformas: ['tiktok', 'youtube', 'instagram'] }
  });

  if (!modular.resultadoPlataformas?.resultados?.length) throw new Error('El flujo modular no expone resultadoPlataformas.');
  if (modular.resultadoPlataformas.total !== 3) throw new Error('No se prepararon las 3 plataformas en flujo modular.');
  if (modular.resultadoPlataformas.exportadas !== 1) throw new Error('Debe existir una exportacion final base.');

  console.log('OK Bloque 9 AutoVideoJeff:', modular.resultadoPlataformas.total, 'plataformas');
}

main().catch((error) => {
  console.error('ERROR Bloque 9 AutoVideoJeff:', error.message);
  process.exit(1);
});
