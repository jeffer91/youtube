import fs from 'fs';
import path from 'path';
import { crearRespuestaCatalogoEfectosLab, obtenerEfectoLabPorId } from '../laboratorio-efectos/catalogo-efectos-lab.js';
import { construirFiltroFfmpegLaboratorio } from '../laboratorio-efectos/filtros-ffmpeg-lab.service.js';
import { prepararPruebaEfectoLaboratorio } from '../laboratorio-efectos/renderizar-efecto-lab.service.js';
import { registrarRutasLaboratorioEfectos } from '../server/rutas-laboratorio-efectos.service.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta archivo requerido: ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function json(ruta) {
  return JSON.parse(leer(ruta));
}

function crearAppFalsa() {
  const rutas = [];
  return {
    rutas,
    get(ruta, ...handlers) { rutas.push({ metodo: 'GET', ruta, handlers }); },
    post(ruta, ...handlers) { rutas.push({ metodo: 'POST', ruta, handlers }); }
  };
}

function crearResFalso() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    status(codigo) { this.statusCode = codigo; return this; },
    setHeader(nombre, valor) { this.headers[nombre] = valor; return this; },
    json(datos) { this.payload = datos; return datos; }
  };
}

function obtenerRutaRegistrada(app, metodo, ruta) {
  return app.rutas.find((item) => item.metodo === metodo && item.ruta === ruta) || null;
}

function ejecutarHandler(rutaRegistrada, req = {}) {
  exigir(rutaRegistrada, 'No existe ruta registrada para ejecutar.');
  const handler = rutaRegistrada.handlers[rutaRegistrada.handlers.length - 1];
  exigir(typeof handler === 'function', `La ruta ${rutaRegistrada.ruta} no tiene handler final.`);
  const res = crearResFalso();
  const resultado = handler(req, res);
  return resultado instanceof Promise ? resultado.then(() => res) : res;
}

function verificarPackageFinal() {
  const pkg = json('package.json');
  exigir(pkg.type === 'module', 'package.json debe conservar type=module.');
  exigir(pkg.scripts?.['check:laboratorio-efectos'], 'Falta check:laboratorio-efectos.');
  exigir(pkg.scripts?.['check:laboratorio-efectos-final'], 'Falta check:laboratorio-efectos-final.');
  exigir(pkg.scripts['check:laboratorio-efectos'].includes('verificar-laboratorio-efectos.js'), 'El check principal no ejecuta verificación base.');
  exigir(pkg.scripts['check:laboratorio-efectos'].includes('verificar-laboratorio-efectos-final.js'), 'El check principal no ejecuta verificación final.');
  exigir((pkg.build?.files || []).includes('laboratorio-efectos/**/*'), 'El build no incluye laboratorio-efectos/**/*.');
  exigir((pkg.build?.files || []).includes('server/**/*'), 'El build no incluye server/**/*.');
  exigir((pkg.build?.files || []).includes('app/**/*'), 'El build no incluye app/**/*.');
}

function verificarArchivosFinales() {
  const requeridos = [
    'laboratorio-efectos/catalogo-efectos-lab.js',
    'laboratorio-efectos/filtros-ffmpeg-lab.service.js',
    'laboratorio-efectos/renderizar-efecto-lab.service.js',
    'server/rutas-laboratorio-efectos.service.js',
    'app/pantallas/laboratorio-efectos.view.js',
    'app/laboratorio-efectos-ui.js',
    'app/laboratorio-efectos.css',
    'scripts/verificar-laboratorio-efectos.js'
  ];
  for (const ruta of requeridos) exigir(fs.existsSync(ruta), `Falta archivo del laboratorio: ${ruta}`);

  const ui = leer('app/laboratorio-efectos-ui.js');
  exigir(!ui.includes('/api/proyectos/') && !ui.includes('/produccion/procesar'), 'La UI del laboratorio no debe depender de Producción maestro.');
  exigir(ui.includes('/api/laboratorio-efectos/probar'), 'La UI no llama a la ruta directa de prueba.');
  exigir(ui.includes('FormData'), 'La UI debe enviar video con FormData.');
  exigir(ui.includes('beforeunload') && ui.includes('revokeObjectURL'), 'La UI debe liberar URLs temporales del preview.');

  const server = leer('server.js');
  exigir(server.includes("/exports"), 'server.js debe exponer /exports para ver resultados del laboratorio.');
}

