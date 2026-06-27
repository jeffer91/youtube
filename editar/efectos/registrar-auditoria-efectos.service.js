/*
  Bloque 8: Diagnóstico y auditoría visual
  Función: guardar auditoría local del motor de efectos sin romper el render.
*/

import path from 'path';
import { asegurarCarpeta, escribirJson } from '../../comun/archivos.js';
import { crearDiagnosticoEfectos, crearResumenEfectosTexto } from '../../diagnostico/efectos/diagnostico-efectos.service.js';

export async function registrarAuditoriaEfectos({ entrada = null, resultado = null } = {}) {
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (!carpetaProyecto || !resultado) return { ok: false, omitido: true, mensaje: 'No hay carpeta de proyecto o resultado para auditar.' };

  const carpeta = path.join(carpetaProyecto, 'efectos');
  asegurarCarpeta(carpeta);

  const rutaResumen = path.join(carpeta, 'efectos-render.json');
  const rutaDiagnostico = path.join(carpeta, 'diagnostico-efectos.json');
  const diagnostico = crearDiagnosticoEfectos(resultado);
  const resumen = {
    ok: Boolean(resultado.ok),
    omitido: Boolean(resultado.omitido),
    motor: resultado.motor || 'efectos-v1',
    perfil: resultado.plan?.perfil?.id || resultado.plan?.perfil || null,
    intensidad: resultado.plan?.intensidad?.id || resultado.plan?.intensidad || null,
    origen: resultado.plan?.origen || resultado.detalle?.origen || 'local',
    fallbackLocal: Boolean(resultado.plan?.fallbackLocal || resultado.detalle?.fallbackLocal),
    totalPlan: resultado.plan?.total || resultado.plan?.efectos?.length || 0,
    filtrosAplicados: resultado.filtrosAplicados || 0,
    omitidos: resultado.compilado?.omitidos?.length || 0,
    mensaje: resultado.mensaje || null,
    resumenTexto: crearResumenEfectosTexto(diagnostico),
    creadoEn: new Date().toISOString()
  };

  await escribirJson(rutaResumen, { resumen, diagnostico, resultado });
  await escribirJson(rutaDiagnostico, diagnostico);
  return { ok: true, rutaResumen, rutaDiagnostico, resumen, diagnostico };
}

export default registrarAuditoriaEfectos;
