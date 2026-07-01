/*
  Verificador: Biblioteca - imágenes inteligentes
  Uso:
    node scripts/verificar-biblioteca-imagenes-inteligentes.js

  Revisa que estén conectados:
  - paginación de una imagen sugerida por vez;
  - frase corta de búsqueda y descripción corta;
  - pegar imagen con Ctrl+V;
  - arrastrar y soltar imagen;
  - examinar imagen;
  - guardado temporal real en Electron;
  - puente seguro preload -> main;
  - avance automático después de guardar.
*/

import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();

const ARCHIVOS = Object.freeze({
  vista: 'app/pantallas/biblioteca-proyecto.view.js',
  ui: 'app/biblioteca-imagenes-sugeridas-ui.js',
  main: 'main.js',
  preload: 'preload.js'
});

function leerArchivo(ruta) {
  const absoluta = path.join(RAIZ, ruta);
  if (!fs.existsSync(absoluta)) {
    throw new Error(`No existe el archivo requerido: ${ruta}`);
  }
  return fs.readFileSync(absoluta, 'utf-8');
}

function contiene(texto, patron) {
  if (patron instanceof RegExp) return patron.test(texto);
  return texto.includes(patron);
}

function revisar(nombre, texto, reglas) {
  const resultados = reglas.map((regla) => ({
    nombre: regla.nombre,
    ok: contiene(texto, regla.patron),
    mensaje: regla.mensaje
  }));

  const errores = resultados.filter((item) => !item.ok);
  return { nombre, resultados, errores };
}

function imprimirBloque(resultado) {
  console.log(`\n${resultado.errores.length ? '❌' : '✅'} ${resultado.nombre}`);
  resultado.resultados.forEach((item) => {
    console.log(`  ${item.ok ? '✅' : '❌'} ${item.nombre}${item.ok ? '' : ` -> ${item.mensaje}`}`);
  });
}

const vista = leerArchivo(ARCHIVOS.vista);
const ui = leerArchivo(ARCHIVOS.ui);
const main = leerArchivo(ARCHIVOS.main);
const preload = leerArchivo(ARCHIVOS.preload);

