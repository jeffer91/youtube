import { planificarEfectos } from '../editar/efectos/planificador/index.js';
import { buscarEfectoPorId } from '../editar/efectos/catalogo/index.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function crearDatosPrueba() {
  return {
    entrada: { proyecto: { id: 'check-efectos', perfil: '11-contra-11', plataforma: 'tiktok' } },
    entendimiento: { ok: true, analisis: { duracionSegundos: 42, orientacion: 'vertical', tieneAudio: true } },
    transcripcion: {
      ok: true,
      transcripcion: {
        cantidadSegmentos: 4,
        segmentos: [
          { inicio: 0.5, fin: 3.5, texto: 'Arranca el análisis con una jugada clave del partido.' },
          { inicio: 5.0, fin: 8.5, texto: 'La presión alta cambia completamente el ritmo del equipo.' },
          { inicio: 13.0, fin: 16.2, texto: 'Aquí aparece el error defensivo que explica el gol.' },
          { inicio: 24.0, fin: 28.0, texto: 'La conclusión es que el equipo necesita más intensidad.' }
        ]
      },
      textosFlotantes: {
        cantidad: 2,
        textos: [
          { inicio: 1.0, fin: 3.0, texto: 'Inicio fuerte', prioridad: 20 },
          { inicio: 13.0, fin: 15.5, texto: 'Error defensivo', prioridad: 10 }
        ]
      }
    },
    edicionDinamica: { activo: false, omitido: true },
    opciones: {
      perfil: '11-contra-11',
      selectorEfectos: 'local',
      intensidadEfectos: 'fuerte',
      maxEfectosVisuales: 12
    }
  };
}

async function main() {
  const plan = await planificarEfectos(crearDatosPrueba());
  exigir(plan.ok, `Planificador devolvio error: ${JSON.stringify(plan.errores || [])}`);
  exigir(plan.origen === 'local', `El selector local no fue usado. Origen: ${plan.origen}`);
  exigir(plan.total > 0, 'El plan no genero efectos.');
  exigir(plan.total <= 12, `El plan supero el maximo permitido: ${plan.total}`);
  exigir(plan.efectos.every((efecto) => buscarEfectoPorId(efecto.efectoId)), 'El plan contiene efectos que no existen en catalogo.');
  exigir(plan.efectos.every((efecto) => Number.isFinite(Number(efecto.inicio)) && Number.isFinite(Number(efecto.fin)) && efecto.fin > efecto.inicio), 'El plan tiene tiempos invalidos.');

  console.log('OK planificador efectos:', { origen: plan.origen, total: plan.total, perfil: plan.perfil.id, intensidad: plan.intensidad.id });
}

main().catch((error) => {
  console.error('ERROR planificador efectos:', error.message);
  process.exit(1);
});
