import { planificarEfectos } from '../editar/efectos/planificador/index.js';
import { compilarPlanFfmpeg } from '../editar/efectos/ffmpeg/index.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

async function crearPlanPrueba() {
  return planificarEfectos({
    entrada: { proyecto: { id: 'check-compilador', perfil: 'creciaula', plataforma: 'tiktok' } },
    entendimiento: { ok: true, analisis: { duracionSegundos: 36, orientacion: 'vertical', tieneAudio: true } },
    transcripcion: {
      ok: true,
      transcripcion: {
        cantidadSegmentos: 3,
        segmentos: [
          { inicio: 1, fin: 4, texto: 'Primero entendemos la idea central del tema.' },
          { inicio: 9, fin: 12, texto: 'Luego revisamos el dato más importante.' },
          { inicio: 21, fin: 24, texto: 'Finalmente cerramos con una conclusión clara.' }
        ]
      },
      textosFlotantes: { cantidad: 1, textos: [{ inicio: 9, fin: 11, texto: 'Dato clave', prioridad: 10 }] }
    },
    edicionDinamica: { activo: false, omitido: true },
    opciones: { perfil: 'creciaula', selectorEfectos: 'local', intensidadEfectos: 'normal', maxEfectosVisuales: 10 }
  });
}

async function main() {
  const plan = await crearPlanPrueba();
  exigir(plan.ok && plan.total > 0, 'No se pudo crear plan de prueba para compilador.');

  const filtroBase = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1,format=yuv420p';
  const compilado = compilarPlanFfmpeg({ filtroBase, plan, width: 1080, height: 1920, duracionSegundos: 36 });

  exigir(compilado.ok, `Compilador no valido el filtro final: ${JSON.stringify(compilado.validacion?.errores || [])}`);
  exigir(compilado.filtroVideo.includes(filtroBase), 'El filtro final no conserva el filtro base.');
  exigir(compilado.filtrosAplicados > 0, 'No se compilo ningun filtro de efecto.');
  exigir(!compilado.filtroVideo.includes('undefined'), 'El filtro final contiene undefined.');
  exigir(!compilado.filtroVideo.includes('null'), 'El filtro final contiene null.');

  console.log('OK compilador efectos:', { filtrosAplicados: compilado.filtrosAplicados, omitidos: compilado.omitidos.length });
}

main().catch((error) => {
  console.error('ERROR compilador efectos:', error.message);
  process.exit(1);
});
