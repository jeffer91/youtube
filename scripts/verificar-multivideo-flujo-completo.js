import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAIZ = path.resolve(__dirname, '..');
const CARPETA_PROYECTOS = path.join(RAIZ, 'datos', 'proyectos');

const ESTADO = Object.freeze({ OK: 'OK', WARN: 'WARN', ERROR: 'ERROR' });

function existe(ruta) {
  try {
    return Boolean(ruta && fs.existsSync(ruta));
  } catch (_error) {
    return false;
  }
}

function esArchivo(ruta) {
  try {
    return Boolean(ruta && fs.existsSync(ruta) && fs.statSync(ruta).isFile());
  } catch (_error) {
    return false;
  }
}

function esCarpeta(ruta) {
  try {
    return Boolean(ruta && fs.existsSync(ruta) && fs.statSync(ruta).isDirectory());
  } catch (_error) {
    return false;
  }
}

function leerTextoRelativo(rutaRelativa) {
  const ruta = path.join(RAIZ, rutaRelativa);
  return fs.readFileSync(ruta, 'utf8');
}

function leerJson(ruta, respaldo = null) {
  try {
    if (!esArchivo(ruta)) return respaldo;
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch (error) {
    return { __errorLectura: error.message, __ruta: ruta };
  }
}

function extraerResultadoEtapa(wrapper = {}) {
  if (wrapper?.resultado?.resultado) return wrapper.resultado.resultado;
  if (wrapper?.datos?.resultado?.resultado) return wrapper.datos.resultado.resultado;
  if (wrapper?.resultado) return wrapper.resultado;
  return wrapper || {};
}

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function lista(valor) {
  return Array.isArray(valor) ? valor : [];
}

function agregar(reporte, estado, titulo, detalle = '', datos = {}) {
  reporte.items.push({ estado, titulo, detalle, datos });
  if (estado === ESTADO.ERROR) reporte.errores += 1;
  if (estado === ESTADO.WARN) reporte.advertencias += 1;
}

function imprimirItem(item) {
  const prefijo = item.estado === ESTADO.OK ? 'OK' : item.estado === ESTADO.WARN ? 'WARN' : 'ERROR';
  console.log(`${prefijo} ${item.titulo}${item.detalle ? ` - ${item.detalle}` : ''}`);
}

function verificarArchivoConTokens(reporte, rutaRelativa, tokens = []) {
  const ruta = path.join(RAIZ, rutaRelativa);
  if (!esArchivo(ruta)) {
    agregar(reporte, ESTADO.ERROR, `Falta archivo ${rutaRelativa}`);
    return;
  }
  const contenido = leerTextoRelativo(rutaRelativa);
  const faltantes = tokens.filter((token) => !contenido.includes(token));
  if (faltantes.length) {
    agregar(reporte, ESTADO.ERROR, `Archivo incompleto ${rutaRelativa}`, `Faltan tokens: ${faltantes.join(', ')}`);
    return;
  }
  agregar(reporte, ESTADO.OK, `Archivo verificado ${rutaRelativa}`, `${tokens.length} token(s) clave presentes.`);
}

function verificarEstructuraCodigo(reporte) {
  const chequeos = [
    {
      ruta: 'server/rutas-etapas.service.js',
      tokens: ['upload.array', 'totalValidos', 'modoVideosOriginales', 'idsVideosOriginales']
    },
    {
      ruta: 'entender/etapas/normalizar-videos-entendimiento.service.js',
      tokens: ['normalizarVideosEntendimiento', 'videosValidos', 'crearEntradaVideoEntendimiento']
    },
    {
      ruta: 'entender/etapas/linea-tiempo-multivideo.service.js',
      tokens: ['crearLineaTiempoMultivideo', 'duracionTotalSegundos', 'lineaTiempo', 'ffprobe']
    },
    {
      ruta: 'entender/etapas/entendimiento-multivideo.service.js',
      tokens: ['procesarEntendimientoMultivideo', 'resultadosPorVideo', 'inicioGlobal', 'segundoGlobal']
    },
    {
      ruta: 'entender/etapas/unir-entendimiento-multivideo.service.js',
      tokens: ['unirEntendimientoMultivideo', 'transcripcionGlobal', 'fotogramasGlobales', 'analisisVideoGlobal']
    },
    {
      ruta: 'app/etapas-ui/entendimiento-ui.js',
      tokens: ['obtenerTotalVideos', 'Global multivideo', 'fotogramasGlobales', 'lineaTiempoGlobal']
    },
    {
      ruta: 'etapas/02-plan/procesar-plan-edicion.service.js',
      tokens: ['subtitulo-global', 'bloque-video-global', 'usaTiemposGlobales', 'fase: \'bloque-6-plan-multivideo\'']
    },
    {
      ruta: 'etapas/03-produccion/unir-videos-maestro.service.js',
      tokens: ['unirVideosMaestroMultivideo', 'concat-demuxer-reencode', 'videoMaestro', 'videos-concat.txt']
    },
    {
      ruta: 'etapas/03-produccion/procesar-produccion-maestro.service.js',
      tokens: ['prepararVideoBaseProduccion', 'usaVideoMaestroUnido', 'bloque-7-produccion-multivideo', 'lineaTiempoGlobal']
    },
    {
      ruta: 'etapas/04-adaptacion/procesar-adaptacion-plataformas.service.js',
      tokens: ['bloque-8-adaptacion-multivideo', 'usaVideoMaestroMultivideo', 'videoMaestroUnido', 'enriquecerResultadoPlataformasMultivideo']
    },
    {
      ruta: 'etapas/05-resultado/procesar-resultado-final.service.js',
      tokens: ['bloque-9-resultado-final-multivideo', 'segmentosGlobales', 'usaVideoMaestroMultivideo', 'videoMaestroUnido']
    }
  ];

  chequeos.forEach((chequeo) => verificarArchivoConTokens(reporte, chequeo.ruta, chequeo.tokens));
}

function resolverProyectoAuditado() {
  const argProyecto = process.argv.slice(2).find((item) => !item.startsWith('--')) || process.env.PROYECTO_ID || '';
  if (argProyecto) {
    const rutaDirecta = path.isAbsolute(argProyecto) ? argProyecto : path.join(CARPETA_PROYECTOS, argProyecto);
    return esCarpeta(rutaDirecta) ? rutaDirecta : null;
  }

  if (!esCarpeta(CARPETA_PROYECTOS)) return null;
  const carpetas = fs.readdirSync(CARPETA_PROYECTOS)
    .map((nombre) => path.join(CARPETA_PROYECTOS, nombre))
    .filter(esCarpeta)
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return carpetas[0] || null;
}

function buscarJsonProyecto(carpetaProyecto, rutasRelativas = []) {
  for (const relativa of rutasRelativas) {
    const ruta = path.join(carpetaProyecto, relativa);
    if (esArchivo(ruta)) return { ruta, json: leerJson(ruta, {}) };
  }
  return { ruta: '', json: null };
}

function validarJsonLeido(reporte, nombre, archivo) {
  if (!archivo?.json) {
    agregar(reporte, ESTADO.WARN, `${nombre} no existe todavía`, 'Ejecuta la etapa correspondiente para completar la auditoría real.');
    return false;
  }
  if (archivo.json.__errorLectura) {
    agregar(reporte, ESTADO.ERROR, `${nombre} tiene JSON inválido`, archivo.json.__errorLectura);
    return false;
  }
  agregar(reporte, ESTADO.OK, `${nombre} encontrado`, path.relative(RAIZ, archivo.ruta));
  return true;
}

function verificarVideosOriginales(reporte, carpetaProyecto) {
  const archivo = buscarJsonProyecto(carpetaProyecto, ['videos-originales.json']);
  if (!validarJsonLeido(reporte, 'videos-originales.json', archivo)) return { totalValidos: 0, esMultivideo: false, videos: [] };

  const videos = lista(archivo.json.videos);
  const totalValidos = numero(archivo.json.totalValidos || videos.filter((video) => video.existe !== false).length, 0);
  const ids = videos.map((video) => video.videoId || video.id).filter(Boolean);
  const idsUnicos = new Set(ids);

  if (!videos.length) agregar(reporte, ESTADO.ERROR, 'No hay videos registrados en videos-originales.json');
  else agregar(reporte, ESTADO.OK, 'Videos registrados', `${videos.length} video(s), ${totalValidos} válido(s).`);

  if (ids.length !== idsUnicos.size) agregar(reporte, ESTADO.ERROR, 'Hay videoId duplicados en videos-originales.json');
  else agregar(reporte, ESTADO.OK, 'videoId únicos', `${idsUnicos.size} identificador(es).`);

  const faltanRutas = videos.filter((video) => !video.rutaProyecto && !video.rutaOriginal);
  if (faltanRutas.length) agregar(reporte, ESTADO.ERROR, 'Videos sin ruta de proyecto', `${faltanRutas.length} video(s).`);
  else agregar(reporte, ESTADO.OK, 'Rutas de videos completas');

  return { totalValidos, esMultivideo: totalValidos > 1 || Boolean(archivo.json.esMultivideo), videos };
}

function verificarLineaTiempo(reporte, carpetaProyecto, contexto) {
  const archivo = buscarJsonProyecto(carpetaProyecto, [
    'entendimiento/linea-tiempo-multivideo.json',
    '01-entendimiento/linea-tiempo-multivideo.json'
  ]);
  if (!validarJsonLeido(reporte, 'línea de tiempo multivideo', archivo)) return null;

  const linea = lista(archivo.json.lineaTiempo || archivo.json.resultado?.lineaTiempoGlobal?.lineaTiempo);
  const duracion = numero(archivo.json.resumen?.duracionTotalSegundos || archivo.json.resultado?.lineaTiempoGlobal?.resumen?.duracionTotalSegundos, 0);
  if (contexto.totalValidos && linea.length !== contexto.totalValidos) {
    agregar(reporte, ESTADO.WARN, 'Línea de tiempo no coincide con videos válidos', `${linea.length}/${contexto.totalValidos}.`);
  } else {
    agregar(reporte, ESTADO.OK, 'Línea de tiempo coincide con videos válidos', `${linea.length} item(s).`);
  }
  if (duracion > 0) agregar(reporte, ESTADO.OK, 'Duración total global calculada', `${duracion}s.`);
  else agregar(reporte, ESTADO.WARN, 'Duración total global no detectada', 'Puede faltar FFprobe o reprocesar Entendimiento.');
  return archivo.json;
}

function verificarEntendimientoGlobal(reporte, carpetaProyecto, contexto) {
  const resultadosPorVideo = buscarJsonProyecto(carpetaProyecto, ['entendimiento/resultados-por-video.json']);
  const global = buscarJsonProyecto(carpetaProyecto, ['entendimiento/entendimiento-global.json']);
  const etapa = buscarJsonProyecto(carpetaProyecto, ['01-entendimiento/reporte-entendimiento.json']);

  validarJsonLeido(reporte, 'resultados por video', resultadosPorVideo);
  validarJsonLeido(reporte, 'entendimiento global', global);
  validarJsonLeido(reporte, 'resultado etapa Entendimiento', etapa);

  if (resultadosPorVideo.json && !resultadosPorVideo.json.__errorLectura) {
    const resultados = lista(resultadosPorVideo.json.resultadosPorVideo);
    if (contexto.totalValidos && resultados.length < contexto.totalValidos) agregar(reporte, ESTADO.WARN, 'Entendimiento por video incompleto', `${resultados.length}/${contexto.totalValidos}.`);
    else agregar(reporte, ESTADO.OK, 'Entendimiento por video completo', `${resultados.length} resultado(s).`);
  }

  if (global.json && !global.json.__errorLectura) {
    const transcripcion = global.json.transcripcionGlobal || global.json.transcripcion || {};
    const frames = global.json.fotogramasGlobales || global.json.fotogramas || {};
    const segmentos = lista(transcripcion.segmentos).length;
    const fotogramas = numero(frames.cantidadExtraida || lista(frames.fotogramas).length, 0);
    if (segmentos > 0 || transcripcion.textoCompleto) agregar(reporte, ESTADO.OK, 'Transcripción global disponible', `${segmentos} segmento(s).`);
    else agregar(reporte, ESTADO.WARN, 'Transcripción global sin texto útil', 'Revisar motores de transcripción.');
    if (fotogramas > 0) agregar(reporte, ESTADO.OK, 'Fotogramas globales disponibles', `${fotogramas} frame(s).`);
    else agregar(reporte, ESTADO.WARN, 'Fotogramas globales no disponibles');
  }

  return extraerResultadoEtapa(etapa.json || {});
}

function verificarPlan(reporte, carpetaProyecto, contexto) {
  const archivo = buscarJsonProyecto(carpetaProyecto, ['02-plan/plan-edicion.json']);
  if (!validarJsonLeido(reporte, 'resultado etapa Plan', archivo)) return null;
  const plan = extraerResultadoEtapa(archivo.json);
  const totalElementos = numero(plan.resumen?.totalElementos || lista(plan.planProduccion?.elementos).length, 0);
  if (totalElementos > 0) agregar(reporte, ESTADO.OK, 'Plan tiene elementos', `${totalElementos} elemento(s).`);
  else agregar(reporte, ESTADO.WARN, 'Plan sin elementos');

  if (contexto.esMultivideo) {
    if (plan.multivideo?.activo || plan.resumen?.esMultivideo || plan.planProduccion?.multivideo?.activo) agregar(reporte, ESTADO.OK, 'Plan marcado como multivideo');
    else agregar(reporte, ESTADO.ERROR, 'Plan no quedó marcado como multivideo');
    if (plan.multivideo?.usaTiemposGlobales || plan.planProduccion?.multivideo?.usaTiemposGlobales) agregar(reporte, ESTADO.OK, 'Plan usa tiempos globales');
    else agregar(reporte, ESTADO.ERROR, 'Plan no reporta tiempos globales');
  }
  return plan;
}

function verificarProduccion(reporte, carpetaProyecto, contexto) {
  const archivo = buscarJsonProyecto(carpetaProyecto, ['03-produccion/produccion.json']);
  if (!validarJsonLeido(reporte, 'resultado etapa Producción', archivo)) return null;
  const produccion = extraerResultadoEtapa(archivo.json);
  const rutaMaestro = produccion.videoMaestro?.ruta || produccion.salida?.rutaExportada || '';
  if (rutaMaestro && esArchivo(rutaMaestro)) agregar(reporte, ESTADO.OK, 'Video maestro producido existe', path.basename(rutaMaestro));
  else agregar(reporte, ESTADO.WARN, 'Video maestro producido no encontrado en disco', rutaMaestro || 'sin ruta');

  if (contexto.esMultivideo) {
    if (produccion.multivideo?.activo || produccion.resumen?.esMultivideo) agregar(reporte, ESTADO.OK, 'Producción marcada como multivideo');
    else agregar(reporte, ESTADO.ERROR, 'Producción no quedó marcada como multivideo');
    if (produccion.multivideo?.usaVideoMaestroUnido || produccion.videoMaestro?.fuenteTemporal) agregar(reporte, ESTADO.OK, 'Producción usó maestro multivideo unido');
    else agregar(reporte, ESTADO.WARN, 'Producción no reporta maestro multivideo unido');
  }
  return produccion;
}

function verificarAdaptacion(reporte, carpetaProyecto, contexto) {
  const archivo = buscarJsonProyecto(carpetaProyecto, ['04-adaptacion/adaptacion-plataformas.json']);
  if (!validarJsonLeido(reporte, 'resultado etapa Adaptación', archivo)) return null;
  const adaptacion = extraerResultadoEtapa(archivo.json);
  const resumen = adaptacion.resumen || {};
  const plataformas = lista(resumen.plataformas || adaptacion.resultadoPlataformas?.resultados);
  agregar(reporte, ESTADO.OK, 'Adaptación revisada', `${resumen.exportadas || 0}/${resumen.total || plataformas.length} exportada(s).`);

  if (contexto.esMultivideo) {
    if (adaptacion.multivideo?.activo || resumen.esMultivideo) agregar(reporte, ESTADO.OK, 'Adaptación marcada como multivideo');
    else agregar(reporte, ESTADO.ERROR, 'Adaptación no quedó marcada como multivideo');
  }
  return adaptacion;
}

function verificarResultadoFinal(reporte, carpetaProyecto, contexto) {
  const archivo = buscarJsonProyecto(carpetaProyecto, ['05-resultado/reporte-final.json']);
  if (!validarJsonLeido(reporte, 'resultado final', archivo)) return null;
  const resultado = extraerResultadoEtapa(archivo.json);
  const resumen = resultado.resumen || {};
  const html = resultado.entregables?.html?.ruta || path.join(carpetaProyecto, '05-resultado', 'resultado-final.html');
  const manifest = resultado.entregables?.manifest?.ruta || path.join(carpetaProyecto, '05-resultado', 'manifest-publicacion.json');

  if (esArchivo(html)) agregar(reporte, ESTADO.OK, 'HTML final existe', path.relative(RAIZ, html));
  else agregar(reporte, ESTADO.WARN, 'HTML final no encontrado');
  if (esArchivo(manifest)) agregar(reporte, ESTADO.OK, 'Manifest final existe', path.relative(RAIZ, manifest));
  else agregar(reporte, ESTADO.WARN, 'Manifest final no encontrado');

  if (contexto.esMultivideo) {
    if (resultado.multivideo?.activo || resumen.esMultivideo) agregar(reporte, ESTADO.OK, 'Resultado final marcado como multivideo');
    else agregar(reporte, ESTADO.ERROR, 'Resultado final no quedó marcado como multivideo');
    if (resumen.videoMaestroUnido || resultado.multivideo?.videoMaestroUnido) agregar(reporte, ESTADO.OK, 'Resultado final conserva video maestro unido');
    else agregar(reporte, ESTADO.WARN, 'Resultado final no reporta nombre del maestro unido');
  }
  return resultado;
}

function verificarProyectoReal(reporte) {
  const carpetaProyecto = resolverProyectoAuditado();
  if (!carpetaProyecto) {
    agregar(reporte, ESTADO.WARN, 'No se encontró proyecto local para auditoría real', 'Crea/procesa un proyecto o usa: npm run check:bloque10-autovideo -- PROYECTO_ID');
    return;
  }

  agregar(reporte, ESTADO.OK, 'Proyecto auditado', path.basename(carpetaProyecto));
  const contexto = verificarVideosOriginales(reporte, carpetaProyecto);
  verificarLineaTiempo(reporte, carpetaProyecto, contexto);
  verificarEntendimientoGlobal(reporte, carpetaProyecto, contexto);
  verificarPlan(reporte, carpetaProyecto, contexto);
  verificarProduccion(reporte, carpetaProyecto, contexto);
  verificarAdaptacion(reporte, carpetaProyecto, contexto);
  verificarResultadoFinal(reporte, carpetaProyecto, contexto);
}

export async function verificarBloque10Multivideo() {
  const reporte = {
    bloque: 10,
    nombre: 'Auditoría flujo multivideo completo',
    errores: 0,
    advertencias: 0,
    items: [],
    creadoEn: new Date().toISOString()
  };

  console.log('=== Bloque 10: Auditoría flujo multivideo completo ===');
  verificarEstructuraCodigo(reporte);
  verificarProyectoReal(reporte);

  console.log('\n--- Resultado auditoría ---');
  reporte.items.forEach(imprimirItem);
  console.log(`\nResumen: ${reporte.errores} error(es), ${reporte.advertencias} advertencia(s), ${reporte.items.length} chequeo(s).`);

  if (reporte.errores > 0) {
    console.error('ERROR Bloque 10 AutoVideoJeff: hay fallos críticos en el flujo multivideo.');
    process.exitCode = 1;
    return reporte;
  }

  console.log('OK Bloque 10 AutoVideoJeff: auditoría multivideo completada.');
  return reporte;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  verificarBloque10Multivideo().catch((error) => {
    console.error('ERROR Bloque 10 AutoVideoJeff:', error.message);
    process.exitCode = 1;
  });
}
