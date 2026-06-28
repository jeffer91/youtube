/*
  Bloque 4 - Verificacion Plan por partes
  Revisa que el Plan se divida en secciones, valide cada parte, se conecte al backend y se vea en UI.
*/

import fs from 'fs';
import { PARTES_PLAN_EDICION, listarIdsPartesPlan } from '../etapas/02-plan/partes-plan.config.js';
import { validarPartePlan } from '../etapas/02-plan/validar-parte-plan.service.js';
import { crearEstadoPlanPorPartes, guardarPartePlan, cerrarPlanPorPartes } from '../etapas/02-plan/guardar-parte-plan.service.js';
import { generarPlanPorPartes } from '../etapas/02-plan/generar-plan-por-partes.service.js';
import { construirContextoPlan } from '../etapas/02-plan/construir-contexto-plan.service.js';
import { renderPlanEdicionView } from '../app/pantallas/plan-edicion.view.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta archivo: ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contextoDemo() {
  return construirContextoPlan({
    proyectoId: 'demo-plan-partes',
    proyecto: { nombre: 'Demo Plan por partes', perfil: '11-contra-11', plataforma: 'youtube' },
    entendimiento: {
      resumenEtapa: { duracionTotalSegundos: 64, totalVideos: 1 },
      transcripcionGlobal: {
        motor: 'demo',
        idioma: 'es',
        textoCompleto: 'Arranca el video con una idea fuerte. Luego se explica la jugada y se cierra con una conclusion clara.',
        segmentos: [
          { inicioGlobal: 0, finGlobal: 5, texto: 'Arranca el video con una idea fuerte.' },
          { inicioGlobal: 6, finGlobal: 18, texto: 'Luego se explica la jugada.' },
          { inicioGlobal: 50, finGlobal: 60, texto: 'Se cierra con una conclusion clara.' }
        ]
      },
      framesClave: [{ segundo: 3, descripcion: 'Frame del presentador' }, { segundo: 14, descripcion: 'Frame de la jugada' }],
      analisisVideoGlobal: {
        momentosClave: [
          { tipo: 'hook', inicioGlobal: 0, finGlobal: 4, motivo: 'Gancho fuerte' },
          { tipo: 'idea', inicioGlobal: 10, finGlobal: 18, motivo: 'Explicacion central' }
        ],
        necesidades: ['texto en pantalla', 'logo', 'transicion suave']
      }
    },
    biblioteca: {
      regla: 'Referenciar sin copiar.',
      resumen: { totalDisponibles: 2, totalGeneral: 1, totalProyecto: 1, seleccionadosGeneral: 1, seleccionadosProyecto: 1 },
      recursosPlan: [
        { id: 'biblioteca-general-logo', nombre: 'Logo general', tipo: 'imagen', categoria: 'logo', biblioteca: { origen: 'general', id: 'logo' } },
        { id: 'biblioteca-proyecto-intro', nombre: 'Intro temporal', tipo: 'video', categoria: 'intro', biblioteca: { origen: 'proyecto', id: 'intro' } }
      ]
    }
  });
}

async function main() {
  const archivos = [
    'etapas/02-plan/partes-plan.config.js',
    'etapas/02-plan/validar-parte-plan.service.js',
    'etapas/02-plan/guardar-parte-plan.service.js',
    'etapas/02-plan/generar-plan-por-partes.service.js'
  ];
  archivos.forEach(leer);

  exigir(PARTES_PLAN_EDICION.length === 8, 'El Plan debe tener 8 partes.');
  ['resumenEstrategico', 'estructuraNarrativa', 'timelineSegundos', 'textosPantalla', 'subtitulos', 'recursosBiblioteca', 'audioEfectosTransiciones', 'validacionFinal'].forEach((id) => {
    exigir(listarIdsPartesPlan().includes(id), `Falta parte ${id}.`);
  });

  const contexto = contextoDemo();
  let estado = crearEstadoPlanPorPartes({ proyectoId: contexto.proyectoId, contextoPlan: contexto });
  exigir(estado.totalPartes === 8, 'Estado inicial no reconoce 8 partes.');

  const parteManual = {
    id: 'timelineSegundos',
    orden: 3,
    titulo: 'Timeline por segundos',
    resumenHumano: 'Timeline generado.',
    jsonTecnico: { timeline: [{ inicio: 0, fin: 5, accion: 'gancho_inicial' }] },
    respuestaIA: { fallback: true }
  };
  const validacion = validarPartePlan(parteManual);
  exigir(validacion.ok, 'La validacion manual de timeline deberia pasar.');
  estado = guardarPartePlan(estado, { ...parteManual, validacion });
  exigir(estado.progreso.completadas === 1, 'No guardo la parte manual.');
  estado = cerrarPlanPorPartes(estado);
  exigir(estado.estado === 'incompleto', 'Un plan con una parte no debe estar completo.');

  const planPorPartes = await generarPlanPorPartes({ proyectoId: contexto.proyectoId, contextoPlan: contexto, opciones: { usarIARealPlanPorPartes: false } });
  exigir(planPorPartes.ok, 'El plan por partes no se genero.');
  exigir(planPorPartes.partes.length === 8, 'No genero las 8 partes.');
  exigir(planPorPartes.progreso.validadas === 8, 'No valido todas las partes.');
  exigir(planPorPartes.listoParaProduccion, 'El plan por partes debe quedar listo.');
  exigir(planPorPartes.partes.every((parte) => parte.resumenHumano && parte.jsonTecnico), 'Cada parte debe tener resumen y JSON tecnico.');

  const planBackend = leer('etapas/02-plan/procesar-plan-edicion.service.js');
  exigir(planBackend.includes('generarPlanPorPartes'), 'El backend no llama generarPlanPorPartes.');
  exigir(planBackend.includes('planPorPartes'), 'El backend no guarda planPorPartes.');
  exigir(planBackend.includes('bloquePlanPorPartes'), 'Metadata no registra bloquePlanPorPartes.');

  const vista = renderPlanEdicionView();
  exigir(vista.includes('planPartes'), 'La vista no tiene KPI de partes.');
  exigir(vista.includes('planPartesDetalle'), 'La vista no tiene detalle de plan por partes.');
  const ui = leer('app/etapas-ui/plan-edicion-ui.js');
  exigir(ui.includes('renderPartes'), 'La UI no renderiza partes.');
  exigir(ui.includes('obtenerPlanPorPartes'), 'La UI no lee planPorPartes.');

  const pkg = JSON.parse(leer('package.json'));
  exigir(pkg.scripts?.['check:plan-por-partes'], 'package.json no tiene script check:plan-por-partes.');

  console.log('OK plan por partes: 8 secciones, validacion, guardado progresivo, backend y UI verificados');
}

main().catch((error) => {
  console.error('ERROR plan por partes:', error.message);
  process.exit(1);
});
