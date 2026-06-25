import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVOS_REQUERIDOS = Object.freeze([
  'revision.config.js',
  'crear-draft.service.js',
  'cargar-draft.service.js',
  'guardar-correcciones-draft.js',
  'validar-cambios-draft.js',
  'aplicar-draft-a-plan.js',
  'revision.conexion.js'
]);

export async function crearDiagnosticoRevision() {
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
    modulo: 'revision',
    mensaje: errores.length === 0 ? 'Módulo revision listo.' : `Módulo revision incompleto: ${errores.join(' ')}`,
    archivos,
    errores,
    advertencias,
    creadoEn: new Date().toISOString()
  };
}

export default crearDiagnosticoRevision;
