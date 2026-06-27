import { listarPresetsVisualesEfectos, obtenerPresetVisualEfectos, aplicarPresetVisualAContexto, aplicarPresetVisualASeleccion } from '../editar/efectos/presets/index.js';
import { buscarEfectoPorId } from '../editar/efectos/catalogo/index.js';
import { planificarEfectos } from '../editar/efectos/planificador/index.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function validarPreset(preset) {
  exigir(preset.id, 'Preset sin id.');
  exigir(preset.nombre, `Preset ${preset.id} sin nombre.`);
  exigir(['suave', 'normal', 'fuerte'].includes(preset.intensidadDefault), `Preset ${preset.id} tiene intensidad invalida.`);
  exigir(Number(preset.maxEfectosDefault) >= 3, `Preset ${preset.id} tiene maximo invalido.`);
  [...(preset.efectosBase || []), ...(preset.efectosPrioritarios || [])].forEach((efectoId) => {
    exigir(buscarEfectoPorId(efectoId), `Preset ${preset.id} referencia efecto inexistente: ${efectoId}`);
  });
}

async function main() {
  const presets = listarPresetsVisualesEfectos();
  exigir(presets.length >= 7, `Hay pocos presets visuales: ${presets.length}`);
  presets.forEach(validarPreset);

  const presetFutbol = obtenerPresetVisualEfectos('11-contra-11');
  exigir(presetFutbol.efectosBase.includes('color_futbol_vibrante'), 'El preset 11 contra 11 debe incluir color futbol vibrante.');

  const contexto = { perfil: { id: '11-contra-11', nombre: '11 contra 11' }, necesidades: [], duracionSegundos: 40 };
  const aplicado = aplicarPresetVisualAContexto(contexto, { perfil: '11-contra-11' });
  exigir(aplicado.contexto.presetVisual.id === '11-contra-11', 'No se aplico el preset correcto al contexto.');
  exigir(aplicado.contexto.necesidades.includes('alta_energia'), 'El preset no agrego necesidades visuales.');

  const seleccion = { ok: true, origen: 'local', efectos: [{ efectoId: 'tono_frio_profesional', inicio: 1, fin: 3, prioridad: 50 }] };
  const filtrada = aplicarPresetVisualASeleccion(seleccion, aplicado.contexto, aplicado.opciones);
  exigir(!filtrada.efectos.some((efecto) => efecto.efectoId === 'tono_frio_profesional'), 'El preset no filtro un efecto no recomendado.');
  exigir(filtrada.efectos.some((efecto) => efecto.origen === 'preset-visual'), 'El preset no agrego efectos base.');

  const plan = await planificarEfectos({
    entrada: { proyecto: { id: 'check-presets', perfil: '11-contra-11', plataforma: 'tiktok' } },
    entendimiento: { ok: true, analisis: { duracionSegundos: 40, orientacion: 'vertical', tieneAudio: true } },
    transcripcion: { ok: true, transcripcion: { cantidadSegmentos: 1, segmentos: [{ inicio: 1, fin: 4, texto: 'Jugada clave del partido.' }] }, textosFlotantes: { cantidad: 1, textos: [{ inicio: 1, fin: 3, texto: 'Jugada clave' }] } },
    edicionDinamica: { activo: false, omitido: true },
    opciones: { perfil: '11-contra-11', selectorEfectos: 'local' }
  });

  exigir(plan.ok, `Plan con preset no ok: ${plan.errores?.join(' | ')}`);
  exigir(plan.presetVisualAplicado === '11-contra-11', `Plan no reporta preset aplicado: ${plan.presetVisualAplicado}`);
  exigir(plan.efectos.some((efecto) => ['color_futbol_vibrante', 'zoom_deportivo', 'barra_progreso'].includes(efecto.efectoId)), 'El plan no conserva efectos del preset deportivo.');

  console.log('OK presets efectos:', { presets: presets.length, plan: plan.total, preset: plan.presetVisualAplicado });
}

main().catch((error) => {
  console.error('ERROR presets efectos:', error.message);
  process.exit(1);
});
