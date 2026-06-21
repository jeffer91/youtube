/*
  Nombre completo: flujo-principal.js
  Ruta o ubicación: AutoVideoJeff/motor/flujo-principal.js
  Función o funciones:
    - Ejecutar el proceso principal de la app en orden.
    - Conectar entrada, entender, editar y salida sin mezclar responsabilidades.
    - Permitir que la app siga respondiendo aunque falten módulos de bloques futuros.
    - Devolver un resultado claro para la pantalla principal.
  Con qué se conecta:
    - motor/motor.conexion.js
    - entrada/entrada.conexion.js
    - entender/entender.conexion.js
    - editar/editar.conexion.js
    - salida/salida.conexion.js
*/

import { procesarEntrada } from '../entrada/entrada.conexion.js';
import { entenderVideo } from '../entender/entender.conexion.js';

function crearRespuestaPendiente({ proyecto, entendimiento, pendientes }) {
  return {
    ok: false,
    estado: 'FLUJO_PARCIAL_BLOQUES_PENDIENTES',
    mensaje:
      'El video ya fue recibido y entendido de forma simple. Falta crear los módulos de edición y salida para generar el video final.',
    proyecto,
    entendimiento,
    pendientes
  };
}

async function cargarModuloOpcional(ruta, nombreFuncion) {
  try {
    const modulo = await import(ruta);

    if (typeof modulo[nombreFuncion] !== 'function') {
      return {
        disponible: false,
        error: `El módulo ${ruta} existe, pero no exporta ${nombreFuncion}.`
      };
    }

    return {
      disponible: true,
      funcion: modulo[nombreFuncion]
    };
  } catch (error) {
    return {
      disponible: false,
      error: error.message
    };
  }
}

export async function ejecutarFlujoPrincipal(solicitud) {
  const entrada = await procesarEntrada(solicitud);
  const entendimiento = await entenderVideo(entrada);

  const moduloEditar = await cargarModuloOpcional('../editar/editar.conexion.js', 'editarVideo');
  const moduloSalida = await cargarModuloOpcional('../salida/salida.conexion.js', 'prepararSalida');

  const pendientes = [];

  if (!moduloEditar.disponible) {
    pendientes.push('editar/editar.conexion.js');
    pendientes.push('editar/tiktok-simple/tiktok.service.js');
  }

  if (!moduloSalida.disponible) {
    pendientes.push('salida/salida.conexion.js');
    pendientes.push('salida/exportar-simple/exportar.service.js');
  }

  if (pendientes.length > 0) {
    return crearRespuestaPendiente({
      proyecto: entrada.proyecto,
      entendimiento,
      pendientes
    });
  }

  const edicion = await moduloEditar.funcion({
    entrada,
    entendimiento,
    opciones: solicitud.opciones || {}
  });

  const salida = await moduloSalida.funcion({
    entrada,
    entendimiento,
    edicion,
    opciones: solicitud.opciones || {}
  });

  return {
    ok: true,
    estado: 'VIDEO_PROCESADO',
    mensaje: 'Video editado y exportado correctamente.',
    proyecto: entrada.proyecto,
    entendimiento,
    edicion,
    resultado: salida
  };
}
