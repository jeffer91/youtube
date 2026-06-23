import fs from 'fs';

import { crearEdicionTikTokSimple } from './tiktok-simple/tiktok.service.js';
import { crearEdicionTikTokCuadradoCentro } from './tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js';

const MODOS_TIKTOK = Object.freeze({ SIMPLE: 'simple', CUADRADO_CENTRO: 'cuadrado-centro' });
const PLATAFORMA_PREDETERMINADA = 'tiktok';
const MODO_VIDEO_PREDETERMINADO = MODOS_TIKTOK.CUADRADO_CENTRO;

function validarEntradaParaEditar(entrada) {
  if (!entrada || typeof entrada !== 'object') throw new Error('No se puede editar porque la entrada no es válida.');
  if (!entrada.video?.rutaOriginal) throw new Error('No se puede editar porque falta la ruta del video original.');
  if (!fs.existsSync(entrada.video.rutaOriginal)) throw new Error(`No se puede editar porque no existe el video: ${entrada.video.rutaOriginal}`);
  if (!entrada.proyecto?.id) throw new Error('No se puede editar porque falta el ID del proyecto.');
  if (!entrada.rutas?.carpetaProyecto) throw new Error('No se puede editar porque falta la carpeta del proyecto.');
}

function validarEntendimiento(entendimiento) {
  if (!entendimiento || typeof entendimiento !== 'object') throw new Error('No se puede editar porque falta el entendimiento del video.');
  if (entendimiento.ok !== true) throw new Error('No se puede editar porque el análisis del video no terminó correctamente.');
  if (!entendimiento.analisis || typeof entendimiento.analisis !== 'object') throw new Error('No se puede editar porque falta el análisis técnico del video.');
}

function normalizarTexto(valor, valorPorDefecto) {
  if (typeof valor !== 'string') return valorPorDefecto;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : valorPorDefecto;
}

function normalizarPlataforma(opciones, entrada) {
  return normalizarTexto(opciones?.plataforma || entrada?.proyecto?.plataforma, PLATAFORMA_PREDETERMINADA).toLowerCase();
}

function normalizarModo(opciones, entrada) {
  const modo = normalizarTexto(opciones?.modo || entrada?.proyecto?.modo, MODO_VIDEO_PREDETERMINADO).toLowerCase();
  if (['cuadrado-centro', 'tiktok-cuadrado-centro', 'square-center'].includes(modo)) return MODOS_TIKTOK.CUADRADO_CENTRO;
  if (['simple', 'tiktok-simple'].includes(modo)) return MODOS_TIKTOK.SIMPLE;
  return modo;
}

function validarModoTikTok(modo) {
  const modosDisponibles = Object.values(MODOS_TIKTOK);
  if (!modosDisponibles.includes(modo)) throw new Error(`Modo de edición TikTok no soportado: ${modo}. Modos disponibles: ${modosDisponibles.join(', ')}`);
}

async function editarTikTok({ entrada, entendimiento, audio = null, transcripcion = null, opciones, modo, plataforma }) {
  validarModoTikTok(modo);
  const opcionesFinales = { ...opciones, plataforma, modo };
  if (modo === MODOS_TIKTOK.SIMPLE) return await crearEdicionTikTokSimple({ entrada, entendimiento, audio, transcripcion, opciones: opcionesFinales });
  return await crearEdicionTikTokCuadradoCentro({ entrada, entendimiento, audio, transcripcion, opciones: opcionesFinales });
}

export async function editarVideo({ entrada, entendimiento, audio = null, transcripcion = null, opciones = {} }) {
  validarEntradaParaEditar(entrada);
  validarEntendimiento(entendimiento);
  const plataforma = normalizarPlataforma(opciones, entrada);
  const modo = normalizarModo(opciones, entrada);
  if (plataforma !== 'tiktok') throw new Error(`Esta versión solo admite TikTok. Plataforma indicada: ${plataforma}`);
  return await editarTikTok({ entrada, entendimiento, audio, transcripcion, opciones, modo, plataforma });
}
