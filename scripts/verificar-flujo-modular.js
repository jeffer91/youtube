/* Verificacion Bloque 8: integracion modular del flujo. */

import { crearIntegracionModularAutoVideoJeff } from '../motor/flujo-modular-autovideo.service.js';

async function main() {
  const entrada = {
    proyecto: { id: 'flujo-modular-prueba', nombre: 'Flujo modular prueba', perfil: 'general', rutas: { exportaciones: 'salida/prueba/exportaciones' } },
    video: { rutaOriginal: 'entrada/video.mp4' }
  };
  const entendimiento = { analisis: { audio: { picoInicialDb: -10 }, duracionSegundos: 12 } };
  const transcripcion = {
    transcripcion: {
      segmentos: [
        { inicio: 0, fin: 3, texto: 'Esta parte es clave para abrir el video.' },
        { inicio: 3, fin: 7, texto: 'El resultado debe verse claro y ordenado.' }
      ]
    }
  };
  const salida = { formato: '9:16', rutaExportada: 'salida/final.mp4', urlPublica: '/exports/final.mp4' };
  const opciones = { perfil: 'general', plataformas: ['tiktok', 'youtube'], modoEdicion: 'revision_completa' };

  const modular = await crearIntegracionModularAutoVideoJeff({ entrada, entendimiento, audio: {}, transcripcion, edicionDinamica: {}, edicion: {}, salida, opciones });

  if (!modular.ok) throw new Error('La integracion modular no devolvio ok.');
  if (modular.exportaciones.length !== 2) throw new Error('No se prepararon exportaciones por plataforma.');
  if (!modular.produccion?.elementos?.length) throw new Error('No se creo plan de produccion.');
  if (!modular.gemini?.tareas?.estilo) throw new Error('No se creo paquete Gemini.');
  if (!modular.visual?.zonasSeguras?.recomendada) throw new Error('No se calcularon zonas seguras.');

  console.log('OK flujo modular:', { exportaciones: modular.exportaciones.length, elementos: modular.produccion.elementos.length });
}

main().catch((error) => {
  console.error('ERROR flujo modular:', error.message);
  process.exit(1);
});
