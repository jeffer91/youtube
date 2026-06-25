import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVOS_REQUERIDOS = Object.freeze([
  'estados-plan.js',
  'plan-edicion.config.js',
  'crear-plan-edicion.service.js',
  'validar-plan-edicion.js',
  'guardar-plan-edicion.js',
  'cargar-plan-edicion.js',
  'aplicar-cambios-plan.js',
  'aprobar-plan-edicion.js',
  'plan-edicion.conexion.js'
]);

export async function crearDiagnosticoPlanEdicion() {
  const errores = [];
  const advertencias = [];
  const archivos = [];

  for (const archivo of ARCHIVOS_REQUERIDOS) {
    const ruta = path.join(__dirname, archivo);
    const existe = fs.existsSync(ruta);
    archivos.push({ archivo, ruta, existe });
    if (!existe) errores.push(`Falta ${archivo}`);
  }

  return {
    ok: errores.length === 0,
    modulo: 'plan-edicion',
    mensaje: errores.length === 0 ? 'Módulo plan-edicion listo.' : `Módulo plan-edicion incompleto: ${errores.join(' ')}`,
    archivos,
    errores,
    advertencias,
    creadoEn: new Date().toISOString()
  };
}

export default crearDiagnosticoPlanEdicion;
