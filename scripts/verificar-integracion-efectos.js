import { procesarMotorEfectos } from '../editar/efectos/efectos.conexion.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

async function main() {
  const filtroBase = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1,format=yuv420p';
  const resultado = await procesarMotorEfectos({
    filtroBase,
    entrada: { proyecto: { id: 'check-integracion-efectos', perfil: '11-contra-11', plataforma: 'tiktok' } },
    entendimiento: { ok: true, analisis: { duracionSegundos: 40, orientacion: 'vertical', tieneAudio: true } },
    transcripcion: {
      ok: true,
      transcripcion: {
        cantidadSegmentos: 3,
        segmentos: [
          { inicio: 1, fin: 4, texto: 'Este partido se rompe por la banda derecha.' },
          { inicio: 8, fin: 11, texto: 'La presión del mediocampo obliga al error.' },
          { inicio: 18, fin: 22, texto: 'La jugada clave está en la segunda pelota.' }
        ]
      },
      textosFlotantes: { cantidad: 2, textos: [{ inicio: 1, fin: 3, texto: 'Banda derecha' }, { inicio: 18, fin: 20, texto: 'Jugada clave' }] }
    },
    edicionDinamica: { activo: false, omitido: true },
    salida: { width: 1080, height: 1920, fps: 30 },
    opciones: { perfil: '11-contra-11', usarMotorEfectos: true, selectorEfectos: 'local', intensidadEfectos: 'fuerte', maxEfectosVisuales: 12 },
    progreso: null
  });

  exigir(resultado.ok, 'El motor de efectos no devolvio ok.');
  exigir(!resultado.omitido, `El motor de efectos fue omitido: ${resultado.mensaje}`);
  exigir(resultado.plan?.total > 0, 'No hay plan de efectos en resultado.');
  exigir(resultado.filtrosAplicados > 0, 'No hay filtros aplicados en resultado.');
  exigir(resultado.filtroVideo && resultado.filtroVideo !== filtroBase, 'El filtro final no cambio respecto al filtro base.');
  exigir(resultado.detalle?.perfil === '11-contra-11', `Perfil inesperado: ${resultado.detalle?.perfil}`);

  console.log('OK integracion efectos:', { filtrosAplicados: resultado.filtrosAplicados, origen: resultado.detalle.origen, perfil: resultado.detalle.perfil });
}

main().catch((error) => {
  console.error('ERROR integracion efectos:', error.message);
  process.exit(1);
});
