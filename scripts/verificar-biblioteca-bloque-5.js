/*
  Verificacion Bloque Biblioteca 5:
  - El Plan usa biblioteca general permanente + biblioteca proyecto temporal.
  - Los recursos se referencian sin copiarlos.
  - La UI del Plan muestra conteos de biblioteca.
*/

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { obtenerRutaDatos, asegurarCarpeta } from '../comun/archivos.js';
import { crearEstadoProyectoEtapas, guardarEstadoProyectoEtapas, guardarResultadoEtapa, ETAPAS_AUTOVIDEO } from '../flujo-etapas/flujo-etapas.conexion.js';
import { guardarRecursoBiblioteca, resolverBibliotecaParaPlan, recomendarRecursosProduccion } from '../biblioteca/biblioteca.conexion.js';
import { guardarRecursoProyecto } from '../biblioteca-proyecto/biblioteca-proyecto.conexion.js';
import { procesarPlanEdicionProyectoEtapa } from '../etapas/02-plan/procesar-plan-edicion.service.js';

const PNG_1X1_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

async function crearImagen(nombre) {
  const carpeta = path.join(obtenerRutaDatos(), 'temporales', 'biblioteca-bloque-5');
  asegurarCarpeta(carpeta);
  const ruta = path.join(carpeta, nombre);
  await fsp.writeFile(ruta, Buffer.from(PNG_1X1_BASE64, 'base64'));
  return ruta;
}

async function prepararProyecto(proyectoId) {
  const carpetaProyecto = path.join(obtenerRutaDatos(), 'proyectos', proyectoId);
  asegurarCarpeta(carpetaProyecto);
  const estado = crearEstadoProyectoEtapas({
    proyectoId,
    nombre: 'Proyecto biblioteca bloque 5',
    datos: { perfil: '11-contra-11', plataforma: 'youtube', modoEdicion: 'revision_completa' }
  });
  await guardarEstadoProyectoEtapas({ proyectoId, carpetaProyecto, estado, mensaje: 'Estado de prueba bloque 5.' });
  await guardarResultadoEtapa({
    proyectoId,
    carpetaProyecto,
    etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
    resultado: {
      ok: true,
      resumen: { listoParaEditar: true, totalVideos: 1, duracionSegundos: 24, tieneAudio: true },
      transcripcionPrincipal: { textoCompleto: 'Prueba de biblioteca para 11 contra 11 con logo, intro y cierre.', segmentos: [{ texto: 'Prueba de biblioteca para 11 contra 11.', inicio: 0, fin: 4 }] },
      analisisVideo: {
        necesidades: ['logo del proyecto', 'intro de 11 contra 11', 'cierre visual'],
        momentosClave: [{ tipo: 'hook', inicio: 0, fin: 3, motivo: 'Inicio fuerte' }, { tipo: 'cierre', inicio: 20, fin: 24, motivo: 'Cierre del video' }]
      }
    },
    metadata: { prueba: 'biblioteca-bloque-5' }
  });
  return { id: proyectoId, proyectoId, carpetaProyecto, rutas: { raiz: carpetaProyecto, carpetaProyecto } };
}

