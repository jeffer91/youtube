import path from 'path';
import { asegurarCarpeta, escribirJson, leerJsonSiExiste, obtenerRutaRaiz } from '../comun/archivos.js';
import { detectarImagenesSugeridasDesdeEntendimiento } from '../entender/recursos-sugeridos/detectar-imagenes-sugeridas.service.js';

const SUGERENCIAS_BASE = Object.freeze([
  {
    id: 'tema-principal',
    nombre: 'Tema principal del video',
    motivo: 'La app necesita una imagen principal para reforzar la idea central del video.',
    usoSugerido: 'imagen de apoyo para reforzar la idea central del video',
    categoria: 'otro',
    tipo: 'imagen',
    formato: 'imagen',
    etiquetas: ['tema-principal', 'apoyo-visual', 'temporal'],
    estado: 'pendiente'
  },
  {
    id: 'personaje-lugar-equipo',
    nombre: 'Personaje, lugar, equipo o país mencionado',
    motivo: 'La transcripción puede mencionar personas, lugares, equipos o países que conviene mostrar visualmente.',
    usoSugerido: 'recurso visual cuando se mencione en la transcripción',
    categoria: 'otro',
    tipo: 'imagen',
    formato: 'imagen',
    etiquetas: ['mencionado', 'apoyo-visual', 'temporal'],
    estado: 'pendiente'
  },
  {
    id: 'grafico-tabla-mapa',
    nombre: 'Tabla, mapa o gráfico de apoyo',
    motivo: 'Algunas explicaciones pueden necesitar una imagen tipo tabla, mapa o gráfico.',
    usoSugerido: 'imagen explicativa para partes difíciles del video',
    categoria: 'otro',
    tipo: 'imagen',
    formato: 'imagen',
    etiquetas: ['grafico', 'tabla', 'mapa', 'temporal'],
    estado: 'pendiente'
  }
]);

function texto(valor = '', respaldo = '') {
  const limpio = String(valor ?? '').trim();
  return limpio || respaldo;
}

