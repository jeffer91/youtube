/*
  Bloque 9
  Funcion: pintar tarjetas de resultado por plataforma y resumen de Produccion.
*/

function escapar(texto = '') {
  return String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function formatoPeso(bytes) {
  const numero = Number(bytes || 0);
  if (!numero) return '';
  return `${(numero / (1024 * 1024)).toFixed(1)} MB`;
}

function obtenerResultadoPlataformas(datos = {}) {
  return datos.resultadoPlataformas || datos.modular?.resultadoPlataformas || null;
}

function obtenerProduccion(datos = {}) {
  return datos.produccion || datos.modular?.produccion || null;
}

function obtenerResumenModular(datos = {}) {
  const modular = datos.modular || {};
  if (!modular.ok) return '';
  const perfil = modular.perfil?.nombre || modular.perfil?.id || 'General';
  const plataformas = modular.plataformas?.join(', ') || 'plataforma actual';
  const elementos = modular.produccion?.elementos?.length || 0;
  return `Perfil: ${perfil} · Plataformas: ${plataformas} · Elementos en Produccion: ${elementos}`;
}

function renderTarjetaPlataforma(item = {}) {
  const exportado = item.estado === 'exportado' && item.urlPublica;
  const estado = exportado ? 'Exportado' : 'Pendiente';
  const peso = formatoPeso(item.pesoBytes);
  const enlace = exportado ? `<a class="platform-download" href="${escapar(item.urlPublica)}" download>Descargar</a>` : '<span class="platform-pending">Pendiente de render final</span>';
  return `
    <article class="platform-result-card ${exportado ? 'is-exported' : 'is-pending'}">
      <div>
        <strong>${escapar(item.nombre || item.plataforma)}</strong>
        <span>${escapar(item.formato || '')}${item.width && item.height ? ` · ${item.width}x${item.height}` : ''}</span>
      </div>
      <p>${escapar(item.mensaje || estado)}</p>
      <footer><small>${estado}${peso ? ` · ${peso}` : ''}</small>${enlace}</footer>
    </article>
  `;
}

export function limpiarResultadoPlataformasUI(elementos = {}) {
  if (elementos.resultPlatformsPanel) elementos.resultPlatformsPanel.hidden = true;
  if (elementos.resultPlatformsList) elementos.resultPlatformsList.innerHTML = '';
  if (elementos.resultPlatformsSummary) elementos.resultPlatformsSummary.textContent = '';
  if (elementos.productionSummary) {
    elementos.productionSummary.hidden = true;
    elementos.productionSummary.textContent = '';
  }
  if (elementos.modularSummary) {
    elementos.modularSummary.hidden = true;
    elementos.modularSummary.textContent = '';
  }
}

export function mostrarResultadoPlataformasUI(datos = {}, elementos = {}) {
  const resultadoPlataformas = obtenerResultadoPlataformas(datos);
  const produccion = obtenerProduccion(datos);
  const resumenModular = obtenerResumenModular(datos);

  if (resumenModular && elementos.modularSummary) {
    elementos.modularSummary.hidden = false;
    elementos.modularSummary.textContent = resumenModular;
  }

  if (produccion && elementos.productionSummary) {
    const total = produccion.elementos?.length || 0;
    const pendientes = produccion.pendientes ?? produccion.elementos?.filter((item) => !item.aprobado && !item.rechazado).length ?? 0;
    elementos.productionSummary.hidden = false;
    elementos.productionSummary.textContent = `Produccion preparada: ${total} elementos · ${pendientes} pendiente(s) de revision.`;
  }

  if (!resultadoPlataformas?.resultados?.length || !elementos.resultPlatformsPanel || !elementos.resultPlatformsList) return;

  elementos.resultPlatformsPanel.hidden = false;
  if (elementos.resultPlatformsSummary) {
    elementos.resultPlatformsSummary.textContent = `${resultadoPlataformas.exportadas || 0} exportada(s) · ${resultadoPlataformas.pendientes || 0} pendiente(s).`;
  }
  elementos.resultPlatformsList.innerHTML = resultadoPlataformas.resultados.map(renderTarjetaPlataforma).join('');
}
