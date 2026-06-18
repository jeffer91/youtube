const fs = require("fs");
const path = require("path");

const RESOURCE_TYPES = {
  audio: [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"],
  image: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"],
  video: [".mp4", ".mov", ".mkv", ".webm", ".avi"],
  subtitle: [".srt", ".vtt", ".ass"],
  document: [".txt", ".md", ".json"]
};

const ALL_SUPPORTED_EXTENSIONS = Object.values(RESOURCE_TYPES).flat();

function cleanText(value, fallback = "") {
  const text = String(value || fallback || "").replace(/\s+/g, " ").trim();
  return text;
}

function normalizePath(filePath) {
  return path.normalize(String(filePath || "").trim());
}

function normalizeExtension(filePath) {
  return path.extname(String(filePath || "")).toLowerCase();
}

function inferResourceType(filePath) {
  const extension = normalizeExtension(filePath);
  const entry = Object.entries(RESOURCE_TYPES).find(([, extensions]) => extensions.includes(extension));
  return entry ? entry[0] : "unknown";
}

function isSupportedResource(filePath) {
  return ALL_SUPPORTED_EXTENSIONS.includes(normalizeExtension(filePath));
}

function createResourceId(filePath = "", index = 0) {
  const base = path.basename(String(filePath || "resource"), path.extname(String(filePath || ""))) || "resource";
  const slug = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50) || "resource";
  return `${slug}_${Date.now()}_${index}`;
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return (value / Math.pow(1024, index)).toFixed(index ? 2 : 0) + " " + units[index];
}

function cleanTags(tags = []) {
  const source = Array.isArray(tags) ? tags : String(tags || "").split(",");
  return [...new Set(source.map((tag) => cleanText(tag).toLowerCase()).filter(Boolean))];
}

function createResourceRecord(filePath, options = {}) {
  const normalizedPath = normalizePath(filePath);
  const stats = fs.existsSync(normalizedPath) ? fs.statSync(normalizedPath) : null;
  const resourceType = options.type || inferResourceType(normalizedPath);
  const extension = normalizeExtension(normalizedPath);
  const now = new Date().toISOString();

  return {
    id: options.id || createResourceId(normalizedPath, options.index || 0),
    app: "AutoEdit Studio",
    block: "10_biblioteca_y_recursos",
    name: cleanText(options.name, path.basename(normalizedPath) || "Recurso"),
    fileName: path.basename(normalizedPath),
    path: normalizedPath,
    originalPath: normalizePath(options.originalPath || normalizedPath),
    extension,
    type: resourceType,
    category: options.category || resourceType,
    source: options.source || "manual",
    imported: Boolean(options.imported),
    supported: isSupportedResource(normalizedPath),
    sizeBytes: stats ? stats.size : 0,
    size: stats ? formatBytes(stats.size) : "0 B",
    tags: cleanTags(options.tags || [resourceType]),
    status: stats ? "READY" : "MISSING",
    note: cleanText(options.note || ""),
    createdAt: options.createdAt || now,
    updatedAt: now
  };
}

function summarizeByType(resources = []) {
  const summary = { total: resources.length, audio: 0, image: 0, video: 0, subtitle: 0, document: 0, unknown: 0 };
  resources.forEach((resource) => {
    const type = resource.type || "unknown";
    summary[type] = Number(summary[type] || 0) + 1;
  });
  return summary;
}

function createLibraryIndex(resources = [], context = {}) {
  const cleanResources = Array.isArray(resources) ? resources : [];
  return {
    app: "AutoEdit Studio",
    block: "10_biblioteca_y_recursos",
    status: cleanResources.length ? "READY" : "EMPTY",
    libraryName: context.libraryName || "Biblioteca AutoEdit",
    count: cleanResources.length,
    summary: summarizeByType(cleanResources),
    resources: cleanResources,
    createdAt: context.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createLibrarySession(index = null, currentProjectResources = null) {
  return {
    app: "AutoEdit Studio",
    block: "10_biblioteca_y_recursos",
    currentLibrary: index || createLibraryIndex([]),
    currentProjectResources: currentProjectResources || null,
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  RESOURCE_TYPES,
  ALL_SUPPORTED_EXTENSIONS,
  cleanText,
  normalizePath,
  normalizeExtension,
  inferResourceType,
  isSupportedResource,
  createResourceId,
  formatBytes,
  cleanTags,
  createResourceRecord,
  summarizeByType,
  createLibraryIndex,
  createLibrarySession
};
