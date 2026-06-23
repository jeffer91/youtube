export const OPCIONES_EDICION_AUTOMATICA = Object.freeze({
  edicionDinamica: 'true',
  activarEdicionDinamica: 'true',
  usarEdicionDinamica: 'true',
  cortarSilencios: 'true',
  modoSeguroEdicionDinamica: 'true',
  intensidadEdicion: 'automatica',
  modoEdicionDinamica: 'automatica',
  agregarEfectosVisualesDinamicos: 'true',
  agregarZooms: 'true',
  agregarPunchIn: 'true',
  agregarBarraProgreso: 'true',
  agregarEtiquetasVisuales: 'true',
  agregarSonidosEdicion: 'true',
  modoSonidosEdicion: 'normal',
  volumenSonidosEdicion: '0.24',
  separacionMinimaSonidos: '1.2',
  cantidadMaximaSonidos: '16'
});

export function obtenerOpcionesEdicionAutomatica() {
  return { ...OPCIONES_EDICION_AUTOMATICA };
}

export function aplicarModoAutomaticoVisual() {
  const resumen = document.getElementById('autoModeSummary');
  if (resumen) {
    resumen.textContent = 'Modo automático activo: corta silencios, ajusta subtítulos, agrega movimiento, textos y sonidos sin configurar nada.';
  }
}

export default obtenerOpcionesEdicionAutomatica;
