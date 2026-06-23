import { crearTranscripcionNormalizada } from '../transcripcion/servicios/normalizar-segmentos.js';
import { generarMomentosFallbackLocal } from '../transcripcion/gemini/gemini-fallback-local.js';
import { generarContenidoSrt } from '../transcripcion/servicios/generar-srt-subtitulos.js';

const transcripcion = crearTranscripcionNormalizada({ idioma: 'es', fuente: 'script-prueba', segmentos: [{ inicio: 0, fin: 3, texto: 'Este punto es muy importante para entender el video.' }, { inicio: 4, fin: 7, texto: 'El error más común es no revisar el audio antes de exportar.' }, { inicio: 8, fin: 11, texto: 'La solución es limpiar el audio y crear subtítulos claros.' }, { inicio: 12, fin: 15, texto: 'Finalmente se exporta el video con textos flotantes.' }] });

const fallback = generarMomentosFallbackLocal({ transcripcion, opciones: { maxTextosFlotantes: 4 }, motivo: 'Prueba local' });
const srt = generarContenidoSrt(transcripcion.segmentos);

console.log('\nAutoVideoJeff - Prueba fallback Gemini local\n');
console.log(`Momentos generados: ${fallback.momentosImportantes.length}`);
console.log('\nMomentos:');
fallback.momentosImportantes.forEach((momento) => console.log(`${momento.id}. [${momento.inicio}s - ${momento.fin}s] ${momento.texto}`));
console.log('\nSRT generado:');
console.log(srt);

if (!fallback.ok || fallback.momentosImportantes.length === 0) process.exitCode = 1;
