/*
  Modulo: perfiles
  Funcion: memoria basica de preferencias y aprendizaje por perfil.
*/

import fs from 'fs/promises';
import path from 'path';
import { obtenerPerfil } from './obtener-perfil.service.js';

const RUTA_MEMORIA = path.join('salida', 'memoria', 'perfiles.json');

async function leerMemoria(baseDir = process.cwd()) {
  const ruta = path.join(baseDir, RUTA_MEMORIA);
  try {
    return JSON.parse(await fs.readFile(ruta, 'utf-8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

export async function registrarMemoriaPerfil(perfilId, entrada = {}, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const perfil = obtenerPerfil(perfilId);
  const ruta = path.join(baseDir, RUTA_MEMORIA);
  const memoria = await leerMemoria(baseDir);
  const lista = Array.isArray(memoria[perfil.id]) ? memoria[perfil.id] : [];

  lista.push({
    id: `memoria-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    perfil: perfil.id,
    tipo: entrada.tipo || 'preferencia',
    descripcion: entrada.descripcion || '',
    datos: entrada.datos || {},
    creadoEn: new Date().toISOString()
  });

  memoria[perfil.id] = lista;
  await fs.mkdir(path.dirname(ruta), { recursive: true });
  await fs.writeFile(ruta, JSON.stringify(memoria, null, 2), 'utf-8');
  return memoria[perfil.id];
}

export async function obtenerMemoriaPerfil(perfilId, opciones = {}) {
  const baseDir = opciones.baseDir || process.cwd();
  const perfil = obtenerPerfil(perfilId);
  const memoria = await leerMemoria(baseDir);
  return memoria[perfil.id] || [];
}