const verificaciones = [
  revisar('Vista Biblioteca Proyecto', vista, [
    {
      nombre: 'Tiene contenedor de imágenes sugeridas',
      patron: 'data-project-library-image-requests',
      mensaje: 'Falta la sección visual de imágenes sugeridas.'
    },
    {
      nombre: 'Tiene contador 1 de X',
      patron: 'projectLibrarySuggestedImagesCounter',
      mensaje: 'Falta contador de paginación.'
    },
    {
      nombre: 'Tiene botón Anterior',
      patron: 'projectLibrarySuggestedPrevBtn',
      mensaje: 'Falta botón Anterior.'
    },
    {
      nombre: 'Tiene botón Siguiente',
      patron: 'projectLibrarySuggestedNextBtn',
      mensaje: 'Falta botón Siguiente.'
    },
    {
      nombre: 'Tiene frase corta Buscar',
      patron: 'project-library-image-search-box',
      mensaje: 'Falta bloque de búsqueda corta.'
    },
    {
      nombre: 'Tiene descripción corta',
      patron: 'project-library-image-description',
      mensaje: 'Falta bloque de descripción corta.'
    },
    {
      nombre: 'Tiene zona de pegar/arrastrar/examinar',
      patron: 'project-library-smart-upload',
      mensaje: 'Falta zona inteligente de carga.'
    },
    {
      nombre: 'Tiene espacio para 3 imágenes de internet',
      patron: 'projectLibraryInternetImageOptions',
      mensaje: 'Falta el espacio visual para 3 imágenes.'
    }
  ]),

  revisar('UI de imágenes sugeridas', ui, [
    {
      nombre: 'Renderiza una sola sugerencia actual',
      patron: 'renderSugerenciaActual',
      mensaje: 'Falta render de una sugerencia por vez.'
    },
    {
      nombre: 'Controla paginación anterior/siguiente',
      patron: 'avanzarSugerencia',
      mensaje: 'Falta función de paginación.'
    },
    {
      nombre: 'Guarda el índice actual',
      patron: 'STORAGE_INDICE_SUGERENCIA',
      mensaje: 'Falta persistencia de la página actual.'
    },
    {
      nombre: 'Valida imagen antes de procesar',
      patron: 'Solo se aceptan imágenes en esta sección',
      mensaje: 'Falta validación de archivos de imagen.'
    },
    {
      nombre: 'Convierte imagen pegada/arrastrada a temporal',
      patron: 'convertirFileAArchivoTemporal',
      mensaje: 'Falta conversión a archivo temporal real.'
    },
    {
      nombre: 'Procesa archivo inteligente',
      patron: 'procesarArchivoInteligente',
      mensaje: 'Falta función común para pegar/arrastrar/examinar.'
    },
    {
      nombre: 'Escucha Ctrl+V',
      patron: "document.addEventListener('paste'",
      mensaje: 'Falta escucha de pegado de imagen.'
    },
    {
      nombre: 'Escucha dragover',
      patron: "root.addEventListener('dragover'",
      mensaje: 'Falta dragover en la zona inteligente.'
    },
    {
      nombre: 'Escucha drop',
      patron: "root.addEventListener('drop'",
      mensaje: 'Falta drop en la zona inteligente.'
    },
    {
      nombre: 'Activa Guardar temporal después de preparar imagen',
      patron: 'activarPanelGuardarTemporal',
      mensaje: 'Falta activar el panel de guardado.'
    },
    {
      nombre: 'Avanza después de guardar recurso',
      patron: 'setTimeout(() => avanzarSugerencia(1)',
      mensaje: 'Falta avance automático después de guardar.'
    }
  ]),

  revisar('Electron main.js', main, [
    {
      nombre: 'Importa crypto para nombre temporal seguro',
      patron: "import crypto from 'crypto'",
      mensaje: 'Falta crypto para nombres temporales únicos.'
    },
    {
      nombre: 'Tiene función de guardado temporal',
      patron: 'guardarArchivoTemporalBiblioteca',
      mensaje: 'Falta función para guardar imagen pegada/arrastrada.'
    },
    {
      nombre: 'Guarda en carpeta biblioteca-inteligente',
      patron: 'biblioteca-inteligente',
      mensaje: 'Falta carpeta temporal específica.'
    },
    {
      nombre: 'Registra canal IPC',
      patron: "ipcMain.handle('biblioteca:guardarArchivoTemporal'",
      mensaje: 'Falta canal IPC para guardar archivo temporal.'
    }
  ]),

  revisar('Preload seguro', preload, [
    {
      nombre: 'Expone guardarArchivoTemporal',
      patron: 'guardarArchivoTemporal',
      mensaje: 'Falta exponer función al frontend.'
    },
    {
      nombre: 'Usa canal IPC correcto',
      patron: "biblioteca:guardarArchivoTemporal",
      mensaje: 'Falta canal IPC correcto en preload.'
    }
  ])
];

let totalErrores = 0;
console.log('\n🔎 Verificación Biblioteca - imágenes inteligentes');
console.log('------------------------------------------------');
verificaciones.forEach((resultado) => {
  imprimirBloque(resultado);
  totalErrores += resultado.errores.length;
});

console.log('\n------------------------------------------------');
if (totalErrores > 0) {
  console.error(`❌ Verificación fallida. Errores encontrados: ${totalErrores}`);
  process.exit(1);
}

console.log('✅ Verificación aprobada. La estructura de imágenes inteligentes está conectada.');
console.log('Siguiente prueba manual: abrir Electron, cargar Biblioteca, pegar una imagen con Ctrl+V y guardar temporal.');
