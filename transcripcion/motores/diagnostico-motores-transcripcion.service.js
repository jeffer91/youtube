import fs from 'fs';
import os from 'os';
import { verificarMotoresTranscripcion } from './gestor-motores-transcripcion.service.js';
import { MOTORES_TRANSCRIPCION } from '../modelos/transcripcion-normalizada.modelo.js';

function texto(valor, respaldo = '') {
  const limpio = String(valor || '').trim();
  return limpio || respaldo;
}

function existeArchivo(ruta) {
  try {
    return Boolean(ruta && fs.existsSync(ruta) && fs.statSync(ruta).isFile());
  } catch (_error) {
    return false;
  }
}

function existeCarpeta(ruta) {
  try {
    return Boolean(ruta && fs.existsSync(ruta) && fs.statSync(ruta).isDirectory());
  } catch (_error) {
    return false;
  }
}

function resolverPython(opciones = {}) {
  return texto(
    opciones.pythonPath ||
    opciones.pythonFasterWhisper ||
    opciones.pythonVosk ||
    process.env.AUTOVIDEOJEFF_PYTHON ||
    process.env.PYTHON ||
    (process.platform === 'win32' ? 'python' : 'python3')
  );
}

function resolverWhisperCppExecutable(opciones = {}) {
  return texto(
    opciones.whisperCppExecutable ||
    opciones.rutaWhisperCpp ||
    process.env.AUTOVIDEOJEFF_WHISPER_CPP ||
    process.env.WHISPER_CPP_PATH ||
    (process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli')
  );
}

function resolverWhisperCppModel(opciones = {}) {
  return texto(opciones.whisperCppModel || opciones.rutaModeloWhisperCpp || process.env.AUTOVIDEOJEFF_WHISPER_CPP_MODEL || process.env.WHISPER_CPP_MODEL || '');
}

function resolverVoskModel(opciones = {}) {
  return texto(opciones.voskModel || opciones.rutaModeloVosk || process.env.AUTOVIDEOJEFF_VOSK_MODEL || process.env.VOSK_MODEL || '');
}

function requisitoPorMotor(motor, opciones = {}) {
  const python = resolverPython(opciones);
  const whisperCppExecutable = resolverWhisperCppExecutable(opciones);
  const whisperCppModel = resolverWhisperCppModel(opciones);
  const voskModel = resolverVoskModel(opciones);

  const mapa = {
    [MOTORES_TRANSCRIPCION.MANUAL]: {
      titulo: 'Texto manual',
      requerido: false,
      gratuito: true,
      local: true,
      requisitos: ['No requiere instalación.'],
      acciones: ['Pegar o escribir texto manual cuando sea necesario.']
    },
    [MOTORES_TRANSCRIPCION.FASTER_WHISPER]: {
      titulo: 'faster-whisper',
      requerido: true,
      gratuito: true,
      local: true,
      requisitos: ['Python disponible', 'Paquete faster-whisper instalado'],
      rutas: { python },
      acciones: [
        'Instalar Python si no existe.',
        'Ejecutar: pip install faster-whisper',
        'Opcional: definir AUTOVIDEOJEFF_PYTHON con la ruta de python.exe.'
      ]
    },
    [MOTORES_TRANSCRIPCION.WHISPER_CPP]: {
      titulo: 'whisper.cpp',
      requerido: true,
      gratuito: true,
      local: true,
      requisitos: ['Ejecutable whisper.cpp disponible', 'Modelo .bin disponible'],
      rutas: {
        ejecutable: whisperCppExecutable,
        modelo: whisperCppModel,
        modeloExiste: Boolean(whisperCppModel && existeArchivo(whisperCppModel))
      },
      acciones: [
        'Descargar o compilar whisper.cpp.',
        'Descargar un modelo .bin compatible.',
        'Definir AUTOVIDEOJEFF_WHISPER_CPP con la ruta del ejecutable.',
        'Definir AUTOVIDEOJEFF_WHISPER_CPP_MODEL con la ruta del modelo .bin.'
      ]
    },
    [MOTORES_TRANSCRIPCION.VOSK]: {
      titulo: 'Vosk español',
      requerido: true,
      gratuito: true,
      local: true,
      requisitos: ['Python disponible', 'Paquete vosk instalado', 'Carpeta de modelo Vosk español disponible'],
      rutas: {
        python,
        modelo: voskModel,
        modeloExiste: Boolean(voskModel && existeCarpeta(voskModel))
      },
      acciones: [
        'Ejecutar: pip install vosk',
        'Descargar un modelo Vosk español.',
        'Definir AUTOVIDEOJEFF_VOSK_MODEL con la ruta de la carpeta del modelo.'
      ]
    },
    [MOTORES_TRANSCRIPCION.GEMINI]: {
      titulo: 'Gemini opcional',
      requerido: false,
      gratuito: false,
      local: false,
      requisitos: ['Clave API solo si se decide usarlo como apoyo externo.'],
      acciones: ['No es necesario para la transcripción gratuita local.']
    }
  };

  return mapa[motor] || {
    titulo: motor,
    requerido: false,
    gratuito: true,
    local: true,
    requisitos: ['Motor no registrado.'],
    acciones: ['Revisar configuración multimotor.']
  };
}

function clasificarEstadoMotor(verificacion = {}, requisito = {}) {
  if (verificacion.ok) return 'listo';
  if (requisito.requerido === false) return 'opcional';
  if (verificacion.mensaje?.toLowerCase?.().includes('modelo')) return 'falta_modelo';
  if (verificacion.mensaje?.toLowerCase?.().includes('python')) return 'falta_python_o_paquete';
  if (verificacion.mensaje?.toLowerCase?.().includes('instalado')) return 'falta_paquete';
  return 'requiere_configuracion';
}

function crearMotorDiagnostico(verificacion = {}, opciones = {}) {
  const requisito = requisitoPorMotor(verificacion.motor, opciones);
  const estado = clasificarEstadoMotor(verificacion, requisito);
  return {
    motor: verificacion.motor,
    nombre: requisito.titulo,
    ok: Boolean(verificacion.ok),
    estado,
    severidad: verificacion.ok ? 'ok' : requisito.requerido ? 'warn' : 'info',
    mensaje: verificacion.mensaje || 'Sin mensaje de verificación.',
    detalle: verificacion.detalle || verificacion.error?.mensaje || null,
    gratuito: Boolean(requisito.gratuito),
    local: Boolean(requisito.local),
    requerido: Boolean(requisito.requerido),
    requisitos: requisito.requisitos || [],
    acciones: requisito.acciones || [],
    rutas: requisito.rutas || {},
    verificacion
  };
}

function crearResumenDiagnostico(motores = []) {
  const obligatorios = motores.filter((motor) => motor.requerido);
  const listos = motores.filter((motor) => motor.ok);
  const faltantes = obligatorios.filter((motor) => !motor.ok);
  return {
    total: motores.length,
    listos: listos.length,
    obligatorios: obligatorios.length,
    faltantes: faltantes.length,
    puedeTranscribirGratis: obligatorios.some((motor) => motor.ok),
    motoresListos: listos.map((motor) => motor.motor),
    motoresFaltantes: faltantes.map((motor) => motor.motor),
    recomendacion: faltantes.length === 0
      ? 'Los motores locales obligatorios están listos.'
      : 'Configura al menos un motor local gratuito para transcribir sin Gemini.'
  };
}

export async function diagnosticarMotoresTranscripcion({ opciones = {} } = {}) {
  const verificacion = await verificarMotoresTranscripcion({ opciones });
  const motores = (verificacion.resultados || []).map((item) => crearMotorDiagnostico(item, opciones));
  const resumen = crearResumenDiagnostico(motores);

  return {
    ok: true,
    version: '1.0.0-diagnostico-motores',
    sistema: {
      plataforma: process.platform,
      arquitectura: process.arch,
      cpu: os.cpus()?.[0]?.model || 'desconocido',
      memoriaGB: Number((os.totalmem() / 1024 / 1024 / 1024).toFixed(2)),
      python: resolverPython(opciones)
    },
    resumen,
    motores,
    verificacionBase: verificacion,
    actualizadoEn: new Date().toISOString()
  };
}

export default diagnosticarMotoresTranscripcion;
