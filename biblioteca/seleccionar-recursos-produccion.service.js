/*
  Bloque 12: Biblioteca mejorada / recursos para producción
  Función: recomendar recursos de biblioteca para un proyecto por etapas usando entendimiento y plan de edición.
*/

import path from 'path';
import { buscarRecursosBiblioteca } from './buscar-recurso.service.js';
import { escribirJson, obtenerRutaRaiz } from '../comun/archivos.js';
import {
  ETAPAS_AUTOVIDEO,
  cargarResultadoEtapa
} from '../flujo-etapas/flujo-etapas.conexion.js';

const TIPOS_POR_ELEMENTO = Object.freeze({
  subtitulo: ['plantilla', 'overlay'],
  texto: ['overlay', 'plantilla', 'imagen'],
  recurso: ['imagen', 'video', 'fondo', 'overlay'],
  imagen: ['imagen', 'fondo', 'overlay'],
  video: ['video', 'fondo'],
  fondo: ['fondo', 'video', 'imagen'],
  efecto: ['overlay', 'transicion', 'plantilla'],
  zoom: ['plantilla', 'overlay'],
  animacion: ['plantilla', 'transicion', 'overlay'],
  audio: ['audio'],
  sonido: ['audio']
});

const CATEGORIA_POR_PERFIL = Object.freeze({
  '11-contra-11': 'futbol',
  'jeff-isekai': 'anime',
  creciaula: 'educacion',
  institucional: 'institucional',
  'el-don-historia': 'historia',
  'jeff-verso': 'cine',
  general: 'general'
});

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function normalizar(valor = '') {
  return texto(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function tokensDe(valor = '') {
  return normalizar(valor).split(/[^a-z0-9]+/).map((item) => item.trim()).filter((item) => item.length > 2);
}

function extraerResultadoEtapa(wrapper = {}) {
  if (wrapper?.resultado?.resultado) return wrapper.resultado.resultado;
  if (wrapper?.datos?.resultado?.resultado) return wrapper.datos.resultado.resultado;
  if (wrapper?.resultado) return wrapper.resultado;
  return wrapper;
}

function obtenerElementosPlan(plan = {}) {
  const elementos = plan.planProduccion?.elementos || plan.elementos || [];
  return Array.isArray(elementos) ? elementos : [];
}

function obtenerNecesidades(entendimiento = {}, plan = {}) {
  const lista = [
    ...(Array.isArray(entendimiento.analisisVideo?.necesidades) ? entendimiento.analisisVideo.necesidades : []),
    ...(Array.isArray(entendimiento.resumenEtapa?.necesidades) ? entendimiento.resumenEtapa.necesidades : []),
    ...(Array.isArray(plan.fuente?.necesidades) ? plan.fuente.necesidades : [])
  ];
  return [...new Set(lista.map((item) => texto(item)).filter(Boolean))];
}

function crearNecesidadesDesdePlan(plan = {}, entendimiento = {}) {
  const elementos = obtenerElementosPlan(plan);
  const necesidades = elementos.slice(0, 30).map((elemento, index) => ({
    id: elemento.id || `plan-${index + 1}`,
    tipo: elemento.tipo || 'recurso',
    nombre: elemento.nombre || elemento.titulo || elemento.tipo || `Elemento ${index + 1}`,
    descripcion: texto([elemento.descripcion, elemento.motivo, elemento.datos?.texto, elemento.fraseRelacionada].filter(Boolean).join(' '), elemento.nombre || 'Elemento del plan'),
    inicio: elemento.inicio ?? elemento.datos?.inicio ?? null,
    fin: elemento.fin ?? elemento.datos?.fin ?? null,
    tipoEdicion: elemento.tipoEdicion || elemento.tipo || 'apoyo_visual',
    momentoSugerido: elemento.momentoSugerido || elemento.momento || '',
    fuente: 'plan-edicion'
  }));

  obtenerNecesidades(entendimiento, plan).forEach((necesidad, index) => {
    necesidades.push({
      id: `necesidad-${index + 1}`,
      tipo: 'recurso',
      nombre: necesidad,
      descripcion: necesidad,
      inicio: 0,
      fin: null,
      tipoEdicion: 'apoyo_visual',
      momentoSugerido: '',
      fuente: 'entendimiento'
    });
  });

  return necesidades;
}

function textoRecurso(recurso = {}) {
  return normalizar([
    recurso.nombre,
    recurso.descripcion,
    recurso.tema,
    recurso.fraseRelacionada,
    recurso.categoria,
    recurso.perfil,
    recurso.tipo,
    recurso.tipoEdicion,
    recurso.tono,
    recurso.momentoSugerido,
    ...(recurso.etiquetas || [])
  ].filter(Boolean).join(' '));
}

function tiposEsperados(necesidad = {}) {
  return TIPOS_POR_ELEMENTO[necesidad.tipo] || ['imagen', 'video', 'overlay', 'fondo', 'plantilla'];
}

function puntuarRecurso({ recurso, necesidad, proyecto, tokensProyecto = [] } = {}) {
  let puntaje = 0;
  const razones = [];
  const riesgos = [];
  const textoCompleto = textoRecurso(recurso);
  const tipos = tiposEsperados(necesidad);
  const perfil = proyecto.perfil || 'general';
  const categoriaEsperada = CATEGORIA_POR_PERFIL[perfil] || 'general';

  if (tipos.includes(recurso.tipo)) { puntaje += 28; razones.push(`tipo compatible: ${recurso.tipo}`); }
  else { puntaje -= 8; riesgos.push(`tipo menos directo para ${necesidad.tipo}`); }

  if (recurso.perfil && recurso.perfil === perfil) { puntaje += 20; razones.push(`perfil exacto: ${perfil}`); }
  if (!recurso.perfil || recurso.perfil === 'general' || recurso.perfil === 'todos') { puntaje += 8; razones.push('perfil flexible'); }
  if (recurso.categoria === categoriaEsperada) { puntaje += 14; razones.push(`categoría alineada: ${categoriaEsperada}`); }
  if (recurso.categoria === 'general') puntaje += 5;

  if (recurso.tipoEdicion && normalizar(recurso.tipoEdicion) === normalizar(necesidad.tipoEdicion)) { puntaje += 14; razones.push(`uso de edición alineado: ${recurso.tipoEdicion}`); }
  if (recurso.momentoSugerido && necesidad.momentoSugerido && normalizar(recurso.momentoSugerido).includes(normalizar(necesidad.momentoSugerido))) { puntaje += 10; razones.push('momento sugerido compatible'); }

  const tokensNecesidad = [...tokensDe(necesidad.nombre), ...tokensDe(necesidad.descripcion), ...tokensProyecto];
  const coincidencias = [...new Set(tokensNecesidad.filter((token) => textoCompleto.includes(token)))].slice(0, 8);
  puntaje += coincidencias.length * 4;
  if (coincidencias.length) razones.push(`coincide con: ${coincidencias.join(', ')}`);

  if (recurso.aprobado) { puntaje += 8; razones.push('aprobado'); }
  if (recurso.estado === 'aprobado' || recurso.estado === 'disponible') puntaje += 5;
  if (recurso.licencia === 'pendiente_revision') { puntaje -= 10; riesgos.push('licencia pendiente de revisión'); }
  if (recurso.rechazado || recurso.estado === 'rechazado') { puntaje -= 35; riesgos.push('recurso rechazado'); }
  if (!recurso.ruta && !recurso.url) { puntaje -= 30; riesgos.push('sin ruta ni url'); }

  return {
    recurso,
    puntaje: Math.max(0, Math.round(puntaje)),
    razones,
    riesgos,
    usoSugerido: necesidad.tipoEdicion || necesidad.tipo || 'apoyo_visual',
    elementoPlanId: necesidad.id,
    momento: { inicio: necesidad.inicio, fin: necesidad.fin }
  };
}

function ordenarCandidatos(a, b) {
  return b.puntaje - a.puntaje || String(a.recurso.nombre).localeCompare(String(b.recurso.nombre), 'es');
}

function resumir(recomendaciones = [], recursos = [], necesidades = []) {
  const usadas = recomendaciones.reduce((total, item) => total + item.recursos.length, 0);
  const sinRecurso = recomendaciones.filter((item) => item.recursos.length === 0).length;
  const riesgos = recomendaciones.flatMap((item) => item.recursos.flatMap((recurso) => recurso.riesgos || [])).length;
  return {
    necesidadesAnalizadas: necesidades.length,
    recursosDisponibles: recursos.length,
    sugerenciasGeneradas: usadas,
    necesidadesSinRecurso: sinRecurso,
    riesgosDetectados: riesgos,
    listoParaProduccion: necesidades.length > 0 && usadas > 0
  };
}

function crearProyectoDesdePlan(plan = {}) {
  return {
    id: plan.proyecto?.id || '',
    nombre: plan.proyecto?.nombre || 'Proyecto AutoVideoJeff',
    perfil: plan.proyecto?.perfil || 'general',
    plataforma: plan.proyecto?.plataforma || 'tiktok',
    modoEdicion: plan.proyecto?.modoEdicion || 'revision_completa'
  };
}

async function guardarRecomendaciones({ proyectoId, resultado } = {}) {
  const ruta = path.join(obtenerRutaRaiz(), 'datos', 'proyectos', proyectoId, '02-plan', 'biblioteca-sugerencias.json');
  await escribirJson(ruta, resultado);
  return ruta;
}

export async function recomendarRecursosProduccion({ proyectoId, filtros = {}, limitePorNecesidad = 4, guardar = true } = {}) {
  if (!proyectoId) throw new Error('Falta proyectoId para recomendar recursos.');

  const planGuardado = await cargarResultadoEtapa({ proyectoId, etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION, valorPorDefecto: null });
  if (!planGuardado) throw new Error('No existe plan de edición. Crea primero el plan para recomendar recursos.');
  const entendimientoGuardado = await cargarResultadoEtapa({ proyectoId, etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO, valorPorDefecto: {} });
  const plan = extraerResultadoEtapa(planGuardado);
  const entendimiento = extraerResultadoEtapa(entendimientoGuardado);
  const proyecto = crearProyectoDesdePlan(plan);
  const recursos = await buscarRecursosBiblioteca({
    consulta: filtros.consulta || filtros.q || '',
    tipo: filtros.tipo || '',
    categoria: filtros.categoria || '',
    perfil: filtros.perfil || ''
  });
  const necesidades = crearNecesidadesDesdePlan(plan, entendimiento);
  const tokensProyecto = tokensDe([proyecto.nombre, proyecto.perfil, proyecto.plataforma, proyecto.modoEdicion].join(' '));

  const recomendaciones = necesidades.map((necesidad) => {
    const candidatos = recursos
      .map((recurso) => puntuarRecurso({ recurso, necesidad, proyecto, tokensProyecto }))
      .filter((item) => item.puntaje > 0 && !item.recurso.rechazado)
      .sort(ordenarCandidatos)
      .slice(0, limitePorNecesidad);
    return {
      necesidad,
      recursos: candidatos,
      mejorRecurso: candidatos[0]?.recurso || null,
      estado: candidatos.length ? 'con_sugerencias' : 'sin_recurso'
    };
  });

  const resultado = {
    ok: true,
    bloque: 12,
    tipo: 'biblioteca-recursos-produccion',
    proyectoId,
    proyecto,
    resumen: resumir(recomendaciones, recursos, necesidades),
    recomendaciones,
    recursosAnalizados: recursos.length,
    filtros,
    creadoEn: new Date().toISOString()
  };

  const archivo = guardar ? await guardarRecomendaciones({ proyectoId, resultado }) : null;
  return { ...resultado, archivo };
}
