import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const archivos = [
    'motor/flujo-principal.js',
    'motor/flujo-modular-autovideo.service.js',
    'salida/reporte-final/reporte-final.service.js',
    'salida/exportar-simple/exportar.service.js',
    'app/resultado-final-ui.js',
    'app/produccion-revision-ui.js',
    'app/navegacion/navegacion-bootstrap.js',
    'app/pantallas/resultado.view.js',
    'app/pantallas/diagnostico.view.js',
    'app/pantallas/biblioteca.view.js',
    'app/biblioteca-ui.js',
    'app/pantallas/perfiles.view.js'
  ];
  const faltantes = archivos.filter((ruta) => !fs.existsSync(ruta));
  exigir(faltantes.length === 0, `Faltan archivos críticos de la revisión final: ${faltantes.join(', ')}`);

  const flujo = leer('motor/flujo-principal.js');
  exigir(flujo.includes('await crearIntegracionModularAutoVideoJeff'), 'ERROR CRÍTICO: la integración modular debe ejecutarse con await.');
  exigir(flujo.includes('crearReporteFinalCompletoSeguro'), 'El flujo principal no consolida el reporte final completo.');
  exigir(flujo.includes('salida.reporteFinal'), 'El resultado final no recibe reporteFinal.');
  exigir(!flujo.includes('modular = crearIntegracionModularAutoVideoJeff'), 'Quedó una llamada modular sin await.');

  const reporte = leer('salida/reporte-final/reporte-final.service.js');
  exigir(reporte.includes('extraerEfectosUsados(edicion'), 'El reporte final no extrae efectos desde edición.');
  exigir(reporte.includes('modular?.produccion?.elementos'), 'El reporte final no revisa elementos de Producción.');
  exigir(reporte.includes('animacionesUsadas'), 'El reporte final no reporta animaciones.');
  exigir(reporte.includes('imagenesUsadasORevisables'), 'El reporte final no reporta imágenes.');
  exigir(reporte.includes('produccionConTimeline'), 'El reporte final no confirma timeline de Producción.');

  const salida = leer('salida/exportar-simple/exportar.service.js');
  exigir(salida.includes('crearReporteFinalEdicion'), 'La salida inicial no genera reporte final base.');
  exigir(salida.includes('reporte-final-edicion.json'), 'La salida no registra el archivo reporte-final-edicion.json.');

  const resultadoUi = leer('app/resultado-final-ui.js');
  exigir(resultadoUi.includes('resultadoFinalVideo'), 'La pantalla Resultado no conecta el video final.');
  exigir(resultadoUi.includes('efectosUsados'), 'La pantalla Resultado no muestra efectos usados.');
  exigir(resultadoUi.includes('animacionesUsadas'), 'La pantalla Resultado no muestra animaciones.');

  const produccionUi = leer('app/produccion-revision-ui.js');
  exigir(produccionUi.includes('guardarUltimaProduccion'), 'Producción no guarda el último resultado para Resultado.');
  exigir(produccionUi.includes('renderTimeline'), 'Producción no renderiza timeline.');
  exigir(produccionUi.includes('aplicarTiempoProduccionUI'), 'Producción no permite corregir tiempos.');

  const biblioteca = `${leer('app/pantallas/biblioteca.view.js')}\n${leer('app/biblioteca-ui.js')}`;
  exigir(biblioteca.includes('libraryDropZone'), 'Biblioteca no tiene arrastre.');
  exigir(biblioteca.includes('tipoEdicion'), 'Biblioteca no guarda tipo de edición.');
  exigir(biblioteca.includes('tono'), 'Biblioteca no guarda tono.');

  const perfiles = leer('app/pantallas/perfiles.view.js');
  exigir(perfiles.includes('Ritmo') && perfiles.includes('Textos') && perfiles.includes('Visual') && perfiles.includes('Uso ideal'), 'Perfiles no explican el estilo de edición completo.');

  const diagnostico = leer('app/pantallas/diagnostico.view.js');
  exigir(diagnostico.includes('data-diagnostic-action="strong"') && diagnostico.includes('data-diagnostic-action="audit"'), 'Diagnóstico sigue bloqueado o sin botones funcionales.');

  const bootstrap = leer('app/navegacion/navegacion-bootstrap.js');
  exigir(bootstrap.includes('inicializarResultadoFinalUI'), 'La navegación no inicializa Resultado final.');

  console.log('OK revisión final: await modular, reporte completo, resultado, producción, biblioteca, perfiles y diagnóstico verificados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR revisión final:', error.message);
  process.exit(1);
}
