/* =========================================================
Nombre completo: verificar-flujo.mjs
Ruta o ubicación: /tools/verificar-flujo.mjs
Funciones principales:
- Verificar que la estructura ideal de 12 pasos exista.
- Verificar que cada paso tenga carpeta index con HTML, CSS y JS.
- Verificar que flujo-editor.js apunte a las rutas nuevas.
- Verificar que app.js y router.js usen la configuración central.
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

const root = process.cwd();

const pasos = [
  { id: "01-video-base-diagnostico", archivos: ["index/vbd.html", "index/vbd.css", "index/vbd.js"] },
  { id: "02-formato-inteligente", archivos: ["index/fin.html", "index/fin.css", "index/fin.js"] },
  { id: "03-transcripcion-analisis", archivos: ["index/tan.html", "index/tan.css", "index/tan.js"] },
  { id: "04-cortes-inteligentes", archivos: ["index/coi.html", "index/coi.css", "index/coi.js"] },
  { id: "05-transiciones-selectivas", archivos: ["index/trs.html", "index/trs.css", "index/trs.js"] },
  { id: "06-audio-principal", archivos: ["index/aud.html", "index/aud.css", "index/aud.js"] },
  { id: "07-musica-sonidos", archivos: ["index/mus.html", "index/mus.css", "index/mus.js"] },
  { id: "08-color-limpieza", archivos: ["index/col.html", "index/col.css", "index/col.js"] },
  { id: "09-recursos-visuales", archivos: ["index/rec.html", "index/rec.css", "index/rec.js"] },
  { id: "10-textos-animaciones", archivos: ["index/tex.html", "index/tex.css", "index/tex.js"] },
  { id: "11-subtitulos-finales", archivos: ["index/sub.html", "index/sub.css", "index/sub.js"] },
  { id: "12-revision-exportacion", archivos: ["index/rev.html", "index/rev.css", "index/rev.js"] }
];

const archivosBase = [
  "package.json",
  "src/index.html",
  "src/app/app.js",
  "src/router/router.js",
  "src/shared/flujo/flujo-editor.js",
  "src/shared/flujo/paso-pendiente.js",
  "src/shared/flujo/paso-pendiente.css",
  "src/shared/proyecto/proyecto-capas.js",
  "electron/main/main.js",
  "electron/preload/preload.js"
];

const errores = [];
const avisos = [];

function existe(relativo) {
  return fs.existsSync(path.join(root, relativo));
}

function leer(relativo) {
  const absoluto = path.join(root, relativo);
  return fs.readFileSync(absoluto, "utf8");
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

function verificarEstructura() {
  for (const archivo of archivosBase) {
    verificarExiste(archivo);
  }

  for (const paso of pasos) {
    const carpeta = `src/pantallas/${paso.id}`;
    verificarExiste(carpeta, "carpeta");

    for (const archivo of paso.archivos) {
      verificarExiste(`${carpeta}/${archivo}`);
    }
  }
}

function verificarFlujoCentral() {
  const flujo = "src/shared/flujo/flujo-editor.js";
  if (!verificarExiste(flujo)) return;

  for (const paso of pasos) {
    verificarContenido(flujo, `"${paso.id}"`, `ruta ${paso.id}`);

    for (const archivo of paso.archivos) {
      verificarContenido(flujo, `./pantallas/${paso.id}/${archivo}`, `archivo ${archivo} de ${paso.id}`);
    }
  }

  verificarContenido(flujo, "ACCIONES_PRINCIPALES_EDITOR", "acciones principales del botón flotante");
}

function verificarAppRouter() {
  verificarContenido("src/app/app.js", "RUTA_INICIAL = \"01-video-base-diagnostico\"", "ruta inicial nueva");
  verificarContenido("src/app/app.js", "RUTA_FINAL = \"12-revision-exportacion\"", "ruta final nueva");
  verificarContenido("src/app/app.js", "ACCIONES_PRINCIPALES_EDITOR", "acciones del flujo central");
  verificarContenido("src/router/router.js", "RUTAS_EDITOR", "rutas centralizadas");
  verificarContenido("src/index.html", "./shared/flujo/paso-pendiente.css", "CSS compartido de pasos funcionales");
}

function verificarPackage() {
  if (!verificarExiste("package.json")) return;

  const pkg = JSON.parse(leer("package.json"));
  if (pkg.main !== "electron/main/main.js") {
    errores.push("package.json: main debe ser electron/main/main.js");
  }
  if (!pkg.scripts?.start) {
    errores.push("package.json: falta script npm start");
  }
  if (!pkg.scripts?.verify) {
    avisos.push("package.json: falta script npm run verify");
  }
}

function imprimirResultado() {
  console.log("\nVerificación de flujo profesional");
  console.log("================================");
  console.log(`Pasos revisados: ${pasos.length}`);
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

  console.log("\nResultado: ESTRUCTURA OK. Puedes ejecutar npm start.");
}

verificarEstructura();
verificarFlujoCentral();
verificarAppRouter();
verificarPackage();
imprimirResultado();
