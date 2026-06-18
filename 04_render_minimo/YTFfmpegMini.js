const { spawn } = require("child_process");

function getFfmpegPath() {
  try {
    const ffmpegStatic = require("ffmpeg-static");
    if (ffmpegStatic) return ffmpegStatic;
  } catch (_error) {}
  return "ffmpeg";
}

function buildFiveSecondArgs(inputPath, outputPath, durationSeconds = 5) {
  return [
    "-y",
    "-ss",
    "0",
    "-t",
    String(durationSeconds),
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a?",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputPath
  ];
}

function testFfmpegAvailable() {
  return new Promise((resolve) => {
    const ffmpegPath = getFfmpegPath();
    const child = spawn(ffmpegPath, ["-version"], { windowsHide: true });
    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (chunk) => output += chunk.toString());
    child.stderr.on("data", (chunk) => errorOutput += chunk.toString());
    child.on("error", (error) => resolve({ ok: false, status: "ERROR", ffmpegPath, message: "FFmpeg no está disponible.", error: error.message || String(error) }));
    child.on("close", (code) => resolve({ ok: code === 0, status: code === 0 ? "OK" : "ERROR", ffmpegPath, code, message: code === 0 ? "FFmpeg está disponible." : "FFmpeg respondió con error.", output: output.slice(0, 400), errorOutput: errorOutput.slice(0, 400) }));
  });
}

module.exports = { getFfmpegPath, buildFiveSecondArgs, testFfmpegAvailable };
