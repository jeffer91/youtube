/* Verificacion Bloque 2: textos, graficos y tablas. */

import {
  detectarTextosRelevantes,
  generarTextosPantalla,
  generarGraficosVisuales,
  generarTablaVisual,
  validarTextosPantalla
} from '../textos/textos.conexion.js';

function main() {
  const segmentos = [
    { inicio: 0, fin: 3, texto: 'Esta parte es clave para explicar el tema central del video.' },
    { inicio: 3, fin: 6, texto: 'El resultado debe verse claro y ordenado para publicar.' }
  ];

  const detectados = detectarTextosRelevantes({ segmentos, perfil: 'creciaula' });
  const capas = generarTextosPantalla({ textos: detectados.textos, perfil: 'creciaula', plataforma: 'youtube' });
  const validacion = validarTextosPantalla(capas);
  const graficos = generarGraficosVisuales({ datos: [{ etiqueta: 'A', valor: 10 }, { etiqueta: 'B', valor: 20 }] });
  const tabla = generarTablaVisual({ columnas: ['tema', 'valor'], filas: [{ tema: 'Prueba', valor: 'OK' }] });

  if (!detectados.total) throw new Error('No se detectaron textos relevantes.');
  if (!validacion.ok) throw new Error(validacion.errores.join(' | '));
  if (!graficos.total) throw new Error('No se genero grafico visual.');
  if (!tabla.columnas.length || !tabla.filas.length) throw new Error('No se genero tabla visual.');

  console.log('OK textos:', capas.length, 'capas');
}

try {
  main();
} catch (error) {
  console.error('ERROR textos:', error.message);
  process.exit(1);
}
