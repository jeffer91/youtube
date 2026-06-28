/*
  Cierre integral - Plan inteligente AutoVideoJeff
  Revisa el flujo completo: contexto, IAs, plan por partes, dos opciones, JSON ejecutable, editor y bloqueo de Produccion.
*/

import fs from 'fs';
import {
  ETAPAS_AUTOVIDEO,
  guardarResultadoEtapa
} from '../flujo-etapas/flujo-etapas.conexion.js';
import { construirContextoPlan } from '../etapas/02-plan/construir-contexto-plan.service.js';
import { generarPlanPorPartes } from '../etapas/02-plan/generar-plan-por-partes.service.js';
import { validarPlanEjecutable } from '../etapas/02-plan/validar-plan-ejecutable.service.js';
import { crearPlanProduccion, validarPlanProduccion } from '../produccion/produccion.conexion.js';
import { obtenerEditorPlanProyecto, editarPlanProyecto } from '../etapas/02-plan/editor-plan.service.js';
import { renderPlanEdicionView } from '../app/pantallas/plan-edicion.view.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta archivo: ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contextoDemo() {
  const proyectoId = `demo-cierre-plan-inteligente-${Date.now()}`;
  return construirContextoPlan({
    proyectoId,
    proyecto: {
      id: proyectoId,
      nombre: 'Demo cierre plan inteligente',
      perfil: '11-contra-11',
      plataforma: 'youtube',
      modoEdicion: 'revision_completa'
    },
    entendimiento: {
      resumenEtapa: { duracionTotalSegundos: 82, totalVideos: 2, esMultivideo: true },
      transcripcionGlobal: {
        motor: 'demo',
        idioma: 'es',
        textoCompleto: 'Gancho inicial del video. Analisis de la jugada principal. Comparacion con otra toma. Cierre con llamado a comentar.',
        segmentos: [
          { videoId: 'video-01', inicioGlobal: 0, finGlobal: 5, texto: 'Gancho inicial del video.' },
          { videoId: 'video-01', inicioGlobal: 6, finGlobal: 25, texto: 'Analisis de la jugada principal.' },
          { videoId: 'video-02', inicioGlobal: 40, finGlobal: 58, texto: 'Comparacion con otra toma.' },
          { videoId: 'video-02', inicioGlobal: 70, finGlobal: 80, texto: 'Cierre con llamado a comentar.' }
        ]
      },
      framesClave: [
        { videoId: 'video-01', segundo: 2, descripcion: 'Presentador introduce el tema' },
        { videoId: 'video-02', segundo: 45, descripcion: 'Frame de comparacion tactica' }
      ],
      analisisVideoGlobal: {
        momentosClave: [
          { tipo: 'hook', videoId: 'video-01', inicioGlobal: 0, finGlobal: 4, motivo: 'Gancho fuerte' },
          { tipo: 'idea', videoId: 'video-01', inicioGlobal: 10, finGlobal: 20, motivo: 'Explicacion central' },
          { tipo: 'cierre', videoId: 'video-02', inicioGlobal: 72, finGlobal: 80, motivo: 'Cierre con CTA' }
        ],
        necesidades: ['logo', 'texto tactico', 'subtitulos claros', 'transicion suave']
      }
    },
    biblioteca: {
      regla: 'Referenciar sin copiar.',
      resumen: { totalDisponibles: 4, totalGeneral: 2, totalProyecto: 2, seleccionadosGeneral: 2, seleccionadosProyecto: 2 },
      recursosPlan: [
        { id: 'biblioteca-general-logo', nombre: 'Logo 11 contra 11', tipo: 'imagen', categoria: 'logo', biblioteca: { origen: 'general', id: 'logo' } },
        { id: 'biblioteca-general-musica', nombre: 'Musica base', tipo: 'audio', categoria: 'musica', biblioteca: { origen: 'general', id: 'musica' } },
        { id: 'biblioteca-proyecto-intro', nombre: 'Intro temporal', tipo: 'video', categoria: 'intro', biblioteca: { origen: 'proyecto', id: 'intro' } },
        { id: 'biblioteca-proyecto-grafico', nombre: 'Grafico temporal', tipo: 'imagen', categoria: 'grafico', biblioteca: { origen: 'proyecto', id: 'grafico' } }
      ]
    }
  });
}

