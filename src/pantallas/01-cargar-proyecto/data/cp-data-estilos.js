/* =========================================================
Nombre completo: cp-data-estilos.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/data/cp-data-estilos.js
Funciones principales:
- Guardar los estilos disponibles para cargar proyecto.
- Mantener el selector de estilo limpio.
- Evitar escribir estilos directamente en el HTML.
========================================================= */

export const CP_ESTILOS_PROYECTO = [
  {
    id: "futbol",
    nombre: "Fútbol"
  },
  {
    id: "anime",
    nombre: "Anime"
  },
  {
    id: "educacion",
    nombre: "Educación"
  },
  {
    id: "institucional",
    nombre: "Institucional"
  },
  {
    id: "historias",
    nombre: "Historias"
  },
  {
    id: "generico",
    nombre: "Genérico"
  }
];

export function obtenerEstilosProyecto() {
  return [...CP_ESTILOS_PROYECTO];
}

export function existeEstiloProyecto(estiloId) {
  return CP_ESTILOS_PROYECTO.some((estilo) => estilo.id === estiloId);
}

export function obtenerNombreEstilo(estiloId) {
  const estilo = CP_ESTILOS_PROYECTO.find((item) => item.id === estiloId);

  return estilo ? estilo.nombre : "";
}