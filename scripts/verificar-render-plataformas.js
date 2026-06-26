/* Verificacion Bloque 11: render final por plataforma sin ejecutar FFmpeg pesado. */

import {
  crearFiltroContenerFormato,
  crearNombreExportacionPlataforma,
  crearResultadoPlataformas,
  renderizarPlataformasPendientes
} from '../exportacion/exportacion.conexion.js';

async function main() {
  const filtroVertical = crearFiltroContenerFormato({ formato: '9:16' });
  const filtroHorizontal = crearFiltroContenerFormato({ formato: '16:9' });
  const filtroCuadrado = crearFiltroContenerFormato({ formato: '1:1' });

  if (!filtroVertical.includes('1080:1920')) throw new Error('Filtro vertical incorrecto.');
  if (!filtroHorizontal.includes('1920:1080')) throw new Error('Filtro horizontal incorrecto.');
  if (!filtroCuadrado.includes('1080:1080')) throw new Error('Filtro cuadrado incorrecto.');

  const nombre = crearNombreExportacionPlataforma({ nombreBase: 'Video Final.mp4', plataforma: 'youtube', formato: '16:9' });
  if (!nombre.endsWith('-youtube-16x9.mp4')) throw new Error('Nombre de exportacion por plataforma incorrecto.');

  const resultado = crearResultadoPlataformas({
    salida: { plataforma: 'tiktok', formato: '9:16', urlPublica: '/exports/base.mp4', nombreExportado: 'base.mp4' },
    plataformas: ['tiktok', 'youtube', 'instagram']
  });

  const render = await renderizarPlataformasPendientes({
    salida: { rutaExportada: 'archivo-no-existe.mp4', plataforma: 'tiktok' },
    resultadoPlataformas: resultado
  });

  if (!render.renderMultiplataforma?.omitido) throw new Error('Debe omitir render cuando no existe video base.');
  if (render.total !== 3) throw new Error('No debe perder plataformas al omitir render.');

  console.log('OK render plataformas:', nombre, filtroVertical);
}

main().catch((error) => {
  console.error('ERROR render plataformas:', error.message);
  process.exit(1);
});
