/*
  Nueva etapa estructural - Bloque 3
  Función: crear títulos, ganchos visuales y textos iniciales desde la transcripción real.
*/

import path from 'path';
import { escribirJson } from '../../comun/archivos.js';
import { limitarNumero, normalizarTexto, obtenerConfigTranscripcion } from '../transcripcion.config.js';

const PALABRAS_FUERZA = Object.freeze(['clave', 'importante', 'problema', 'solución', 'resultado', 'nunca', 'siempre', 'ojo', 'atención', 'recuerda', 'error', 'ganar', 'perder']);

function limpiar(texto = '', max = 64) {
  const valor = normalizarTexto(texto, '').replace(/\s+/g, ' ').trim();
  if (valor.length <= max) return valor;
  return `${valor.slice(0, Math.max(12, max - 3)).trim()}...`;
}

function puntuarSegmento(segmento = {}, index = 0) {
  const texto = limpiar(segmento.texto || segmento.text || '', 180);
  const lower = texto.toLowerCase();
  const fuerza = PALABRAS_FUERZA.filter((palabra) => lower.includes(palabra)).length;
  const pregunta = /[?¿]/.test(texto) ? 2 : 0;
  const exclamacion = /[!¡]/.test(texto) ? 1 : 0;
  const largoBueno = texto.length >= 18 && texto.length <= 120 ? 2 : 0;
  const ventajaInicial = index <= 2 ? 2 : 0;
  return fuerza * 3 + pregunta + exclamacion + largoBueno + ventajaInicial;
}

function obtenerSegmentos(transcripcion = []) {
  return Array.isArray(transcripcion?.segmentos) ? transcripcion.segmentos.filter((item) => normalizarTexto(item?.texto || item?.text, '')) : [];
}

function elegirSegmentoGancho(segmentos = []) {
  if (!segmentos.length) return null;
  return segmentos
    .map((segmento, index) => ({ segmento, puntaje: puntuarSegmento(segmento, index), index }))
    .sort((a, b) => b.puntaje - a.puntaje || a.index - b.index)[0]?.segmento || segmentos[0];
}

function crearTituloPrincipal(segmentos = [], perfil = 'general') {
  const gancho = elegirSegmentoGancho(segmentos);
  const textoGancho = limpiar(gancho?.texto || gancho?.text || '', 42);
  if (textoGancho) return textoGancho;
  const nombrePerfil = String(perfil || 'general').replace(/-/g, ' ');
  return `Idea clave para ${nombrePerfil}`;
}

function crearMomentosTitulos({ segmentos, transcripcion, entendimiento, opciones }) {
  const config = obtenerConfigTranscripcion(opciones);
  const duracion = Number(entendimiento?.analisis?.duracionSegundos || transcripcion?.duracionSegundos || 0);
  const perfil = opciones?.perfil || 'general';
  const titulo = crearTituloPrincipal(segmentos, perfil);
  const gancho = elegirSegmentoGancho(segmentos);
  const inicioGancho = Math.max(0, Number(gancho?.inicio || 0));
  const finGancho = Number(gancho?.fin || Math.min(duracion || 3.4, inicioGancho + 3.4));
  const maxTextos = limitarNumero(config.textosFlotantes.cantidadMaxima, 1, 12, 6);

  const momentos = [
    { id: 'titulo-principal', inicio: 0.2, fin: Math.min(duracion || 3.2, 3.2), texto: titulo, tipo: 'gancho', prioridad: 1, posicion: 'arriba', estilo: 'impacto', motivo: 'Título inicial generado desde la transcripción.' },
    { id: 'gancho-visual', inicio: inicioGancho, fin: Math.max(finGancho, inicioGancho + 1.4), texto: limpiar(gancho?.texto || gancho?.text || titulo, 42), tipo: 'clave', prioridad: 2, posicion: 'centro', estilo: 'badge', motivo: 'Gancho visual elegido por fuerza del segmento.' }
  ];

  const adicionales = segmentos
    .map((segmento, index) => ({ segmento, index, puntaje: puntuarSegmento(segmento, index) }))
    .filter((item) => item.puntaje > 1)
    .sort((a, b) => b.puntaje - a.puntaje || a.index - b.index)
    .slice(0, Math.max(0, maxTextos - momentos.length))
    .map((item, index) => ({
      id: `texto-clave-${index + 1}`,
      inicio: Number(item.segmento.inicio || 0),
      fin: Number(item.segmento.fin || Number(item.segmento.inicio || 0) + 2.4),
      texto: limpiar(item.segmento.texto || item.segmento.text, 42),
      tipo: item.puntaje >= 6 ? 'alerta' : 'clave',
      prioridad: 3 + index,
      posicion: index % 2 === 0 ? 'arriba' : 'abajo',
      estilo: item.puntaje >= 6 ? 'impacto' : 'badge',
      motivo: 'Texto clave generado desde la transcripción.'
    }));

  return [...momentos, ...adicionales].filter((item) => item.texto);
}

function resultadoOmitido(mensaje) {
  return { ok: true, omitido: true, mensaje, titulos: [], ganchos: [], momentosImportantes: [], rutaTitulosGanchos: null, creadoEn: new Date().toISOString() };
}

export async function generarTitulosYGanchos({ entrada, entendimiento, transcripcion, origenMomentos = null, opciones = {} } = {}) {
  const segmentos = obtenerSegmentos(transcripcion);
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (!carpetaProyecto) throw new Error('No se pueden generar títulos porque falta la carpeta del proyecto.');
  if (!segmentos.length) return resultadoOmitido('No se generaron títulos ni ganchos porque no existe transcripción real.');

  const momentosBase = crearMomentosTitulos({ segmentos, transcripcion, entendimiento, opciones });
  const momentosGemini = Array.isArray(origenMomentos?.momentosImportantes) ? origenMomentos.momentosImportantes : [];
  const momentosImportantes = [...momentosBase, ...momentosGemini]
    .filter((item) => item?.texto)
    .sort((a, b) => Number(a.prioridad || 99) - Number(b.prioridad || 99) || Number(a.inicio || 0) - Number(b.inicio || 0));

  const payload = {
    ok: true,
    omitido: false,
    tipo: 'titulos-ganchos-textos',
    titulos: [{ id: 'titulo-principal', texto: momentosBase[0]?.texto || '', inicio: momentosBase[0]?.inicio || 0, fin: momentosBase[0]?.fin || 3.2 }],
    ganchos: momentosBase.filter((item) => ['gancho', 'clave', 'alerta'].includes(item.tipo)).slice(0, 4),
    momentosImportantes,
    origen: origenMomentos?.origen || transcripcion?.fuente || 'transcripcion',
    mensaje: `${momentosImportantes.length} título(s), gancho(s) y textos preparados para el video.`,
    creadoEn: new Date().toISOString()
  };

  const rutaTitulosGanchos = path.join(carpetaProyecto, 'titulos-ganchos.json');
  await escribirJson(rutaTitulosGanchos, payload);
  return { ...payload, rutaTitulosGanchos, nombreArchivo: path.basename(rutaTitulosGanchos) };
}

export default generarTitulosYGanchos;
