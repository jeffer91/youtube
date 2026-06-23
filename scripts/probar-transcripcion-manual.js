import { segmentarTextoManual } from '../transcripcion/servicios/segmentar-texto-manual.js';
import { crearTranscripcionNormalizada } from '../transcripcion/servicios/normalizar-segmentos.js';

const texto = `
Este es un ejemplo de transcripción manual para AutoVideoJeff.
Primero se limpia el texto y luego se divide en segmentos.
Después esos segmentos pueden usarse para subtítulos y textos flotantes.
Lo importante es que el video no se detenga si todavía no existe un motor automático.
`;

const segmentado = segmentarTextoManual({ texto, duracionSegundos: 20, opciones: { maxTextosFlotantes: 4 } });
const normalizada = crearTranscripcionNormalizada({ textoCompleto: segmentado.textoCompleto, segmentos: segmentado.segmentos, idioma: 'es', fuente: 'script-prueba', duracionSegundos: 20 });

console.log('\nAutoVideoJeff - Prueba de transcripción manual\n');
console.log(`Texto completo: ${normalizada.textoCompleto.length} caracteres`);
console.log(`Segmentos generados: ${normalizada.segmentos.length}`);

normalizada.segmentos.forEach((segmento) => {
  console.log(`${segmento.id}. [${segmento.inicio}s - ${segmento.fin}s] ${segmento.texto}`);
});

if (normalizada.segmentos.length === 0) process.exitCode = 1;
