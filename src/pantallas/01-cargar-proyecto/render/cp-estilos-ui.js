/* =========================================================
Nombre completo: cp-estilos-ui.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/render/cp-estilos-ui.js
Funciones principales:
- Renderizar el selector de estilos del proyecto.
- Mantener el selector limpio y corto.
- Marcar el estilo seleccionado.
- Conectar cambios con el servicio de pantalla.
========================================================= */

import { obtenerEstilosProyecto } from "../data/cp-data-estilos.js";

export function crearOpcionesEstilo(estiloSeleccionado = "") {
  const estilos = obtenerEstilosProyecto();

  const opciones = estilos
    .map((estilo) => {
      const seleccionado = estilo.id === estiloSeleccionado ? "selected" : "";

      return `
        <option value="${estilo.id}" ${seleccionado}>
          ${estilo.nombre}
        </option>
      `;
    })
    .join("");

  return `
    <option value="">Elige un estilo</option>
    ${opciones}
  `;
}

export function renderSelectorEstilos({ contenedor, estiloSeleccionado }) {
  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = `
    <label class="cp-field">
      <span>Estilo</span>
      <select id="cpEstiloProyecto" class="cp-input">
        ${crearOpcionesEstilo(estiloSeleccionado)}
      </select>
    </label>
  `;
}

export function conectarSelectorEstilos({ service }) {
  const selector = document.getElementById("cpEstiloProyecto");

  if (!selector || !service?.actualizarEstilo) {
    return;
  }

  selector.addEventListener("change", () => {
    service.actualizarEstilo(selector.value);
  });
}