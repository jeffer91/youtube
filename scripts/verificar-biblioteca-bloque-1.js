/*
  Verificacion Bloque Biblioteca 1:
  - Modelo de datos.
  - Carpetas internas.
  - Guardado de recurso permanente.
  - Guardado de recurso temporal de proyecto.
*/

import fs from 'fs/promises';
import path from 'path';
import {
  listarCategoriasBiblioteca,
  listarEstilosVideo,
  crearRecursoModelo,
  validarRecursoModelo,
  asegurarEstructuraBibliotecaGeneral,
  guardarRecursoBiblioteca,
  listarRecursosBiblioteca
} from '../biblioteca/biblioteca.conexion.js';
import { guardarRecursoProyecto, listarRecursosProyecto } from '../biblioteca-proyecto/biblioteca-proyecto.conexion.js';
import { obtenerRutaDatos, asegurarCarpeta } from '../comun/archivos.js';

async function crearArchivoTemporal(nombre, contenido) {
  const carpeta = path.join(obtenerRutaDatos(), 'temporales', 'biblioteca-bloque-1');
  asegurarCarpeta(carpeta);
  const ruta = path.join(carpeta, nombre);
  await fs.writeFile(ruta, contenido);
  return ruta;
}

async function verificar() {
  const categorias = listarCategoriasBiblioteca();
  const estilos = listarEstilosVideo();
  if (categorias.length < 10) throw new Error('Faltan categorias base de biblioteca.');
  if (!estilos.find((item) => item.id === '11-contra-11')) throw new Error('Falta estilo 11 contra 11.');

  const rutasGeneral = asegurarEstructuraBibliotecaGeneral();
  await fs.access(rutasGeneral.general);
  await fs.access(rutasGeneral.archivos);

  const rutaAudio = await crearArchivoTemporal('intro-prueba.mp3', Buffer.from('audio de prueba biblioteca bloque 1'));
  const recursoBase = crearRecursoModelo({
    nombre: 'Intro prueba 11 contra 11',
    tipo: 'audio',
    categoria: 'intro',
    estilos: ['11-contra-11', 'general'],
    etiquetas: ['intro', 'futbol'],
    rutaOrigen: rutaAudio,
    nombreOriginal: 'intro-prueba.mp3'
  });
  const validacion = validarRecursoModelo({ ...recursoBase, ruta: rutaAudio });
  if (!validacion.ok) throw new Error(validacion.errores.join(' | '));

  const guardadoGeneral = await guardarRecursoBiblioteca({
    nombre: 'Intro prueba 11 contra 11',
    tipo: 'audio',
    categoria: 'intro',
    estilos: ['11-contra-11', 'general'],
    etiquetas: ['intro', 'futbol'],
    rutaOrigen: rutaAudio,
    nombreOriginal: 'intro-prueba.mp3'
  }, { accionDuplicado: 'duplicar' });
  if (!guardadoGeneral.ok) throw new Error(guardadoGeneral.mensaje || 'No se guardo recurso general.');

  const recursosGenerales = await listarRecursosBiblioteca();
  if (!recursosGenerales.find((item) => item.id === guardadoGeneral.recurso.id)) throw new Error('No aparece recurso general en indice.');

  const rutaImagen = await crearArchivoTemporal('logo-proyecto.png', Buffer.from('imagen de prueba biblioteca proyecto'));
  const proyecto = {
    id: 'proyecto-biblioteca-bloque-1',
    rutas: {
      raiz: path.join(obtenerRutaDatos(), 'proyectos', 'proyecto-biblioteca-bloque-1')
    }
  };
  const guardadoProyecto = await guardarRecursoProyecto(proyecto, {
    nombre: 'Logo temporal proyecto',
    tipo: 'imagen',
    categoria: 'logo',
    estilos: ['11-contra-11'],
    etiquetas: ['logo', 'temporal'],
    rutaOrigen: rutaImagen,
    nombreOriginal: 'logo-proyecto.png'
  }, { accionDuplicado: 'duplicar' });
  if (!guardadoProyecto.ok) throw new Error(guardadoProyecto.mensaje || 'No se guardo recurso proyecto.');

  const recursosProyecto = await listarRecursosProyecto(proyecto);
  if (!recursosProyecto.find((item) => item.id === guardadoProyecto.recurso.id)) throw new Error('No aparece recurso temporal en indice de proyecto.');

  console.log('OK biblioteca bloque 1:', {
    categorias: categorias.length,
    estilos: estilos.length,
    general: guardadoGeneral.recurso.id,
    proyecto: guardadoProyecto.recurso.id
  });
}

verificar().catch((error) => {
  console.error('ERROR biblioteca bloque 1:', error.message);
  process.exit(1);
});
