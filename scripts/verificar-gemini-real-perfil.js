/* Verificacion Bloque 18: Gemini real conectado por perfil con fallback seguro. */

import fs from 'fs';
import { obtenerConfigGemini, construirBloquePerfilGemini, crearPaqueteGeminiEdicion, ejecutarPaqueteGeminiEdicion } from '../gemini/gemini.conexion.js';

async function main() {
  const perfil = {
    id: '11-contra-11',
    nombre: '11 contra 11',
    instruccionesGemini: 'Usar tono futbolero y recursos deportivos.'
  };
  const transcripcion = { segmentos: [{ inicio: 0, fin: 4, texto: 'Esta final se juega con una presion enorme y una hinchada encendida.' }] };
  const bloquePerfil = construirBloquePerfilGemini(perfil);
  const config = obtenerConfigGemini({ geminiModelo: 'gemini-1.5-flash', geminiTemperatura: '0.25' });
  const paquete = crearPaqueteGeminiEdicion({ proyecto: { id: 'p1', perfil: perfil.id }, perfil, transcripcion, plataformas: ['tiktok'], opciones: { usarGemini: false } });
  const ejecutado = await ejecutarPaqueteGeminiEdicion({ paquete, opciones: { usarGemini: false, usarFallbackGemini: true } });

  const cliente = fs.readFileSync('gemini/cliente-gemini.service.js', 'utf-8');
  const flujo = fs.readFileSync('motor/flujo-modular-autovideo.service.js', 'utf-8');

  if (!bloquePerfil.includes('futbolero') || !bloquePerfil.includes('recursos deportivos')) throw new Error('No aplica instrucciones por perfil.');
  if (config.modelo !== 'gemini-1.5-flash' || config.temperatura !== 0.25) throw new Error('Config Gemini no normaliza modelo/temperatura.');
  if (!paquete.tareas?.analisis || !paquete.tareas?.recursos || !paquete.tareas?.textos) throw new Error('Paquete Gemini incompleto.');
  if (!ejecutado.ejecutado || ejecutado.estado !== 'GEMINI_FALLBACK_LOCAL') throw new Error('Fallback Gemini no ejecuta correctamente.');
  if (!cliente.includes('generativelanguage.googleapis.com') || !cliente.includes('responseMimeType')) throw new Error('Cliente Gemini real incompleto.');
  if (!flujo.includes('ejecutarPaqueteGeminiEdicion')) throw new Error('Flujo modular no ejecuta Gemini.');

  console.log('OK Gemini real por perfil:', ejecutado.estado, ejecutado.resumen.tareas, 'tareas');
}

main().catch((error) => {
  console.error('ERROR Gemini real por perfil:', error.message);
  process.exit(1);
});
