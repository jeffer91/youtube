import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { procesarInteligenciaCreativa } from './inteligencia.conexion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVOS_REQUERIDOS = Object.freeze([
  'inteligencia.config.js',
  'utilidades-extraer-texto.js',
  'inteligencia.conexion.js',
  'hooks/hook-generator.service.js',
  'seo/seo-generator.service.js',
  'miniatura/miniatura-recomendacion.service.js',
  'puntos/puntos-importantes.service.js'
]);

export async function crearDiagnosticoInteligencia() {
  const errores = [];
  const archivos = [];

  for (const archivo of ARCHIVOS_REQUERIDOS) {
    const ruta = path.join(__dirname, archivo);
    const existe = fs.existsSync(ruta);
    archivos.push({ archivo, ruta, existe });
    if (!existe) errores.push(`Falta ${archivo}`);
  }

  let prueba = null;
  try {
    prueba = await procesarInteligenciaCreativa({
      entrada: { rutas: { carpetaProyecto: null } },
      transcripcion: { transcripcion: { segmentos: [{ inicio: 0, fin: 3, texto: 'Evita este error importante en tu video.' }] } },
      opciones: { inteligenciaCreativa: true, perfilAplicado: { id: 'educacion', nombre: 'Educación', ritmo: 'medio', visual: { colorPrincipal: '#2563eb' } } },
      guardar: false
    });
    if (!prueba?.ok) errores.push('La prueba de inteligencia no devolvió ok=true.');
  } catch (error) {
    errores.push(`Falló prueba de inteligencia: ${error.message}`);
  }

  return {
    ok: errores.length === 0,
    modulo: 'inteligencia',
    mensaje: errores.length === 0 ? 'Módulo inteligencia listo.' : `Módulo inteligencia incompleto: ${errores.join(' ')}`,
    archivos,
    prueba: prueba ? { estado: prueba.estado, hook: prueba.hook?.estado, seo: prueba.seo?.estado, miniatura: prueba.miniatura?.estado } : null,
    errores,
    advertencias: [],
    creadoEn: new Date().toISOString()
  };
}

export default crearDiagnosticoInteligencia;
