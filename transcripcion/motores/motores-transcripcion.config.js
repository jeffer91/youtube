import { MOTORES_TRANSCRIPCION, normalizarIdMotorTranscripcion } from '../modelos/transcripcion-normalizada.modelo.js';

export const ORDEN_MOTORES_TRANSCRIPCION = Object.freeze([
  MOTORES_TRANSCRIPCION.MANUAL,
  MOTORES_TRANSCRIPCION.FASTER_WHISPER,
  MOTORES_TRANSCRIPCION.WHISPER_CPP,
  MOTORES_TRANSCRIPCION.VOSK,
  MOTORES_TRANSCRIPCION.GEMINI
]);

export const MOTORES_TRANSCRIPCION_CONFIG = Object.freeze({
  [MOTORES_TRANSCRIPCION.MANUAL]: Object.freeze({
    id: MOTORES_TRANSCRIPCION.MANUAL,
    nombre: 'Manual',
    tipo: 'manual',
    gratis: true,
    local: true,
    requiereClave: false,
    requiereInternet: false,
    prioridad: 0,
    activoPorDefecto: true,
    descripcion: 'Texto pegado o escrito por el usuario.'
  }),
  [MOTORES_TRANSCRIPCION.FASTER_WHISPER]: Object.freeze({
    id: MOTORES_TRANSCRIPCION.FASTER_WHISPER,
    nombre: 'faster-whisper',
    tipo: 'local-python',
    gratis: true,
    local: true,
    requiereClave: false,
    requiereInternet: false,
    prioridad: 1,
    activoPorDefecto: true,
    modeloPredeterminado: 'small',
    descripcion: 'Motor local principal para transcripción gratuita.'
  }),
  [MOTORES_TRANSCRIPCION.WHISPER_CPP]: Object.freeze({
    id: MOTORES_TRANSCRIPCION.WHISPER_CPP,
    nombre: 'whisper.cpp',
    tipo: 'local-binario',
    gratis: true,
    local: true,
    requiereClave: false,
    requiereInternet: false,
    prioridad: 2,
    activoPorDefecto: true,
    modeloPredeterminado: 'ggml-small.bin',
    descripcion: 'Motor local de respaldo basado en ejecutable.'
  }),
  [MOTORES_TRANSCRIPCION.VOSK]: Object.freeze({
    id: MOTORES_TRANSCRIPCION.VOSK,
    nombre: 'Vosk español',
    tipo: 'local-python',
    gratis: true,
    local: true,
    requiereClave: false,
    requiereInternet: false,
    prioridad: 3,
    activoPorDefecto: true,
    modeloPredeterminado: 'vosk-model-small-es',
    descripcion: 'Motor local liviano para respaldo rápido en español.'
  }),
  [MOTORES_TRANSCRIPCION.GEMINI]: Object.freeze({
    id: MOTORES_TRANSCRIPCION.GEMINI,
    nombre: 'Gemini',
    tipo: 'cloud-opcional',
    gratis: false,
    local: false,
    requiereClave: true,
    requiereInternet: true,
    prioridad: 4,
    activoPorDefecto: false,
    descripcion: 'Motor opcional para apoyo inteligente; no debe ser obligatorio.'
  })
});

export const CONFIG_MULTIMOTOR_TRANSCRIPCION = Object.freeze({
  version: '1.0.0-multimotor',
  guardarTodas: true,
  elegirMejorAutomaticamente: true,
  motorPrincipalPreferido: MOTORES_TRANSCRIPCION.FASTER_WHISPER,
  ordenMotores: ORDEN_MOTORES_TRANSCRIPCION,
  ejecutarEnParalelo: false,
  detenerAlEncontrarTextoUtil: false,
  permitirTranscripcionVacia: true,
  carpetaModelos: 'modelos/transcripcion',
  carpetaBinarios: 'binarios/transcripcion'
});

function convertirBooleano(valor, respaldo = false) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo', 'activado'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(limpio)) return false;
  }
  return respaldo;
}

