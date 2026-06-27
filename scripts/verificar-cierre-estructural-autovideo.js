import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const archivos = [
    'app/pantallas/biblioteca.view.js',
    'app/biblioteca-ui.js',
    'app/pantallas/perfiles.view.js',
    'app/pantallas/diagnostico.view.js',
    'app/pantallas/resultado.view.js',
    'app/resultado-final-ui.js',
    'app/final-correcciones.css',
    'salida/reporte-final/reporte-final.service.js',
    'salida/exportar-simple/exportar.service.js',
    'biblioteca/recurso.modelo.js',
    'app/navegacion/navegacion-bootstrap.js'
  ];
  const faltantes = archivos.filter((ruta) => !fs.existsSync(ruta));
  exigir(faltantes.length === 0, `Faltan archivos del cierre estructural: ${faltantes.join(', ')}`);

  const bibliotecaView = leer('app/pantallas/biblioteca.view.js');
  exigir(bibliotecaView.includes('libraryDropZone'), 'Biblioteca no tiene zona de arrastre.');
  exigir(bibliotecaView.includes('libraryNewEditType'), 'Biblioteca no pregunta tipo de edición.');
  exigir(bibliotecaView.includes('libraryNewTone'), 'Biblioteca no pregunta tono.');

  const bibliotecaUi = leer('app/biblioteca-ui.js');
  exigir(bibliotecaUi.includes('dragover'), 'Biblioteca no maneja arrastre.');
  exigir(bibliotecaUi.includes('tipoEdicion'), 'Biblioteca no guarda tipoEdicion.');
  exigir(bibliotecaUi.includes('momentoSugerido'), 'Biblioteca no guarda momento sugerido.');

  const perfiles = leer('app/pantallas/perfiles.view.js');
  exigir(perfiles.includes('Ritmo') && perfiles.includes('Textos') && perfiles.includes('Visual'), 'Perfiles no explican el estilo de edición.');

  const diagnostico = leer('app/pantallas/diagnostico.view.js');
  exigir(diagnostico.includes('data-diagnostic-action="strong"'), 'Diagnóstico fuerte no está disponible.');
  exigir(diagnostico.includes('data-diagnostic-action="audit"'), 'Auditoría integral no está disponible.');

  const reporte = leer('salida/reporte-final/reporte-final.service.js');
  exigir(reporte.includes('efectosUsados'), 'Reporte final no lista efectos usados.');
  exigir(reporte.includes('imagenesUsadasORevisables'), 'Reporte final no lista imágenes.');
  exigir(reporte.includes('animacionesUsadas'), 'Reporte final no lista animaciones.');

  const salida = leer('salida/exportar-simple/exportar.service.js');
  exigir(salida.includes('crearReporteFinalEdicion'), 'Salida final no crea reporte final.');
  exigir(salida.includes('reporte-final-edicion.json'), 'Salida final no registra reporte-final-edicion.json.');

  const resultado = leer('app/pantallas/resultado.view.js');
  exigir(resultado.includes('resultadoFinalContent'), 'Pantalla Resultado no tiene contenedor de reporte.');
  exigir(resultado.includes('resultadoFinalVideo'), 'Pantalla Resultado no tiene video final.');

  const bootstrap = leer('app/navegacion/navegacion-bootstrap.js');
  exigir(bootstrap.includes('inicializarResultadoFinalUI'), 'Navegación no inicializa resultado final.');

  console.log('OK cierre estructural: biblioteca, perfiles, diagnóstico, resultado y reporte final conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR cierre estructural:', error.message);
  process.exit(1);
}