async function main() {
  const proyectoId = `proyecto-biblioteca-bloque-5-${Date.now()}`;
  const proyecto = await prepararProyecto(proyectoId);
  const rutaGeneral = await crearImagen('logo-general-bloque-5.png');
  const rutaTemporal = await crearImagen('logo-temporal-bloque-5.png');

  const general = await guardarRecursoBiblioteca({
    nombre: `Logo general bloque 5 ${Date.now()}`,
    tipo: 'imagen',
    categoria: 'logo',
    estilos: ['11-contra-11'],
    etiquetas: ['logo', 'general', 'bloque-5'],
    usoSugerido: 'marca visual permanente',
    rutaOrigen: rutaGeneral,
    nombreOriginal: 'logo-general-bloque-5.png'
  }, { accionDuplicado: 'duplicar' });
  exigir(general.ok, 'No se guardo recurso general.');

  const temporal = await guardarRecursoProyecto(proyecto, {
    nombre: 'Logo temporal bloque 5',
    tipo: 'imagen',
    categoria: 'logo',
    estilos: ['11-contra-11'],
    etiquetas: ['logo', 'temporal', 'bloque-5'],
    usoSugerido: 'marca visual temporal del proyecto',
    rutaOrigen: rutaTemporal,
    nombreOriginal: 'logo-temporal-bloque-5.png'
  }, { accionDuplicado: 'duplicar' });
  exigir(temporal.ok, 'No se guardo recurso temporal.');

  const biblioteca = await resolverBibliotecaParaPlan({
    proyectoId,
    proyecto: { id: proyectoId, nombre: 'Proyecto biblioteca bloque 5', perfil: '11-contra-11', plataforma: 'youtube' },
    entendimiento: {
      resumen: { totalVideos: 1 },
      analisisVideo: { necesidades: ['logo del proyecto', 'intro de 11 contra 11'] }
    }
  });
  exigir(biblioteca.resumen.totalProyecto >= 1, 'No detecto recursos temporales de proyecto.');
  exigir(biblioteca.resumen.totalGeneral >= 1, 'No detecto recursos generales permanentes.');
  exigir(biblioteca.recursosPlan.some((item) => item.biblioteca.origen === 'proyecto'), 'No selecciono recurso temporal del proyecto.');
  exigir(biblioteca.recursosPlan.some((item) => item.biblioteca.origen === 'general'), 'No selecciono recurso general permanente.');

  const planProcesado = await procesarPlanEdicionProyectoEtapa({ proyectoId, opciones: { perfil: '11-contra-11', plataforma: 'youtube' }, solicitud: { origen: 'verificacion-bloque-5' } });
  const plan = planProcesado.resultado;
  exigir(plan?.biblioteca?.resumen?.seleccionadosProyecto >= 1, 'El plan no conserva biblioteca proyecto.');
  exigir(plan?.biblioteca?.resumen?.seleccionadosGeneral >= 1, 'El plan no conserva biblioteca general.');
  exigir(plan.planProduccion.elementos.some((item) => item.datos?.biblioteca?.origen === 'proyecto'), 'El plan no creo elemento desde biblioteca proyecto.');
  exigir(plan.planProduccion.elementos.some((item) => item.datos?.biblioteca?.origen === 'general'), 'El plan no creo elemento desde biblioteca general.');

  const recomendaciones = await recomendarRecursosProduccion({ proyectoId, filtros: { perfil: '11-contra-11' }, limitePorNecesidad: 3, guardar: true });
  exigir(recomendaciones.resumen.recursosProyecto >= 1, 'Recomendaciones no incluyen recursos de proyecto.');
  exigir(recomendaciones.resumen.recursosGenerales >= 1, 'Recomendaciones no incluyen recursos generales.');
  exigir(fs.existsSync(path.join(obtenerRutaDatos(), 'proyectos', proyectoId, '02-plan', 'biblioteca-sugerencias.json')), 'No se guardo biblioteca-sugerencias.json.');

  const planUi = fs.readFileSync('app/etapas-ui/plan-edicion-ui.js', 'utf-8');
  exigir(planUi.includes('planBiblioteca'), 'Plan UI no muestra KPI de biblioteca.');
  exigir(planUi.includes('Biblioteca proyecto'), 'Plan UI no muestra biblioteca proyecto.');
  exigir(planUi.includes('Biblioteca general'), 'Plan UI no muestra biblioteca general.');

  console.log('OK biblioteca bloque 5:', {
    proyectoId,
    general: biblioteca.resumen.seleccionadosGeneral,
    proyecto: biblioteca.resumen.seleccionadosProyecto,
    sugerencias: recomendaciones.resumen.sugerenciasGeneradas
  });
}

main().catch((error) => {
  console.error('ERROR biblioteca bloque 5:', error.message);
  process.exit(1);
});
