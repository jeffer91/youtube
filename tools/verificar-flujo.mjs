/* =========================================================
Nombre completo: verificar-flujo.mjs
Ruta o ubicación: /tools/verificar-flujo.mjs
Funciones principales:
- Verificar que la estructura ideal de 12 pasos exista.
- Verificar que cada paso tenga carpeta index con HTML, CSS y JS.
- Verificar que flujo-editor.js apunte a rutas resolubles según cómo carga la app.
- Verificar que cada JS exporte la función inicial definida en el flujo.
- Verificar que app.js, router.js, main.js, preload.js y package.json estén alineados.
- Servir como prueba rápida antes de ejecutar npm start.
Con qué se conecta:
- src/shared/flujo/flujo-editor.js
- src/app/app.js
- src/router/router.js
- src/pantallas/*
========================================================= */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const errores = [];
const avisos = [];

const FLUJO_REL = "src/shared/flujo/flujo-editor.js";
const APP_REL = "src/app/app.js";
const ROUTER_REL = "src/router/router.js";
const INDEX_REL = "src/index.html";
const MAIN_REL = "electron/main/main.js";
const PRELOAD_REL = "electron/preload/preload.js";
const PACKAGE_REL = "package.json";

const PASOS_OBLIGATORIOS = [
  "01-video-base-diagnostico",
  "02-formato-inteligente",
  "03-transcripcion-analisis",
  "04-cortes-inteligentes",
  "05-transiciones-selectivas",
  "06-audio-principal",
  "07-musica-sonidos",
  "08-color-limpieza",
  "09-recursos-visuales",
  "10-textos-animaciones",
  "11-subtitulos-finales",
  "12-revision-exportacion"
];

function rutaAbs(relativo) {
  return path.join(root, relativo);
}

function existe(relativo) {
  return fs.existsSync(rutaAbs(relativo));
}

function leer(relativo) {
  return fs.readFileSync(rutaAbs(relativo), "utf8");
}

function verificarExiste(relativo, tipo = "archivo") {
  if (!existe(relativo)) {
    errores.push(`Falta ${tipo}: ${relativo}`);
    return false;
  }
  return true;
}

function verificarContenido(relativo, texto, descripcion) {
  if (!verificarExiste(relativo)) return;
  const contenido = leer(relativo);
  if (!contenido.includes(texto)) {
    errores.push(`${relativo}: no contiene ${descripcion || texto}`);
  }
}

function normalizarSeparadores(valor) {
  return String(valor || "").replace(/\\/g, "/");
}

function rutaRelativaDesdeRoot(absoluta) {
  return normalizarSeparadores(path.relative(root, absoluta));
}

function resolverRutaHtmlCssDesdeIndex(ruta) {
  return path.resolve(path.dirname(rutaAbs(INDEX_REL)), ruta);
}

function resolverRutaJsDesdeRouter(ruta) {
  return path.resolve(path.dirname(rutaAbs(ROUTER_REL)), ruta);
}

async function cargarFlujoEditor() {
  if (!verificarExiste(FLUJO_REL)) return null;

  try {
    return await import(pathToFileURL(rutaAbs(FLUJO_REL)).href);
  } catch (error) {
    errores.push(`${FLUJO_REL}: no se pudo importar. ${error.message}`);
    return null;
  }
}

function verificarBase() {
  [
    PACKAGE_REL,
    INDEX_REL,
    APP_REL,
    ROUTER_REL,
    FLUJO_REL,
    "src/shared/flujo/paso-pendiente.js",
    "src/shared/flujo/paso-pendiente.css",
    "src/shared/proyecto/proyecto-capas.js",
    MAIN_REL,
    PRELOAD_REL
  ].forEach((archivo) => verificarExiste(archivo));
}

function verificarPackage() {
  if (!verificarExiste(PACKAGE_REL)) return;

  try {
    const pkg = JSON.parse(leer(PACKAGE_REL));

    if (pkg.main !== "electron/main/main.js") {
      errores.push("package.json: main debe ser electron/main/main.js");
    }

    if (pkg.scripts?.start !== "electron .") {
      errores.push("package.json: el script start debe ser electron .");
    }

    if (pkg.scripts?.verify !== "node tools/verificar-flujo.mjs") {
      errores.push("package.json: el script verify debe ejecutar tools/verificar-flujo.mjs");
    }

    if (!pkg.devDependencies?.electron) {
      errores.push("package.json: falta electron en devDependencies");
    }

    if (pkg.devDependencies?.electron === "latest") {
      errores.push("package.json: no uses electron: latest; fija una versión estable.");
    }

    if (!pkg.engines?.node) {
      avisos.push("package.json: conviene declarar engines.node para evitar instalaciones con Node incompatible.");
    }
  } catch (error) {
    errores.push(`package.json: JSON inválido. ${error.message}`);
  }
}

function verificarPackageLockSiExiste() {
  if (!existe("package-lock.json")) {
    avisos.push("package-lock.json no existe. Se regenerará con npm install.");
    return;
  }

  try {
    const pkg = JSON.parse(leer(PACKAGE_REL));
    const lock = JSON.parse(leer("package-lock.json"));
    const electronPkg = pkg.devDependencies?.electron || "";
    const electronLock = lock.packages?.[""]?.devDependencies?.electron || "";

    if (electronPkg && electronLock && electronPkg !== electronLock) {
      errores.push(`package-lock.json: electron (${electronLock}) no coincide con package.json (${electronPkg}).`);
    }
  } catch (error) {
    errores.push(`package-lock.json: no se pudo validar. ${error.message}`);
  }
}

