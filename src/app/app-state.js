/* =========================================================
Nombre completo: app-state.js
Ruta o ubicación: /src/app/app-state.js
Funciones principales:
- Mantener el estado global mínimo de la app.
- Guardar la pantalla actual.
- Guardar el proyecto activo en memoria.
- Permitir escuchar cambios de estado.
- Evitar mezclar lógica propia de pantallas.
========================================================= */

const ESTADO_INICIAL = {
  pantallaActual: "01-cargar-proyecto",
  proyectoActivo: null,
  rutaProyectoActivo: null,
  pantallas: []
};

function clonarSeguro(valor) {
  return JSON.parse(JSON.stringify(valor));
}

export function crearEstadoApp(configuracionInicial = {}) {
  let estado = {
    ...ESTADO_INICIAL,
    ...configuracionInicial
  };

  const listeners = new Set();

  function notificar() {
    const copiaEstado = obtenerEstado();

    listeners.forEach((listener) => {
      if (typeof listener === "function") {
        listener(copiaEstado);
      }
    });
  }

  function obtenerEstado() {
    return clonarSeguro(estado);
  }

  function obtenerValor(clave) {
    return clonarSeguro(estado[clave]);
  }

  function actualizar(parcial) {
    if (!parcial || typeof parcial !== "object") {
      return obtenerEstado();
    }

    estado = {
      ...estado,
      ...parcial
    };

    notificar();

    return obtenerEstado();
  }

  function establecerPantallaActual(pantallaId) {
    return actualizar({
      pantallaActual: pantallaId
    });
  }

  function establecerProyectoActivo(proyecto, rutaProyecto = null) {
    return actualizar({
      proyectoActivo: proyecto || null,
      rutaProyectoActivo: rutaProyecto
    });
  }

  function obtenerProyectoActivo() {
    return obtenerValor("proyectoActivo");
  }

  function limpiarProyectoActivo() {
    return actualizar({
      proyectoActivo: null,
      rutaProyectoActivo: null
    });
  }

  function escuchar(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  return {
    obtenerEstado,
    obtenerValor,
    actualizar,
    establecerPantallaActual,
    establecerProyectoActivo,
    obtenerProyectoActivo,
    limpiarProyectoActivo,
    escuchar
  };
}