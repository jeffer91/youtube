/* =========================================================
Nombre completo: storage-service.js
Ruta o ubicación: /src/storage/storage-service.js
Funciones principales:
- Guardar datos pequeños en localStorage.
- Leer datos pequeños de localStorage.
- Eliminar datos guardados.
- Servir como apoyo global simple.
- No guardar aquí videos ni proyectos grandes.
========================================================= */

function crearClave(clave) {
  return `video-editor:${clave}`;
}

export function guardarDatoLocal(clave, valor) {
  try {
    if (!clave) {
      return {
        ok: false,
        mensaje: "Clave no válida."
      };
    }

    const claveFinal = crearClave(clave);
    const valorFinal = JSON.stringify(valor);

    localStorage.setItem(claveFinal, valorFinal);

    return {
      ok: true
    };
  } catch (error) {
    return {
      ok: false,
      mensaje: error.message
    };
  }
}

export function leerDatoLocal(clave, valorDefecto = null) {
  try {
    if (!clave) {
      return valorDefecto;
    }

    const claveFinal = crearClave(clave);
    const valor = localStorage.getItem(claveFinal);

    if (!valor) {
      return valorDefecto;
    }

    return JSON.parse(valor);
  } catch {
    return valorDefecto;
  }
}

export function eliminarDatoLocal(clave) {
  try {
    if (!clave) {
      return {
        ok: false,
        mensaje: "Clave no válida."
      };
    }

    localStorage.removeItem(crearClave(clave));

    return {
      ok: true
    };
  } catch (error) {
    return {
      ok: false,
      mensaje: error.message
    };
  }
}

export function limpiarDatosLocales() {
  try {
    const claves = Object.keys(localStorage);

    claves.forEach((clave) => {
      if (clave.startsWith("video-editor:")) {
        localStorage.removeItem(clave);
      }
    });

    return {
      ok: true
    };
  } catch (error) {
    return {
      ok: false,
      mensaje: error.message
    };
  }
}