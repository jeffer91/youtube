/*
  Modulo: biblioteca
  Funcion: leer indice general de recursos permanentes.
*/

import fs from 'fs/promises';
import path from 'path';
import { BIBLIOTECA_CONFIG } from './biblioteca.config.js';
import { crearRecursoModelo } from './recurso.modelo.js';
import { obtenerRutasBibliotecaGeneral, asegurarEstructuraBibliotecaGeneral } from './rutas-biblioteca.service.js';

export function obtenerRutaIndiceBiblioteca() {
  return obtenerRutasBibliotecaGeneral().indice;
}

export async function leerIndiceBibliotecaGeneral() {
  const rutas = asegurarEstructuraBibliotecaGeneral();
  try {
    const datos = JSON.parse(await fs.readFile(rutas.indice, 'utf-8'));
    const recursos = Array.isArray(datos.recursos) ? datos.recursos : [];
    return {
      version: datos.version || BIBLIOTECA_CONFIG.version,
      alcance: 'general',
      rutas: {
        indice: rutas.indice,
        archivos: rutas.archivos
      },
      recursos
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        version: BIBLIOTECA_CONFIG.version,
        alcance: 'general',
        rutas: {
          indice: rutas.indice,
          archivos: rutas.archivos
        },
        recursos: []
      };
    }
    throw error;
  }
}

export async function listarRecursosBiblioteca() {
  const indice = await leerIndiceBibliotecaGeneral();
  return indice.recursos
    .map((recurso) => crearRecursoModelo(recurso))
    .sort((a, b) => String(b.actualizadoEn || '').localeCompare(String(a.actualizadoEn || '')));
}

export async function escribirIndiceBibliotecaGeneral(recursos = []) {
  const rutas = asegurarEstructuraBibliotecaGeneral();
  const normalizados = recursos.map((recurso) => crearRecursoModelo(recurso));
  const payload = {
    version: BIBLIOTECA_CONFIG.version,
    alcance: 'general',
    actualizadoEn: new Date().toISOString(),
    total: normalizados.length,
    recursos: normalizados
  };
  await fs.mkdir(path.dirname(rutas.indice), { recursive: true });
  await fs.writeFile(rutas.indice, JSON.stringify(payload, null, 2), 'utf-8');
  return payload;
}