function normalizarOrdenMotores(valor, respaldo = ORDEN_MOTORES_TRANSCRIPCION) {
  const lista = Array.isArray(valor)
    ? valor
    : typeof valor === 'string' && valor.trim()
      ? valor.split(',')
      : respaldo;

  const normalizados = lista.map((motor) => normalizarIdMotorTranscripcion(motor)).filter(Boolean);
  return [...new Set(normalizados)];
}

export function obtenerMotorTranscripcionConfig(motor) {
  const motorId = normalizarIdMotorTranscripcion(motor);
  return MOTORES_TRANSCRIPCION_CONFIG[motorId] || MOTORES_TRANSCRIPCION_CONFIG[MOTORES_TRANSCRIPCION.MANUAL];
}

export function obtenerConfigMultimotorTranscripcion(opciones = {}) {
  const configUsuario = opciones.configMultimotorTranscripcion || opciones.configMotoresTranscripcion || {};
  const orden = normalizarOrdenMotores(
    opciones.ordenMotoresTranscripcion || configUsuario.ordenMotores,
    CONFIG_MULTIMOTOR_TRANSCRIPCION.ordenMotores
  );

  return {
    ...CONFIG_MULTIMOTOR_TRANSCRIPCION,
    ...configUsuario,
    guardarTodas: convertirBooleano(opciones.guardarTodasTranscripciones ?? configUsuario.guardarTodas, CONFIG_MULTIMOTOR_TRANSCRIPCION.guardarTodas),
    elegirMejorAutomaticamente: convertirBooleano(opciones.elegirMejorTranscripcion ?? configUsuario.elegirMejorAutomaticamente, CONFIG_MULTIMOTOR_TRANSCRIPCION.elegirMejorAutomaticamente),
    ejecutarEnParalelo: convertirBooleano(opciones.ejecutarMotoresTranscripcionEnParalelo ?? configUsuario.ejecutarEnParalelo, CONFIG_MULTIMOTOR_TRANSCRIPCION.ejecutarEnParalelo),
    detenerAlEncontrarTextoUtil: convertirBooleano(opciones.detenerTranscripcionAlPrimerResultado ?? configUsuario.detenerAlEncontrarTextoUtil, CONFIG_MULTIMOTOR_TRANSCRIPCION.detenerAlEncontrarTextoUtil),
    permitirTranscripcionVacia: convertirBooleano(opciones.permitirTranscripcionVacia ?? configUsuario.permitirTranscripcionVacia, CONFIG_MULTIMOTOR_TRANSCRIPCION.permitirTranscripcionVacia),
    motorPrincipalPreferido: normalizarIdMotorTranscripcion(opciones.motorPrincipalTranscripcion || configUsuario.motorPrincipalPreferido || CONFIG_MULTIMOTOR_TRANSCRIPCION.motorPrincipalPreferido),
    ordenMotores: orden,
    motores: orden.map((motor) => obtenerMotorTranscripcionConfig(motor))
  };
}

export function motorTranscripcionEsGratuito(motor) {
  return Boolean(obtenerMotorTranscripcionConfig(motor).gratis);
}

export function motorTranscripcionEsLocal(motor) {
  return Boolean(obtenerMotorTranscripcionConfig(motor).local);
}

export function crearResumenMotoresDisponibles(opciones = {}) {
  const config = obtenerConfigMultimotorTranscripcion(opciones);
  return {
    version: config.version,
    ordenMotores: config.ordenMotores,
    motorPrincipalPreferido: config.motorPrincipalPreferido,
    guardarTodas: config.guardarTodas,
    elegirMejorAutomaticamente: config.elegirMejorAutomaticamente,
    motores: config.motores.map((motor) => ({
      id: motor.id,
      nombre: motor.nombre,
      tipo: motor.tipo,
      gratis: motor.gratis,
      local: motor.local,
      requiereClave: motor.requiereClave,
      requiereInternet: motor.requiereInternet,
      activoPorDefecto: motor.activoPorDefecto
    }))
  };
}