async function main() {
  [
    'etapas/02-plan/construir-contexto-plan.service.js',
    'ia/ia.conexion.js',
    'etapas/02-plan/generar-plan-por-partes.service.js',
    'etapas/02-plan/generar-opciones-plan.service.js',
    'etapas/02-plan/plan-ejecutable.modelo.js',
    'etapas/02-plan/editor-plan.service.js',
    'produccion/crear-plan-produccion.service.js',
    'server/rutas-etapas.service.js',
    'app/pantallas/plan-edicion.view.js',
    'app/etapas-ui/plan-edicion-ui.js'
  ].forEach(leer);

  const contextoPlan = contextoDemo();
  exigir(contextoPlan.resumen?.listoParaIA, 'El contexto no queda listo para IA.');
  exigir(contextoPlan.resumen?.recursosBibliotecaProyecto >= 2, 'No absorbio biblioteca proyecto.');
  exigir(contextoPlan.resumen?.recursosBibliotecaGeneral >= 2, 'No absorbio biblioteca general.');

  const planPorPartes = await generarPlanPorPartes({
    proyectoId: contextoPlan.proyectoId,
    contextoPlan,
    opciones: { usarIARealPlanPorPartes: false, usarIARealOpcionesPlan: false }
  });
  exigir(planPorPartes.partes.length === 8, 'No genero las 8 partes del plan.');
  exigir(planPorPartes.opcionesPlan?.opciones?.length === 2, 'No genero dos opciones del plan.');
  exigir(planPorPartes.opcionesPlan?.seleccionAutomatica?.ok, 'No selecciono automaticamente la mejor opcion.');
  exigir(planPorPartes.planEjecutable?.tipo === 'plan-ejecutable-produccion', 'No genero JSON tecnico ejecutable.');
  exigir(validarPlanEjecutable(planPorPartes.planEjecutable).ok, 'El JSON tecnico ejecutable no valida.');

  const planProduccion = crearPlanProduccion({
    proyecto: contextoPlan.proyecto,
    duracionSegundos: contextoPlan.resumen.duracionSegundos,
    planEjecutable: planPorPartes.planEjecutable
  });
  exigir(validarPlanProduccion(planProduccion).ok, 'Produccion no acepta el JSON tecnico ejecutable.');
  exigir(planProduccion.usaPlanEjecutable, 'Produccion no marca uso de plan ejecutable.');
  exigir(planProduccion.elementos.some((item) => item.origen === 'plan-ejecutable'), 'Produccion no crea elementos desde plan ejecutable.');

  const planCompleto = {
    ok: true,
    proyecto: contextoPlan.proyecto,
    resumen: {
      listoParaProduccion: true,
      planPartesValidadas: planPorPartes.resumen.validadas,
      planEjecutableAcciones: planPorPartes.resumen.planEjecutableAcciones
    },
    biblioteca: contextoPlan.biblioteca,
    contextoPlan,
    contextoIA: contextoPlan.contextoIA,
    planPorPartes,
    planEjecutable: planPorPartes.planEjecutable,
    planProduccion,
    validacion: { ok: true, errores: [] },
    lectura: ['Plan integral de prueba creado.']
  };

  await guardarResultadoEtapa({
    proyectoId: contextoPlan.proyectoId,
    etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION,
    resultado: planCompleto,
    metadata: { prueba: 'cierre-plan-inteligente' }
  });

  const editorInicial = await obtenerEditorPlanProyecto({ proyectoId: contextoPlan.proyectoId });
  exigir(editorInicial.resumen.totalAcciones > 0, 'Editor no carga acciones ejecutables.');
  const primeraAccion = editorInicial.planEjecutable.timeline[0]?.id;
  exigir(primeraAccion, 'No existe primera accion para editar.');

  const editado = await editarPlanProyecto({ proyectoId: contextoPlan.proyectoId, operacion: 'actualizar_accion', accionId: primeraAccion, cambios: { textoPantalla: 'Texto final revisado' }, comentario: 'Cierre integral' });
  exigir(editado.editorPlan.totalCambios >= 1, 'Editor no registro cambios.');
  const aprobado = await editarPlanProyecto({ proyectoId: contextoPlan.proyectoId, operacion: 'aprobar_plan', comentario: 'Cierre integral aprobado' });
  exigir(aprobado.editorPlan.aprobado, 'Editor no aprobo el plan.');
  exigir(aprobado.resumen.planAprobadoParaProduccion, 'Resumen no marca plan aprobado.');

  const vista = renderPlanEdicionView();
  exigir(vista.includes('planEditorDetalle'), 'La vista no tiene editor del plan.');
  exigir(vista.includes('planAprobarBtn'), 'La vista no tiene boton aprobar.');
  exigir(vista.includes('planProducirBtn'), 'La vista no tiene boton producir.');

  const rutas = leer('server/rutas-etapas.service.js');
  exigir(rutas.includes('/api/proyectos/:proyectoId/plan/editor'), 'Faltan rutas del editor en API.');
  exigir(rutas.includes('exigirPlanAprobadoAntesDeProduccion'), 'Produccion no exige aprobacion.');

  const ui = leer('app/etapas-ui/plan-edicion-ui.js');
  exigir(ui.includes('renderEditor'), 'La UI no renderiza editor.');
  exigir(ui.includes('aprobar_plan'), 'La UI no aprueba el plan.');

  const pkg = JSON.parse(leer('package.json'));
  exigir(pkg.scripts?.['check:cierre-plan-inteligente'], 'package.json no tiene check:cierre-plan-inteligente.');

  console.log('OK cierre plan inteligente: contexto, IAs, partes, opciones, JSON ejecutable, editor y aprobacion verificados');
}

main().catch((error) => {
  console.error('ERROR cierre plan inteligente:', error.message);
  process.exit(1);
});
