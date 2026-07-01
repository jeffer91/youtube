/*
  Middleware de control de funcionalidades - AutoVideoJeff
  Función:
    - Exponer el estado del módulo de control.
    - Bloquear rutas API de funcionalidades apagadas sin borrar código.
*/

import {
  obtenerControlFuncionalidades,
  resolverBloqueoRutaApi
} from '../app/control/control-funcionalidades.js';

function responderBloqueo(res, bloqueo) {
  return res.status(423).json({
    ok: false,
    bloqueada: true,
    tipo: 'funcionalidad-apagada',
    ...bloqueo,
    recomendacion: 'Activa esta funcionalidad en app/control/control-funcionalidades.js cuando Jeff indique que ya debe probarse.',
    fecha: new Date().toISOString()
  });
}

export function registrarControlFuncionalidades(app, opciones = {}) {
  const aplicarCabeceras = opciones.aplicarCabecerasSinCache || (() => {});

  app.get('/api/autovideo/control-funcionalidades', (_req, res) => {
    aplicarCabeceras(res);
    return res.json({
      ...obtenerControlFuncionalidades(),
      fecha: new Date().toISOString()
    });
  });

  app.use((req, res, next) => {
    const bloqueo = resolverBloqueoRutaApi({
      metodo: req.method,
      ruta: req.path || req.originalUrl || ''
    });

    if (!bloqueo) return next();
    aplicarCabeceras(res);
    return responderBloqueo(res, bloqueo);
  });
}
