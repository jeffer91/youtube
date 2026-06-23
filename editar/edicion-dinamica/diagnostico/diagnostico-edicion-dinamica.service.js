import path from 'path';
import { escribirJson } from '../../../comun/archivos.js';

function validarCortes(cortes) {
  const errores = [];
  const advertencias = [];

  if (!cortes) {
    advertencias.push('No existe resultado de cortes.');
    return { ok: true, errores, advertencias };
  }

  if (cortes.ok !== true) errores.push('La etapa de cortes no terminó correctamente.');
  if (!cortes.omitido && !cortes.videoDinamico) errores.push('Se indicaron cortes aplicados, pero no existe video dinámico.');
  if (!cortes.omitido && Number(cortes.resumen?.cantidadCortesAplicados || 0) <= 0) advertencias.push('La edición dinámica no aplicó cortes reales.');

  return { ok: errores.length === 0, errores, advertencias };
}

function validarTiempo(tiempo) {
  const errores = [];
  const advertencias = [];

  if (!tiempo) {
    advertencias.push('No existe resultado de tiempo dinámico.');
    return { ok: true, errores, advertencias };
  }

  if (tiempo.ok !== true) errores.push('La etapa de tiempo dinámico no terminó correctamente.');
  if (!tiempo.omitido && !tiempo.mapaTiempo?.bloques?.length) errores.push('No existe mapa de tiempo aunque se aplicaron cortes.');
  if (tiempo.mapaTiempo?.duracionEditada && tiempo.mapaTiempo?.duracionOriginal && tiempo.mapaTiempo.duracionEditada > tiempo.mapaTiempo.duracionOriginal) advertencias.push('La duración editada es mayor que la original. Revisar mapa de tiempo.');

  return { ok: errores.length === 0, errores, advertencias };
}

export async function crearDiagnosticoEdicionDinamica({ carpetaEdicionDinamica, cortes = null, tiempo = null, config = null } = {}) {
  const diagnosticoCortes = validarCortes(cortes);
  const diagnosticoTiempo = validarTiempo(tiempo);
  const errores = [...diagnosticoCortes.errores, ...diagnosticoTiempo.errores];
  const advertencias = [...diagnosticoCortes.advertencias, ...diagnosticoTiempo.advertencias];

  const diagnostico = {
    ok: errores.length === 0,
    tipo: 'diagnostico-edicion-dinamica',
    activo: Boolean(config?.activo),
    intensidad: config?.intensidad || null,
    errores,
    advertencias,
    resumen: {
      cortesOmitidos: Boolean(cortes?.omitido),
      tiempoOmitido: Boolean(tiempo?.omitido),
      videoDinamico: cortes?.videoDinamico || null,
      bloquesMapaTiempo: tiempo?.mapaTiempo?.bloques?.length || 0,
      transcripcionAjustada: Boolean(tiempo?.transcripcionAjustada)
    },
    mensaje: errores.length === 0 ? 'Diagnóstico de edición dinámica correcto.' : `Diagnóstico con errores: ${errores.join(', ')}`,
    creadoEn: new Date().toISOString()
  };

  if (carpetaEdicionDinamica) {
    const rutaDiagnostico = path.join(carpetaEdicionDinamica, 'diagnostico-edicion-dinamica.json');
    await escribirJson(rutaDiagnostico, diagnostico);
    return { ...diagnostico, rutaDiagnostico };
  }

  return diagnostico;
}

export default crearDiagnosticoEdicionDinamica;
