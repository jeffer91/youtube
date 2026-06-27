import fs from 'fs';
import { execFileSync } from 'child_process';

const CHECKS = [
  'scripts/verificar-estilo-principal-ui.js',
  'scripts/verificar-flujo-produccion-sin-comparacion.js',
  'scripts/verificar-revision-final-errores.js',
  'scripts/verificar-audio-sincronizacion-segura.js',
  'scripts/verificar-produccion-timeline.js',
  'scripts/verificar-cierre-estructural-autovideo.js',
  'scripts/verificar-animaciones-renderizadas.js',
  'scripts/verificar-efectos-autovideo.js',
  'scripts/verificar-gemini-ajustes-contexto.js',
  'scripts/verificar-transcripcion-titulos-textos.js'
];

function ejecutarCheck(ruta) {
  if (!fs.existsSync(ruta)) return { ruta, ok: false, mensaje: 'No existe el script.' };
  try {
    const salida = execFileSync(process.execPath, [ruta], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ruta, ok: true, mensaje: salida.trim().split('\n').slice(-1)[0] || 'OK' };
  } catch (error) {
    const detalle = String(error.stdout || error.stderr || error.message || '').trim();
    return { ruta, ok: false, mensaje: detalle.split('\n').slice(-4).join('\n') };
  }
}

function verificarArchivosCriticos() {
  const archivos = [
    'app/app.js',
    'app/styles.css',
    'app/pantallas/produccion.view.js',
    'app/pantallas/resultado.view.js',
    'app/pantallas/biblioteca.view.js',
    'server/rutas-modulares.service.js',
    'motor/flujo-principal.js',
    'editar/animaciones/animaciones-render.service.js',
    'editar/edicion-dinamica/visual/visual.conexion.js',
    'editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js',
    'editar/tiktok-simple/tiktok.service.js',
    'salida/exportar-simple/exportar.service.js',
    'salida/reporte-final/reporte-final.service.js',
    'package.json'
  ];
  return archivos.map((ruta) => ({ ruta, ok: fs.existsSync(ruta) }));
}

function main() {
  const archivos = verificarArchivosCriticos();
  const faltantes = archivos.filter((item) => !item.ok);
  const checks = CHECKS.map(ejecutarCheck);
  const fallidos = checks.filter((item) => !item.ok);
  const ok = faltantes.length === 0 && fallidos.length === 0;
  const reporte = {
    ok,
    resumen: ok ? 'AutoVideoJeff pasó la verificación final de Jeff.' : 'AutoVideoJeff tiene puntos pendientes en la verificación final.',
    archivosCriticos: { total: archivos.length, faltantes },
    checks,
    generadoEn: new Date().toISOString()
  };
  console.log(JSON.stringify(reporte, null, 2));
  process.exit(ok ? 0 : 1);
}

main();
