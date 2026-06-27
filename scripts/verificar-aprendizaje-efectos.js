import fs from 'fs/promises';
import path from 'path';
import { registrarAprendizajeEfectos, cargarMemoriaEfectos, aplicarAprendizajeEfectos } from '../editar/efectos/aprendizaje/index.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function crearResultadoPrueba() {
  return {
    ok: true,
    omitido: false,
    motor: 'efectos-v1',
    filtrosAplicados: 3,
    mensaje: 'Render de prueba con efectos.',
    detalle: { perfil: '11-contra-11', origen: 'local', filtrosAplicados: 3, omitidos: 0 },
    plan: {
      origen: 'local',
      perfil: { id: '11-contra-11', nombre: '11 contra 11' },
      intensidad: { id: 'fuerte' },
      advertencias: [],
      efectos: [
        { efectoId: 'zoom_suave', nombre: 'Zoom suave', categoria: 'movimiento', inicio: 1, fin: 3, prioridad: 40, motivo: 'Prueba.' },
        { efectoId: 'color_futbol_vibrante', nombre: 'Color fútbol vibrante', categoria: 'color', inicio: 0, fin: 40, prioridad: 42, motivo: 'Prueba.' },
        { efectoId: 'texto_impacto', nombre: 'Texto impacto', categoria: 'texto', inicio: 5, fin: 7, prioridad: 44, motivo: 'Prueba.' }
      ]
    },
    compilado: { omitidos: [], filtrosAplicados: 3 }
  };
}

async function main() {
  const baseDir = path.resolve('datos', 'temporales', 'check-aprendizaje-efectos');
  await fs.rm(baseDir, { recursive: true, force: true });

  const opciones = { baseDir };
  const registro = await registrarAprendizajeEfectos(crearResultadoPrueba(), opciones);
  exigir(registro.ok, 'No se registró aprendizaje de efectos.');
  exigir(registro.perfil === '11-contra-11', `Perfil inesperado: ${registro.perfil}`);
  exigir(registro.efectosRegistrados === 3, `Cantidad inesperada: ${registro.efectosRegistrados}`);

  const memoria = await cargarMemoriaEfectos(opciones);
  exigir(memoria.perfiles['11-contra-11']?.totalProcesos === 1, 'La memoria no guardó el proceso del perfil.');
  exigir(memoria.perfiles['11-contra-11']?.efectos?.zoom_suave?.usos === 1, 'No se guardó uso de zoom_suave.');

  const seleccion = {
    ok: true,
    origen: 'local',
    efectos: [
      { efectoId: 'zoom_suave', inicio: 1, fin: 3, prioridad: 50, motivo: 'Base.' },
      { efectoId: 'barra_progreso', inicio: 0, fin: 40, prioridad: 55, motivo: 'Base.' }
    ]
  };
  const aprendido = await aplicarAprendizajeEfectos(seleccion, { perfil: { id: '11-contra-11', maxEfectosPorVideo: 8 }, intensidad: { id: 'fuerte' } }, opciones);
  exigir(aprendido.aprendizajeAplicado, 'No se marcó aprendizaje aplicado.');
  exigir(aprendido.efectos.some((efecto) => efecto.aprendizajeEfectos?.aplicado), 'No se ajustó ningún efecto por memoria.');

  await fs.rm(baseDir, { recursive: true, force: true });
  console.log('OK aprendizaje efectos:', { perfil: registro.perfil, efectos: registro.efectosRegistrados, memoria: memoria.perfiles['11-contra-11'].totalProcesos });
}

main().catch((error) => {
  console.error('ERROR aprendizaje efectos:', error.message);
  process.exit(1);
});
