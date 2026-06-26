export const ENTREGA_CONFIG = Object.freeze({
  version: '1.1.0',
  archivosObligatorios: [
    'package.json',
    'README.md',
    'main.js',
    'server.js',
    'preload.js',
    'app/index.html',
    'app/app.js',
    'app/styles.css',
    'motor/flujo-principal.js',
    'salida/salida.conexion.js',
    'salida/exportar-simple/exportar.service.js',
    'salida/antes-despues/antes-despues.conexion.js',
    'scripts/verificar-ui-conexiones.js',
    'scripts/verificar-bloque-1.js',
    'scripts/verificar-bloque-2.js',
    'scripts/verificar-bloque-3.js',
    'scripts/verificar-bloque-4.js',
    'abrir_app.bat',
    'actualizar_y_abrir.bat',
    'verificar_app.bat',
    'crear_instalador_windows.bat'
  ],
  comandosEsperados: [
    'start',
    'check:ui',
    'check:funcional',
    'check:bloque1',
    'check:bloque2',
    'check:bloque3',
    'check:bloque4',
    'check:todo',
    'dist:win'
  ],
  limiteLineas: 1000
});

export default ENTREGA_CONFIG;
