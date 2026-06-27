import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function verificarDocumentoAuditoria() {
  const ruta = 'docs/bloque-01-auditoria-estado-actual.md';
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  const contenido = leer(ruta);
  exigir(contenido.includes('Subir video -> procesar todo -> exportar'), 'La auditoría no documenta el flujo actual monolítico.');
  exigir(contenido.includes('crear proyecto -> entender -> planificar -> producir maestro -> adaptar plataformas -> resultado'), 'La auditoría no documenta el flujo objetivo por etapas.');
  exigir(contenido.includes('No se deben borrar. Deben reordenarse'), 'La auditoría no indica que se conserva la base actual.');
}

function verificarMapaCambios() {
  const ruta = 'docs/bloque-01-mapa-cambios-archivos.md';
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  const contenido = leer(ruta);
  const requeridos = [
    'server.js',
    'motor/flujo-principal.js',
    'app/index.html',
    'app/app.js',
    'app/navegacion/menu.config.js',
    'app/pantallas/entendimiento.view.js',
    'app/pantallas/plan-edicion.view.js',
    'app/pantallas/adaptacion.view.js',
    'flujo-etapas/estado-proyecto.service.js',
    'etapas/01-entendimiento/procesar-entendimiento.service.js',
    'etapas/02-plan/procesar-plan-edicion.service.js',
    'etapas/03-produccion/procesar-produccion-maestro.service.js',
    'etapas/04-adaptacion/procesar-adaptacion-plataformas.service.js',
    'etapas/05-resultado/exportar-resultado-final.service.js',
    'editar/efectos-premium/efectos-premium.catalogo.js',
    'editar/sfx-premium/sfx-premium.catalogo.js'
  ];
  for (const item of requeridos) exigir(contenido.includes(item), `El mapa de cambios no menciona ${item}`);
  exigir(contenido.includes('Bloque 18: Diagnóstico final y verificadores'), 'El mapa no conserva la planificación de 18 bloques.');
}

function verificarBaseActualPresente() {
  const archivosBase = [
    'package.json',
    'main.js',
    'server.js',
    'motor/flujo-principal.js',
    'entrada/entrada.conexion.js',
    'entender/entender.conexion.js',
    'transcripcion/transcripcion.conexion.js',
    'editar/edicion-dinamica/edicion-dinamica.conexion.js',
    'produccion/produccion.conexion.js',
    'exportacion/exportacion.conexion.js',
    'app/index.html',
    'app/navegacion/menu.config.js'
  ];
  const faltantes = archivosBase.filter((ruta) => !fs.existsSync(ruta));
  exigir(faltantes.length === 0, `Faltan archivos base actuales: ${faltantes.join(', ')}`);
}

function main() {
  verificarDocumentoAuditoria();
  verificarMapaCambios();
  verificarBaseActualPresente();
  console.log('OK Bloque 1: auditoría, mapa de cambios y base actual documentados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR Bloque 1:', error.message);
  process.exit(1);
}
