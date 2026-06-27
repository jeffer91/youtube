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

function verificarServicioSfx() {
  contiene('editar/edicion-dinamica/sonidos/premium/sfx-premium.service.js', [
    'Bloque 14: SFX premium',
    'PAQUETES_SFX_PREMIUM',
    'sfx-premium-futbol',
    'sfx-premium-general',
    'listarPaquetesSfxPremium',
    'mejorarEventosSonidoPremium',
    'previsualizarSfxPremium',
    'usarSfxPremium',
    'calidadSfx',
    'usaSoloSonidosBase'
  ]);
  contiene('editar/edicion-dinamica/sonidos/premium/index.js', [
    'listarPaquetesSfxPremium',
    'mejorarEventosSonidoPremium',
    'previsualizarSfxPremium'
  ]);
}

function verificarIntegracionSonidos() {
  contiene('editar/edicion-dinamica/sonidos/sonidos.conexion.js', [
    'mejorarEventosSonidoPremium',
    'Preparando SFX premium',
    'SFX premium aplicado',
    'sfx-premium.json',
    'eventos-sonido-base.json',
    'Audio final con SFX premium',
    'sfxPremium'
  ]);
}

function verificarRutas() {
  contiene('server/rutas-modulares.service.js', [
    'listarPaquetesSfxPremium',
    'previsualizarSfxPremium',
    'sfx-premium',
    '/api/autovideo/sfx/premium',
    '/api/autovideo/sfx/premium/previsualizar'
  ]);
}

function verificarDocumentacion() {
  contiene('docs/bloque-14-sfx-premium.md', [
    'SFX premium',
    'editar/edicion-dinamica/sonidos/premium/sfx-premium.service.js',
    'GET  /api/autovideo/sfx/premium',
    'siguiente_bloque: Adaptación a plataformas backend'
  ]);
}

async function verificarImportacionReal() {
  const sfx = await import('../editar/edicion-dinamica/sonidos/premium/index.js');
  exigir(typeof sfx.listarPaquetesSfxPremium === 'function', 'listarPaquetesSfxPremium no se exporta como función.');
  exigir(typeof sfx.mejorarEventosSonidoPremium === 'function', 'mejorarEventosSonidoPremium no se exporta como función.');
  exigir(typeof sfx.previsualizarSfxPremium === 'function', 'previsualizarSfxPremium no se exporta como función.');
  const preview = sfx.previsualizarSfxPremium({ perfil: 'general', cantidadMaximaEventos: 8 });
  exigir(preview?.premium?.aplicado === true, 'La previsualización SFX premium no aplicó la capa premium.');
  exigir(Array.isArray(preview.eventos) && preview.eventos.length > 0, 'La previsualización SFX premium no generó eventos.');
}

async function main() {
  verificarServicioSfx();
  verificarIntegracionSonidos();
  verificarRutas();
  verificarDocumentacion();
  await verificarImportacionReal();
  console.log('OK Bloque 14: SFX premium conectado.');
}

main().catch((error) => {
  console.error('ERROR Bloque 14:', error.message);
  process.exit(1);
});
