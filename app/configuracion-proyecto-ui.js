/*
  Bloque 12
  Funcion: selector real de perfil, plataformas y modo de edicion desde la interfaz.
*/

export const PERFILES_UI = Object.freeze([
  { id: '11-contra-11', nombre: '11 contra 11' },
  { id: 'jeff-isekai', nombre: 'Jeff Isekai' },
  { id: 'creciaula', nombre: 'Creciaula' },
  { id: 'general', nombre: 'General' },
  { id: 'institucional', nombre: 'Institucional' },
  { id: 'el-don-historia', nombre: 'El Don Historia' },
  { id: 'jeff-verso', nombre: 'Jeff Verso' }
]);

export const PLATAFORMAS_UI = Object.freeze([
  { id: 'tiktok', nombre: 'TikTok', formato: '9:16' },
  { id: 'reels', nombre: 'Reels', formato: '9:16' },
  { id: 'shorts', nombre: 'Shorts', formato: '9:16' },
  { id: 'youtube', nombre: 'YouTube', formato: '16:9' },
  { id: 'instagram', nombre: 'Instagram', formato: '1:1' }
]);

function obtenerDocumento() {
  return typeof document === 'undefined' ? null : document;
}

function obtenerSeleccionados() {
  const doc = obtenerDocumento();
  if (!doc) return ['tiktok', 'reels', 'shorts', 'youtube'];
  const checks = [...doc.querySelectorAll('[data-platform-option]')];
  const seleccionados = checks.filter((item) => item.checked).map((item) => item.value);
  return seleccionados.length ? seleccionados : ['tiktok'];
}

export function normalizarConfiguracionProyecto(datos = {}) {
  const plataformas = Array.isArray(datos.plataformas) && datos.plataformas.length
    ? datos.plataformas
    : ['tiktok', 'reels', 'shorts', 'youtube'];
  const plataforma = datos.plataforma || plataformas[0] || 'tiktok';
  return {
    perfil: datos.perfil || 'general',
    plataforma,
    plataformas,
    plataformasTexto: plataformas.join(','),
    modoEdicion: datos.modoEdicion || 'revision_completa',
    exportarMultiplataforma: datos.exportarMultiplataforma !== false
  };
}

export function obtenerOpcionesProyecto() {
  const doc = obtenerDocumento();
  if (!doc) return normalizarConfiguracionProyecto();
  return normalizarConfiguracionProyecto({
    perfil: doc.getElementById('profileSelect')?.value || 'general',
    plataformas: obtenerSeleccionados(),
    modoEdicion: doc.getElementById('editModeSelect')?.value || 'revision_completa',
    exportarMultiplataforma: doc.getElementById('exportMultiplatform')?.checked !== false
  });
}

export function aplicarOpcionesProyectoAFormulario(formulario) {
  const opciones = obtenerOpcionesProyecto();
  formulario.append('perfil', opciones.perfil);
  formulario.append('plataforma', opciones.plataforma);
  formulario.append('plataformas', opciones.plataformasTexto);
  formulario.append('modoEdicion', opciones.modoEdicion);
  formulario.append('exportarMultiplataforma', opciones.exportarMultiplataforma ? 'true' : 'false');
  return opciones;
}

export function actualizarResumenConfiguracionProyecto() {
  const doc = obtenerDocumento();
  if (!doc) return null;
  const resumen = doc.getElementById('projectSettingsSummary');
  const platformInput = doc.getElementById('platformInput');
  if (!resumen) return null;
  const opciones = obtenerOpcionesProyecto();
  const perfil = PERFILES_UI.find((item) => item.id === opciones.perfil)?.nombre || opciones.perfil;
  const nombresPlataformas = opciones.plataformas.map((id) => PLATAFORMAS_UI.find((item) => item.id === id)?.nombre || id).join(', ');
  const modo = opciones.modoEdicion === 'automatico_rapido' ? 'automatico rapido' : 'revision completa';
  resumen.textContent = `Perfil: ${perfil} · Plataformas: ${nombresPlataformas} · Modo: ${modo}`;
  if (platformInput) platformInput.value = opciones.plataforma;
  return opciones;
}

export function bloquearControlesConfiguracionProyecto(bloquear) {
  const doc = obtenerDocumento();
  if (!doc) return;
  ['profileSelect', 'editModeSelect', 'exportMultiplatform'].forEach((id) => {
    const control = doc.getElementById(id);
    if (control) control.disabled = bloquear;
  });
  doc.querySelectorAll('[data-platform-option]').forEach((control) => {
    control.disabled = bloquear;
  });
}

export function inicializarConfiguracionProyectoUI() {
  const doc = obtenerDocumento();
  if (!doc) return false;
  const controles = [doc.getElementById('profileSelect'), doc.getElementById('editModeSelect'), doc.getElementById('exportMultiplatform'), ...doc.querySelectorAll('[data-platform-option]')].filter(Boolean);
  controles.forEach((control) => control.addEventListener('change', actualizarResumenConfiguracionProyecto));
  actualizarResumenConfiguracionProyecto();
  return controles.length > 0;
}
