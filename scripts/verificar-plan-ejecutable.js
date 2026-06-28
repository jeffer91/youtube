/*
  Bloque 6 - Verificacion JSON tecnico ejecutable para Produccion
  Revisa modelo, reparacion, validacion, plan por partes y compatibilidad con produccion.
*/

import fs from 'fs';
import { crearPlanEjecutableModelo } from '../etapas/02-plan/plan-ejecutable.modelo.js';
import { validarPlanEjecutable } from '../etapas/02-plan/validar-plan-ejecutable.service.js';
import { repararPlanEjecutable } from '../etapas/02-plan/reparar-plan-ejecutable.service.js';
import { generarPlanPorPartes } from '../etapas/02-plan/generar-plan-por-partes.service.js';
import { construirContextoPlan } from '../etapas/02-plan/construir-contexto-plan.service.js';
import { crearPlanProduccion, validarPlanProduccion } from '../produccion/produccion.conexion.js';

function exigir(condicion, mensaje) { if (!condicion) throw new Error(mensaje); }
function leer(ruta) { exigir(fs.existsSync(ruta), `Falta archivo: ${ruta}`); return fs.readFileSync(ruta, 'utf-8'); }

function contextoDemo() {
  return construirContextoPlan({
    proyectoId: 'demo-plan-ejecutable',
    proyecto: { id: 'demo-plan-ejecutable', nombre: 'Demo ejecutable', perfil: '11-contra-11', plataforma: 'youtube' },
    entendimiento: {
      resumenEtapa: { duracionTotalSegundos: 45, totalVideos: 1 },
      transcripcionGlobal: {
        textoCompleto: 'Inicio con gancho. Explicacion central. Cierre claro.',
        segmentos: [
          { inicioGlobal: 0, finGlobal: 5, texto: 'Inicio con gancho.' },
          { inicioGlobal: 6, finGlobal: 18, texto: 'Explicacion central.' }
        ]
      },
      framesClave: [{ segundo: 2, descripcion: 'Frame inicial' }],
      analisisVideoGlobal: {
        momentosClave: [{ tipo: 'hook', inicioGlobal: 0, finGlobal: 4, motivo: 'Gancho fuerte' }],
        necesidades: ['logo', 'texto pantalla']
      }
    },
    biblioteca: {
      regla: 'Referenciar sin copiar.',
      resumen: { totalDisponibles: 2, totalGeneral: 1, totalProyecto: 1, seleccionadosGeneral: 1, seleccionadosProyecto: 1 },
      recursosPlan: [
        { id: 'biblioteca-general-logo', nombre: 'Logo', tipo: 'imagen', categoria: 'logo', biblioteca: { origen: 'general', id: 'logo' } }
      ]
    }
  });
}

async function main() {
  [
    'etapas/02-plan/plan-ejecutable.modelo.js',
    'etapas/02-plan/validar-plan-ejecutable.service.js',
    'etapas/02-plan/reparar-plan-ejecutable.service.js'
  ].forEach(leer);

  const contexto = contextoDemo();
  const planPorPartes = await generarPlanPorPartes({ proyectoId: contexto.proyectoId, contextoPlan: contexto, opciones: { usarIARealPlanPorPartes: false } });
  exigir(planPorPartes.planEjecutable?.tipo === 'plan-ejecutable-produccion', 'Plan por partes no genera planEjecutable.');
  exigir(planPorPartes.validacionPlanEjecutable?.ok, 'Plan ejecutable dentro de planPorPartes no valida.');
  exigir(planPorPartes.resumen.planEjecutableAcciones > 0, 'Resumen no cuenta acciones ejecutables.');

  const manual = crearPlanEjecutableModelo({ proyecto: contexto.proyecto, contextoPlan: contexto, planPorPartes });
  const reparado = repararPlanEjecutable(manual);
  exigir(reparado.validacion.ok, 'Reparacion no dejo plan ejecutable valido.');
  const validacion = validarPlanEjecutable(reparado.plan);
  exigir(validacion.ok, 'Validacion final del plan ejecutable fallo.');

  const planProduccion = crearPlanProduccion({
    proyecto: contexto.proyecto,
    recursos: [],
    subtitulos: [],
    textos: [],
    duracionSegundos: contexto.resumen.duracionSegundos,
    planEjecutable: reparado.plan
  });
  const validacionProduccion = validarPlanProduccion(planProduccion);
  exigir(validacionProduccion.ok, 'Produccion no acepta planEjecutable.');
  exigir(planProduccion.usaPlanEjecutable, 'Modelo de produccion no marca usaPlanEjecutable.');
  exigir(planProduccion.elementos.some((item) => item.origen === 'plan-ejecutable'), 'Produccion no creo elementos desde planEjecutable.');

  const crearPlan = leer('produccion/crear-plan-produccion.service.js');
  exigir(crearPlan.includes('elementosDesdePlanEjecutable'), 'Crear plan produccion no convierte planEjecutable.');
  exigir(crearPlan.includes('planEjecutable'), 'Crear plan produccion no recibe planEjecutable.');

  const pkg = JSON.parse(leer('package.json'));
  exigir(pkg.scripts?.['check:plan-ejecutable'], 'package.json no tiene check:plan-ejecutable.');

  console.log('OK plan ejecutable: JSON tecnico, reparacion, validacion y produccion verificados');
}

main().catch((error) => { console.error('ERROR plan ejecutable:', error.message); process.exit(1); });
