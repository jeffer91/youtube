/*
  Bloque 19
  Funcion: diagnostico fuerte con recomendaciones y reporte ampliado.
*/

import fs from 'fs';
import path from 'path';
import { crearDiagnosticoAutomatico, diagnosticoEsBloqueante } from './diagnostico-automatico.service.js';
import { escribirJson, obtenerRutaDatos, obtenerRutaRaiz } from '../comun/archivos.js';

const ARCHIVOS_FUERTES = Object.freeze([
  'server.js',
  'package.json',
  'app/app.js',
  'app/error-modal.js',
  'motor/flujo-principal.js',
  'motor/flujo-modular-autovideo.service.js',
  'diagnostico/diagnostico-automatico.service.js',
  'diagnostico/reintento-etapa.service.js',
  'gemini/cliente-gemini.service.js',
  'exportacion/renderizar-plataformas-pendientes.service.js',
  'produccion/produccion.conexion.js',
  'aprendizaje/aprendizaje.conexion.js'
]);

const SCRIPTS_FUERTES = Object.freeze([
  'check:autovideo',
  'check:bloques-autovideo',
  'check:bloque18-autovideo',
  'check:diagnostico-modular',
  'check:integracion-modular-final'
]);

function existeArchivo(relativo) {
  return fs.existsSync(path.join(obtenerRutaRaiz(), relativo));
}

function verificarArchivosFuertes() {
  const faltantes = ARCHIVOS_FUERTES.filter((archivo) => !existeArchivo(archivo));
  return {
    ok: faltantes.length === 0,
    total: ARCHIVOS_FUERTES.length,
    faltantes,
    errores: faltantes.map((archivo) => `Falta archivo fuerte: ${archivo}`),
    advertencias: []
  };
}

function verificarPackageFuerte() {
  const ruta = path.join(obtenerRutaRaiz(), 'package.json');
  const errores = [];
  const advertencias = [];
  let version = 'desconocida';

  try {
    const pkg = JSON.parse(fs.readFileSync(ruta, 'utf-8'));
    version = pkg.version || version;
    const scripts = pkg.scripts || {};
    SCRIPTS_FUERTES.forEach((script) => {
      if (!scripts[script]) errores.push(`Falta script fuerte: ${script}`);
    });
    if (!pkg.build?.files?.includes('diagnostico/**/*')) advertencias.push('diagnostico/**/* no esta confirmado en build.files.');
  } catch (error) {
    errores.push(`No se pudo leer package.json: ${error.message}`);
  }

  return {
    ok: errores.length === 0,
    version,
    scriptsRequeridos: SCRIPTS_FUERTES,
    errores,
    advertencias
  };
}

function construirRecomendaciones({ automatico, archivos, packageJson } = {}) {
  const recomendaciones = [];
  if (diagnosticoEsBloqueante(automatico)) recomendaciones.push('Resolver primero errores bloqueantes del diagnostico automatico.');
  if (!archivos.ok) recomendaciones.push('Restaurar archivos faltantes antes de procesar videos.');
  if (!packageJson.ok) recomendaciones.push('Corregir package.json y ejecutar npm install si es necesario.');
  if (!recomendaciones.length) recomendaciones.push('Sistema listo. Si una etapa falla, usar Reintentar etapa desde la ventana de error.');
  return recomendaciones;
}

export async function crearDiagnosticoFuerte(opciones = {}) {
  const inicio = Date.now();
  const automatico = await crearDiagnosticoAutomatico({ guardarReporte: false });
  const archivos = verificarArchivosFuertes();
  const packageJson = verificarPackageFuerte();
  const errores = [...(automatico.errores || []), ...archivos.errores, ...packageJson.errores];
  const advertencias = [...(automatico.advertencias || []), ...archivos.advertencias, ...packageJson.advertencias];
  const bloqueante = diagnosticoEsBloqueante(automatico) || !archivos.ok || !packageJson.ok;

  const diagnostico = {
    ok: errores.length === 0,
    bloqueante,
    tipo: 'diagnostico-fuerte',
    version: '1.0.0',
    mensaje: errores.length ? `Diagnostico fuerte encontro ${errores.length} problema(s).` : 'Diagnostico fuerte correcto.',
    automatico,
    archivos,
    packageJson,
    errores,
    advertencias,
    recomendaciones: construirRecomendaciones({ automatico, archivos, packageJson }),
    duracionMs: Date.now() - inicio,
    creadoEn: new Date().toISOString()
  };

  if (opciones.guardarReporte) {
    const rutaReporte = path.join(obtenerRutaDatos(), 'diagnosticos', 'diagnostico-fuerte.json');
    await escribirJson(rutaReporte, diagnostico);
    return { ...diagnostico, rutaReporte };
  }

  return diagnostico;
}

export default crearDiagnosticoFuerte;
