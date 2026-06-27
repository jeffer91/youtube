import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), 'Falta ' + ruta);
  return fs.readFileSync(ruta, 'utf-8');
}

function contiene(ruta, claves) {
  const contenido = leer(ruta);
  for (const clave of claves) exigir(contenido.includes(clave), ruta + ' no contiene ' + clave);
}

function verificarServicioPremium() {
  contiene('editar/efectos/premium/efectos-premium.service.js', [
    'Bloque 13: Efectos visuales premium',
    'PAQUETES_PREMIUM',
    'premium-futbol',
    'premium-general',
    'listarPaquetesPremiumEfectos',
    'mejorarPlanEfectosPremium',
    'previsualizarEfectosPremium',
    'tieneRecetaFfmpeg',
    'calidadPremium',
    'usarEfectosPremium'
  ]);
  contiene('editar/efectos/premium/index.js', [
    'listarPaquetesPremiumEfectos',
    'mejorarPlanEfectosPremium',
    'previsualizarEfectosPremium'
  ]);
}

function verificarIntegracionMotor() {
  contiene('editar/efectos/efectos.conexion.js', [
    'Efectos visuales premium',
    'mejorarPlanEfectosPremium',
    'efectos-premium-v2',
    'Planificando efectos premium',
    'Efectos premium listos',
    'premium: plan?.premium'
  ]);
}

function verificarRutas() {
  contiene('server/rutas-modulares.service.js', [
    'listarPaquetesPremiumEfectos',
    'previsualizarEfectosPremium',
    'efectos-premium',
    '/api/autovideo/efectos/premium',
    '/api/autovideo/efectos/premium/previsualizar'
  ]);
}

function verificarDocumentacion() {
  contiene('docs/bloque-13-efectos-visuales-premium.md', [
    'Efectos visuales premium',
    'editar/efectos/premium/efectos-premium.service.js',
    'efectos-premium-v2',
    'GET  /api/autovideo/efectos/premium',
    'siguiente_bloque: SFX premium'
  ]);
}

async function verificarImportacionReal() {
  const premium = await import('../editar/efectos/premium/index.js');
  exigir(typeof premium.listarPaquetesPremiumEfectos === 'function', 'listarPaquetesPremiumEfectos no se exporta como función.');
  exigir(typeof premium.mejorarPlanEfectosPremium === 'function', 'mejorarPlanEfectosPremium no se exporta como función.');
  exigir(typeof premium.previsualizarEfectosPremium === 'function', 'previsualizarEfectosPremium no se exporta como función.');
  const preview = premium.previsualizarEfectosPremium({ perfil: 'general', duracionSegundos: 30, maxEfectos: 8 });
  exigir(preview?.premium?.aplicado === true, 'La previsualización premium no aplicó efectos.');
}

async function main() {
  verificarServicioPremium();
  verificarIntegracionMotor();
  verificarRutas();
  verificarDocumentacion();
  await verificarImportacionReal();
  console.log('OK Bloque 13: efectos visuales premium conectados.');
}

main().catch((error) => {
  console.error('ERROR Bloque 13:', error.message);
  process.exit(1);
});
