import { previsualizarEfectos } from '../editar/efectos/previsualizacion/index.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

async function main() {
  const preview = await previsualizarEfectos({
    perfil: '11-contra-11',
    plataforma: 'tiktok',
    formato: '9:16',
    duracionSegundos: 38,
    selectorEfectos: 'local',
    intensidadEfectos: 'fuerte',
    maxEfectosVisuales: 12,
    texto: 'El partido se rompe por la banda derecha. La presión alta obliga al error. La jugada clave aparece en la segunda pelota. El cierre explica por qué ganó el equipo.'
  });

  exigir(preview.ok, `La previsualización no devolvió ok: ${preview.mensaje}`);
  exigir(preview.planResumen?.total > 0, 'La previsualización no generó plan.');
  exigir(preview.filtrosAplicados > 0, 'La previsualización no compiló filtros.');
  exigir(preview.filtroVideo.includes('scale=1080:1920'), 'La previsualización no usó formato vertical 9:16.');
  exigir(preview.diagnostico?.ok, `Diagnóstico de preview no ok: ${preview.diagnostico?.mensaje}`);
  exigir(Array.isArray(preview.efectos) && preview.efectos.length === preview.planResumen.total, 'La lista de efectos no coincide con el resumen.');

  console.log('OK previsualizacion efectos:', { total: preview.planResumen.total, filtros: preview.filtrosAplicados, perfil: preview.entrada.perfil });
}

main().catch((error) => {
  console.error('ERROR previsualizacion efectos:', error.message);
  process.exit(1);
});
