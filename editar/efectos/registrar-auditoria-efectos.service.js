/*
  Bloque 13: Aprendizaje de efectos por perfil
  Función: guardar auditoría local y actualizar memoria del motor de efectos.
*/

import path from 'path';
import { asegurarCarpeta, escribirJson } from '../../comun/archivos.js';
import { crearDiagnosticoEfectos, crearResumenEfectosTexto } from '../../diagnostico/efectos/diagnostico-efectos.service.js';
import { registrarAprendizajeEfectos } from './aprendizaje/index.js';

export async function registrarAuditoriaEfectos({ entrada = null, resultado = null } = {}) {
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (!carpetaProyecto || !resultado) return { ok: false, omitido: true, mensaje: 'No hay carpeta de proyecto o resultado para auditar.' };

  const carpeta = path.join(carpetaProyecto, 'efectos');
  asegurarCarpeta(carpeta);

  const rutaResumen = path.join(carpeta, 'efectos-render.json');
  const rutaDiagnostico = path.join(carpeta, 'diagnostico-efectos.json');
  const diagnostico = crearDiagnosticoEfectos(resultado);
  const aprendizaje = await registrarAprendizajeEfectos(resultado).catch((error) => ({ ok: false, mensaje: error.message }));
  const resumen = {
    ok: Boolean(resultado.ok),
    omitido: Boolean(resultado.omitido),
    motor: resultado.motor || 'efectos-v1',
    perfil: resultado.plan?.perfil?.id || resultado.plan?.perfil || null,
    intensidad: resultado.plan?.intensidad?.id || resultado.plan?.intensidad || null,
    origen: resultado.plan?.origen || resultado.detalle?.origen || 'local',
    fallbackLocal: Boolean(resultado.plan?.fallbackLocal || resultado.detalle?.fallbackLocal),
    aprendizajeAplicado: Boolean(resultado.plan?.aprendizajeAplicado),
    aprendizajeRegistrado: Boolean(aprendizaje?.ok),
    totalPlan: resultado.plan?.total || resultado.plan?.efectos?.length || 0,
    filtrosAplicados: resultado.filtrosAplicados || 0,
    omitidos: resultado.compilado?.omitidos?.length || 0,
    mensaje: resultado.mensaje || null,
    resumenTexto: crearResumenEfectosTexto(diagnostico),
    creadoEn: new Date().toISOString()
  };

  await escribirJson(rutaResumen, { resumen, diagnostico, aprendizaje, resultado });
  await escribirJson(rutaDiagnostico, diagnostico);
  return { ok: true, rutaResumen, rutaDiagnostico, resumen, diagnostico, aprendizaje };
}

export default registrarAuditoriaEfectos;
