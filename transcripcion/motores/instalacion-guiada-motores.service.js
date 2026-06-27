import path from 'path';
import { obtenerRutaRaiz } from '../../comun/archivos.js';

function rutaLocal(...partes) {
  return path.join(obtenerRutaRaiz(), ...partes);
}

function crearComandoWindows(comando) {
  return { sistema: 'windows', comando };
}

function crearComandoGeneral(comando) {
  return { sistema: 'general', comando };
}

export function obtenerInstalacionGuiadaMotoresTranscripcion() {
  const carpetaModelos = rutaLocal('datos', 'modelos', 'transcripcion');
  const carpetaBinarios = rutaLocal('datos', 'binarios', 'transcripcion');

  return {
    ok: true,
    version: '1.0.0-instalacion-guiada',
    titulo: 'Instalación guiada de motores gratuitos/locales',
    objetivo: 'Dejar al menos un motor local funcionando para transcribir sin depender de Gemini ni APIs pagadas.',
    modo: 'guia-manual-asistida',
    aviso: 'Este bloque no descarga archivos automáticamente. Prepara una guía segura para instalar modelos gratuitos y configurar rutas locales.',
    carpetasRecomendadas: {
      modelos: carpetaModelos,
      binarios: carpetaBinarios,
      fasterWhisper: rutaLocal('datos', 'modelos', 'transcripcion', 'faster-whisper'),
      whisperCpp: rutaLocal('datos', 'modelos', 'transcripcion', 'whisper-cpp'),
      vosk: rutaLocal('datos', 'modelos', 'transcripcion', 'vosk')
    },
    prioridad: [
      'faster-whisper como motor principal',
      'whisper.cpp como respaldo sin Python',
      'Vosk español como respaldo liviano'
    ],
    pasos: [
      {
        id: 'python-base',
        titulo: '1. Verificar Python',
        motor: 'base',
        obligatorio: true,
        descripcion: 'faster-whisper y Vosk necesitan Python disponible en Windows.',
        comandos: [
          crearComandoWindows('python --version'),
          crearComandoWindows('pip --version')
        ],
        variables: ['AUTOVIDEOJEFF_PYTHON'],
        resultadoEsperado: 'Python y pip responden sin error.',
        siFalla: [
          'Instalar Python para Windows.',
          'Marcar la opción para agregar Python al PATH.',
          'Reabrir la terminal después de instalar.'
        ]
      },
      {
        id: 'faster-whisper',
        titulo: '2. Instalar faster-whisper',
        motor: 'faster-whisper',
        obligatorio: false,
        recomendado: true,
        descripcion: 'Motor principal local gratuito para transcripción.',
        comandos: [
          crearComandoWindows('pip install faster-whisper'),
          crearComandoWindows('python -c "import faster_whisper; print(\'faster-whisper ok\')"')
        ],
        variables: ['AUTOVIDEOJEFF_PYTHON'],
        modelos: ['tiny', 'base', 'small', 'medium', 'large-v3'],
        modeloRecomendado: 'small',
        resultadoEsperado: 'El diagnóstico marca faster-whisper como disponible.',
        siFalla: [
          'Revisar que pip esté usando el mismo Python que la app.',
          'Definir AUTOVIDEOJEFF_PYTHON con la ruta exacta de python.exe.',
          'Ejecutar otra vez el diagnóstico desde Entendimiento.'
        ]
      },
      {
        id: 'whisper-cpp',
        titulo: '3. Configurar whisper.cpp',
        motor: 'whisper-cpp',
        obligatorio: false,
        recomendado: true,
        descripcion: 'Motor local de respaldo basado en ejecutable. Sirve cuando no se quiere depender de Python para este motor.',
        comandos: [
          crearComandoGeneral('Guardar whisper-cli.exe o main.exe en la carpeta de binarios recomendada.'),
          crearComandoGeneral('Guardar el modelo .bin en la carpeta de modelos whisper.cpp.'),
          crearComandoWindows('setx AUTOVIDEOJEFF_WHISPER_CPP "C:\\ruta\\whisper-cli.exe"'),
          crearComandoWindows('setx AUTOVIDEOJEFF_WHISPER_CPP_MODEL "C:\\ruta\\ggml-small.bin"')
        ],
        variables: ['AUTOVIDEOJEFF_WHISPER_CPP', 'AUTOVIDEOJEFF_WHISPER_CPP_MODEL'],
        modelos: ['ggml-tiny.bin', 'ggml-base.bin', 'ggml-small.bin', 'ggml-medium.bin'],
        modeloRecomendado: 'ggml-small.bin',
        resultadoEsperado: 'El diagnóstico encuentra el ejecutable y el modelo .bin.',
        siFalla: [
          'Verificar que la ruta del ejecutable exista.',
          'Verificar que la ruta del modelo termine en .bin.',
          'Cerrar y abrir la app después de usar setx.'
        ]
      },
      {
        id: 'vosk',
        titulo: '4. Instalar Vosk español',
        motor: 'vosk',
        obligatorio: false,
        recomendado: true,
        descripcion: 'Motor local liviano para respaldo rápido en español.',
        comandos: [
          crearComandoWindows('pip install vosk'),
          crearComandoWindows('python -c "import vosk; print(\'vosk ok\')"'),
          crearComandoWindows('setx AUTOVIDEOJEFF_VOSK_MODEL "C:\\ruta\\vosk-model-small-es"')
        ],
        variables: ['AUTOVIDEOJEFF_PYTHON', 'AUTOVIDEOJEFF_VOSK_MODEL'],
        modelos: ['vosk-model-small-es', 'vosk-model-es'],
        modeloRecomendado: 'vosk-model-small-es',
        resultadoEsperado: 'El diagnóstico encuentra Vosk y la carpeta del modelo español.',
        siFalla: [
          'Verificar que la variable AUTOVIDEOJEFF_VOSK_MODEL apunte a una carpeta, no a un archivo ZIP.',
          'Descomprimir el modelo antes de usarlo.',
          'Ejecutar otra vez el diagnóstico.'
        ]
      },
      {
        id: 'verificacion-final',
        titulo: '5. Verificación final',
        motor: 'todos',
        obligatorio: true,
        descripcion: 'Después de instalar o configurar rutas, volver a Entendimiento y ejecutar Diagnosticar motores.',
        comandos: [
          crearComandoGeneral('Abrir AutoVideoJeff'),
          crearComandoGeneral('Ir a Entendimiento'),
          crearComandoGeneral('Presionar Diagnosticar motores')
        ],
        resultadoEsperado: 'Al menos uno de los motores locales aparece como listo.',
        siFalla: [
          'Copiar el mensaje del diagnóstico.',
          'Revisar rutas configuradas.',
          'Confirmar que se reinició la app después de configurar variables.'
        ]
      }
    ],
    variablesEntorno: [
      {
        nombre: 'AUTOVIDEOJEFF_PYTHON',
        uso: 'Ruta exacta de python.exe cuando Windows tiene varias instalaciones de Python.',
        ejemplo: 'C:\\Users\\Jeff\\AppData\\Local\\Programs\\Python\\Python312\\python.exe'
      },
      {
        nombre: 'AUTOVIDEOJEFF_WHISPER_CPP',
        uso: 'Ruta del ejecutable whisper.cpp.',
        ejemplo: 'D:\\AutoVideoJeff\\binarios\\whisper-cpp\\whisper-cli.exe'
      },
      {
        nombre: 'AUTOVIDEOJEFF_WHISPER_CPP_MODEL',
        uso: 'Ruta del modelo .bin de whisper.cpp.',
        ejemplo: 'D:\\AutoVideoJeff\\modelos\\whisper-cpp\\ggml-small.bin'
      },
      {
        nombre: 'AUTOVIDEOJEFF_VOSK_MODEL',
        uso: 'Ruta de la carpeta descomprimida del modelo Vosk español.',
        ejemplo: 'D:\\AutoVideoJeff\\modelos\\vosk\\vosk-model-small-es'
      }
    ],
    criteriosAceptacion: [
      'El diagnóstico muestra al menos un motor local listo.',
      'Entendimiento puede procesar sin clave de Gemini.',
      'Los errores indican qué ruta o paquete falta.'
    ],
    actualizadoEn: new Date().toISOString()
  };
}

export default obtenerInstalacionGuiadaMotoresTranscripcion;
