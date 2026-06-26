/*
  Bloque 10
  Funcion: diagnostico final de modulos nuevos de AutoVideoJeff.
*/

import fs from 'fs';
import path from 'path';

const MODULOS_REQUERIDOS = Object.freeze([
  { id: 'proyectos', carpeta: 'proyectos', conexion: 'proyectos.conexion.js' },
  { id: 'perfiles', carpeta: 'perfiles', conexion: 'perfiles.conexion.js' },
  { id: 'exportacion', carpeta: 'exportacion', conexion: 'exportacion.conexion.js' },
  { id: 'audio', carpeta: 'audio', conexion: 'audio.conexion.js' },
  { id: 'subtitulos', carpeta: 'subtitulos', conexion: 'subtitulos.conexion.js' },
  { id: 'textos', carpeta: 'textos', conexion: 'textos.conexion.js' },
  { id: 'visual', carpeta: 'visual', conexion: 'visual.conexion.js' },
  { id: 'biblioteca', carpeta: 'biblioteca', conexion: 'biblioteca.conexion.js' },
  { id: 'biblioteca-proyecto', carpeta: 'biblioteca-proyecto', conexion: 'biblioteca-proyecto.conexion.js' },
  { id: 'recursos-externos', carpeta: 'recursos-externos', conexion: 'recursos-externos.conexion.js' },
  { id: 'gemini', carpeta: 'gemini', conexion: 'gemini.conexion.js' },
  { id: 'produccion', carpeta: 'produccion', conexion: 'produccion.conexion.js' },
  { id: 'aprendizaje', carpeta: 'aprendizaje', conexion: 'aprendizaje.conexion.js' },
  { id: 'servidor-modular', carpeta: 'server', conexion: 'rutas-modulares.service.js' }
]);

const ARCHIVOS_UI_REQUERIDOS = Object.freeze([
  'app/index.html',
  'app/app.js',
  'app/navegacion/navegacion.service.js',
  'app/navegacion/navegacion-bootstrap.js',
  'app/navegacion/navegacion.css',
  'app/resultado-plataformas-ui.js',
  'app/resultado-plataformas.css'
]);

function existe(ruta) {
  return fs.existsSync(path.join(process.cwd(), ruta));
}

function diagnosticarModulo(modulo) {
  const rutaCarpeta = modulo.carpeta;
  const rutaConexion = path.join(modulo.carpeta, modulo.conexion).replace(/\\/g, '/');
  const carpetaExiste = existe(rutaCarpeta);
  const conexionExiste = existe(rutaConexion);
  const errores = [];

  if (!carpetaExiste) errores.push(`No existe carpeta ${rutaCarpeta}.`);
  if (!conexionExiste) errores.push(`No existe archivo conexion ${rutaConexion}.`);

  return {
    id: modulo.id,
    carpeta: rutaCarpeta,
    conexion: rutaConexion,
    ok: errores.length === 0,
    errores
  };
}

export function crearDiagnosticoModularAutoVideoJeff() {
  const modulos = MODULOS_REQUERIDOS.map(diagnosticarModulo);
  const ui = ARCHIVOS_UI_REQUERIDOS.map((archivo) => ({ archivo, ok: existe(archivo), errores: existe(archivo) ? [] : [`No existe ${archivo}.`] }));
  const errores = [...modulos, ...ui].flatMap((item) => item.errores || []);

  return {
    ok: errores.length === 0,
    tipo: 'diagnostico-modular-autovideo',
    totalModulos: modulos.length,
    modulosOk: modulos.filter((item) => item.ok).length,
    totalUi: ui.length,
    uiOk: ui.filter((item) => item.ok).length,
    modulos,
    ui,
    errores,
    bloqueante: errores.length > 0,
    creadoEn: new Date().toISOString()
  };
}

export { MODULOS_REQUERIDOS, ARCHIVOS_UI_REQUERIDOS };
