/*
  Verificacion Bloque Biblioteca 3:
  - Analisis automatico de archivo.
  - Deteccion de tipo, peso, resolucion, orientacion, formato y miniatura.
  - Guardado del analisis dentro del recurso.
  - Visualizacion de metadata en tarjetas y tabla.
*/

import fs from 'fs/promises';
import path from 'path';
import { obtenerRutaDatos, asegurarCarpeta } from '../comun/archivos.js';
import {
  analizarArchivoBiblioteca,
  guardarRecursoBiblioteca,
  listarRecursosBiblioteca
} from '../biblioteca/biblioteca.conexion.js';
import { renderRecursosBiblioteca } from '../app/biblioteca-ui.js';

const PNG_1X1_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

async function crearImagenPrueba() {
  const carpeta = path.join(obtenerRutaDatos(), 'temporales', 'biblioteca-bloque-3');
  asegurarCarpeta(carpeta);
  const ruta = path.join(carpeta, 'logo-bloque-3.png');
  await fs.writeFile(ruta, Buffer.from(PNG_1X1_BASE64, 'base64'));
  return ruta;
}

async function main() {
  const rutaImagen = await crearImagenPrueba();
  const analisis = await analizarArchivoBiblioteca({ rutaArchivo: rutaImagen, tipo: 'imagen', recurso: { id: 'test-biblioteca-bloque-3' } });

  if (!analisis.ok) throw new Error(`Analisis fallo: ${(analisis.errores || []).join(' | ')}`);
  if (analisis.tipo !== 'imagen') throw new Error('No detecto tipo imagen.');
  if (analisis.ancho !== 1 || analisis.alto !== 1) throw new Error(`Resolucion incorrecta: ${analisis.resolucion}`);
  if (analisis.orientacion !== 'cuadrada') throw new Error(`Orientacion incorrecta: ${analisis.orientacion}`);
  if (!analisis.miniatura?.rutaRelativa) throw new Error('No registro miniatura para imagen.');

  const guardado = await guardarRecursoBiblioteca({
    nombre: 'Logo bloque 3 analizado',
    tipo: 'imagen',
    categoria: 'logo',
    estilos: ['11-contra-11'],
    etiquetas: ['logo', 'analisis', 'bloque-3'],
    rutaOrigen: rutaImagen,
    nombreOriginal: 'logo-bloque-3.png'
  }, { accionDuplicado: 'duplicar' });

  if (!guardado.ok) throw new Error(guardado.mensaje || 'No se guardo recurso analizado.');
  if (guardado.recurso.estadoTecnico !== 'listo') throw new Error(`Estado tecnico incorrecto: ${guardado.recurso.estadoTecnico}`);
  if (guardado.recurso.ancho !== 1 || guardado.recurso.alto !== 1) throw new Error('El recurso guardado no conserva resolucion.');
  if (!guardado.recurso.analisisArchivo?.miniatura) throw new Error('El recurso guardado no conserva miniatura.');

  const recursos = await listarRecursosBiblioteca();
  const encontrado = recursos.find((item) => item.id === guardado.recurso.id);
  if (!encontrado) throw new Error('El recurso analizado no aparece en la biblioteca.');

  const tarjetas = renderRecursosBiblioteca([encontrado]);
  const tabla = renderRecursosBiblioteca([encontrado], 'table');
  if (!tarjetas.includes('1x1') || !tarjetas.includes('Resolución')) throw new Error('La tarjeta no muestra metadata analizada.');
  if (!tabla.includes('1x1') || !tabla.includes('Audio')) throw new Error('La tabla no muestra metadata analizada.');

  console.log('OK biblioteca bloque 3:', {
    tipo: guardado.recurso.tipo,
    resolucion: guardado.recurso.resolucion,
    formato: guardado.recurso.formato,
    estadoTecnico: guardado.recurso.estadoTecnico
  });
}

main().catch((error) => {
  console.error('ERROR biblioteca bloque 3:', error.message);
  process.exit(1);
});