async function verificarRutasRegistradas() {
  const app = crearAppFalsa();
  const tmpExports = path.join(process.cwd(), 'tmp-lab-final-exports');
  const upload = {
    single(campo) {
      return function middlewareUpload(_req, _res, next) {
        if (typeof next === 'function') next();
      };
    }
  };

  registrarRutasLaboratorioEfectos(app, {
    upload,
    rutasBase: { videosExportados: tmpExports },
    aplicarCabecerasSinCache: (res) => res.setHeader?.('Cache-Control', 'no-store')
  });

  const esperadas = [
    ['GET', '/api/laboratorio-efectos/catalogo'],
    ['GET', '/api/laboratorio-efectos/efectos/:efectoId'],
    ['POST', '/api/laboratorio-efectos/preparar'],
    ['POST', '/api/laboratorio-efectos/probar']
  ];
  for (const [metodo, ruta] of esperadas) exigir(obtenerRutaRegistrada(app, metodo, ruta), `No se registró ${metodo} ${ruta}.`);

  const probar = obtenerRutaRegistrada(app, 'POST', '/api/laboratorio-efectos/probar');
  exigir(probar.handlers.length >= 2, 'La ruta /probar debe tener middleware de subida y handler final.');

  const catalogo = await ejecutarHandler(obtenerRutaRegistrada(app, 'GET', '/api/laboratorio-efectos/catalogo'), {});
  exigir(catalogo.statusCode === 200, 'Catálogo no respondió 200.');
  exigir(catalogo.payload?.ok === true, 'Catálogo no respondió ok=true.');
  exigir(catalogo.payload?.catalogo?.totalEfectos >= 35, 'Catálogo API no devuelve suficientes efectos.');

  const detalle = await ejecutarHandler(obtenerRutaRegistrada(app, 'GET', '/api/laboratorio-efectos/efectos/:efectoId'), { params: { efectoId: 'zoom-in-centro' }, query: {}, body: {} });
  exigir(detalle.statusCode === 200, 'Detalle de efecto no respondió 200.');
  exigir(detalle.payload?.efecto?.id === 'zoom-in-centro', 'Detalle de efecto no devuelve el efecto correcto.');
  exigir(detalle.payload?.filtro?.filtroVideo, 'Detalle de efecto no devuelve filtro.');

  const preparar = await ejecutarHandler(obtenerRutaRegistrada(app, 'POST', '/api/laboratorio-efectos/preparar'), { params: {}, query: {}, body: { efectoId: 'shake-suave', textoPersonalizado: 'PRUEBA', intensidad: 'normal' } });
  exigir(preparar.statusCode === 200, 'Preparar efecto no respondió 200.');
  exigir(preparar.payload?.preparacion?.nombreSalida?.includes('lab-shake-suave-preview.mp4'), 'Preparar no crea nombre esperado.');
  exigir(preparar.payload?.queDebeSalir, 'Preparar no devuelve qué debe salir.');

  fs.rmSync(tmpExports, { recursive: true, force: true });
}

function verificarFlujoSinRenderReal() {
  const catalogo = crearRespuestaCatalogoEfectosLab();
  const efecto = obtenerEfectoLabPorId('titulo-centro-grande');
  const filtro = construirFiltroFfmpegLaboratorio({ efectoId: efecto.id, textoPersonalizado: 'MIRA ESTO', intensidad: 'fuerte' });
  const carpetaSalida = path.join(process.cwd(), 'tmp-lab-final-prep');
  const preparacion = prepararPruebaEfectoLaboratorio({
    rutaVideo: path.join(process.cwd(), 'video-prueba.mp4'),
    carpetaSalida,
    efectoId: efecto.id,
    textoPersonalizado: 'MIRA ESTO',
    intensidad: 'fuerte',
    marcaEjecucion: 'final'
  });

  exigir(catalogo.ok && catalogo.totalCategorias >= 7 && catalogo.totalEfectos >= 35, 'Catálogo final no está completo.');
  exigir(efecto?.requiereTexto === true, 'Efecto de texto no indica requiereTexto.');
  exigir(filtro.filtroVideo.includes('drawtext'), 'Filtro de texto no usa drawtext.');
  exigir(filtro.textoUsado === 'MIRA ESTO', 'Filtro no conserva texto personalizado.');
  exigir(preparacion.comando.includes('-vf'), 'Preparación no incluye -vf.');
  exigir(preparacion.comando.includes('-shortest'), 'Preparación no protege duración.');
  exigir(preparacion.nombreSalida === 'lab-titulo-centro-grande-final.mp4', 'Nombre final de preparación no es estable.');

  fs.rmSync(carpetaSalida, { recursive: true, force: true });
}

async function main() {
  verificarPackageFinal();
  verificarArchivosFinales();
  verificarFlujoSinRenderReal();
  await verificarRutasRegistradas();
  console.log('OK Laboratorio de efectos final: package, build, archivos, UI, API, rutas y flujo sin render real verificados.');
}

main().catch((error) => {
  console.error('ERROR Laboratorio de efectos final:', error.message);
  process.exit(1);
});
