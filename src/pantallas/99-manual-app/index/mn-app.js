/* =========================================================
Nombre completo: mn-app.js
Ruta o ubicación: /src/pantallas/99-manual-app/index/mn-app.js
Funciones principales:
- Iniciar el manual interno de la app.
- Mostrar estado de Google Sheets como base principal.
- Guardar configuración local de Google Sheets.
- Probar conexión sin salir del programa.
Con qué se conecta:
- mn-app.html
- mn-app.css
- router.js
- gs-estado-db.service.js
========================================================= */

import {
  obtenerEstadoBasePrincipalGS,
  guardarConfiguracionBasePrincipalGS,
  probarConexionBasePrincipalGS,
  crearTextoEstadoBasePrincipalGS
} from "../../../shared/google-sheets/gs-estado-db.service.js";

function obtenerElementosManual() {
  return {
    raiz: document.getElementById("mnRoot"),
    estado: document.getElementById("mnGsEstado"),
    spreadsheetId: document.getElementById("mnGsSpreadsheetId"),
    webAppUrl: document.getElementById("mnGsWebAppUrl"),
    guardar: document.getElementById("mnGsGuardarConfig"),
    probar: document.getElementById("mnGsProbarConexion")
  };
}

function pintarEstado(elementos, estado) {
  if (!elementos.estado) {
    return;
  }

  const clase = estado?.conectado
    ? "is-ok"
    : estado?.configurado
      ? "is-warn"
      : "is-error";

  elementos.estado.className = `mn-db-status ${clase}`;
  elementos.estado.innerHTML = `
    <strong>${crearTextoEstadoBasePrincipalGS(estado)}</strong>
    <span>Proveedor: ${estado?.metadata?.nombreVisible || "Google Sheets"}</span>
    <span>Rol: ${estado?.metadata?.rol || "BASE_PRINCIPAL"}</span>
    <span>Estado: ${estado?.estado || "SIN_VERIFICAR"}</span>
  `;

  if (elementos.spreadsheetId && estado?.config?.spreadsheetId) {
    elementos.spreadsheetId.value = estado.config.spreadsheetId;
  }
}

function pintarResultadoTemporal(elementos, mensaje, tipo = "warn") {
  if (!elementos.estado) {
    return;
  }

  elementos.estado.className = `mn-db-status is-${tipo}`;
  elementos.estado.innerHTML = `<strong>${mensaje}</strong>`;
}

async function cargarEstadoGoogleSheets(elementos, estadoApp) {
  const estado = await obtenerEstadoBasePrincipalGS();

  pintarEstado(elementos, estado);

  if (estadoApp?.establecerEstadoBasePrincipal) {
    estadoApp.establecerEstadoBasePrincipal({
      configurado: Boolean(estado.configurado),
      conectado: Boolean(estado.conectado),
      estado: estado.estado,
      mensaje: estado.mensaje
    });
  }
}

async function guardarConfiguracion(elementos, estadoApp) {
  pintarResultadoTemporal(elementos, "Guardando configuración de Google Sheets...", "warn");

  const resultado = await guardarConfiguracionBasePrincipalGS({
    spreadsheetId: elementos.spreadsheetId?.value || "",
    webAppUrl: elementos.webAppUrl?.value || ""
  });

  if (!resultado.ok) {
    pintarResultadoTemporal(
      elementos,
      (resultado.errores || []).join(" | ") || resultado.mensaje || "No se pudo guardar la configuración.",
      "error"
    );
    return;
  }

  await cargarEstadoGoogleSheets(elementos, estadoApp);
}

async function probarConexion(elementos, estadoApp) {
  pintarResultadoTemporal(elementos, "Probando conexión con Google Sheets...", "warn");

  const resultado = await probarConexionBasePrincipalGS();

  pintarEstado(elementos, {
    ...resultado,
    configurado: true,
    config: {
      spreadsheetId: elementos.spreadsheetId?.value || "",
      webAppUrlConfigurada: true
    }
  });

  if (estadoApp?.establecerEstadoBasePrincipal) {
    estadoApp.establecerEstadoBasePrincipal({
      configurado: true,
      conectado: Boolean(resultado.ok),
      estado: resultado.estado,
      mensaje: resultado.mensaje
    });
  }
}

function conectarEventos(elementos, estadoApp) {
  if (elementos.guardar) {
    elementos.guardar.addEventListener("click", () => {
      guardarConfiguracion(elementos, estadoApp);
    });
  }

  if (elementos.probar) {
    elementos.probar.addEventListener("click", () => {
      probarConexion(elementos, estadoApp);
    });
  }
}

export async function iniciarPantallaManualApp({ estadoApp } = {}) {
  const elementos = obtenerElementosManual();

  if (!elementos.raiz) {
    return;
  }

  elementos.raiz.dataset.manualActivo = "true";
  conectarEventos(elementos, estadoApp);
  await cargarEstadoGoogleSheets(elementos, estadoApp);
}
