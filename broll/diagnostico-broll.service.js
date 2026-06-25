import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { procesarBrollSugerido } from './broll.conexion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVOS_REQUERIDOS = Object.freeze([
  'broll.config.js',
  'sugerir-broll.service.js',
  'guardar-broll-proyecto.js',
  'broll.conexion.js'
]);

export async function crearDiagnosticoBroll() {
  const errores = [];
  const advertencias = [];
  const archivos = [];

  for (const archivo of ARCHIVOS_REQUERIDOS) {
    const ruta = path.join(__dirname, archivo);
    const existe = fs.existsSync(ruta);
    archivos.push({ archivo, ruta, existe });
    if (!existe) errores.push(`Falta ${archivo}`);
  }

  let prueba = null;
  try {
    prueba = await procesarBrollSugerido({
      entrada: { rutas: { carpetaProyecto: null } },
      entendimiento: { analisis: { duracionSegundos: 30 } },
      transcripcion: { transcripcion: { segmentos: [{ inicio: 0, fin: 3, texto: 'Este punto clave necesita apoyo visual.' }] } },
      inteligencia: { puntosImportantes: { puntos: [{ inicio: 0, fin: 3, texto: 'Este punto clave necesita apoyo visual.', puntaje: 5 }] }, seo: { palabrasClave: [{ palabra: 'apoyo' }, { palabra: 'visual' }] } },
      opciones: { perfilAplicado: { id: 'educacion', nombre: 'Educación' } },
      guardar: false
    });
    if (!prueba?.ok) errores.push('La prueba de B-Roll no devolvió ok=true.');
    if (!Array.isArray(prueba?.items)) errores.push('La prueba de B-Roll no devolvió items.');
  } catch (error) {
    errores.push(`Falló prueba de B-Roll: ${error.message}`);
  }

  return {
    ok: errores.length === 0,
    modulo: 'broll',
    mensaje: errores.length === 0 ? 'Módulo B-Roll listo.' : `Módulo B-Roll incompleto: ${errores.join(' ')}`,
    archivos,
    prueba: prueba ? { estado: prueba.estado, total: prueba.total || 0 } : null,
    errores,
    advertencias,
    creadoEn: new Date().toISOString()
  };
}

export default crearDiagnosticoBroll;
