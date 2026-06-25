import { crearDiagnosticoRevision } from '../revision/diagnostico-revision.service.js';
import { crearDraftRevision } from '../revision/crear-draft.service.js';
import { validarCambiosDraft } from '../revision/validar-cambios-draft.js';

async function main() {
  const diagnostico = await crearDiagnosticoRevision();

  const planPrueba = {
    id: 'plan-prueba',
    estado: 'BORRADOR',
    proyecto: { id: 'video-prueba', nombre: 'video-prueba' },
    video: { nombreOriginal: 'video-prueba.mp4' },
    rutas: { carpetaProyecto: process.cwd() },
    revision: {
      cortes: [{ id: 1, activo: true, inicio: 0, fin: 2, motivo: 'corte prueba' }],
      subtitulos: [{ id: 1, activo: true, inicio: 0, fin: 2, texto: 'Texto prueba' }],
      textosFlotantes: [{ id: 1, activo: true, texto: 'PUNTO CLAVE' }],
      broll: []
    },
    exportacion: { formatos: ['vertical-9-16'] }
  };

  const draft = await crearDraftRevision({ plan: planPrueba, guardar: false });
  const validacionCambios = validarCambiosDraft({ subtitulos: [{ id: 1, activo: true, texto: 'Texto corregido' }] });
  const ok = diagnostico.ok && draft.ok && validacionCambios.ok;

  console.log(JSON.stringify({ ok, diagnostico, draftId: draft.draft.id, validacionCambios }, null, 2));
  if (!ok) process.exit(1);
}

main().catch((error) => {
  console.error('[verificar-revision] Error:', error);
  process.exit(1);
});