function lista(valor = []) {
  if (Array.isArray(valor)) return valor.map((item) => texto(item)).filter(Boolean);
  if (typeof valor === 'string' && valor.trim()) return valor.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function rutaProyecto(proyectoId) {
  if (!proyectoId) throw new Error('Falta proyectoId para imágenes sugeridas.');
  return path.join(obtenerRutaRaiz(), 'datos', 'proyectos', proyectoId);
}

function rutaArchivoImagenesSugeridas(proyectoId) {
  return path.join(rutaProyecto(proyectoId), 'biblioteca-proyecto', 'imagenes-sugeridas.json');
}

function normalizarEstado(estado = 'pendiente') {
  const limpio = texto(estado, 'pendiente').toLowerCase();
  if (['pendiente', 'subida', 'omitida', 'no-necesaria', 'guardada'].includes(limpio)) return limpio === 'no-necesaria' ? 'omitida' : limpio;
  return 'pendiente';
}

function normalizarSugerencia(sugerencia = {}, base = {}) {
  const id = texto(sugerencia.id || base.id, 'sugerencia-imagen');
  return {
    id,
    nombre: texto(sugerencia.nombre || base.nombre, id),
    motivo: texto(sugerencia.motivo || base.motivo, 'Imagen sugerida para reforzar el video.'),
    usoSugerido: texto(sugerencia.usoSugerido || sugerencia.uso || base.usoSugerido, 'apoyo visual del proyecto'),
    categoria: texto(sugerencia.categoria || base.categoria, 'otro'),
    tipo: 'imagen',
    formato: 'imagen',
    etiquetas: lista(sugerencia.etiquetas).length ? lista(sugerencia.etiquetas) : lista(base.etiquetas),
    estado: normalizarEstado(sugerencia.estado || base.estado),
    detalle: texto(sugerencia.detalle || base.detalle, ''),
    recursoId: texto(sugerencia.recursoId || base.recursoId, ''),
    archivoNombre: texto(sugerencia.archivoNombre || base.archivoNombre, ''),
    prioridad: Number.isFinite(Number(sugerencia.prioridad ?? base.prioridad)) ? Number(sugerencia.prioridad ?? base.prioridad) : 50,
    fuente: texto(sugerencia.fuente || base.fuente, 'manual'),
    actualizadoEn: texto(sugerencia.actualizadoEn || base.actualizadoEn, new Date().toISOString())
  };
}

function crearEstadoInicial(proyectoId) {
  return {
    ok: true,
    proyectoId,
    tipo: 'imagenes-sugeridas-proyecto',
    version: 1,
    total: SUGERENCIAS_BASE.length,
    totalAutomaticas: 0,
    sugerencias: SUGERENCIAS_BASE.map((item) => normalizarSugerencia(item)),
    actualizadoEn: new Date().toISOString()
  };
}

function fusionarSugerencias(base = [], cambios = []) {
  const mapa = new Map();
  base.forEach((item) => mapa.set(item.id, normalizarSugerencia(item)));
  cambios.forEach((item) => {
    const id = texto(item.id, '');
    if (!id) return;
    const previo = mapa.get(id) || {};
    const previoProtegido = ['subida', 'guardada', 'omitida'].includes(normalizarEstado(previo.estado));
    const cambio = previoProtegido
      ? { ...item, estado: previo.estado, detalle: previo.detalle, recursoId: previo.recursoId, archivoNombre: previo.archivoNombre }
      : item;
    mapa.set(id, normalizarSugerencia({ ...previo, ...cambio, actualizadoEn: new Date().toISOString() }, previo));
  });
  return [...mapa.values()].sort((a, b) => Number(b.prioridad || 0) - Number(a.prioridad || 0));
}

export async function cargarImagenesSugeridasProyecto({ proyectoId } = {}) {
  const rutaArchivo = rutaArchivoImagenesSugeridas(proyectoId);
  const inicial = crearEstadoInicial(proyectoId);
  const guardado = await leerJsonSiExiste(rutaArchivo, null);
  if (!guardado) return { ...inicial, rutaArchivo, existe: false };
  const sugerencias = fusionarSugerencias(inicial.sugerencias, Array.isArray(guardado.sugerencias) ? guardado.sugerencias : []);
  return {
    ...inicial,
    ...guardado,
    ok: true,
    proyectoId,
    total: sugerencias.length,
    totalAutomaticas: sugerencias.filter((item) => item.fuente === 'auto-entendimiento').length,
    sugerencias,
    rutaArchivo,
    existe: true
  };
}

export async function guardarImagenesSugeridasProyecto({ proyectoId, sugerencia = null, sugerencias = null, accion = 'actualizar' } = {}) {
  const actual = await cargarImagenesSugeridasProyecto({ proyectoId });
  const cambios = Array.isArray(sugerencias) ? sugerencias : (sugerencia ? [sugerencia] : []);
  const fusionadas = fusionarSugerencias(actual.sugerencias, cambios);
  const rutaArchivo = rutaArchivoImagenesSugeridas(proyectoId);
  asegurarCarpeta(path.dirname(rutaArchivo));
  const salida = {
    ok: true,
    proyectoId,
    tipo: 'imagenes-sugeridas-proyecto',
    version: 1,
    total: fusionadas.length,
    totalAutomaticas: fusionadas.filter((item) => item.fuente === 'auto-entendimiento').length,
    sugerencias: fusionadas,
    ultimaAccion: accion,
    actualizadoEn: new Date().toISOString()
  };
  await escribirJson(rutaArchivo, salida);
  return { ...salida, rutaArchivo, existe: true };
}

export async function actualizarImagenesSugeridasDesdeEntendimiento({ proyectoId, resultadoEntendimiento = {} } = {}) {
  if (!proyectoId) throw new Error('Falta proyectoId para actualizar imágenes sugeridas desde Entendimiento.');
  const deteccion = detectarImagenesSugeridasDesdeEntendimiento(resultadoEntendimiento);
  if (!deteccion.sugerencias?.length) {
    return await cargarImagenesSugeridasProyecto({ proyectoId });
  }
  return await guardarImagenesSugeridasProyecto({
    proyectoId,
    accion: 'auto-entendimiento',
    sugerencias: deteccion.sugerencias
  });
}
