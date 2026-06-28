/*
  Bloque 7 - Verificacion Editor del Plan antes de Produccion
  Revisa edicion, duplicado, eliminacion, aprobacion, rutas API y UI.
*/

import fs from 'fs';
import {
  ETAPAS_AUTOVIDEO,
  guardarResultadoEtapa
} from '../flujo-etapas/flujo-etapas.conexion.js';
import { obtenerEditorPlanProyecto, editarPlanProyecto } from '../etapas/02-plan/editor-plan.service.js';
import { renderPlanEdicionView } from '../app/pantallas/plan-edicion.view.js';

function exigir(condicion, mensaje) { if (!condicion) throw new Error(mensaje); }
function leer(ruta) { exigir(fs.existsSync(ruta), `Falta archivo: ${ruta}`); return fs.readFileSync(ruta, 'utf-8'); }

function crearPlanDemo(proyectoId) {
  return {
    ok: true,
    proyecto: { id: proyectoId, nombre: 'Demo editor', perfil: 'general' },
    resumen: { listoParaProduccion: true },
    planPorPartes: {
      resumen: { validadas: 8, totalPartes: 8, mejorOpcionId: 'opcion-local' },
      planEjecutable: {
        ok: true,
        tipo: 'plan-ejecutable-produccion',
        proyectoId,
        timeline: [
          { id: 'accion-1', orden: 1, inicio: 0, fin: 4, accion: 'gancho_inicial', textoPantalla: 'Gancho', motivo: 'Inicio' },
          { id: 'accion-2', orden: 2, inicio: 5, fin: 10, accion: 'texto_apoyo', textoPantalla: 'Idea central', motivo: 'Desarrollo' }
        ],
        recursos: [],
        salidaProduccion: { usarTimelineEjecutable: true, totalAcciones: 2 }
      }
    },
    planProduccion: {
      id: 'plan-demo',
      proyectoId,
      elementos: [],
      lineaTiempo: { ok: true, items: [] }
    },
    validacion: { ok: true, errores: [] }
  };
}

async function main() {
  ['etapas/02-plan/editor-plan.service.js'].forEach(leer);
  const proyectoId = `demo-editor-plan-${Date.now()}`;
  await guardarResultadoEtapa({
    proyectoId,
    etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION,
    resultado: crearPlanDemo(proyectoId),
    metadata: { prueba: 'editor-plan' }
  });

  const inicial = await obtenerEditorPlanProyecto({ proyectoId });
  exigir(inicial.ok, 'No pudo cargar editor inicial.');
  exigir(inicial.resumen.totalAcciones === 2, 'Editor inicial no cuenta acciones.');
  exigir(!inicial.resumen.aprobado, 'Editor no debe iniciar aprobado.');

  const editado = await editarPlanProyecto({ proyectoId, operacion: 'actualizar_accion', accionId: 'accion-1', cambios: { textoPantalla: 'Nuevo gancho' }, comentario: 'Prueba editar' });
  exigir(editado.ok, 'No edito accion.');
  exigir(editado.editorPlan.totalCambios === 1, 'No registro cambio de edicion.');
  exigir(editado.planEjecutable.timeline[0].textoPantalla === 'Nuevo gancho', 'No cambio texto de accion.');

  const duplicado = await editarPlanProyecto({ proyectoId, operacion: 'duplicar_accion', accionId: 'accion-1', comentario: 'Prueba duplicar' });
  exigir(duplicado.planEjecutable.timeline.length === 3, 'No duplico accion.');

  const eliminado = await editarPlanProyecto({ proyectoId, operacion: 'eliminar_accion', accionId: 'accion-2', comentario: 'Prueba eliminar' });
  exigir(eliminado.planEjecutable.timeline.length === 2, 'No elimino accion.');

  const aprobado = await editarPlanProyecto({ proyectoId, operacion: 'aprobar_plan', comentario: 'Aprobacion final' });
  exigir(aprobado.editorPlan.aprobado, 'No aprobo plan.');
  exigir(aprobado.resumen.planAprobadoParaProduccion, 'Resumen no marca plan aprobado para produccion.');

  const vista = renderPlanEdicionView();
  exigir(vista.includes('planEditorDetalle'), 'La vista no tiene panel editor.');
  exigir(vista.includes('planAprobarBtn'), 'La vista no tiene boton aprobar.');

  const ui = leer('app/etapas-ui/plan-edicion-ui.js');
  exigir(ui.includes('renderEditor'), 'La UI no renderiza el editor.');
  exigir(ui.includes('actualizar_accion'), 'La UI no edita acciones.');
  exigir(ui.includes('aprobar_plan'), 'La UI no aprueba el plan.');

  const rutas = leer('server/rutas-etapas.service.js');
  exigir(rutas.includes('/api/proyectos/:proyectoId/plan/editor'), 'API no tiene ruta editor plan.');
  exigir(rutas.includes('exigirPlanAprobadoAntesDeProduccion'), 'Produccion no exige aprobacion del plan.');

  const pkg = JSON.parse(leer('package.json'));
  exigir(pkg.scripts?.['check:editor-plan'], 'package.json no tiene check:editor-plan.');

  console.log('OK editor plan: editar, duplicar, eliminar, aprobar, UI y API verificados');
}

main().catch((error) => { console.error('ERROR editor plan:', error.message); process.exit(1); });
