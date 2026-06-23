export function construirPromptGemini(paqueteGemini, opciones = {}) {
  const cantidadMaxima = Number(opciones.maxTextosFlotantes || 6);
  return {
    ok: true,
    modelo: opciones.geminiModelo || 'gemini-1.5-flash',
    instruccionesSistema: `Devuelve JSON válido con máximo ${cantidadMaxima} momentos importantes.`,
    promptUsuario: JSON.stringify({ guia: opciones.geminiGuia || '', paquete: paqueteGemini || {} }, null, 2),
    generationConfig: {
      temperature: Number(opciones.geminiTemperatura || 0.35),
      topP: 0.9,
      topK: 40,
      maxOutputTokens: Number(opciones.geminiMaxOutputTokens || 1200),
      responseMimeType: 'application/json'
    },
    esperado: {
      momentosImportantes: [
        { inicio: 0, fin: 3, texto: 'PUNTO CLAVE', tipo: 'clave', prioridad: 1, posicion: 'arriba', estilo: 'badge', motivo: 'Motivo breve' }
      ]
    },
    creadoEn: new Date().toISOString()
  };
}

export function construirCuerpoGemini(promptGemini) {
  return {
    systemInstruction: { parts: [{ text: promptGemini.instruccionesSistema }] },
    contents: [{ role: 'user', parts: [{ text: promptGemini.promptUsuario }] }],
    generationConfig: promptGemini.generationConfig
  };
}

export default construirPromptGemini;
