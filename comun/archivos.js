/*
  Nombre completo: archivos.js
  Ruta o ubicación: AutoVideoJeff/comun/archivos.js
  Función o funciones:
    - Centralizar operaciones comunes de archivos y carpetas.
    - Crear carpetas de forma segura.
    - Copiar archivos sin repetir lógica en cada módulo.
    - Leer y escribir archivos JSON.
    - Generar nombres seguros e IDs de proyecto.
  Con qué se conecta:
    - entrada/subir-simple/subir.service.js
    - entender/transcripcion-simple/transcripcion.service.js
    - futuros módulos de editar/ y salida/
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function obtenerRutaRaiz() {
  return path.resolve(__dirname, '..');
}

export function asegurarCarpeta(rutaCarpeta) {
  fs.mkdirSync(rutaCarpeta, { recursive: true });
  return rutaCarpeta;
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
  await fs.promises.mkdir(path.dirname(destino), { recursive: true });
  await fs.promises.copyFile(origen, destino);
  return destino;
}

export async function escribirJson(rutaArchivo, datos) {
  await fs.promises.mkdir(path.dirname(rutaArchivo), { recursive: true });
  await fs.promises.writeFile(rutaArchivo, JSON.stringify(datos, null, 2), 'utf-8');
  return rutaArchivo;
}

export async function leerJsonSiExiste(rutaArchivo, valorPorDefecto = null) {
  try {
    const contenido = await fs.promises.readFile(rutaArchivo, 'utf-8');
    return JSON.parse(contenido);
  } catch (_error) {
    return valorPorDefecto;
  }
}

export function crearRutaRelativaParaWeb(rutaAbsoluta) {
  const raiz = obtenerRutaRaiz();
  return path.relative(raiz, rutaAbsoluta).replace(/\\/g, '/');
}
