/*
  Bloque 3 - Verificación motor de IAs gratis para Plan
  Revisa proveedores: Gemini, Ollama, LM Studio, GPT4All y fallback interno.
  No llama internet ni servicios locales reales; prueba contrato, selector y fallback.
*/

import fs from 'fs';
import {
  PROVEEDORES_IA_PLAN,
  ORDEN_AUTO_IA_PLAN,
  obtenerConfigIAPlan,
  listarProveedoresIAPlan,
  diagnosticarProveedoresIAPlan,
  ejecutarPlanConIA,
  generarDosOpcionesIAPlan,
  crearRespuestaFallbackPlan,
  normalizarRespuestaPlanIA
} from '../ia/ia.conexion.js';
import { construirContextoPlan } from '../etapas/02-plan/construir-contexto-plan.service.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta archivo: ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contextoDemo() {
  return construirContextoPlan({
    proyectoId: 'demo-ias-plan',
    proyecto: { nombre: 'Demo IA Plan', perfil: '11-contra-11', plataforma: 'youtube' },
    entendimiento: {
      resumenEtapa: { duracionTotalSegundos: 40, totalVideos: 1 },
      transcripcionGlobal: {
        textoCompleto: 'Inicio fuerte del análisis. Se explica la jugada principal y luego se cierra con una conclusión clara.',
        segmentos: [
          { inicioGlobal: 0, finGlobal: 5, texto: 'Inicio fuerte del análisis.' },
          { inicioGlobal: 6, finGlobal: 15, texto: 'Se explica la jugada principal.' }
        ]
      },
      framesClave: [{ segundo: 2, descripcion: 'Plano del presentador' }],
      analisisVideoGlobal: {
        momentosClave: [{ tipo: 'hook', inicioGlobal: 0, finGlobal: 4, motivo: 'Gancho inicial' }],
        necesidades: ['texto táctico', 'logo del programa']
      }
    },
    biblioteca: {
      regla: 'Referenciar sin copiar.',
      resumen: { totalDisponibles: 2, totalGeneral: 1, totalProyecto: 1, seleccionadosGeneral: 1, seleccionadosProyecto: 1 },
      recursosPlan: [
        { id: 'biblioteca-general-logo', nombre: 'Logo general', tipo: 'imagen', categoria: 'logo', biblioteca: { origen: 'general', id: 'logo' } },
        { id: 'biblioteca-proyecto-audio', nombre: 'Audio temporal', tipo: 'audio', categoria: 'musica', biblioteca: { origen: 'proyecto', id: 'audio' } }
      ]
    }
  });
}

async function main() {
  const archivos = [
    'ia/ia.config.js',
    'ia/ia.conexion.js',
    'ia/normalizar-respuesta-ia.service.js',
    'ia/selector-ia-plan.service.js',
    'ia/proveedores/gemini-plan.service.js',
    'ia/proveedores/ollama-plan.service.js',
    'ia/proveedores/lmstudio-plan.service.js',
    'ia/proveedores/gpt4all-plan.service.js',
    'ia/proveedores/fallback-plan.service.js'
  ];
  archivos.forEach(leer);

  ['gemini', 'ollama', 'lmstudio', 'gpt4all', 'fallback'].forEach((id) => {
    exigir(PROVEEDORES_IA_PLAN[id], `Falta proveedor ${id}.`);
    exigir(ORDEN_AUTO_IA_PLAN.includes(id), `El orden automático no incluye ${id}.`);
  });

  const config = obtenerConfigIAPlan({ usarGemini: false, proveedor: 'automatico' });
  exigir(config.proveedores.gemini.activo === false, 'La configuración no respeta usarGemini=false.');
  exigir(config.proveedores.ollama.endpointBase.includes('11434'), 'Ollama no tiene endpoint local por defecto.');
  exigir(config.proveedores.lmstudio.endpointBase.includes('1234'), 'LM Studio no tiene endpoint local por defecto.');
  exigir(config.proveedores.gpt4all.endpointBase.includes('4891'), 'GPT4All no tiene endpoint local por defecto.');

  const lista = listarProveedoresIAPlan({});
  exigir(lista.length === 5, 'La lista de proveedores debe tener 5 entradas contando fallback.');
  const diagnostico = diagnosticarProveedoresIAPlan({});
  exigir(diagnostico.some((item) => item.id === 'gemini'), 'Diagnóstico no incluye Gemini.');
  exigir(diagnostico.some((item) => item.id === 'fallback' && item.seleccionable), 'Fallback debe ser seleccionable.');

  const contexto = contextoDemo();
  const fallback = crearRespuestaFallbackPlan(contexto, 'Prueba de fallback');
  exigir(Array.isArray(fallback.jsonTecnico.timeline), 'Fallback no generó timeline.');
  exigir(fallback.jsonTecnico.timeline.length > 0, 'Fallback generó timeline vacío.');

  const normalizada = normalizarRespuestaPlanIA({ proveedor: 'prueba', respuesta: fallback, contexto, real: false, fallback: true, motivo: 'test' });
  exigir(normalizada.ok, 'Normalizador no aceptó fallback válido.');
  exigir(normalizada.jsonTecnico.timeline.length > 0, 'Normalizador perdió timeline.');

  const ejecucion = await ejecutarPlanConIA({ contextoPlan: contexto, proveedor: 'fallback', modo: 'manual', opciones: {} });
  exigir(ejecucion.ok, 'Selector manual fallback falló.');
  exigir(ejecucion.proveedorSeleccionado === 'fallback', 'Selector manual no usó fallback.');

  const dosOpciones = await generarDosOpcionesIAPlan({ contextoPlan: contexto, opciones: { usarGemini: false, usarOllama: false, usarLmstudio: false, usarGpt4all: false } });
  exigir(dosOpciones.ok, 'Generador de dos opciones falló.');
  exigir(dosOpciones.opciones.length === 2, 'Debe generar dos opciones: Gemini y local/fallback.');
  exigir(dosOpciones.seleccionAutomatica?.mejorId, 'No calculó selección automática.');

  const pkg = JSON.parse(leer('package.json'));
  exigir(pkg.scripts?.['check:ias-plan'], 'package.json no tiene script check:ias-plan.');
  exigir((pkg.build?.files || []).includes('ia/**/*'), 'El build no incluye ia/**/*');

  console.log('OK IAs plan: Gemini/Ollama/LM Studio/GPT4All/fallback, selector, dos opciones y build verificados');
}

main().catch((error) => {
  console.error('ERROR IAs plan:', error.message);
  process.exit(1);
});
