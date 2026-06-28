/*
  Verificacion Bloque Biblioteca 4:
  - Pantalla Biblioteca proyecto despues de Entendimiento.
  - Menu y flujo con biblioteca-proyecto antes de Plan.
  - API por etapas para biblioteca-proyecto.
  - Guardado temporal dentro del proyecto.
*/

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { obtenerRutaDatos, asegurarCarpeta } from '../comun/archivos.js';
import { renderBibliotecaProyectoView } from '../app/pantallas/biblioteca-proyecto.view.js';
import { renderRecursosBibliotecaProyecto } from '../app/biblioteca-proyecto-ui.js';
import { MENU_PRINCIPAL, FLUJO_PROYECTO } from '../app/navegacion/menu.config.js';
import { ETAPAS_AUTOVIDEO, crearEstadoProyectoEtapas, guardarEstadoProyectoEtapas, guardarResultadoEtapa } from '../flujo-etapas/flujo-etapas.conexion.js';
import { guardarRecursoProyecto, listarRecursosProyecto } from '../biblioteca-proyecto/biblioteca-proyecto.conexion.js';

const PNG_1X1_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

async function crearImagenTemporal() {
  const carpeta = path.join(obtenerRutaDatos(), 'temporales', 'biblioteca-bloque-4');
  asegurarCarpeta(carpeta);
  const ruta = path.join(carpeta, 'logo-temporal-proyecto.png');
  await fsp.writeFile(ruta, Buffer.from(PNG_1X1_BASE64, 'base64'));
  return ruta;
}

async function prepararProyectoConEntendimiento(proyectoId) {
  const carpetaProyecto = path.join(obtenerRutaDatos(), 'proyectos', proyectoId);
  asegurarCarpeta(carpetaProyecto);
  const estado = crearEstadoProyectoEtapas({ proyectoId, nombre: 'Proyecto biblioteca bloque 4', datos: { origen: 'verificacion-bloque-4' } });
  await guardarEstadoProyectoEtapas({ proyectoId, carpetaProyecto, estado, mensaje: 'Estado de prueba para biblioteca proyecto.' });
  await guardarResultadoEtapa({
    proyectoId,
    carpetaProyecto,
    etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
    resultado: { ok: true, resumen: { listoParaEditar: true, totalVideos: 1 }, mensaje: 'Entendimiento de prueba listo.' },
    metadata: { prueba: 'biblioteca-bloque-4' }
  });
  return { id: proyectoId, proyectoId, carpetaProyecto, rutas: { raiz: carpetaProyecto, carpetaProyecto } };
}

async function main() {
  const vista = renderBibliotecaProyectoView();
  if (!vista.includes('data-project-library-root')) throw new Error('Falta root de biblioteca proyecto.');
  if (!vista.includes('projectLibraryProjectId') || !vista.includes('projectLibraryCreatePlanBtn')) throw new Error('Vista biblioteca proyecto incompleta.');

  const idsMenu = MENU_PRINCIPAL.map((item) => item.id);
  const idsFlujo = FLUJO_PROYECTO.map((item) => item.id);
  if (!idsMenu.includes('biblioteca-proyecto')) throw new Error('Menu principal no incluye biblioteca-proyecto.');
  if (idsFlujo.indexOf('biblioteca-proyecto') < idsFlujo.indexOf('entendimiento')) throw new Error('Biblioteca proyecto debe ir despues de Entendimiento.');
  if (idsFlujo.indexOf('biblioteca-proyecto') > idsFlujo.indexOf('plan-edicion')) throw new Error('Biblioteca proyecto debe ir antes de Plan.');

  const rutasEtapas = fs.readFileSync('server/rutas-etapas.service.js', 'utf-8');
  if (!rutasEtapas.includes('/api/proyectos/:proyectoId/biblioteca-proyecto')) throw new Error('Falta API por etapas para biblioteca-proyecto.');
  if (!rutasEtapas.includes('Biblioteca proyecto bloqueada')) throw new Error('La API no bloquea biblioteca proyecto antes de Entendimiento.');

  const bootstrap = fs.readFileSync('app/navegacion/navegacion-bootstrap.js', 'utf-8');
  if (!bootstrap.includes('inicializarBibliotecaProyectoUI') || !bootstrap.includes('biblioteca-proyecto.css')) throw new Error('Bootstrap no inicializa biblioteca proyecto.');

  const ui = fs.readFileSync('app/biblioteca-proyecto-ui.js', 'utf-8');
  if (!ui.includes('irABibliotecaProyectoDesdeEntendimiento') || !ui.includes('biblioteca-proyecto')) throw new Error('UI no conecta Entendimiento con Biblioteca proyecto.');

  const proyectoId = `proyecto-biblioteca-bloque-4-${Date.now()}`;
  const proyecto = await prepararProyectoConEntendimiento(proyectoId);
  const rutaImagen = await crearImagenTemporal();
  const guardado = await guardarRecursoProyecto(proyecto, {
    nombre: 'Logo temporal bloque 4',
    tipo: 'imagen',
    categoria: 'logo',
    estilos: ['11-contra-11'],
    etiquetas: ['temporal', 'bloque-4'],
    usoSugerido: 'marca visual del proyecto',
    rutaOrigen: rutaImagen,
    nombreOriginal: 'logo-temporal-proyecto.png'
  }, { accionDuplicado: 'duplicar' });

  if (!guardado.ok) throw new Error(guardado.mensaje || 'No guardo recurso temporal de proyecto.');
  if (guardado.recurso.permanente) throw new Error('El recurso de proyecto no debe ser permanente.');
  if (guardado.recurso.alcance !== 'proyecto') throw new Error(`Alcance incorrecto: ${guardado.recurso.alcance}`);

  const recursos = await listarRecursosProyecto(proyecto);
  if (!recursos.find((item) => item.id === guardado.recurso.id)) throw new Error('No se lista recurso temporal del proyecto.');

  const tarjetas = renderRecursosBibliotecaProyecto(recursos);
  const tabla = renderRecursosBibliotecaProyecto(recursos, 'table');
  if (!tarjetas.includes('Logo temporal bloque 4') || !tarjetas.includes('marca visual')) throw new Error('Tarjetas de biblioteca proyecto incompletas.');
  if (!tabla.includes('<table') || !tabla.includes('logo')) throw new Error('Tabla de biblioteca proyecto incompleta.');

  console.log('OK biblioteca bloque 4:', { proyectoId, recursos: recursos.length, recurso: guardado.recurso.id });
}

main().catch((error) => {
  console.error('ERROR biblioteca bloque 4:', error.message);
  process.exit(1);
});
