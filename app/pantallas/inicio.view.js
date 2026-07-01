export function renderInicioView() {
  return `
    <section class="aj-view-card aj-home-view aj-home-dashboard" data-inicio-root data-proceso-root="inicio" data-proceso-paso-activo="estado-general">
      <section id="inicioMessage" class="inicio-message" hidden></section>

      <section class="inicio-flow" aria-label="Navegación de inicio">
        <button class="inicio-step is-active" type="button" data-inicio-wizard-go="estado" data-proceso-step="estado-general"><span><strong>Estado</strong></span></button>
        <button class="inicio-step is-locked" type="button" data-inicio-wizard-go="accesos" data-proceso-step="accesos-rapidos"><span><strong>Accesos</strong></span></button>
        <button class="inicio-step is-locked" type="button" data-inicio-wizard-go="servidor" data-proceso-step="servidor-local"><span><strong>Servidor</strong></span></button>
        <button class="inicio-step is-advanced" type="button" data-inicio-wizard-go="diagnostico" data-proceso-step="diagnostico-rapido"><span><strong>Diagnóstico</strong></span></button>
        <span class="aj-status-chip" id="inicioStateChip">Sistema listo</span>
      </section>

      <section class="inicio-wizard">
        <article class="inicio-wizard-panel is-active" data-inicio-wizard-panel="estado">
          <div class="inicio-panel-heading">
            <h3>Estado general</h3>
          </div>
          <div class="aj-home-status inicio-status-grid">
            <article><span>Servidor local</span><strong id="inicioServidorEstado">Activo al procesar</strong></article>
            <article><span>Laboratorio</span><strong>Prueba rápida disponible</strong></article>
            <article><span>Diagnóstico</span><strong>Disponible</strong></article>
            <article><span>Flujo recomendado</span><strong>Nuevo proyecto → Entendimiento → Biblioteca → Plan</strong></article>
          </div>
          <div class="inicio-actions-row"><button class="primary-button" type="button" data-inicio-wizard-go="accesos">Elegir acción</button></div>
        </article>

        <article class="inicio-wizard-panel" data-inicio-wizard-panel="accesos" hidden>
          <div class="inicio-panel-heading">
            <h3>Accesos rápidos</h3>
          </div>
          <div class="aj-home-grid aj-home-actions inicio-actions-grid" aria-label="Accesos rápidos">
            <button type="button" data-pantalla-destino="nuevo-proyecto"><strong>Nuevo proyecto</strong><span>Subir video.</span></button>
            <button type="button" data-pantalla-destino="entendimiento"><strong>Entendimiento</strong><span>Revisar transcripción.</span></button>
            <button type="button" data-pantalla-destino="biblioteca"><strong>Biblioteca</strong><span>Recursos del proyecto.</span></button>
            <button type="button" data-pantalla-destino="plan-edicion"><strong>Plan de edición</strong><span>Crear o aprobar.</span></button>
            <button type="button" data-pantalla-destino="laboratorio-efectos"><strong>Laboratorio</strong><span>Probar efecto.</span></button>
            <button type="button" data-pantalla-destino="historial"><strong>Historial</strong><span>Reabrir proyecto.</span></button>
          </div>
        </article>

        <article class="inicio-wizard-panel" data-inicio-wizard-panel="servidor" hidden>
          <div class="inicio-panel-heading">
            <h3>Servidor local</h3>
          </div>
          <div class="inicio-server-card">
            <strong id="inicioServidorTitulo">Servidor local</strong>
            <span id="inicioServidorDetalle">Se activa al procesar y al consultar módulos locales.</span>
            <button class="secondary-button" type="button" data-inicio-action="refresh-server">Actualizar estado</button>
          </div>
        </article>

        <article class="inicio-wizard-panel" data-inicio-wizard-panel="diagnostico" data-proceso-avanzado hidden>
          <div class="inicio-panel-heading">
            <h3>Diagnóstico rápido</h3>
          </div>
          <div class="inicio-diagnostic-card">
            <strong>Revisión recomendada</strong>
            <span>Abre Diagnóstico para revisar el estado general.</span>
            <button class="primary-button" type="button" data-pantalla-destino="diagnostico">Abrir Diagnóstico</button>
          </div>
        </article>
      </section>
    </section>
  `;
}
