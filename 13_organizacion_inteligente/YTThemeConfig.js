/*
Nombre completo: YTThemeConfig.js
Ruta: 13_organizacion_inteligente/YTThemeConfig.js
Función o funciones:
  - Definir temáticas oficiales de AutoEdit Studio.
  - Centralizar estilos, prioridades, recursos y reglas por temática.
Se conecta con:
  - YTThemeService.js
  - YTWorkflowService.js
  - YTThemeSelector.js
*/

const THEMES = Object.freeze({
  "11_contra_11": {
    id: "11_contra_11",
    label: "11 contra 11",
    folder: "11_contra_11",
    defaultMode: "standard",
    priority: "visual_energy",
    tone: "dinamico",
    description: "Fútbol, jugadas, emoción, frases fuertes y ritmo rápido.",
    editRules: { rhythm: "fast", subtitles: "strong", effects: "sports", music: "energetic", visualWeight: 0.65, transcriptWeight: 0.35 },
    resources: ["intro", "outro", "logos", "musica", "efectos", "overlays", "fondos", "subtitulos"]
  },
  crece_aula: {
    id: "crece_aula",
    label: "Crece Aula",
    folder: "crece_aula",
    defaultMode: "standard",
    priority: "transcription_structure",
    tone: "educativo",
    description: "Educación, clases, cursos y explicaciones claras.",
    editRules: { rhythm: "medium", subtitles: "clean", effects: "minimal", music: "soft", visualWeight: 0.3, transcriptWeight: 0.7 },
    resources: ["intro", "outro", "logos", "musica", "overlays", "fondos", "subtitulos"]
  },
  generico: {
    id: "generico",
    label: "Genérico",
    folder: "generico",
    defaultMode: "standard",
    priority: "balanced",
    tone: "neutral",
    description: "Edición limpia y adaptable para cualquier tipo de video.",
    editRules: { rhythm: "medium", subtitles: "standard", effects: "basic", music: "generic", visualWeight: 0.5, transcriptWeight: 0.5 },
    resources: ["intro", "outro", "logos", "musica", "efectos", "overlays", "fondos", "subtitulos"]
  },
  institucional: {
    id: "institucional",
    label: "Institucional",
    folder: "institucional",
    defaultMode: "standard",
    priority: "formal_message",
    tone: "formal",
    description: "Serio, limpio, elegante, profesional y con pocos efectos.",
    editRules: { rhythm: "slow_medium", subtitles: "formal", effects: "minimal", music: "corporate", visualWeight: 0.45, transcriptWeight: 0.55 },
    resources: ["intro", "outro", "logos", "musica", "overlays", "fondos", "subtitulos"]
  },
  boca_rosa: {
    id: "boca_rosa",
    label: "Boca Rosa",
    folder: "boca_rosa",
    defaultMode: "musica",
    priority: "music_or_speech",
    tone: "musical",
    description: "Tecnocumbia para Boca Rosa, con versión musical o hablada.",
    modes: {
      musica: { id: "musica", label: "Boca Rosa música", folder: "musica", priority: "visual_rhythm", description: "Prioriza imagen, ritmo, baile, energía y cambios de plano.", editRules: { rhythm: "music_sync", subtitles: "minimal", effects: "music", music: "source_audio", visualWeight: 0.85, transcriptWeight: 0.15 } },
      hablado: { id: "hablado", label: "Boca Rosa hablado", folder: "hablado", priority: "spoken_message", description: "Prioriza mensaje, transcripción, presencia del grupo y cortes claros.", editRules: { rhythm: "medium_fast", subtitles: "strong", effects: "moderate", music: "low_background", visualWeight: 0.45, transcriptWeight: 0.55 } }
    },
    resources: ["intro", "outro", "logos", "musica", "efectos", "overlays", "fondos", "subtitulos"]
  }
});

const DEFAULT_THEME = "generico";
const DEFAULT_MODE = "standard";

function normalizeTheme(theme) {
  const value = String(theme || "").trim().toLowerCase();
  return THEMES[value] ? value : DEFAULT_THEME;
}

function normalizeMode(theme, mode) {
  const themeId = normalizeTheme(theme);
  const config = THEMES[themeId];
  if (!config.modes) return DEFAULT_MODE;
  const value = String(mode || config.defaultMode || "").trim().toLowerCase();
  return config.modes[value] ? value : config.defaultMode;
}

function getThemeConfig(theme = DEFAULT_THEME, mode = DEFAULT_MODE) {
  const themeId = normalizeTheme(theme);
  const base = THEMES[themeId];
  const modeId = normalizeMode(themeId, mode);
  if (base.modes) {
    const modeConfig = base.modes[modeId];
    return { ...base, selectedMode: modeId, selectedLabel: modeConfig.label, selectedDescription: modeConfig.description, selectedPriority: modeConfig.priority, editRules: modeConfig.editRules, resourceFolder: `${base.folder}/${modeConfig.folder}` };
  }
  return { ...base, selectedMode: DEFAULT_MODE, selectedLabel: base.label, selectedDescription: base.description, selectedPriority: base.priority, resourceFolder: base.folder };
}

function listThemes() {
  return Object.values(THEMES).map((theme) => ({ id: theme.id, label: theme.label, defaultMode: theme.defaultMode, description: theme.description, modes: theme.modes ? Object.values(theme.modes) : [] }));
}

module.exports = { THEMES, DEFAULT_THEME, DEFAULT_MODE, normalizeTheme, normalizeMode, getThemeConfig, listThemes };
