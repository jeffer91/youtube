/* Verificacion Bloque 9: resultado por plataformas. */

import { crearResultadoPlataformas } from '../exportacion/exportacion.conexion.js';
import { mostrarResultadoPlataformasUI, limpiarResultadoPlataformasUI } from '../app/resultado-plataformas-ui.js';

function crearElementosFalsos() {
  return {
    resultPlatformsPanel: { hidden: true },
    resultPlatformsList: { innerHTML: '' },
    resultPlatformsSummary: { textContent: '' },
    productionSummary: { hidden: true, textContent: '' },
    modularSummary: { hidden: true, textContent: '' }
  };
}

function main() {
  const resultado = crearResultadoPlataformas({
    salida: { plataforma: 'tiktok', formato: '9:16', urlPublica: '/exports/final.mp4', nombreExportado: 'final.mp4', pesoBytes: 1024 * 1024 },
    exportaciones: [
      { plataforma: 'tiktok', formato: '9:16', videoDestino: 'final-tiktok.mp4' },
      { plataforma: 'youtube', formato: '16:9', videoDestino: 'final-youtube.mp4' },
      { plataforma: 'instagram', formato: '1:1', videoDestino: 'final-instagram.mp4' }
    ],
    plataformas: ['tiktok', 'youtube', 'instagram']
  });

  if (!resultado.ok) throw new Error('Resultado por plataformas no devolvio ok.');
  if (resultado.total !== 3) throw new Error('No se crearon las tres plataformas.');
  if (resultado.exportadas !== 1) throw new Error('La plataforma base debe estar exportada.');
  if (resultado.pendientes !== 2) throw new Error('Las plataformas no renderizadas deben quedar pendientes.');

  const elementos = crearElementosFalsos();
  mostrarResultadoPlataformasUI({ resultadoPlataformas: resultado, produccion: { elementos: [{ id: 'a' }], pendientes: 1 }, modular: { ok: true, perfil: { nombre: 'General' }, plataformas: ['tiktok', 'youtube'], produccion: { elementos: [{ id: 'a' }] } } }, elementos);
  if (elementos.resultPlatformsPanel.hidden) throw new Error('No se mostro panel de plataformas.');
  if (!elementos.resultPlatformsList.innerHTML.includes('TikTok')) throw new Error('No se renderizo tarjeta TikTok.');
  limpiarResultadoPlataformasUI(elementos);
  if (!elementos.resultPlatformsPanel.hidden) throw new Error('No se limpio panel de plataformas.');

  console.log('OK resultado plataformas:', resultado.total, 'plataformas');
}

try {
  main();
} catch (error) {
  console.error('ERROR resultado plataformas:', error.message);
  process.exit(1);
}
