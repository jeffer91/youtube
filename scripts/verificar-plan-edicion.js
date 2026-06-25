import { crearDiagnosticoPlanEdicion } from '../plan-edicion/diagnostico-plan-edicion.service.js';
import { crearPlanEdicion } from '../plan-edicion/crear-plan-edicion.service.js';
import { validarPlanEdicion } from '../plan-edicion/validar-plan-edicion.js';

async function main() {
  const diagnostico = await crearDiagnosticoPlanEdicion();

  const entradaPrueba = {
    proyecto: { id: 'video-prueba', nombre: 'video-prueba', plataforma: 'tiktok', modo: 'cuadrado-centro' },
    video: { nombreOriginal: 'video-prueba.mp4', nombreSeguro: 'video-prueba.mp4', rutaOriginal: '/tmp/video-prueba.mp4' },
    rutas: { carpetaProyecto: process.cwd() }
  };

  const planPrueba = await crearPlanEdicion({
    entrada: entradaPrueba,
    entendimiento: { ok: true, analisis: { orientacion: 'vertical', duracionSegundos: 30, tieneAudio: true } },
    audio: { ok: true, omitido: true },
    transcripcion: { transcripcion: { segmentos: [{ inicio: 0, fin: 3, texto: 'Texto de prueba para el plan.' }] }, textosFlotantes: { textos: [] } },
    edicionDinamica: { ok: true, activo: true, cortes: { planCortes: { cortes: [] } } },
    edicion: { ok: true, salida: { formato: '9:16', nombreExportado: 'video-prueba.mp4' } },
    opciones: { requiereRevision: true, renderAutomatico: false },
    guardar: false
  });

  const validacion = validarPlanEdicion(planPrueba.plan);
  const ok = diagnostico.ok && validacion.ok;

  console.log(JSON.stringify({ ok, diagnostico, validacion, planId: planPrueba.plan.id }, null, 2));
  if (!ok) process.exit(1);
}

main().catch((error) => {
  console.error('[verificar-plan-edicion] Error:', error);
  process.exit(1);
});
