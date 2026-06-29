export function renderInicioView() {
  return `
    <section class="aj-view-card aj-home-view aj-home-dashboard" data-inicio-root data-proceso-root="inicio" data-proceso-paso-activo="estado-general">
      <div class="aj-home-hero inicio-hero">
        <div>
          <p class="eyebrow">Panel principal</p>
          <h2>AutoVideoJeff</h2>
          <p>Editor automático modular para subir, procesar, probar efectos y revisar videos. El inicio ahora guía qué hacer primero, sin mostrar todas las rutas al mismo tiempo.</p>
        </div>
        <span class="aj-status-chip" id="inicioStateChip">Sistema listo</span>
      </div>

      <div data-proceso-resumen="inicio"></div>

      <section class="inicio-flow" aria-label="Flujo guiado de inicio">
        <button class="inicio-step is-active" type="button" data-inicio-wizard-go="estado" data-proceso-step="estado-general"><b>1</b><span><strong>Estado</strong><small>Resumen general</small></span></button>
        <button class="inicio-step is-locked" type="button" data-inicio-wizard-go="accesos" data-proceso-step="accesos-rapidos"><b>2</b><span><strong>Accesos</strong><small>Qué quieres hacer</small></span></button>
        <button class="inicio-step is-locked" type="button" data-inicio-wizard-go="servidor" data-proceso-step="servidor-local"><b>3</b><span><strong>Servidor</strong><small>Estado local</small></span></button>
        <button class="inicio-step is-advanced" type="button" data-inicio-wizard-go="diagnostico" data-proceso-step="diagnostico-rapido"><b>+</b><span><strong>Diagnóstico</strong><small>Revisión rápida</small></span></button>
      </section>

      <section id="inicioMessage" class="inicio-message" hidden></section>

      <section class="inicio-wizard">
        <article class="inicio-wizard-panel is-active" data-inicio-wizard-panel="estado">
          <div class="inicio-panel-heading">
            <p class="eyebrow">Paso 1</p>
            <h3>Estado general de la app</h3>
            <p>Primero revisa si quieres iniciar un proyecto, continuar uno existente o probar herramientas antes de producir.</p>
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
            <p class="eyebrow">Paso 2</p>
            <h3>Accesos rápidos</h3>
            <p>Elige solo la acción que necesitas ahora. Cada botón abre su pantalla sin cambiar la funcionalidad existente.</p>
          </div>
          <div class="aj-home-grid aj-home-actions inicio-actions-grid" aria-label="Accesos rápidos">
            <button type="button" data-pantalla-destino="nuevo-proyecto"><strong>Nuevo proyecto</strong><span>Subir video y elegir perfil.</span></button>
            <button type="button" data-pantalla-destino="entendimiento"><strong>Continuar Entendimiento</strong><span>Cargar proyecto y revisar transcripción.</span></button>
            <button type="button" data-pantalla-destino="biblioteca"><strong>Biblioteca</strong><span>Recursos generales o del proyecto.</span></button>
            <button type="button" data-pantalla-destino="plan-edicion"><strong>Plan de edición</strong><span>Crear, revisar o aprobar plan.</span></button>
            <button type="button" data-pantalla-destino="laboratorio-efectos"><strong>Laboratorio de efectos</strong><span>Probar un solo efecto en un clip corto.</span></button>
            <button type="button" data-pantalla-destino="historial"><strong>Historial</strong><span>Reabrir proyectos previos.</span></button>
          </div>
        </article>

        <article class="inicio-wizard-panel" data-inicio-wizard-panel="servidor" hidden>
          <div class="inicio-panel-heading">
            <p class="eyebrow">Paso 3</p>
            <h3>Servidor local</h3>
            <p>Consulta el estado del servidor cuando necesites confirmar si la app está lista para llamadas API locales.</p>
          </div>
          <div class="inicio-server-card">
            <strong id="inicioServidorTitulo">Servidor local</strong>
            <span id="inicioServidorDetalle">Se activa al procesar y al consultar módulos locales.</span>
            <button class="secondary-button" type="button" data-inicio-action="refresh-server">Actualizar estado</button>
          </div>
        </article>

        <article class="inicio-wizard-panel" data-inicio-wizard-panel="diagnostico" data-proceso-avanzado hidden>
          <div class="inicio-panel-heading">
            <p class="eyebrow">Avanzado</p>
            <h3>Diagnóstico rápido</h3>
            <p>Usa este acceso cuando algo no cargue, una ruta falle o quieras revisar el estado general de la app.</p>
          </div>
          <div class="inicio-diagnostic-card">
            <strong>Revisión recomendada</strong>
            <span>Abre Diagnóstico para ejecutar diagnóstico fuerte, auditoría integral o diagnóstico final del rediseño.</span>
            <button class="primary-button" type="button" data-pantalla-destino="diagnostico">Abrir Diagnóstico</button>
          </div>
        </article>
      </section>
    </section>
  `;
}
