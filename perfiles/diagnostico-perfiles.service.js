import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validarTodosLosPerfiles } from './validar-perfil.js';
import { obtenerResumenPerfilesVisuales } from './obtener-perfil.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVOS_REQUERIDOS = Object.freeze([
  'perfiles.config.js',
  'validar-perfil.js',
  'obtener-perfil.service.js',
  'aplicar-perfil-a-opciones.js',
  'perfiles.conexion.js'
]);

export async function crearDiagnosticoPerfilesVisuales() {
  const errores = [];
  const advertencias = [];
  const archivos = [];

  for (const archivo of ARCHIVOS_REQUERIDOS) {
    const ruta = path.join(__dirname, archivo);
    const existe = fs.existsSync(ruta);
    archivos.push({ archivo, ruta, existe });
    if (!existe) errores.push(`Falta ${archivo}`);
  }

  const validacion = validarTodosLosPerfiles();
  if (!validacion.ok) errores.push(...validacion.errores);

  const resumen = obtenerResumenPerfilesVisuales();
  if (!resumen.perfiles.length) errores.push('No hay perfiles visuales registrados.');

  return {
    ok: errores.length === 0,
    modulo: 'perfiles',
    mensaje: errores.length === 0 ? 'Módulo perfiles listo.' : `Módulo perfiles incompleto: ${errores.join(' ')}`,
    archivos,
    perfiles: resumen.perfiles,
    predeterminado: resumen.predeterminado,
    validacion,
    errores,
    advertencias,
    creadoEn: new Date().toISOString()
  };
}

export default crearDiagnosticoPerfilesVisuales;
