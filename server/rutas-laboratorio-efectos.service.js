/*
  Laboratorio de efectos - Bloque 3
  Función: exponer catálogo y render de un solo efecto con subida de video corta.
*/

import fs from 'fs';
import path from 'path';
import { crearRespuestaCatalogoEfectosLab, obtenerEfectoLabPorId } from '../laboratorio-efectos/catalogo-efectos-lab.js';
import { construirFiltroFfmpegLaboratorio } from '../laboratorio-efectos/filtros-ffmpeg-lab.service.js';
import { normalizarOriginalLaboratorio, prepararPruebaEfectoLaboratorio, renderizarEfectoLaboratorio } from '../laboratorio-efectos/renderizar-efecto-lab.service.js';

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function responderOk(res, datos = {}) {
  return res.json({ ok: true, ...datos, fecha: new Date().toISOString() });
}

function responderError(res, error, codigo = 500) {
  return res.status(codigo).json({ ok: false, mensaje: error?.message || 'Error en laboratorio de efectos.', fecha: new Date().toISOString() });
}

function asegurarCarpeta(rutaCarpeta) {
  const ruta = texto(rutaCarpeta, '');
  if (!ruta) throw new Error('Falta carpeta para laboratorio de efectos.');
  fs.mkdirSync(ruta, { recursive: true });
  return ruta;
}

function obtenerCarpetaSalida(rutasBase = {}) {
  return asegurarCarpeta(path.join(rutasBase.videosExportados || path.join(process.cwd(), 'datos', 'videos-exportados'), 'laboratorio-efectos'));
}

function crearUrlPublicaLaboratorio(nombreSalida = '') {
  const nombre = path.basename(texto(nombreSalida, ''));
  if (!nombre) return null;
  return `/exports/laboratorio-efectos/${nombre}`;
}

function obtenerEfectoId(req) {
  return texto(req.body?.efectoId || req.body?.efecto || req.query?.efectoId || req.params?.efectoId, '');
}

function construirOpcionesDesdeReq(req) {
  return {
    efectoId: obtenerEfectoId(req),
    textoPersonalizado: texto(req.body?.textoPersonalizado || req.body?.texto || req.query?.texto, ''),
    intensidad: texto(req.body?.intensidad || req.query?.intensidad, '') || null
  };
}

async function eliminarTemporalSeguro(rutaTemporal) {
  if (!rutaTemporal) return;
  try {
    if (fs.existsSync(rutaTemporal)) await fs.promises.unlink(rutaTemporal);
  } catch (error) {
    console.warn('[Laboratorio efectos] No se pudo eliminar temporal:', error.message);
  }
}

export function registrarRutasLaboratorioEfectos(app, opciones = {}) {
  const aplicarCabeceras = opciones.aplicarCabecerasSinCache || (() => {});
  const upload = opciones.upload;
  const rutasBase = opciones.rutasBase || {};

  if (!upload?.single) {
    throw new Error('No se puede registrar laboratorio de efectos porque falta middleware upload.single.');
  }

  app.get('/api/laboratorio-efectos/catalogo', (_req, res) => {
    try {
      aplicarCabeceras(res);
      return responderOk(res, { catalogo: crearRespuestaCatalogoEfectosLab() });
    } catch (error) {
      return responderError(res, error, 500);
    }
  });

  app.get('/api/laboratorio-efectos/efectos/:efectoId', (req, res) => {
    try {
      aplicarCabeceras(res);
      const efecto = obtenerEfectoLabPorId(req.params.efectoId);
      if (!efecto) return responderError(res, new Error(`No existe el efecto ${req.params.efectoId}.`), 404);
      const filtro = construirFiltroFfmpegLaboratorio({ efectoId: efecto.id, textoPersonalizado: efecto.textoPrueba || '', intensidad: efecto.intensidadBase });
      return responderOk(res, { efecto, filtro, queDebeSalir: efecto.queDebeSalir });
    } catch (error) {
      return responderError(res, error, 400);
    }
  });

  app.post('/api/laboratorio-efectos/preparar', (req, res) => {
    try {
      aplicarCabeceras(res);
      const datos = construirOpcionesDesdeReq(req);
      const carpetaSalida = obtenerCarpetaSalida(rutasBase);
      const preparacion = prepararPruebaEfectoLaboratorio({ rutaVideo: 'video-prueba.mp4', carpetaSalida, ...datos, marcaEjecucion: 'preview' });
      return responderOk(res, { preparacion, efecto: preparacion.efecto, filtro: preparacion.filtro, queDebeSalir: preparacion.queDebeSalir });
    } catch (error) {
      return responderError(res, error, 400);
    }
  });

  app.post('/api/laboratorio-efectos/probar', upload.single('video'), async (req, res) => {
    const archivo = req.file || null;
    try {
      aplicarCabeceras(res);
      if (!archivo?.path) return responderError(res, new Error('Sube un video corto para probar el efecto.'), 400);
      const datos = construirOpcionesDesdeReq(req);
      if (!datos.efectoId) return responderError(res, new Error('Selecciona un efecto antes de probar.'), 400);

      const carpetaSalida = obtenerCarpetaSalida(rutasBase);
      const marcaEjecucion = `${Date.now()}-${process.pid || 'app'}`;

      const original = await normalizarOriginalLaboratorio({
        rutaVideo: archivo.path,
        carpetaSalida,
        nombreOriginal: archivo.originalname,
        marcaEjecucion
      });

      const resultado = await renderizarEfectoLaboratorio({
        rutaVideo: archivo.path,
        carpetaSalida,
        ...datos,
        marcaEjecucion
      });

      const urlPublica = crearUrlPublicaLaboratorio(resultado.nombreSalida);
      const originalUrlPublica = crearUrlPublicaLaboratorio(original.nombreSalida);

      return responderOk(res, {
        mensaje: resultado.mensaje,
        resultado: {
          ...resultado,
          urlPublica,
          rutaRelativa: urlPublica,
          original: {
            ...original,
            urlPublica: originalUrlPublica,
            rutaRelativa: originalUrlPublica
          },
          videoEntrada: {
            nombreOriginal: archivo.originalname,
            nombreTemporal: archivo.filename,
            pesoBytes: archivo.size || null,
            normalizado: true,
            urlPublica: originalUrlPublica,
            rutaRelativa: originalUrlPublica
          }
        },
        efecto: resultado.efecto,
        filtro: resultado.filtro,
        queDebeSalir: resultado.queDebeSalir
      });
    } catch (error) {
      return responderError(res, error, 500);
    } finally {
      await eliminarTemporalSeguro(archivo?.path);
    }
  });
}

export default registrarRutasLaboratorioEfectos;
