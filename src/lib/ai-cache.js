import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), '.next', 'ai_analysis_cache.json');
let inMemoryCache = {};

// Load persistent disk cache on initialization
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    inMemoryCache = JSON.parse(raw);
  }
} catch (err) {
  console.warn('AI cache load notice:', err.message);
}

function saveDiskCache() {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(inMemoryCache, null, 2), 'utf8');
  } catch (err) {
    console.warn('AI cache save warning:', err.message);
  }
}

export function getAICache(key, maxAgeMs = null) {
  if (!key) return null;
  const cleanKey = String(key).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
  const entry = inMemoryCache[cleanKey];
  if (entry && entry.data) {
    if (maxAgeMs && entry.savedAt) {
      const age = Date.now() - new Date(entry.savedAt).getTime();
      if (age > maxAgeMs) {
        delete inMemoryCache[cleanKey];
        saveDiskCache();
        return null;
      }
    }
    return entry.data;
  }
  return null;
}

export function setAICache(key, data) {
  if (!key || !data) return;
  const cleanKey = String(key).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
  inMemoryCache[cleanKey] = {
    data,
    savedAt: new Date().toISOString(),
  };
  saveDiskCache();
}
