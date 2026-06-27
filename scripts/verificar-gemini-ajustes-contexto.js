import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const archivos = [
    'app/gemini-config-storage.js',
    'app/ajustes-gemini-ui.js',
    'app/pantallas/ajustes.view.js',
    'gemini/contexto-editorial-gemini.service.js',
    'gemini/cliente-gemini.service.js',
    'server/rutas-modulares.service.js'
  ];
  const faltantes = archivos.filter((ruta) => !fs.existsSync(ruta));
  exigir(faltantes.length === 0, `Faltan archivos de Gemini ajustes/contexto: ${faltantes.join(', ')}`);

  const storage = leer('app/gemini-config-storage.js');
  exigir(storage.includes('localStorage'), 'La configuración Gemini no se guarda localmente.');
  exigir(storage.includes('geminiCredencial'), 'La configuración no contempla la clave API.');

  const ajustes = leer('app/pantallas/ajustes.view.js');
  exigir(ajustes.includes('ajustesGeminiCredencial'), 'Ajustes no muestra campo de clave API Gemini.');
  exigir(ajustes.includes('ajustesTestGemini'), 'Ajustes no tiene botón de prueba Gemini.');

  const ui = leer('app/ajustes-gemini-ui.js');
  exigir(ui.includes('/api/autovideo/gemini/probar'), 'La UI no prueba conexión contra el servidor.');
  exigir(ui.includes('guardarConfigGeminiLocal'), 'La UI no guarda configuración local.');

  const contexto = leer('gemini/contexto-editorial-gemini.service.js');
  exigir(contexto.includes('Eres un editor profesional de video'), 'Gemini no recibe contexto editorial profesional.');
  exigir(contexto.includes('Transcripción disponible'), 'Gemini no recibe contexto de transcripción.');
  exigir(contexto.includes('Fotogramas analizados'), 'Gemini no recibe contexto de fotogramas.');
  exigir(contexto.includes('Efectos permitidos'), 'Gemini no recibe catálogo de efectos permitidos.');

  const cliente = leer('gemini/cliente-gemini.service.js');
  exigir(cliente.includes('construirContextoEditorialGemini'), 'El cliente Gemini no integra contexto editorial.');
  exigir(cliente.includes('contextoEditorial: true'), 'La respuesta Gemini no reporta contexto editorial.');

  const server = leer('server/rutas-modulares.service.js');
  exigir(server.includes('/api/autovideo/gemini/probar'), 'El servidor no expone prueba de Gemini.');
  exigir(server.includes('ejecutarTareaGeminiReal'), 'El servidor no ejecuta tarea real de Gemini.');

  console.log('OK Gemini ajustes/contexto: clave local, prueba, ruta API y contexto editorial conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR Gemini ajustes/contexto:', error.message);
  process.exit(1);
}