function verificarAppRouter() {
  verificarContenido(APP_REL, "RUTA_INICIAL = \"01-video-base-diagnostico\"", "ruta inicial del flujo nuevo");
  verificarContenido(APP_REL, "RUTA_FINAL = \"12-revision-exportacion\"", "ruta final del flujo nuevo");
  verificarContenido(APP_REL, "ACCIONES_PRINCIPALES_EDITOR", "acciones principales del botón flotante");
  verificarContenido(ROUTER_REL, "RUTAS_EDITOR", "rutas centralizadas del flujo");
  verificarContenido(INDEX_REL, "./shared/flujo/paso-pendiente.css", "CSS compartido de pasos provisionales");
  verificarContenido(MAIN_REL, "ventanaPrincipal.loadFile", "carga de src/index.html");
  verificarContenido(PRELOAD_REL, "contextBridge.exposeInMainWorld", "puente seguro de Electron");
}

function verificarRutaArchivo(abs, descripcion) {
  if (!fs.existsSync(abs)) {
    errores.push(`No existe ${descripcion}: ${rutaRelativaDesdeRoot(abs)}`);
    return false;
  }
  return true;
}

function verificarExportInicial(absJs, nombreFuncion, routeId) {
  if (!nombreFuncion) return;
  if (!fs.existsSync(absJs)) return;

  const contenido = fs.readFileSync(absJs, "utf8");
  const patronExportFunction = new RegExp(`export\\s+(async\\s+)?function\\s+${nombreFuncion}\\s*\\(`);
  const patronExportConst = new RegExp(`export\\s+const\\s+${nombreFuncion}\\s*=`);

  if (!patronExportFunction.test(contenido) && !patronExportConst.test(contenido)) {
    errores.push(`${rutaRelativaDesdeRoot(absJs)}: no exporta ${nombreFuncion} para la ruta ${routeId}.`);
  }
}

function verificarRutasEditor({ RUTAS_EDITOR, ACCIONES_PRINCIPALES_EDITOR }) {
  if (!RUTAS_EDITOR || typeof RUTAS_EDITOR !== "object") {
    errores.push("flujo-editor.js: no exporta RUTAS_EDITOR.");
    return;
  }

  if (!ACCIONES_PRINCIPALES_EDITOR || typeof ACCIONES_PRINCIPALES_EDITOR !== "object") {
    errores.push("flujo-editor.js: no exporta ACCIONES_PRINCIPALES_EDITOR.");
  }

  PASOS_OBLIGATORIOS.forEach((id, index) => {
    const ruta = RUTAS_EDITOR[id];
    if (!ruta) {
      errores.push(`flujo-editor.js: falta ruta obligatoria ${id}.`);
      return;
    }

    const numeroEsperado = String(index + 1).padStart(2, "0");
    if (ruta.numero !== numeroEsperado) {
      errores.push(`${id}: número esperado ${numeroEsperado}, recibido ${ruta.numero}.`);
    }

    const carpeta = `src/pantallas/${id}/index`;
    verificarExiste(carpeta, "carpeta");

    if (ruta.html) {
      verificarRutaArchivo(resolverRutaHtmlCssDesdeIndex(ruta.html), `HTML de ${id}`);
    } else {
      errores.push(`${id}: falta ruta html.`);
    }

    if (ruta.css) {
      verificarRutaArchivo(resolverRutaHtmlCssDesdeIndex(ruta.css), `CSS de ${id}`);
    } else {
      errores.push(`${id}: falta ruta css.`);
    }

    if (ruta.js) {
      const absJs = resolverRutaJsDesdeRouter(ruta.js);
      verificarRutaArchivo(absJs, `JS de ${id}`);
      verificarExportInicial(absJs, ruta.init, id);
    } else if (ruta.init) {
      errores.push(`${id}: tiene init pero no tiene ruta js.`);
    }

    if (index < PASOS_OBLIGATORIOS.length - 1) {
      const siguienteEsperado = PASOS_OBLIGATORIOS[index + 1];
      if (ruta.siguiente !== siguienteEsperado) {
        errores.push(`${id}: siguiente esperado ${siguienteEsperado}, recibido ${ruta.siguiente}.`);
      }
    }

    if (index === PASOS_OBLIGATORIOS.length - 1 && ruta.siguiente !== null) {
      errores.push(`${id}: la última ruta debe tener siguiente null.`);
    }
  });
}

function imprimirResultado() {
  console.log("\nVerificación de flujo profesional");
  console.log("================================");
  console.log(`Pasos revisados: ${PASOS_OBLIGATORIOS.length}`);
  console.log(`Errores: ${errores.length}`);
  console.log(`Avisos: ${avisos.length}`);

  if (avisos.length) {
    console.log("\nAvisos:");
    for (const aviso of avisos) console.log(`- ${aviso}`);
  }

  if (errores.length) {
    console.log("\nErrores:");
    for (const error of errores) console.log(`- ${error}`);
    console.log("\nResultado: REVISAR ANTES DE PROBAR.");
    process.exitCode = 1;
    return;
  }

  console.log("\nResultado: ESTRUCTURA OK. Puedes ejecutar npm install y npm start.");
}

verificarBase();
verificarPackage();
verificarPackageLockSiExiste();
verificarAppRouter();

const flujo = await cargarFlujoEditor();
if (flujo) {
  verificarRutasEditor(flujo);
}

imprimirResultado();
