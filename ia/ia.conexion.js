/*
  Bloque 3 - Conexión pública del motor IA para Plan
*/

export {
  PROVEEDORES_IA_PLAN,
  ORDEN_AUTO_IA_PLAN,
  PROVEEDORES_LOCALES_IA_PLAN,
  obtenerConfigIAPlan,
  listarProveedoresIAPlan
} from './ia.config.js';

export {
  extraerJsonDesdeTexto,
  crearRespuestaFallbackPlan,
  normalizarRespuestaPlanIA
} from './normalizar-respuesta-ia.service.js';

export { ejecutarGeminiPlan } from './proveedores/gemini-plan.service.js';
export { ejecutarOllamaPlan } from './proveedores/ollama-plan.service.js';
export { ejecutarLmStudioPlan } from './proveedores/lmstudio-plan.service.js';
export { ejecutarGpt4AllPlan } from './proveedores/gpt4all-plan.service.js';
export { ejecutarFallbackPlan } from './proveedores/fallback-plan.service.js';

export {
  diagnosticarProveedoresIAPlan,
  ejecutarProveedorIAPlan,
  ejecutarPlanConIA,
  generarDosOpcionesIAPlan
} from './selector-ia-plan.service.js';
