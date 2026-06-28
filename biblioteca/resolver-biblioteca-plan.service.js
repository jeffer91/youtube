/*
  Bloque Biblioteca 5
  Funcion: unir biblioteca general permanente + biblioteca temporal del proyecto para que el Plan pueda usarlas sin copiar archivos.
*/

import path from 'path';
import { buscarRecursosBiblioteca } from './buscar-recurso.service.js';
import { buscarRecursosProyecto, listarRecursosProyecto } from '../biblioteca-proyecto/biblioteca-proyecto.conexion.js';
import { obtenerRutaDatos } from '../comun/archivos.js';

const CATEGORIAS_PRIORITARIAS = ['intro', 'logo', 'top-1', 'top-2', 'top-3', 'overlay', 'texto-plantilla', 'transicion', 'ending', 'musica', 'efecto-sonoro', 'otro'];
const CATEGORIAS_CONTEXTO = ['logo', 'overlay', 'texto-plantilla', 'transicion', 'fondo', 'musica', 'efecto-sonoro', 'otro'];

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function normalizar(valor = '') {
  return texto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function tokensDe(valor = '') {
  return normalizar(valor).split(/[^a-z0-9]+/).map((item) => item.trim()).filter((item) => item.length > 2);
}

function obtenerRutaProyecto(proyectoId) {
  return path.join(obtenerRutaDatos(), 'proyectos', proyectoId);
}

export function crearProyectoBibliotecaPlan({ proyectoId, proyecto = {} } = {}) {
  const carpetaProyecto = proyecto.carpetaProyecto || proyecto.rutaProyecto || proyecto.ruta || obtenerRutaProyecto(proyectoId || proyecto.id || proyecto.proyectoId);
  return {
    id: proyectoId || proyecto.id || proyecto.proyectoId,
    proyectoId: proyectoId || proyecto.proyectoId || proyecto.id,
    nombre: proyecto.nombre || 'Proyecto AutoVideoJeff',
    carpetaProyecto,
    rutas: {
      ...(proyecto.rutas || {}),
      raiz: proyecto.rutas?.raiz || carpetaProyecto,
      carpetaProyecto
    }
  };
}

function normalizarRecursoBiblioteca(recurso = {}, alcance = 'general') {
  const estilos = Array.isArray(recurso.estilos) ? recurso.estilos : Array.isArray(recurso.perfiles) ? recurso.perfiles : recurso.perfil ? [recurso.perfil] : [];
  const ruta = recurso.ruta || recurso.archivo?.rutaAbsoluta || recurso.url || '';
  return {
    ...recurso,
    alcanceBiblioteca: alcance,
    bibliotecaOrigen: alcance,
    permanente: alcance === 'general',
    temporalProyecto: alcance === 'proyecto',
    idBiblioteca: recurso.id,
    estilos,
    perfil: recurso.perfil || estilos[0] || 'general',
    ruta,
    rutaRelativa: recurso.rutaRelativa || recurso.archivo?.rutaRelativa || '',
    categoria: recurso.categoria || 'otro',
    tipo: recurso.tipo || 'video',
    estadoTecnico: recurso.estadoTecnico || recurso.estado || 'pendiente',
    usoSugerido: recurso.usoSugerido || recurso.tipoEdicion || recurso.estadoUso || 'recurso_apoyo'
  };
}

function recursoDisponible(recurso = {}) {
  const estado = recurso.estadoTecnico || recurso.estado || '';
  if (['rechazado', 'error', 'faltante'].includes(estado)) return false;
  return Boolean(recurso.ruta || recurso.url || recurso.archivo?.rutaAbsoluta || recurso.archivo?.rutaRelativa);
}

function claveRecurso(recurso = {}) {
  const hash = recurso.archivo?.hashSha256 || '';
  if (hash) return `hash:${hash}`;
  return `${recurso.alcanceBiblioteca || recurso.alcance || 'general'}:${recurso.id || recurso.nombre}:${recurso.ruta || recurso.url || ''}`;
}

function deduplicarRecursos(recursos = []) {
  const mapa = new Map();
  recursos.forEach((recurso) => {
    const clave = claveRecurso(recurso);
    if (!mapa.has(clave)) mapa.set(clave, recurso);
    else {
      const existente = mapa.get(clave);
      if (existente.alcanceBiblioteca !== 'proyecto' && recurso.alcanceBiblioteca === 'proyecto') mapa.set(clave, recurso);
    }
  });
  return [...mapa.values()];
}

function textoRecurso(recurso = {}) {
  return normalizar([
    recurso.nombre,
    recurso.descripcion,
    recurso.categoria,
    recurso.categoriaNombre,
    recurso.tipo,
    recurso.usoSugerido,
    recurso.tipoEdicion,
    recurso.perfil,
    ...(recurso.estilos || []),
    ...(recurso.etiquetas || [])
  ].filter(Boolean).join(' '));
}

function puntuarParaPlan({ recurso, proyecto = {}, necesidades = [], tokensProyecto = [] } = {}) {
  let puntaje = 0;
  const razones = [];
  const textoCompleto = textoRecurso(recurso);

  if (recurso.alcanceBiblioteca === 'proyecto') { puntaje += 50; razones.push('temporal del proyecto'); }
  if (recurso.alcanceBiblioteca === 'general') { puntaje += 18; razones.push('permanente reutilizable'); }
  if (recurso.estadoTecnico === 'listo' || recurso.estado === 'listo') { puntaje += 12; razones.push('analizado y listo'); }

  const perfil = proyecto.perfil || 'general';
  const estilos = recurso.estilos || recurso.perfiles || [];
  if (estilos.includes(perfil) || recurso.perfil === perfil) { puntaje += 18; razones.push(`estilo ${perfil}`); }
  if (estilos.includes('general') || recurso.perfil === 'general') { puntaje += 6; razones.push('estilo general'); }

  if (CATEGORIAS_PRIORITARIAS.includes(recurso.categoria)) { puntaje += 10; razones.push(`categoria ${recurso.categoria}`); }
  if (['intro', 'logo', 'ending', 'transicion', 'musica', 'efecto-sonoro'].includes(recurso.categoria)) puntaje += 8;

  const tokensNecesidad = necesidades.flatMap((item) => tokensDe(typeof item === 'string' ? item : [item.nombre, item.descripcion, item.tipoEdicion, item.tipo].filter(Boolean).join(' ')));
  const coincidencias = [...new Set([...tokensProyecto, ...tokensNecesidad].filter((token) => textoCompleto.includes(token)))].slice(0, 8);
  if (coincidencias.length) { puntaje += coincidencias.length * 5; razones.push(`coincide con ${coincidencias.join(', ')}`); }

  if (!recursoDisponible(recurso)) puntaje -= 60;
  return { puntaje: Math.max(0, Math.round(puntaje)), razones };
}

function convertirRecursoAPlan({ recurso, index, puntaje = 0, razones = [] } = {}) {
  const nombre = texto(recurso.nombre, `Recurso biblioteca ${index + 1}`);
  const categoria = recurso.categoria || 'otro';
  return {
    id: `biblioteca-${recurso.alcanceBiblioteca || 'general'}-${recurso.id || index + 1}`,
    nombre,
    descripcion: texto(recurso.descripcion, `${categoria} · ${recurso.tipo || 'recurso'} · ${recurso.alcanceBiblioteca || 'general'}`),
    inicio: 0,
    fin: null,
    motivo: recurso.alcanceBiblioteca === 'proyecto'
      ? 'Recurso temporal cargado específicamente para este proyecto.'
      : 'Recurso permanente disponible desde la biblioteca general.',
    tipoPlan: 'recurso-biblioteca',
    tipoEdicion: recurso.usoSugerido || recurso.tipoEdicion || categoria || 'recurso_apoyo',
    categoria,
    tipo: recurso.tipo || 'recurso',
    biblioteca: {
      origen: recurso.alcanceBiblioteca || 'general',
      alcance: recurso.alcanceBiblioteca || 'general',
      id: recurso.id || null,
      nombre,
      categoria,
      tipo: recurso.tipo || '',
      formato: recurso.formato || recurso.tamanoFormato || recurso.tamañoFormato || '',
      estadoTecnico: recurso.estadoTecnico || recurso.estado || '',
      ruta: recurso.ruta || recurso.archivo?.rutaAbsoluta || '',
      rutaRelativa: recurso.rutaRelativa || recurso.archivo?.rutaRelativa || '',
      url: recurso.url || '',
      etiquetas: recurso.etiquetas || [],
      puntaje,
      razones
    }
  };
}

function crearNecesidadesContexto({ entendimiento = {}, proyecto = {} } = {}) {
  const necesidades = [
    ...(Array.isArray(entendimiento.analisisVideoGlobal?.necesidades) ? entendimiento.analisisVideoGlobal.necesidades : []),
    ...(Array.isArray(entendimiento.analisisVideo?.necesidades) ? entendimiento.analisisVideo.necesidades : []),
    ...(Array.isArray(entendimiento.resumenEtapa?.necesidades) ? entendimiento.resumenEtapa.necesidades : []),
    ...(Array.isArray(entendimiento.reporteEntendimiento?.resumen?.necesidades) ? entendimiento.reporteEntendimiento.resumen.necesidades : [])
  ];

  CATEGORIAS_CONTEXTO.forEach((categoria) => necesidades.push({ nombre: categoria, tipoEdicion: categoria, descripcion: `Recurso de apoyo tipo ${categoria}` }));
  if (proyecto.esMultivideo || proyecto.totalVideos > 1) necesidades.push({ nombre: 'transicion entre videos', tipoEdicion: 'transicion', descripcion: 'Separadores para unir videos' });
  return necesidades;
}

export async function resolverBibliotecaParaPlan({ proyectoId, proyecto = {}, entendimiento = {}, limiteSeleccionados = 24 } = {}) {
  if (!proyectoId) throw new Error('Falta proyectoId para resolver biblioteca del plan.');
  const proyectoBiblioteca = crearProyectoBibliotecaPlan({ proyectoId, proyecto });
  const perfil = proyecto.perfil || 'general';
  const necesidades = crearNecesidadesContexto({ entendimiento, proyecto });
  const tokensProyecto = tokensDe([proyecto.nombre, proyecto.perfil, proyecto.plataforma, proyecto.modoEdicion].join(' '));

  const [recursosProyecto, recursosGeneralesPerfil, recursosGeneralesContexto] = await Promise.all([
    listarRecursosProyecto(proyectoBiblioteca),
    buscarRecursosBiblioteca({ perfil, estadoTecnico: 'listo' }),
    buscarRecursosBiblioteca({ estadoTecnico: 'listo' })
  ]);

  const todos = deduplicarRecursos([
    ...recursosProyecto.map((recurso) => normalizarRecursoBiblioteca(recurso, 'proyecto')),
    ...recursosGeneralesPerfil.map((recurso) => normalizarRecursoBiblioteca(recurso, 'general')),
    ...recursosGeneralesContexto.map((recurso) => normalizarRecursoBiblioteca(recurso, 'general'))
  ]).filter(recursoDisponible);

  const puntuados = todos
    .map((recurso) => ({ recurso, ...puntuarParaPlan({ recurso, proyecto, necesidades, tokensProyecto }) }))
    .filter((item) => item.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje || String(a.recurso.nombre).localeCompare(String(b.recurso.nombre), 'es'));

  const seleccionados = puntuados.slice(0, limiteSeleccionados);
  const recursosPlan = seleccionados.map((item, index) => convertirRecursoAPlan({ recurso: item.recurso, index, puntaje: item.puntaje, razones: item.razones }));
  const totalProyecto = todos.filter((item) => item.alcanceBiblioteca === 'proyecto').length;
  const totalGeneral = todos.filter((item) => item.alcanceBiblioteca === 'general').length;

  return {
    ok: true,
    tipo: 'biblioteca-plan-combinada',
    proyectoId,
    regla: 'La biblioteca proyecto es temporal. La biblioteca general es permanente. El plan referencia recursos sin copiarlos.',
    resumen: {
      totalDisponibles: todos.length,
      totalGeneral,
      totalProyecto,
      seleccionados: recursosPlan.length,
      seleccionadosGeneral: recursosPlan.filter((item) => item.biblioteca.origen === 'general').length,
      seleccionadosProyecto: recursosPlan.filter((item) => item.biblioteca.origen === 'proyecto').length,
      listoParaPlan: true
    },
    recursosDisponibles: todos.map((recurso) => ({ id: recurso.id, nombre: recurso.nombre, origen: recurso.alcanceBiblioteca, tipo: recurso.tipo, categoria: recurso.categoria, estadoTecnico: recurso.estadoTecnico })),
    recursosPlan,
    creadoEn: new Date().toISOString()
  };
}

export default resolverBibliotecaParaPlan;
