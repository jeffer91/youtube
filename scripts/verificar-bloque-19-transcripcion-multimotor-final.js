import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivosCriticos = [
  'transcripcion/modelos/transcripcion-normalizada.modelo.js',
  'transcripcion/motores/motores-transcripcion.config.js',
  'transcripcion/servicios/preparar-audio-motores.service.js',
  'transcripcion/motores/faster-whisper/faster-whisper.service.js',
  'transcripcion/motores/faster-whisper/faster_whisper_runner.py',
  'transcripcion/motores/whisper-cpp/whisper-cpp.service.js',
  'transcripcion/motores/vosk/vosk.service.js',
  'transcripcion/motores/vosk/vosk_runner.py',
  'transcripcion/motores/gestor-motores-transcripcion.service.js',
  'transcripcion/motores/diagnostico-motores-transcripcion.service.js',
  'transcripcion/motores/instalacion-guiada-motores.service.js',
  'transcripcion/motores/seleccionar-transcripcion-principal.service.js',
  'transcripcion/servicios/guardar-resultados-motores.service.js',
  'transcripcion/servicios/cargar-resultados-motores.service.js',
  'entender/entender.conexion.js',
  'entender/etapas/entendimiento-etapa.service.js',
  'server/rutas-modulares.service.js',
  'app/pantallas/entendimiento.view.js',
  'app/etapas-ui/entendimiento-ui.js',
  'app/entendimiento.css',
  'scripts/probar-flujo-transcripcion-multimotor-real.js'
];

const verificadoresBloques = Array.from({ length: 12 }, (_, index) => {
  const bloque = String(index + 1).padStart(2, '0');
  return `scripts/verificar-bloque-19-transcripcion-multimotor-${bloque}.js`;
});

const docsBloques = Array.from({ length: 12 }, (_, index) => {
  const bloque = String(index + 1).padStart(2, '0');
  return `docs/bloque-19-transcripcion-multimotor-${bloque}.md`;
});

function ruta(relativa) {
  return path.join(raiz, relativa);
}

function existe(relativa) {
  return fs.existsSync(ruta(relativa));
}

function leer(relativa) {
  return fs.readFileSync(ruta(relativa), 'utf-8');
}

function validarArchivo(relativa, validaciones = []) {
  if (!existe(relativa)) return [`Falta archivo: ${relativa}`];
  const contenido = leer(relativa);
  return validaciones
    .filter((validacion) => !contenido.includes(validacion.texto))
    .map((validacion) => `${relativa}: falta ${validacion.nombre}`);
}

const errores = [];

for (const archivo of [...archivosCriticos, ...verificadoresBloques, ...docsBloques]) {
  if (!existe(archivo)) errores.push(`Falta archivo: ${archivo}`);
}

errores.push(...validarArchivo('transcripcion/motores/gestor-motores-transcripcion.service.js', [
  { nombre: 'procesarTranscripcionMultimotor', texto: 'procesarTranscripcionMultimotor' },
  { nombre: 'faster-whisper', texto: 'transcribirConFasterWhisper' },
  { nombre: 'whisper.cpp', texto: 'transcribirConWhisperCpp' },
  { nombre: 'Vosk', texto: 'transcribirConVosk' },
  { nombre: 'guardado por lote', texto: 'guardarLoteResultadosTranscripcion' }
]));

errores.push(...validarArchivo('entender/entender.conexion.js', [
  { nombre: 'gestor multimotor conectado', texto: 'procesarTranscripcionMultimotor' },
  { nombre: 'transcripcionPrincipal', texto: 'transcripcionPrincipal' },
  { nombre: 'transcripcionesPorMotor', texto: 'transcripcionesPorMotor' },
  { nombre: 'resumenTranscripcion', texto: 'resumenTranscripcion' }
]));

errores.push(...validarArchivo('server/rutas-modulares.service.js', [
  { nombre: 'endpoint diagnóstico', texto: '/api/autovideo/transcripcion/motores/diagnostico' },
  { nombre: 'endpoint instalación', texto: '/api/autovideo/transcripcion/motores/instalacion' },
  { nombre: 'endpoint selección principal', texto: '/api/proyectos/:proyectoId/transcripciones/:motor/usar' }
]));

errores.push(...validarArchivo('app/etapas-ui/entendimiento-ui.js', [
  { nombre: 'tabs por motor', texto: 'renderTabsTranscripcion' },
  { nombre: 'diagnóstico motores', texto: 'diagnosticarMotores' },
  { nombre: 'guía instalación', texto: 'mostrarGuiaInstalacionMotores' },
  { nombre: 'usar como principal', texto: 'usarTranscripcionActivaComoPrincipal' },
  { nombre: 'endpoint selección principal UI', texto: '/transcripciones/' }
]));

errores.push(...validarArchivo('scripts/probar-flujo-transcripcion-multimotor-real.js', [
  { nombre: 'diagnóstico real', texto: '/api/autovideo/transcripcion/motores/diagnostico' },
  { nombre: 'procesar entendimiento', texto: '/entendimiento/procesar' },
  { nombre: 'selección principal', texto: '/transcripciones/' },
  { nombre: 'validación de archivos', texto: 'transcripcion-principal.json' },
  { nombre: 'reporte final', texto: 'prueba-completa-bloque-19-12.json' }
]));

if (errores.length) {
  console.error('Revisión final con errores:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Revisión final OK: integración multimotor de transcripción lista para prueba real.');
console.log('Siguiente paso: ejecutar la app y probar con un proyectoId real.');
