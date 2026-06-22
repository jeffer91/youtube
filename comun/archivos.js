/*
  Nombre completo: archivos.js
  Ruta o ubicación: AutoVideoJeff/comun/archivos.js
  Función o funciones:
    - Centralizar operaciones comunes de archivos y carpetas.
    - Crear carpetas de forma segura.
    - Copiar archivos sin repetir lógica en cada módulo.
    - Leer y escribir archivos JSON.
    - Generar nombres seguros e IDs de proyecto.
    - Usar una ruta compatible con Electron cuando exista AUTOVIDEOJEFF_ROOT_DIR.
    - Preparar carpetas estándar para videos, proyectos, temporales y audios mejorados.
  Con qué se conecta:
    - entrada/subir-simple/subir.service.js
    - entender/analisis-simple/analisis.service.js
    - editar/tiktok-simple/tiktok.service.js
    - audio/limpieza-simple/limpieza-audio.service.js
    - salida/exportar-simple/exportar.service.js
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rutaProyecto = path.resolve(__dirname, '..');

export function obtenerRutaProyecto() {
  return rutaProyecto;
}

export function obtenerRutaRaiz() {
  const rutaElectron = process.env.AUTOVIDEOJEFF_ROOT_DIR;

  if (rutaElectron && typeof rutaElectron === 'string') {
    return path.resolve(rutaElectron);
  }

  return rutaProyecto;
}

export function obtenerRutaDatos() {
  return path.join(obtenerRutaRaiz(), 'datos');
}

export function obtenerRutasDatosBase() {
  const raiz = obtenerRutaRaiz();
  const datos = path.join(raiz, 'datos');

  return {
    raiz,
    datos,
    proyectos: path.join(datos, 'proyectos'),
    temporales: path.join(datos, 'temporales'),
    subidas: path.join(datos, 'temporales', 'subidas'),
    videosOriginales: path.join(datos, 'videos-originales'),
    videosExportados: path.join(datos, 'videos-exportados'),
    audiosMejorados: path.join(datos, 'audios-mejorados')
  };
}

export function asegurarCarpeta(rutaCarpeta) {
  if (!rutaCarpeta || typeof rutaCarpeta !== 'string') {
    throw new Error('No se puede crear una carpeta sin ruta válida.');
  }

  fs.mkdirSync(rutaCarpeta, { recursive: true });
  return rutaCarpeta;
}

export function asegurarCarpetasBase() {
  const rutas = obtenerRutasDatosBase();

  asegurarCarpeta(rutas.datos);
  asegurarCarpeta(rutas.proyectos);
  asegurarCarpeta(rutas.temporales);
  asegurarCarpeta(rutas.subidas);
  asegurarCarpeta(rutas.videosOriginales);
  asegurarCarpeta(rutas.videosExportados);
  asegurarCarpeta(rutas.audiosMejorados);

  return rutas;
}

export function normalizarNombreArchivo(nombre) {
  const extension = path.extname(nombre || '.mp4') || '.mp4';
  const base = path.basename(nombre || 'video', extension);

  const baseLimpia = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return `${baseLimpia || 'video'}${extension.toLowerCase()}`;
}

export function crearIdProyecto(prefijo = 'proyecto') {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mi = String(fecha.getMinutes()).padStart(2, '0');
  const ss = String(fecha.getSeconds()).padStart(2, '0');
  const aleatorio = Math.random().toString(36).slice(2, 8);

  return `${prefijo}-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${aleatorio}`;
}

export async function copiarArchivoSeguro(origen, destino) {
  if (!origen || !destino) {
    throw new Error('No se puede copiar archivo: falta origen o destino.');
  }

  await fs.promises.mkdir(path.dirname(destino), { recursive: true });
  await fs.promises.copyFile(origen, destino);
  return destino;
}

export async function escribirJson(rutaArchivo, datos) {
  if (!rutaArchivo) {
    throw new Error('No se puede escribir JSON sin ruta de archivo.');
  }

  await fs.promises.mkdir(path.dirname(rutaArchivo), { recursive: true });
  await fs.promises.writeFile(rutaArchivo, JSON.stringify(datos, null, 2), 'utf-8');
  return rutaArchivo;
}

export async function leerJsonSiExiste(rutaArchivo, valorPorDefecto = null) {
  try {
    const contenido = await fs.promises.readFile(rutaArchivo, 'utf-8');
    return JSON.parse(contenido);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return valorPorDefecto;
    }

    if (error instanceof SyntaxError) {
      throw new Error(`JSON inválido en ${rutaArchivo}: ${error.message}`);
    }

    throw error;
  }
}

export function crearRutaRelativaParaWeb(rutaAbsoluta) {
  const raiz = obtenerRutaRaiz();
  return path.relative(raiz, rutaAbsoluta).replace(/\\/g, '/');
}