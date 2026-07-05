/* =========================================================
Nombre completo: cp-pasos.js
Ruta o ubicación: /src/pantallas/01-cargar-proyecto/render/cp-pasos.js
Funciones principales:
- Renderizar los 3 pasos de Cargar proyecto.
- Marcar el paso activo.
- Mostrar contenido corto por paso.
- Conectar botones Atrás y Siguiente.
- Mantener la pantalla simple y ordenada.
========================================================= */

const CP_PASOS = [
  {
    numero: 1,
    titulo: "Cargar videos",
    texto: "Carga tus videos para empezar."
  },
  {
    numero: 2,
    titulo: "Ordenar videos",
    texto: "Organiza el orden del proyecto."
  },
  {
    numero: 3,
    titulo: "Nombre y estilo",
    texto: "Completa los datos del proyecto."
  }
];

function crearItemPaso(paso, pasoActual) {
  const activo = paso.numero === pasoActual ? "is-active" : "";
  const completado = paso.numero < pasoActual ? "is-done" : "";

  return `
    <button
      class="cp-step ${activo} ${completado}"
      type="button"
      data-cp-paso="${paso.numero}"
    >
      <span class="cp-step__number">${paso.numero}</span>
      <span class="cp-step__info">
        <strong>${paso.titulo}</strong>
        <small>${paso.texto}</small>
      </span>
    </button>
  `;
}

export function renderPasos({ contenedor, pasoActual }) {
  if (!contenedor) {
    return;
  }

  const pasosHtml = CP_PASOS
    .map((paso) => crearItemPaso(paso, pasoActual))
    .join("");

  contenedor.innerHTML = `
    <div class="cp-steps">
      ${pasosHtml}
    </div>
  `;
}

export function conectarPasos({ service }) {
  const botones = document.querySelectorAll("[data-cp-paso]");

  botones.forEach((boton) => {
    boton.addEventListener("click", () => {
      const paso = Number(boton.dataset.cpPaso);
      service.irAPaso(paso);
    });
  });
}

export function renderContenidoPaso({ contenedor, estado }) {
  if (!contenedor) {
    return;
  }

  const pasoActual = Number(estado.pasoActual || 1);

  if (pasoActual === 1) {
    contenedor.innerHTML = `
      <section class="cp-panel">
        <div class="cp-panel__head">
          <div>
            <h3>Cargar videos</h3>
            <p>Carga tus videos para empezar.</p>
          </div>
        </div>

        <div class="cp-upload">
          <div class="cp-upload__icon">+</div>
          <h4>Selecciona tus videos</h4>
          <p>Formatos: MP4, MOV, AVI, MKV y WEBM.</p>

          <button id="cpBtnCargarVideos" class="app-btn" type="button">
            Cargar videos
          </button>
        </div>
      </section>
    `;
    return;
  }

  if (pasoActual === 2) {
    contenedor.innerHTML = `
      <section class="cp-panel">
        <div class="cp-panel__head">
          <div>
            <h3>Ordenar videos</h3>
            <p>Arrastra o usa las flechas.</p>
          </div>
        </div>

        <div id="cpListaVideos" class="cp-video-list"></div>
      </section>
    `;
    return;
  }

  contenedor.innerHTML = `
    <section class="cp-panel">
      <div class="cp-panel__head">
        <div>
          <h3>Nombre y estilo</h3>
          <p>Completa los datos para guardar.</p>
        </div>
      </div>

      <div class="cp-form">
        <label class="cp-field">
          <span>Nombre del proyecto</span>
          <input
            id="cpNombreProyecto"
            class="cp-input"
            type="text"
            placeholder="Ejemplo: Video fútbol 1"
            maxlength="80"
            value="${estado.nombre || ""}"
          />
        </label>

        <div id="cpSelectorEstilos"></div>
      </div>
    </section>
  `;
}

export function renderBotonesNavegacion({ contenedor, estado }) {
  if (!contenedor) {
    return;
  }

  const pasoActual = Number(estado.pasoActual || 1);
  const totalPasos = Number(estado.totalPasos || 3);
  const esPrimero = pasoActual <= 1;
  const esUltimo = pasoActual >= totalPasos;

  contenedor.innerHTML = `
    <div class="cp-actions">
      <button
        id="cpBtnAtras"
        class="app-btn app-btn--ghost"
        type="button"
        ${esPrimero ? "disabled" : ""}
      >
        Atrás
      </button>

      ${
        esUltimo
          ? `
            <button
              id="cpBtnGuardar"
              class="app-btn"
              type="button"
              ${estado.guardando ? "disabled" : ""}
            >
              ${estado.guardando ? "Guardando..." : "Guardar y continuar"}
            </button>
          `
          : `
            <button id="cpBtnSiguiente" class="app-btn" type="button">
              Siguiente
            </button>
          `
      }
    </div>
  `;
}

export function conectarBotonesNavegacion({ service, onGuardar }) {
  const btnAtras = document.getElementById("cpBtnAtras");
  const btnSiguiente = document.getElementById("cpBtnSiguiente");
  const btnGuardar = document.getElementById("cpBtnGuardar");

  if (btnAtras) {
    btnAtras.addEventListener("click", () => {
      service.pasoAnterior();
    });
  }

  if (btnSiguiente) {
    btnSiguiente.addEventListener("click", () => {
      service.siguientePaso();
    });
  }

  if (btnGuardar) {
    btnGuardar.addEventListener("click", () => {
      if (typeof onGuardar === "function") {
        onGuardar();
      }
    });
  }
}

export function conectarCamposPasoTres({ service }) {
  const inputNombre = document.getElementById("cpNombreProyecto");

  if (!inputNombre) {
    return;
  }

  inputNombre.addEventListener("change", () => {
    service.actualizarNombre(inputNombre.value);
  });
}