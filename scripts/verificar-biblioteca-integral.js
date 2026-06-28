/*
  Verificacion integral de Biblioteca AutoVideoJeff
  Objetivo:
  - Confirmar que biblioteca general, biblioteca proyecto, analisis automatico, UI, API y Plan trabajan juntos.
  - Ejecutar los bloques ya creados sin depender de la app abierta.
*/

import fs from 'fs';
import { spawnSync } from 'child_process';

const CHECKS_BIBLIOTECA = [
  { nombre: 'Bloque 1 - Base biblioteca', script: 'scripts/verificar-biblioteca-bloque-1.js' },
  { nombre: 'Bloque 2 - UI biblioteca general', script: 'scripts/verificar-biblioteca-ui.js' },
  { nombre: 'Bloque 3 - Analisis automatico', script: 'scripts/verificar-biblioteca-bloque-3.js' },
  { nombre: 'Bloque 4 - Biblioteca proyecto', script: 'scripts/verificar-biblioteca-bloque-4.js' },
  { nombre: 'Bloque 5 - Biblioteca conectada al Plan', script: 'scripts/verificar-biblioteca-bloque-5.js' }
];

const ARCHIVOS_CRITICOS = [
  {
    ruta: 'biblioteca/guardar-recurso.service.js',
    claves: ['guardarRecursoBiblioteca', 'analizarRecursoGuardado', 'accionDuplicado', 'Recurso guardado y analizado en biblioteca general permanente']
  },
  {
    ruta: 'biblioteca/analizar-recurso.service.js',
    claves: ['analizarArchivoBiblioteca', 'ffprobe', 'generarMiniaturaVideo', 'fusionarAnalisisConRecurso']
  },
  {
    ruta: 'biblioteca/resolver-biblioteca-plan.service.js',
    claves: ['resolverBibliotecaParaPlan', 'biblioteca-plan-combinada', 'biblioteca proyecto es temporal', 'recursosPlan']
  },
  {
    ruta: 'biblioteca-proyecto/guardar-recurso-proyecto.service.js',
    claves: ['guardarRecursoProyecto', 'analizarRecursoTemporal', 'permanente: false', 'Recurso guardado y analizado en biblioteca temporal del proyecto']
  },
  {
    ruta: 'app/pantallas/biblioteca.view.js',
    claves: ['library-tabs', 'libraryNewStyles', 'libraryNewCategory', 'libraryResourcesList']
  },
  {
    ruta: 'app/pantallas/biblioteca-proyecto.view.js',
    claves: ['data-project-library-root', 'projectLibraryProjectId', 'projectLibraryCreatePlanBtn', 'Guardar temporal']
  },
  {
    ruta: 'app/biblioteca-ui.js',
    claves: ['seleccionarArchivo', 'guardarRecurso', 'renderRecursosBiblioteca', 'resolucion']
  },
  {
    ruta: 'app/biblioteca-proyecto-ui.js',
    claves: ['inicializarBibliotecaProyectoUI', 'irABibliotecaProyectoDesdeEntendimiento', 'guardarRecurso', 'renderRecursosBibliotecaProyecto']
  },
  {
    ruta: 'app/etapas-ui/plan-edicion-ui.js',
    claves: ['planBiblioteca', 'Biblioteca general', 'Biblioteca proyecto', 'datos?.biblioteca']
  },
  {
    ruta: 'server/rutas-etapas.service.js',
    claves: ['/api/proyectos/:proyectoId/biblioteca-proyecto', 'Biblioteca proyecto bloqueada', 'guardarBibliotecaProyecto']
  },
  {
    ruta: 'etapas/02-plan/procesar-plan-edicion.service.js',
    claves: ['resolverBibliotecaParaPlan', 'recursosBibliotecaProyecto', 'recursosBibliotecaGeneral', 'Plan de edición creado con biblioteca conectada']
  },
  {
    ruta: 'biblioteca/seleccionar-recursos-produccion.service.js',
    claves: ['buscarRecursosProyecto', 'biblioteca-recursos-produccion-combinada', 'recursosProyecto', 'recursosGenerales']
  }
];

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leerArchivo(ruta) {
  exigir(fs.existsSync(ruta), `Falta archivo critico: ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function verificarArchivo({ ruta, claves }) {
  const contenido = leerArchivo(ruta);
  claves.forEach((clave) => exigir(contenido.includes(clave), `${ruta} no contiene clave requerida: ${clave}`));
  return { ruta, claves: claves.length };
}

function ejecutarCheck({ nombre, script }) {
  exigir(fs.existsSync(script), `Falta script de verificacion: ${script}`);
  console.log(`\n[Biblioteca integral] Ejecutando: ${nombre}`);
  const resultado = spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, AUTOVIDEOJEFF_VERIFICACION_INTEGRAL: '1' }
  });

  exigir(resultado.status === 0, `${nombre} fallo con codigo ${resultado.status}`);
  return { nombre, script, ok: true };
}

function verificarPackage() {
  const pkg = JSON.parse(leerArchivo('package.json'));
  const scripts = pkg.scripts || {};
  ['check:biblioteca-bloque1', 'check:biblioteca-ui', 'check:biblioteca-bloque3', 'check:biblioteca-bloque4', 'check:biblioteca-bloque5', 'check:biblioteca-integral'].forEach((script) => {
    exigir(Boolean(scripts[script]), `package.json no tiene ${script}`);
  });
  return { scripts: 6 };
}

async function main() {
  console.log('Iniciando verificacion integral de Biblioteca AutoVideoJeff...');

  const estructura = ARCHIVOS_CRITICOS.map(verificarArchivo);
  const packageOk = verificarPackage();
  const checks = CHECKS_BIBLIOTECA.map(ejecutarCheck);

  const resumen = {
    ok: true,
    archivosCriticos: estructura.length,
    clavesVerificadas: estructura.reduce((total, item) => total + item.claves, 0),
    scriptsPackage: packageOk.scripts,
    checksEjecutados: checks.length,
    mensaje: 'Biblioteca general, biblioteca proyecto, analisis automatico, UI, API y Plan verificados correctamente.'
  };

  console.log('\nOK verificacion integral biblioteca:', resumen);
}

main().catch((error) => {
  console.error('\nERROR verificacion integral biblioteca:', error.message);
  process.exit(1);
});
