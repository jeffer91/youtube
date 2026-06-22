/*
  Nombre completo: construir-cadena-audio.js
  Ruta o ubicación: AutoVideoJeff/audio/audio-inteligente/construir-cadena-audio.js
  Función o funciones:
    - Convertir un perfil de audio inteligente en una cadena real de filtros FFmpeg.
    - Aplicar límites de seguridad para evitar valores peligrosos.
    - Construir filtros por etapas: limpieza, ecualización, compresión, normalización y control final.
    - Entregar una lista legible de filtros para reportes técnicos.
  Con qué se conecta:
    - audio/audio-inteligente/perfiles-audio-inteligente.js
    - audio/audio-inteligente/audio-inteligente.config.js
    - audio/audio-inteligente/ejecutar-master-audio.js
    - audio/audio-inteligente/audio-inteligente.service.js
*/

import { limitarNumero, obtenerConfigAudioInteligente } from './audio-inteligente.config.js';
import { normalizarPerfilAudio } from './perfiles-audio-inteligente.js';

function redondear(valor, decimales = 2) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  const factor = 10 ** decimales;
  return Math.round(numero * factor) / factor;
}

function ajustar(valor, intensidad, minimo, maximo, respaldo) {
  const base = Number.isFinite(Number(valor)) ? Number(valor) : respaldo;
  return limitarNumero(redondear(base * intensidad, 2), minimo, maximo, respaldo);
}

function filtroRuido(perfil, config) {
  const ruido = perfil.filtros.reduccionRuido || {};
  if (ruido.activo === false) return null;
  const intensidad = config.calidadActiva?.intensidadGlobal || 1;
  const nf = limitarNumero(ruido.noiseFloorDb, config.filtrosSeguros.noiseFloorMinDb, config.filtrosSeguros.noiseFloorMaxDb, -30);
  const nr = ajustar(ruido.reduccion, intensidad, config.filtrosSeguros.reduccionRuidoMin, config.filtrosSeguros.reduccionRuidoMax, 10);
  const tn = ruido.seguimientoRuido === false ? 0 : 1;
  return `afftdn=nf=${nf}:nr=${nr}:tn=${tn}`;
}

function filtrosEq(perfil, config) {
  const bandas = Array.isArray(perfil.filtros.ecualizacion) ? perfil.filtros.ecualizacion : [];
  const intensidad = config.calidadActiva?.intensidadGlobal || 1;

  return bandas.map((banda) => {
    const f = limitarNumero(banda.frecuenciaHz, 60, 16000, 3000);
    const w = limitarNumero(banda.ancho, 0.2, 4, 1);
    const g = ajustar(banda.gananciaDb, intensidad, config.filtrosSeguros.gananciaMinDb, config.filtrosSeguros.gananciaMaxDb, 0);
    return `equalizer=f=${f}:t=q:w=${w}:g=${g}`;
  });
}

function filtroGanancia(perfil, config, analisis) {
  const volumenMedio = analisis?.volumen?.volumenMedioDb;
  let ganancia = Number(perfil.filtros.gananciaInicialDb || 0);

  if (Number.isFinite(volumenMedio) && volumenMedio < -34) ganancia += 1.5;
  if (Number.isFinite(volumenMedio) && volumenMedio > -12) ganancia -= 1.5;

  ganancia = limitarNumero(redondear(ganancia, 2), config.filtrosSeguros.gananciaMinDb, config.filtrosSeguros.gananciaMaxDb, 0);
  return Math.abs(ganancia) < 0.1 ? null : `volume=${ganancia}dB`;
}

function filtroCompresor(perfil) {
  const c = perfil.filtros.compresor || {};
  if (c.activo === false) return null;

  const threshold = limitarNumero(c.thresholdDb, -40, -6, -18);
  const ratio = limitarNumero(c.ratio, 1, 8, 2.4);
  const attack = limitarNumero(c.attackMs, 1, 80, 12);
  const release = limitarNumero(c.releaseMs, 40, 800, 180);
  const makeup = limitarNumero(c.makeupDb, 0, 8, 1.5);

  return `acompressor=threshold=${threshold}dB:ratio=${ratio}:attack=${attack}:release=${release}:makeup=${makeup}`;
}

function filtroLoudnorm(perfil, config) {
  const l = perfil.filtros.loudnorm || {};
  if (l.activo === false) return null;

  const i = limitarNumero(l.intensidadIntegrada, config.filtrosSeguros.loudnessMinI, config.filtrosSeguros.loudnessMaxI, -16);
  const tp = limitarNumero(l.truePeak, -3, config.filtrosSeguros.truePeakMaxDb, -1.5);
  const lra = limitarNumero(l.rangoLoudness, config.filtrosSeguros.lraMin, config.filtrosSeguros.lraMax, 10);

  return `loudnorm=I=${i}:TP=${tp}:LRA=${lra}`;
}

function filtroControlFinal(perfil) {
  const l = perfil.filtros.limitador || {};
  if (l.activo === false) return null;

  const limit = limitarNumero(l.limite, 0.75, 0.99, 0.95);
  const attack = limitarNumero(l.attack, 1, 50, 5);
  const release = limitarNumero(l.release, 20, 500, 70);

  return `alimiter=limit=${limit}:attack=${attack}:release=${release}`;
}

function limpiar(filtros) {
  return filtros.flat().filter((filtro) => typeof filtro === 'string' && filtro.trim()).map((filtro) => filtro.trim());
}

export function construirFiltrosComoLista({ perfilId, perfil, analisis = null, opciones = {} } = {}) {
  const config = obtenerConfigAudioInteligente(opciones);
  const p = perfil || normalizarPerfilAudio(perfilId);
  const highpass = limitarNumero(p.filtros.highpassHz, config.filtrosSeguros.highpassMinHz, config.filtrosSeguros.highpassMaxHz, 80);
  const lowpass = limitarNumero(p.filtros.lowpassHz, config.filtrosSeguros.lowpassMinHz, config.filtrosSeguros.lowpassMaxHz, 14500);
  const frecuencia = limitarNumero(config.salida.frecuenciaMuestreo, 22050, 96000, 48000);
  const canales = Number(config.salida.canales) === 1 ? 'mono' : 'stereo';

  const filtros = limpiar([
    `highpass=f=${highpass}`,
    `lowpass=f=${lowpass}`,
    filtroRuido(p, config),
    filtroGanancia(p, config, analisis),
    filtrosEq(p, config),
    filtroCompresor(p),
    filtroLoudnorm(p, config),
    filtroControlFinal(p),
    `aresample=${frecuencia}`,
    `aformat=channel_layouts=${canales}`
  ]);

  return {
    ok: true,
    perfilId: p.id,
    perfilNombre: p.nombre,
    calidad: config.calidadSeleccionada,
    filtros,
    cantidadFiltros: filtros.length
  };
}

export function construirCadenaAudioInteligente({ perfilId, perfil, analisis = null, opciones = {} } = {}) {
  const resultado = construirFiltrosComoLista({ perfilId, perfil, analisis, opciones });
  return { ...resultado, filtroAudio: resultado.filtros.join(',') };
}

export function construirCadenaAudioSegura(opciones = {}) {
  return construirCadenaAudioInteligente({ perfilId: 'seguro', opciones });
}

export default construirCadenaAudioInteligente;
