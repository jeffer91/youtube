function parseFfmpegTime(text) {
  const match = String(text || "").match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function createProgressFromText(text, totalSeconds = 5) {
  const currentSeconds = parseFfmpegTime(text);
  if (currentSeconds === null) return null;
  const percentage = Math.max(0, Math.min(100, Math.round((currentSeconds / totalSeconds) * 100)));
  return { currentSeconds, totalSeconds, percentage };
}

function createInitialProgress(totalSeconds = 5) {
  return { currentSeconds: 0, totalSeconds, percentage: 0 };
}

function createFinalProgress(totalSeconds = 5) {
  return { currentSeconds: totalSeconds, totalSeconds, percentage: 100 };
}

module.exports = { parseFfmpegTime, createProgressFromText, createInitialProgress, createFinalProgress };
