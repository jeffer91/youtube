import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { crearDiagnosticoAutomatico } from '../diagnostico/diagnostico-automatico.service.js';
import { verificarIntegracionFinal } from '../diagnostico/verificar-integracion-final.service.js';
import { verificarProgresoReal } from '../diagnostico/verificar-progreso-real.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAIZ = path.resolve(__dirname, '..');
const LIMITE_LINEAS = 1000;

const ARCHIVOS_BASE = [
  'README.md',
  'package.json',
  'server.js',
  'main.js',
  'preload.js',
  'app/index.html',
  'app/app.js',
  'motor/motor.conexion.js',
  'motor/flujo-principal.js',
  'entrada/entrada.conexion.js',
  'entender/entender.conexion.js',
  'audio/audio.conexion.js',
  'transcripcion/transcripcion.conexion.js',
  'editar/editar.conexion.js',
  'salida/salida.conexion.js',
  'diagnostico/diagnostico-automatico.config.js',
  'docs/bloque-1-estado.md'
];

function rutaAbsoluta(rutaRelativa) {
  return path.join(RAIZ, rutaRelativa);
}

function contarLineas(rutaRelativa) {
  const contenido = fs.readFileSync(rutaAbsoluta(rutaRelativa), 'utf8');
  return contenido.split('\n').length;
}

function verificarArchivosBase() {
  const faltantes = ARCHIVOS_BASE.filter((ruta) => !fs.existsSync(rutaAbsoluta(ruta)));
  const archivosMuyGrandes = ARCHIVOS_BASE
    .filter((ruta) => fs.existsSync(rutaAbsoluta(ruta)))
    .map((ruta) => ({ ruta, lineas: contarLineas(ruta) }))
    .filter((item) => item.lineas > LIMITE_LINEAS);

  return {
    ok: faltantes.length === 0 && archivosMuyGrandes.length === 0,
    mensaje: faltantes.length === 0 && archivosMuyGrandes.length === 0
      ? 'Bloque 1 tiene archivos base y ningun archivo revisado supera 1000 lineas.'
      : 'Bloque 1 encontro problemas en archivos base.',
    faltantes,
    archivosMuyGrandes
  };
}

function resumir(nombre, resultado) {
  return {
    nombre,
    ok: Boolean(resultado?.ok),
    mensaje: resultado?.mensaje || '',
    errores: resultado?.errores || [],
    advertencias: resultado?.advertencias || []
  };
}

async function main() {
  const archivosBase = verificarArchivosBase();
  const diagnostico = await crearDiagnosticoAutomatico({ guardarReporte: true });
  const integracion = await verificarIntegracionFinal();
  const progreso = await verificarProgresoReal();

  const resultados = [
    { nombre: 'archivos-base', ...archivosBase },
    resumir('diagnostico', diagnostico),
    resumir('integracion-final', integracion),
    resumir('progreso-real', progreso)
  ];

  const ok = resultados.every((item) => item.ok);
  const salida = {
    ok,
    bloque: 1,
    mensaje: ok ? 'Bloque 1 verificado correctamente.' : 'Bloque 1 necesita revision.',
    resultados
  };

  console.log(JSON.stringify(salida, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error('[verificar-bloque-1] Error:', error);
  process.exit(1);
});
