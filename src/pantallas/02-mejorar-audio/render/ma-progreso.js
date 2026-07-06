/* =========================================================
Nombre completo: ma-progreso.js
Ruta o ubicación: /src/pantallas/02-mejorar-audio/render/ma-progreso.js
Funciones principales:
- Renderizar la barra de progreso general de Mejorar audio.
- Mostrar total, procesados, porcentaje y video actual.
- Mostrar resumen final del lote de audio.
- Mantener separado el progreso para no crecer ma.js.
Con qué se conecta:
- ma.js
- ma-service.js
- ma-lote.js
- ma.css
========================================================= */

function escaparHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarNumero(valor, respaldo = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : respaldo;
}

function limitarPorcentaje(valor) {
  return Math.max(0, Math.min(100, normalizarNumero(valor, 0)));
}

function debeMostrarProgreso(progreso) {
  if (!progreso || typeof progreso !== "object") {
    return false;
  }

  return Boolean(
    progreso.activo ||
    progreso.total ||
    progreso.procesados ||
    progreso.estado === "FINALIZADO" ||
    progreso.estado === "ERROR"
  );
}

function obtenerTituloProgreso(progreso) {
  if (progreso.estado === "FINALIZADO") {
    return "Audio mejorado en todos los videos";
  }

  if (progreso.estado === "ERROR") {
    return "Revisión necesaria en audio";
  }

  if (progreso.activo) {
    return "Mejorando audio de todos los videos";
  }

  return "Progreso de audio";
}

function obtenerTextoConteo(progreso) {
  const procesados = normalizarNumero(progreso.procesados, 0);
  const total = normalizarNumero(progreso.total, 0);

  if (!total) {
    return "Sin videos en proceso";
  }

  return `Procesados ${procesados} de ${total}`;
}

function obtenerTextoActual(progreso) {
  const actualNombre = String(progreso.actualNombre || "").trim();
  const actualIndice = normalizarNumero(progreso.actualIndice, 0);
  const total = normalizarNumero(progreso.total, 0);

  if (progreso.estado === "FINALIZADO") {
    return "Todos los videos quedaron listos para continuar.";
  }

  if (progreso.estado === "ERROR") {
    return "Hay videos que necesitan revisión antes de continuar.";
  }

  if (actualNombre && actualIndice && total) {
    return `Video actual ${actualIndice} de ${total}: ${actualNombre}`;
  }

  return progreso.mensaje || "Preparando procesamiento de audio.";
}

function obtenerClaseEstado(progreso) {
  if (progreso.estado === "FINALIZADO") {
    return "ma-progress--ok";
  }

  if (progreso.estado === "ERROR") {
    return "ma-progress--error";
  }

  if (progreso.activo) {
    return "ma-progress--active";
  }

  return "";
}

export function renderProgresoMA({ contenedor, progreso }) {
  if (!contenedor) {
    return;
  }

  if (!debeMostrarProgreso(progreso)) {
    contenedor.innerHTML = "";
    return;
  }

  const porcentaje = limitarPorcentaje(progreso.porcentaje);
  const mejorados = normalizarNumero(progreso.mejorados, 0);
  const fallidos = normalizarNumero(progreso.fallidos, 0);
  const claseEstado = obtenerClaseEstado(progreso);

  contenedor.innerHTML = `
    <section class="ma-progress ${claseEstado}" aria-label="Progreso general de mejora de audio">
      <div class="ma-progress__head">
        <div>
          <strong>${escaparHtml(obtenerTituloProgreso(progreso))}</strong>
          <span>${escaparHtml(obtenerTextoActual(progreso))}</span>
        </div>
        <b>${porcentaje}%</b>
      </div>

      <div class="ma-progress__bar" aria-hidden="true">
        <span style="width: ${porcentaje}%"></span>
      </div>

      <div class="ma-progress__meta">
        <span>${escaparHtml(obtenerTextoConteo(progreso))}</span>
        <span>${mejorados} listo(s)</span>
        <span>${fallidos} con revisión</span>
      </div>
    </section>
  `;
}
