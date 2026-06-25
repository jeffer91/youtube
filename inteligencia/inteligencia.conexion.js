import path from 'path';
import { escribirJson } from '../comun/archivos.js';
import { obtenerConfigInteligencia } from './inteligencia.config.js';
import { generarHookInicial } from './hooks/hook-generator.service.js';
import { generarSeoVideo } from './seo/seo-generator.service.js';
import { recomendarMiniatura } from './miniatura/miniatura-recomendacion.service.js';
import { detectarPuntosImportantes } from './puntos/puntos-importantes.service.js';

function obtenerCarpetaProyecto(entrada = {}) {
  return entrada?.rutas?.carpetaProyecto || entrada?.rutas?.proyecto || entrada?.proyecto?.carpetaProyecto || null;
}

async function guardarSalidaInteligencia({ entrada, config, inteligencia } = {}) {
  const carpeta = obtenerCarpetaProyecto(entrada);
  if (!carpeta) return { ok: false, omitido: true, motivo: 'No hay carpeta de proyecto para guardar inteligencia.' };

  const rutas = {
    inteligenciaJson: path.join(carpeta, config.archivos.inteligenciaJson),
    seoJson: path.join(carpeta, config.archivos.seoJson),
    hookJson: path.join(carpeta, config.archivos.hookJson),
    miniaturaJson: path.join(carpeta, config.archivos.miniaturaJson),
    seoTxt: path.join(carpeta, config.archivos.seoTxt)
  };

  await escribirJson(rutas.inteligenciaJson, inteligencia);
  await escribirJson(rutas.seoJson, inteligencia.seo);
  await escribirJson(rutas.hookJson, inteligencia.hook);
  await escribirJson(rutas.miniaturaJson, inteligencia.miniatura);

  const seoTxt = [
    `TÍTULO PRINCIPAL: ${inteligencia.seo?.tituloPrincipal || ''}`,
    '',
    'TÍTULOS SUGERIDOS:',
    ...(inteligencia.seo?.titulos || []).map((titulo, index) => `${index + 1}. ${titulo}`),
    '',
    'DESCRIPCIÓN:',
    inteligencia.seo?.descripcion || '',
    '',
    'HASHTAGS:',
    (inteligencia.seo?.hashtags || []).join(' ')
  ].join('\n');

  await import('fs').then((fs) => fs.promises.writeFile(rutas.seoTxt, seoTxt, 'utf8'));

  return { ok: true, rutas };
}

export async function procesarInteligenciaCreativa({ entrada = null, entendimiento = null, transcripcion = null, opciones = {}, guardar = true } = {}) {
  const config = obtenerConfigInteligencia(opciones);
  if (!config.activo) {
    return { ok: true, omitido: true, estado: 'OMITIDO', mensaje: 'Inteligencia creativa desactivada.', config };
  }

  const perfilVisual = opciones.perfilAplicado || null;
  const hook = generarHookInicial({ transcripcion, opciones });
  const puntosImportantes = detectarPuntosImportantes({ transcripcion, opciones });
  const seo = generarSeoVideo({ transcripcion, hook, perfilVisual, opciones });
  const miniatura = recomendarMiniatura({ hook, seo, perfilVisual, transcripcion, entendimiento });

  const inteligencia = {
    ok: true,
    estado: 'GENERADO_LOCAL',
    tipo: 'inteligencia-creativa',
    version: config.version,
    mensaje: 'Inteligencia creativa básica generada localmente.',
    perfilVisual: perfilVisual ? { id: perfilVisual.id, nombre: perfilVisual.nombre, ritmo: perfilVisual.ritmo } : null,
    hook,
    puntosImportantes,
    seo,
    miniatura,
    creadoEn: new Date().toISOString()
  };

  const guardado = guardar ? await guardarSalidaInteligencia({ entrada, config, inteligencia }) : null;
  return { ...inteligencia, guardado };
}

export default procesarInteligenciaCreativa;
