/*
  Bloque 5 - Verificacion dos opciones y eleccion automatica
  Revisa generacion de opcion Gemini, opcion local, evaluacion y seleccion automatica sin depender de internet.
*/

import fs from 'fs';
import { generarPlanPorPartes } from '../etapas/02-plan/generar-plan-por-partes.service.js';
import { generarOpcionesPlan } from '../etapas/02-plan/generar-opciones-plan.service.js';
import { evaluarOpcionesPlan } from '../etapas/02-plan/evaluar-opciones-plan.service.js';
import { seleccionarMejorPlan } from '../etapas/02-plan/seleccionar-mejor-plan.service.js';
import { CRITERIOS_COMPARACION_PLAN } from '../etapas/02-plan/comparar-plan.modelo.js';
import { construirContextoPlan } from '../etapas/02-plan/construir-contexto-plan.service.js';

function exigir(condicion, mensaje) { if (!condicion) throw new Error(mensaje); }
function leer(ruta) { exigir(fs.existsSync(ruta), `Falta archivo: ${ruta}`); return fs.readFileSync(ruta, 'utf-8'); }

function contextoDemo() {
  return construirContextoPlan({
    proyectoId: 'demo-dos-opciones-plan',
    proyecto: { nombre: 'Demo dos opciones', perfil: '11-contra-11', plataforma: 'youtube' },
    entendimiento: {
      resumenEtapa: { duracionTotalSegundos: 70, totalVideos: 1 },
      transcripcionGlobal: {
        textoCompleto: 'Gancho inicial. Desarrollo del analisis. Cierre con llamado a comentar.',
        segmentos: [
          { inicioGlobal: 0, finGlobal: 4, texto: 'Gancho inicial.' },
          { inicioGlobal: 5, finGlobal: 20, texto: 'Desarrollo del analisis.' },
          { inicioGlobal: 55, finGlobal: 65, texto: 'Cierre con llamado a comentar.' }
        ]
      },
      framesClave: [{ segundo: 2, descripcion: 'Presentador' }],
      analisisVideoGlobal: {
        momentosClave: [{ tipo: 'hook', inicioGlobal: 0, finGlobal: 4, motivo: 'Inicio fuerte' }],
        necesidades: ['logo', 'texto de apoyo']
      }
    },
    biblioteca: {
      regla: 'Referenciar sin copiar.',
      resumen: { totalDisponibles: 2, totalGeneral: 1, totalProyecto: 1, seleccionadosGeneral: 1, seleccionadosProyecto: 1 },
      recursosPlan: [
        { id: 'biblioteca-general-logo', nombre: 'Logo', tipo: 'imagen', categoria: 'logo', biblioteca: { origen: 'general', id: 'logo' } },
        { id: 'biblioteca-proyecto-intro', nombre: 'Intro', tipo: 'video', categoria: 'intro', biblioteca: { origen: 'proyecto', id: 'intro' } }
      ]
    }
  });
}

async function main() {
  [
    'etapas/02-plan/comparar-plan.modelo.js',
    'etapas/02-plan/evaluar-opciones-plan.service.js',
    'etapas/02-plan/seleccionar-mejor-plan.service.js',
    'etapas/02-plan/generar-opciones-plan.service.js'
  ].forEach(leer);

  exigir(CRITERIOS_COMPARACION_PLAN.length >= 6, 'Faltan criterios de comparacion.');
  const contexto = contextoDemo();
  const opcionesPlan = await generarOpcionesPlan({ proyectoId: contexto.proyectoId, contextoPlan: contexto, planPorPartes: { resumen: { validadas: 8 } }, opciones: {} });
  exigir(opcionesPlan.ok, 'No genero opciones de plan.');
  exigir(opcionesPlan.opciones.length === 2, 'Debe generar dos opciones.');
  exigir(opcionesPlan.opciones.some((opcion) => opcion.id === 'opcion-gemini'), 'Falta opcion Gemini.');
  exigir(opcionesPlan.opciones.some((opcion) => opcion.id === 'opcion-local'), 'Falta opcion local.');
  exigir(opcionesPlan.seleccionAutomatica?.mejorId, 'No eligio mejor opcion.');
  exigir(opcionesPlan.comparacion?.evaluaciones?.length === 2, 'No evaluo ambas opciones.');

  const evaluaciones = evaluarOpcionesPlan(opcionesPlan.opciones, contexto);
  exigir(evaluaciones[0].puntaje >= evaluaciones[1].puntaje, 'Las evaluaciones no estan ordenadas.');
  const seleccion = seleccionarMejorPlan({ opciones: opcionesPlan.opciones, contextoPlan: contexto, planPorPartes: { resumen: { validadas: 8 } } });
  exigir(seleccion.ok, 'Seleccion automatica no devolvio resultado ok.');
  exigir(seleccion.resumen.mejorId, 'Seleccion automatica no devolvio mejorId.');

  const planPorPartes = await generarPlanPorPartes({ proyectoId: contexto.proyectoId, contextoPlan: contexto, opciones: { usarIARealPlanPorPartes: false } });
  exigir(planPorPartes.opcionesPlan?.opciones?.length === 2, 'Plan por partes no contiene dos opciones.');
  exigir(planPorPartes.mejorOpcionPlan, 'Plan por partes no guarda mejor opcion.');
  exigir(planPorPartes.resumen.mejorOpcionId, 'Resumen no guarda mejorOpcionId.');

  const generadorPartes = leer('etapas/02-plan/generar-plan-por-partes.service.js');
  exigir(generadorPartes.includes('generarOpcionesPlan'), 'Plan por partes no llama generarOpcionesPlan.');
  exigir(generadorPartes.includes('mejorOpcionPlan'), 'Plan por partes no expone mejorOpcionPlan.');

  const pkg = JSON.parse(leer('package.json'));
  exigir(pkg.scripts?.['check:dos-opciones-plan'], 'package.json no tiene check:dos-opciones-plan.');

  console.log('OK dos opciones plan: Gemini/local, evaluacion, seleccion automatica y planPorPartes verificados');
}

main().catch((error) => { console.error('ERROR dos opciones plan:', error.message); process.exit(1); });
