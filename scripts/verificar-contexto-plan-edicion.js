/*
  Bloque 2 - Verificacion de contexto para Plan de edición
  Revisa que el Plan absorba Entendimiento + transcripción + frames + Biblioteca general/proyecto
  y genere un contexto listo para IA.
*/

import fs from 'fs';
import { construirContextoPlan } from '../etapas/02-plan/construir-contexto-plan.service.js';
import { normalizarContextoPlanParaIA } from '../etapas/02-plan/normalizar-contexto-plan.service.js';
import { renderPlanEdicionView } from '../app/pantallas/plan-edicion.view.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta archivo: ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function crearEntendimientoDemo() {
  return {
    resumenEtapa: { duracionTotalSegundos: 92, totalVideos: 2, esMultivideo: true },
    transcripcionGlobal: {
      motor: 'demo',
      idioma: 'es',
      textoCompleto: 'Bienvenidos al análisis. Ecuador presiona alto y Brasil responde con salida rápida.',
      segmentos: [
        { videoId: 'video-01', inicioGlobal: 0, finGlobal: 5, texto: 'Bienvenidos al análisis.' },
        { videoId: 'video-02', inicioGlobal: 35, finGlobal: 42, texto: 'Brasil responde con salida rápida.' }
      ]
    },
    framesClave: [
      { videoId: 'video-01', segundo: 2, descripcion: 'Rostro en plano medio' },
      { videoId: 'video-02', segundo: 38, descripcion: 'Jugada clave en ataque' }
    ],
    analisisVideoGlobal: {
      momentosClave: [
        { tipo: 'hook', inicioGlobal: 0, finGlobal: 4, motivo: 'Gancho inicial fuerte' },
        { tipo: 'idea', inicioGlobal: 35, finGlobal: 42, motivo: 'Comparación táctica' }
      ],
      necesidades: ['logo del programa', 'transición entre videos', 'texto de apoyo táctico']
    },
    lineaTiempoGlobal: { resumen: { totalVideos: 2, duracionTotalSegundos: 92, videosConAudio: 2, todosTienenAudio: true } }
  };
}

function crearBibliotecaDemo() {
  return {
    ok: true,
    regla: 'La biblioteca proyecto es temporal. La biblioteca general es permanente. El plan referencia recursos sin copiarlos.',
    resumen: {
      totalDisponibles: 4,
      totalGeneral: 2,
      totalProyecto: 2,
      seleccionados: 4,
      seleccionadosGeneral: 2,
      seleccionadosProyecto: 2
    },
    recursosDisponibles: [
      { id: 'g1', nombre: 'Intro general', origen: 'general', tipo: 'video', categoria: 'intro' },
      { id: 'p1', nombre: 'Logo invitado', origen: 'proyecto', tipo: 'imagen', categoria: 'logo' }
    ],
    recursosPlan: [
      { id: 'biblioteca-general-g1', nombre: 'Intro general', tipo: 'video', categoria: 'intro', biblioteca: { origen: 'general', id: 'g1', nombre: 'Intro general', ruta: 'biblioteca/intro.mp4' } },
      { id: 'biblioteca-proyecto-p1', nombre: 'Logo invitado', tipo: 'imagen', categoria: 'logo', biblioteca: { origen: 'proyecto', id: 'p1', nombre: 'Logo invitado', ruta: 'proyectos/demo/logo.png' } }
    ]
  };
}

function main() {
  const contexto = construirContextoPlan({
    proyectoId: 'demo-plan-contexto',
    proyecto: { nombre: 'Video prueba contexto', perfil: '11-contra-11', plataforma: 'youtube' },
    estado: { nombre: 'Video prueba contexto', datos: { perfil: '11-contra-11' } },
    entendimiento: crearEntendimientoDemo(),
    biblioteca: crearBibliotecaDemo(),
    solicitud: { origen: 'verificacion-contexto' }
  });

  exigir(contexto.ok, 'El contexto no se creó correctamente.');
  exigir(contexto.tipo === 'contexto-plan-edicion', 'Tipo de contexto incorrecto.');
  exigir(contexto.resumen.totalVideos === 2, 'No absorbió total de videos.');
  exigir(contexto.resumen.segmentosTranscripcion === 2, 'No absorbió segmentos de transcripción.');
  exigir(contexto.resumen.framesClave === 2, 'No absorbió frames.');
  exigir(contexto.resumen.momentosClave === 2, 'No absorbió momentos clave.');
  exigir(contexto.resumen.recursosBibliotecaGeneral === 2, 'No absorbió biblioteca general.');
  exigir(contexto.resumen.recursosBibliotecaProyecto === 2, 'No absorbió biblioteca proyecto.');
  exigir(contexto.contextoIA?.listoParaIA, 'No generó contexto IA listo.');
  exigir(contexto.contextoIA.promptBase.includes('JSON técnico ejecutable'), 'Prompt base no exige JSON técnico ejecutable.');

  const compacto = normalizarContextoPlanParaIA(contexto);
  exigir(compacto.compacto.segmentos.length === 2, 'Compacto IA perdió segmentos.');
  exigir(compacto.compacto.biblioteca.recursosPlan.length === 2, 'Compacto IA perdió recursos de biblioteca.');

  const vistaPlan = renderPlanEdicionView();
  exigir(vistaPlan.includes('planContexto'), 'La vista Plan no tiene KPI de Contexto IA.');
  exigir(vistaPlan.includes('planContextoDetalle'), 'La vista Plan no tiene panel de contexto absorbido.');

  const planBackend = leer('etapas/02-plan/procesar-plan-edicion.service.js');
  const planUi = leer('app/etapas-ui/plan-edicion-ui.js');
  ['construirContextoPlan', 'contextoPlan', 'contextoIA', 'contextoListoParaIA'].forEach((clave) => exigir(planBackend.includes(clave), `Backend plan no contiene ${clave}`));
  ['renderContexto', 'planContextoDetalle', 'Contexto IA', 'Resumen humano + JSON técnico ejecutable'].forEach((clave) => exigir(planUi.includes(clave), `UI plan no contiene ${clave}`));

  console.log('OK contexto plan edicion: Entendimiento + Biblioteca + prompt IA + UI verificados');
}

try {
  main();
} catch (error) {
  console.error('ERROR contexto plan edicion:', error.message);
  process.exit(1);
}
