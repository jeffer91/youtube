/*
Nombre completo: YTClipModel.js
Ruta: 08_clips_y_timeline/YTClipModel.js
Función o funciones:
  - Modelar clips desde análisis, manuales y propuesta inteligente.
  - Crear timeline final desde clips aprobados.
Se conecta con:
  - YTClipService.js
  - YTClipStore.js
  - YTSmartOrganizerModel.js
*/

function normalizeSecond(value, fallback = 0) {
  const number = Number(value);
  return (!Number.isFinite(number) || number < 0) ? fallback : Math.round(number * 100) / 100;
}

function createClipId(index = 1) { return `clip_${Date.now()}_${index}`; }

const DEFAULT_PLATFORMS = ["youtube_horizontal", "youtube_shorts", "tiktok", "instagram_reels", "facebook_reels", "instagram_facebook_square"];

function createClipFromSegment(segment = {}, index = 1, context = {}) {
  const startSecond = normalizeSecond(segment.startSecond, (index - 1) * 10);
  const rawEnd = normalizeSecond(segment.endSecond, startSecond + 8);
  const endSecond = rawEnd > startSecond ? rawEnd : startSecond + 8;
  return {
    id: segment.id || createClipId(index),
    block: "08_clips_y_timeline",
    projectId: context.projectId || "",
    projectName: context.projectName || "",
    title: segment.title || `Clip ${index}`,
    source: segment.source || "analysis_segment",
    sourceVideoId: segment.sourceVideoId || segment.videoId || "",
    sourceVideoName: segment.sourceVideoName || segment.videoName || "",
    role: segment.role || "Clip sugerido",
    reason: segment.reason || "Segmento sugerido desde el análisis textual.",
    text: segment.text || "",
    score: Number(segment.score || 0),
    startSecond,
    endSecond,
    durationSeconds: Math.max(1, endSecond - startSecond),
    theme: context.theme || segment.theme || "",
    themeMode: context.themeMode || segment.themeMode || "",
    status: segment.status || "SUGGESTED",
    platformTargets: Array.isArray(segment.platformTargets) ? segment.platformTargets : DEFAULT_PLATFORMS,
    createdAt: segment.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createManualClip(data = {}, context = {}) {
  return createClipFromSegment({ ...data, source: "manual", title: data.title || "Clip manual", reason: data.reason || "Clip creado manualmente.", status: data.status || "MANUAL" }, 1, context);
}

function createClipFromSmartOrderItem(item = {}, index = 1, context = {}) {
  const end = item.durationSeconds && Number(item.durationSeconds) > 0 ? Math.min(Number(item.durationSeconds), 45) : 30;
  return createClipFromSegment({
    id: item.clipId || `smart_clip_${index}`,
    source: "smart_proposal",
    sourceVideoId: item.videoId || item.id || "",
    sourceVideoName: item.name || item.videoName || "",
    videoId: item.videoId || item.id || "",
    videoName: item.name || item.videoName || "",
    title: item.title || `${item.role || "Clip"}: ${item.name || item.videoName || "Video"}`,
    role: item.role || "Clip inteligente",
    reason: item.reason || "Sugerido desde la propuesta inteligente.",
    startSecond: item.startSecond || 0,
    endSecond: item.endSecond || end,
    score: item.confidence === "high" ? 100 : item.confidence === "low" ? 40 : 70,
    status: "SUGGESTED"
  }, index, context);
}

function createClipsCollection(clips = [], context = {}) {
  return {
    app: "AutoEdit Studio",
    block: "08_clips_y_timeline",
    projectId: context.projectId || "",
    projectName: context.projectName || "",
    source: context.source || "analysis",
    theme: context.theme || "",
    themeMode: context.themeMode || "",
    status: clips.length ? "READY" : "EMPTY",
    count: clips.length,
    clips,
    approvedOrder: Array.isArray(context.approvedOrder) ? context.approvedOrder : [],
    discardedClips: Array.isArray(context.discardedClips) ? context.discardedClips : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createTimelineFromClips(clips = [], context = {}) {
  let cursor = 0;
  const items = clips.map((clip, index) => {
    const duration = normalizeSecond(clip.durationSeconds, Math.max(1, normalizeSecond(clip.endSecond, 30) - normalizeSecond(clip.startSecond, 0)));
    const item = {
      id: `timeline_item_${index + 1}`,
      clipId: clip.id,
      sourceVideoId: clip.sourceVideoId || "",
      sourceVideoName: clip.sourceVideoName || "",
      title: clip.title,
      sourceStartSecond: normalizeSecond(clip.startSecond, 0),
      sourceEndSecond: normalizeSecond(clip.endSecond, duration),
      timelineStartSecond: cursor,
      timelineEndSecond: cursor + duration,
      durationSeconds: duration,
      role: clip.role || "",
      status: "PLACED"
    };
    cursor += duration;
    return item;
  });
  return { app: "AutoEdit Studio", block: "08_clips_y_timeline", projectId: context.projectId || "", projectName: context.projectName || "", status: clips.length ? "READY" : "EMPTY", totalDurationSeconds: cursor, tracks: [{ id: "track_video_1", type: "video", name: "Video final", items }], clipCount: clips.length, platforms: DEFAULT_PLATFORMS, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

module.exports = { normalizeSecond, createClipId, DEFAULT_PLATFORMS, createClipFromSegment, createManualClip, createClipFromSmartOrderItem, createClipsCollection, createTimelineFromClips };
