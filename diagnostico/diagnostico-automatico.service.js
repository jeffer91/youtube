import path from 'path';
import { escribirJson, obtenerRutaDatos } from '../comun/archivos.js';
import { obtenerConfigDiagnosticoAutomatico } from './diagnostico-automatico.config.js';
import { verificarFfmpegDiagnostico } from './verificar-ffmpeg.service.js';
import { verificarCarpetasDiagnostico } from './verificar-carpetas.service.js';
import { verificarModulosEdicionDiagnostico } from './verificar-modulos-edicion.service.js';

function obtenerErrores(resultados) {
  return resultados.flatMap((item) => item.errores || []);
}

function obtenerAdvertencias(resultados) {
  return resultados.flatMap((item) => item.advertencias || []);
}

export function diagnosticoEsBloqueante(diagnostico) {
  return Boolean(diagnostico?.bloqueante || (diagnostico?.errores || []).length > 0);
}

export async function crearDiagnosticoAutomatico(opciones = {}) {
  const config = obtenerConfigDiagnosticoAutomatico(opciones);
  const inicio = Date.now();

  const ffmpeg = await verificarFfmpegDiagnostico();
  const carpetas = await verificarCarpetasDiagnostico();
  const modulos = await verificarModulosEdicionDiagnostico({ modulos: config.modulosCriticos });

  const resultados = [ffmpeg, carpetas, modulos];
  const errores = obtenerErrores(resultados);
  const advertencias = obtenerAdvertencias(resultados);
  const bloqueante = Boolean(
    (config.bloquearSiFfmpegFalla && !ffmpeg.ok) ||
    (config.bloquearSiCarpetasFallan && !carpetas.ok) ||
    (config.bloquearSiModulosCriticosFallan && !modulos.ok)
  );

  const diagnostico = {
    ok: errores.length === 0,
    bloqueante,
    tipo: 'diagnostico-automatico',
    version: config.version,
    mensaje: errores.length === 0 ? 'Diagnóstico automático correcto.' : `Diagnóstico automático encontró problemas: ${errores.join(' ')}`,
    resumen: {
      ffmpeg: ffmpeg.ok,
      carpetas: carpetas.ok,
      modulos: modulos.ok,
      errores: errores.length,
      advertencias: advertencias.length,
      bloqueante
    },
    ffmpeg,
    carpetas,
    modulos,
    errores,
    advertencias,
    duracionMs: Date.now() - inicio,
    creadoEn: new Date().toISOString()
  };

  if (config.guardarReporte) {
    const rutaReporte = path.join(obtenerRutaDatos(), 'diagnosticos', config.nombreReporte);
    await escribirJson(rutaReporte, diagnostico);
    return { ...diagnostico, rutaReporte };
  }

  return diagnostico;
}

export default crearDiagnosticoAutomatico;
