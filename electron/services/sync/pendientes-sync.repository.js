/* =========================================================
Nombre completo: pendientes-sync.repository.js
Ruta o ubicación: /electron/services/sync/pendientes-sync.repository.js
Funciones principales:
- Guardar operaciones pendientes cuando Google Sheets no responde.
- Leer, actualizar y resumir la cola PendientesSync local.
- Mantener los datos pendientes fuera del código fuente.
- Preparar reintentos seguros desde Electron.
Con qué se conecta:
- sync-electron.js
- gs-electron.js
- electron/main/main.js
========================================================= */

const fs = require("fs");
const path = require("path");

const NOMBRE_ARCHIVO_PENDIENTES = "pendientes-sync.json";
const ESTADOS_PENDIENTES = new Set(["PENDIENTE", "ERROR"]);

function ahoraSync() {
  return new Date().toISOString();
}

function limpiarTextoSync(valor) {
  return String(valor || "").trim();
}

function crearIdPendienteSync(tipo = "operacion") {
  return `pendiente-${limpiarTextoSync(tipo) || "operacion"}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function obtenerRutaCarpetaSync({ obtenerRutaData, asegurarCarpeta }) {
  const carpeta = path.join(obtenerRutaData(), "pendientes-sync");
  asegurarCarpeta(carpeta);
  return carpeta;
}

function obtenerRutaArchivoPendientesSync({ obtenerRutaData, asegurarCarpeta }) {
  return path.join(
    obtenerRutaCarpetaSync({ obtenerRutaData, asegurarCarpeta }),
    NOMBRE_ARCHIVO_PENDIENTES
  );
}

function crearBasePendientesSync() {
  return {
    version: "1.0.0",
    actualizadoEn: ahoraSync(),
    pendientes: []
  };
}

function leerArchivoPendientesSync({ obtenerRutaData, asegurarCarpeta }) {
  const rutaArchivo = obtenerRutaArchivoPendientesSync({ obtenerRutaData, asegurarCarpeta });

  if (!fs.existsSync(rutaArchivo)) {
    return {
      ok: true,
      rutaArchivo,
      data: crearBasePendientesSync()
    };
  }

  try {
    const texto = fs.readFileSync(rutaArchivo, "utf8");
    const data = JSON.parse(texto || "{}");

    return {
      ok: true,
      rutaArchivo,
      data: {
        ...crearBasePendientesSync(),
        ...data,
        pendientes: Array.isArray(data.pendientes) ? data.pendientes : []
      }
    };
  } catch (error) {
    return {
      ok: false,
      rutaArchivo,
      data: crearBasePendientesSync(),
      mensaje: "No se pudo leer PendientesSync.",
      detalle: error.message
    };
  }
}

function escribirArchivoPendientesSync({ obtenerRutaData, asegurarCarpeta, data }) {
  const rutaArchivo = obtenerRutaArchivoPendientesSync({ obtenerRutaData, asegurarCarpeta });
  const salida = {
    ...crearBasePendientesSync(),
    ...data,
    actualizadoEn: ahoraSync(),
    pendientes: Array.isArray(data?.pendientes) ? data.pendientes : []
  };

  fs.writeFileSync(rutaArchivo, JSON.stringify(salida, null, 2), "utf8");

  return {
    ok: true,
    rutaArchivo,
    data: salida
  };
}

function normalizarOperacionSync(operacion) {
  if (!operacion || typeof operacion !== "object") {
    return {
      id: crearIdPendienteSync("operacion"),
      tipo: "operacionDesconocida",
      entidad: "desconocida",
      payload: {}
    };
  }

  return operacion;
}

function normalizarPendienteSync(pendiente) {
  const operacion = normalizarOperacionSync(pendiente?.operacion || pendiente?.payload || pendiente);
  const fecha = ahoraSync();

  return {
    id: limpiarTextoSync(pendiente?.id) || crearIdPendienteSync(operacion.tipo),
    operacionId: limpiarTextoSync(operacion.id),
    tipo: limpiarTextoSync(operacion.tipo) || "operacion",
    entidad: limpiarTextoSync(operacion.entidad) || "general",
    estado: limpiarTextoSync(pendiente?.estado) || "PENDIENTE",
    intentos: Number.isFinite(Number(pendiente?.intentos)) ? Number(pendiente.intentos) : 0,
    ultimoError: limpiarTextoSync(pendiente?.ultimoError || pendiente?.error || pendiente?.mensaje),
    operacion,
    creadoEn: limpiarTextoSync(pendiente?.creadoEn) || fecha,
    actualizadoEn: fecha
  };
}

function listarPendientesSyncLocal({ obtenerRutaData, asegurarCarpeta, incluirCompletados = false }) {
  const lectura = leerArchivoPendientesSync({ obtenerRutaData, asegurarCarpeta });

  if (!lectura.ok) {
    return lectura;
  }

  const pendientes = incluirCompletados
    ? lectura.data.pendientes
    : lectura.data.pendientes.filter((item) => ESTADOS_PENDIENTES.has(item.estado));

  return {
    ok: true,
    rutaArchivo: lectura.rutaArchivo,
    pendientes,
    total: pendientes.length,
    data: lectura.data
  };
}

function guardarPendienteSyncLocal({ obtenerRutaData, asegurarCarpeta, pendiente }) {
  const lectura = leerArchivoPendientesSync({ obtenerRutaData, asegurarCarpeta });

  if (!lectura.ok) {
    return lectura;
  }

  const pendienteNormalizado = normalizarPendienteSync(pendiente);
  const pendientes = lectura.data.pendientes.filter((item) => item.id !== pendienteNormalizado.id);

  pendientes.push(pendienteNormalizado);

  const escritura = escribirArchivoPendientesSync({
    obtenerRutaData,
    asegurarCarpeta,
    data: {
      ...lectura.data,
      pendientes
    }
  });

  return {
    ok: escritura.ok,
    rutaArchivo: escritura.rutaArchivo,
    pendiente: pendienteNormalizado,
    total: pendientes.length,
    mensaje: "PendienteSync guardado localmente."
  };
}

function actualizarPendienteSyncLocal({ obtenerRutaData, asegurarCarpeta, pendienteId, cambios }) {
  const lectura = leerArchivoPendientesSync({ obtenerRutaData, asegurarCarpeta });

  if (!lectura.ok) {
    return lectura;
  }

  const pendientes = lectura.data.pendientes.map((item) => {
    if (item.id !== pendienteId) {
      return item;
    }

    return {
      ...item,
      ...(cambios || {}),
      actualizadoEn: ahoraSync()
    };
  });

  const escritura = escribirArchivoPendientesSync({
    obtenerRutaData,
    asegurarCarpeta,
    data: {
      ...lectura.data,
      pendientes
    }
  });

  return {
    ok: escritura.ok,
    rutaArchivo: escritura.rutaArchivo,
    pendientes,
    total: pendientes.length
  };
}

function crearResumenPendientesSync({ obtenerRutaData, asegurarCarpeta }) {
  const lectura = listarPendientesSyncLocal({
    obtenerRutaData,
    asegurarCarpeta,
    incluirCompletados: true
  });

  if (!lectura.ok) {
    return lectura;
  }

  const resumen = lectura.pendientes.reduce((acc, item) => {
    acc.total += 1;
    acc[item.estado] = (acc[item.estado] || 0) + 1;
    return acc;
  }, { total: 0 });

  return {
    ok: true,
    rutaArchivo: lectura.rutaArchivo,
    resumen,
    pendientesActivos: lectura.pendientes.filter((item) => ESTADOS_PENDIENTES.has(item.estado)).length
  };
}

module.exports = {
  leerArchivoPendientesSync,
  escribirArchivoPendientesSync,
  listarPendientesSyncLocal,
  guardarPendienteSyncLocal,
  actualizarPendienteSyncLocal,
  crearResumenPendientesSync,
  normalizarPendienteSync
};
