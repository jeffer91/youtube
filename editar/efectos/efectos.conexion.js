/*
  Bloque 6: Selector Gemini de efectos
  Funcion: conectar planificador local/Gemini + compilador FFmpeg para entregar un filtro visual final.
*/

import { reportarModulo } from '../../progreso/progreso-modulo.js';
import { planificarEfectos } from './planificador/index.js';
import { compilarPlanFfmpeg } from './ffmpeg/index.js';
import { registrarAuditoriaEfectos } from './registrar-auditoria-efectos.service.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function crearOmitido({ filtroBase = '', mensaje = 'Motor de efectos omitido.', error = null } = {}) {
  return {
    ok: true,
    omitido: true,
    motor: 'efectos-v1',
    mensaje,
    filtroVideo: filtroBase,
    plan: null,
    compilado: null,
    filtrosAplicados: 0,
    errorControlado: error ? { mensaje: error.message || String(error), modulo: 'editar/efectos/efectos.conexion.js' } : null,
    creadoEn: new Date().toISOString()
  };
}

export async function procesarMotorEfectos({ filtroBase = '', entrada = null, entendimiento = null, transcripcion = null, edicionDinamica = null, salida = {}, opciones = {}, progreso = null } = {}) {
  if (!filtroBase) return crearOmitido({ filtroBase: '', mensaje: 'Motor de efectos omitido porque falta filtro base.' });

  try {
    if (opciones?.agregarEfectosVisualesDinamicos === false || opciones?.usarMotorEfectos === false) {
      return crearOmitido({ filtroBase, mensaje: 'Motor de efectos omitido por configuracion.' });
    }

    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 84, titulo: 'Planificando efectos', detalle: 'Seleccionando efectos visuales por perfil.', archivo: 'editar/efectos/efectos.conexion.js' });

    const plan = await planificarEfectos({ entrada, entendimiento, transcripcion, edicionDinamica, opciones });
    const width = numero(salida?.width, 1080);
    const height = numero(salida?.height, 1920);
    const duracionSegundos = numero(plan?.duracionSegundos || entendimiento?.analisis?.duracionSegundos, 0);
    const compilado = compilarPlanFfmpeg({ filtroBase, plan, width, height, duracionSegundos });

    const resultado = {
      ok: Boolean(compilado.ok),
      omitido: !compilado.ok || compilado.filtrosAplicados === 0,
      motor: 'efectos-v1',
      mensaje: compilado.mensaje,
      filtroVideo: compilado.ok ? compilado.filtroVideo : filtroBase,
      plan,
      compilado,
      filtrosAplicados: compilado.filtrosAplicados || 0,
      detalle: {
        origen: plan?.origen || 'local',
        fallbackLocal: Boolean(plan?.fallbackLocal),
        perfil: plan?.perfil?.id || 'general',
        intensidad: plan?.intensidad?.id || 'normal',
        totalPlan: plan?.total || 0,
        filtrosAplicados: compilado.filtrosAplicados || 0,
        omitidos: compilado.omitidos?.length || 0
      },
      creadoEn: new Date().toISOString()
    };

    await registrarAuditoriaEfectos({ entrada, resultado });
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 86, titulo: 'Efectos listos', detalle: `${resultado.filtrosAplicados} efectos integrados al render.`, datos: resultado.detalle, archivo: 'editar/efectos/efectos.conexion.js' });

    return resultado;
  } catch (error) {
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 86, titulo: 'Motor de efectos omitido', detalle: 'Se mantiene el filtro anterior para no detener la exportacion.', archivo: 'editar/efectos/efectos.conexion.js' });
    return crearOmitido({ filtroBase, mensaje: 'No se pudo integrar el motor de efectos. Se mantiene el filtro anterior.', error });
  }
}

export default procesarMotorEfectos;
