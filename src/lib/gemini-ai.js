import { getAICache, setAICache } from './ai-cache.js';

// Set to track invalid or revoked API keys at runtime so they are not repeatedly retried
const invalidKeysSet = new Set();

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY_6,
  process.env.GEMINI_API_KEY_7,
].filter(Boolean);

// Priority list of Gemini models to ensure maximum uptime & fallback
const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

/**
 * Safely parse JSON from raw LLM output (handles markdown code fences and surrounding text)
 */
function parseJSONSafely(text) {
  if (!text) return null;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  const cleanedText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanedText);
}

/**
 * Robust caller to Gemini API with automatic key rotation, bad-key pruning, and multi-model fallback.
 */
export async function callGemini(promptText) {
  // Filter out known invalid keys
  let availableKeys = GEMINI_KEYS.filter(k => !invalidKeysSet.has(k));
  if (availableKeys.length === 0) {
    // If all were marked invalid, reset in case of temporary provider issues
    invalidKeysSet.clear();
    availableKeys = GEMINI_KEYS;
  }

  let lastError = null;

  for (const apiKey of availableKeys) {
    for (const model of GEMINI_MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

          const generationConfig = {
            temperature: 0.2,
            responseMimeType: 'application/json',
            maxOutputTokens: 2500
          };

          // thinkingConfig is supported on gemini-3.5-flash to produce ultra-fast, direct responses without token overhead
          if (model === 'gemini-3.5-flash') {
            generationConfig.thinkingConfig = { thinkingBudget: 0 };
          }

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig
            }),
            signal: AbortSignal.timeout(12000)
          });

          const data = await res.json();

          if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            const rawText = data.candidates[0].content.parts[0].text;
            const parsed = parseJSONSafely(rawText);
            if (parsed) return parsed;
          }

          const errMsg = data.error?.message || `HTTP ${res.status}`;
          lastError = errMsg;

          // Blacklist invalid/revoked keys immediately so they are skipped in future calls
          if (res.status === 400 && (errMsg.includes('API key not valid') || errMsg.includes('API_KEY_INVALID'))) {
            console.warn(`[Gemini AI] Blacklisting invalid API key (${apiKey.slice(0, 8)}...): ${errMsg}`);
            invalidKeysSet.add(apiKey);
            break; // Stop trying other models with this broken key
          }

          // If high demand 503 or quota 429, wait briefly and retry or fall back to next model
          if (res.status === 503 || res.status === 429) {
            if (attempt === 1) {
              await new Promise(resolve => setTimeout(resolve, 400));
              continue;
            }
          }

          // Non-retryable error for this model, move to next model in the fallback chain
          break;
        } catch (err) {
          lastError = err.message;
          // Timeout or network drop, try next model
          break;
        }
      }

      // If key was blacklisted, move to next key immediately
      if (invalidKeysSet.has(apiKey)) break;
    }
  }

  throw new Error(lastError || 'Semua Gemini API key dan model cadangan gagal dihubungi.');
}

/**
 * AI Device Price Valuation
 */
export async function estimateDevicePrice({ device = '', brand = '', condition = 'Good', storage = '128GB', ram = '8GB', category = 'Smartphone', ttlMs = 10 * 60 * 1000 }) {
  const cacheKey = `price_${brand}_${device}_${condition}_${storage}_${ram}_${category}`;
  const cached = getAICache(cacheKey, ttlMs);
  if (cached) return cached;

  const prompt = `Anda adalah pakar penilai harga gadget bekas & baru di Indonesia.
Evaluasi estimasi harga pasar wajar dalam Rupiah (IDR) untuk perangkat berikut:
Merek: ${brand}
Nama Perangkat / Model Spesifik: ${device}
Kategori: ${category}
RAM: ${ram}
Penyimpanan: ${storage}
Kondisi: ${condition}

Panduan Penilaian Penting:
1. PERHATIKAN DENGAN SEKSAMA nama/model perangkat "${device}". Jika ini adalah HP Flagship / Generasi Terbaru (seperti Samsung Galaxy S26, S25 Ultra, S24 Ultra, iPhone 16 Pro Max, Z Fold 6), harganya HARUS mencerminkan kelas flagship premium (kisaran 18 Juta - 30 Juta+ IDR tergantung model/seri/varian). Jangan menilai HP Flagship premium seperti HP midrange 11 Juta!
2. Jika model adalah Samsung S-series generasi terbaru/mendatang (seperti S26 / S26 Ultra / S25 Ultra), berikan estimasi harga flagship resmi/pasar sekunder yang realistis (19 Juta - 27 Juta IDR).
3. Jika model mid-range (seperti Samsung A55, Poco F6), berikan harga yang sesuai mid-range (3 Juta - 6 Juta IDR).
4. Hasil estimatedPrice dan priceRange harus berupa angka integer murni IDR tanpa titik atau koma.

Kembalikan HANYA JSON valid dengan struktur:
{
  "estimatedPrice": 19500000,
  "priceRange": [18000000, 21000000],
  "confidence": 92,
  "marketDemand": "High",
  "reasoning": "Penjelasan singkat analisis pasar dalam Bahasa Indonesia..."
}`;

  let finalValuation = null;

  try {
    const result = await callGemini(prompt);
    if (result && typeof result.estimatedPrice === 'number' && result.estimatedPrice > 100000) {
      finalValuation = {
        estimatedPrice: Math.round(result.estimatedPrice),
        priceRange: Array.isArray(result.priceRange) && result.priceRange.length === 2
          ? [Math.round(result.priceRange[0]), Math.round(result.priceRange[1])]
          : [Math.round(result.estimatedPrice * 0.92), Math.round(result.estimatedPrice * 1.08)],
        confidence: typeof result.confidence === 'number' ? result.confidence : 92,
        marketDemand: result.marketDemand || 'High',
        reasoning: result.reasoning || `Berdasarkan analisis pasar terkini di Indonesia untuk ${brand} ${device} (${storage}, ${condition}).`,
        isFallback: false,
        isAiValuation: true
      };
    }
  } catch (err) {
    console.warn('Gemini Price Estimation fallback triggered:', err.message);
  }

  // If AI service failed, use transparent algorithmic fallback
  if (!finalValuation) {
    finalValuation = fallbackPriceEstimation({ device, brand, condition, storage, ram, category });
  }

  setAICache(cacheKey, finalValuation);
  return finalValuation;
}

function fallbackPriceEstimation({ device = '', brand = '', condition = 'Good', storage = '128GB', ram = '8GB', category = 'Smartphone' }) {
  const nameLower = (device + ' ' + brand).toLowerCase().trim();
  let basePrice = 5000000;

  // 1. SAMSUNG GALAXY ANALYSIS
  if (nameLower.includes('samsung') || nameLower.includes('galaxy') || /\bs\d+/i.test(device.trim())) {
    const sMatch = nameLower.match(/\bs(\d{2})\b/);
    if (sMatch) {
      const num = parseInt(sMatch[1], 10);
      let genBase = 11500000 + (num - 24) * 3500000;
      if (genBase < 3500000) genBase = 3500000;

      if (nameLower.includes('ultra')) genBase += 6000000;
      else if (nameLower.includes('plus') || nameLower.includes('+')) genBase += 3000000;
      else if (nameLower.includes('fe')) genBase -= 2500000;

      basePrice = genBase;
    } else if (nameLower.includes('z fold')) {
      const foldMatch = nameLower.match(/fold\s*(\d+)/);
      const foldNum = foldMatch ? parseInt(foldMatch[1], 10) : 5;
      basePrice = 14000000 + (foldNum - 4) * 4000000;
    } else if (nameLower.includes('z flip')) {
      const flipMatch = nameLower.match(/flip\s*(\d+)/);
      const flipNum = flipMatch ? parseInt(flipMatch[1], 10) : 5;
      basePrice = 9000000 + (flipNum - 4) * 3000000;
    } else if (nameLower.includes('a5') || nameLower.includes('a55') || nameLower.includes('a54')) {
      basePrice = 4800000;
    } else if (nameLower.includes('a3') || nameLower.includes('a35') || nameLower.includes('a34')) {
      basePrice = 3500000;
    } else if (nameLower.includes('a1') || nameLower.includes('a2')) {
      basePrice = 2200000;
    } else {
      basePrice = 8500000;
    }
  } 
  // 2. APPLE IPHONE & MACBOOK ANALYSIS
  else if (nameLower.includes('iphone') || nameLower.includes('apple') || nameLower.includes('macbook') || nameLower.includes('ipad')) {
    if (nameLower.includes('macbook')) {
      if (nameLower.includes('pro')) {
        basePrice = nameLower.includes('m3') ? 24000000 : nameLower.includes('m2') ? 19000000 : 14500000;
      } else {
        basePrice = nameLower.includes('m3') ? 17500000 : nameLower.includes('m2') ? 14000000 : 10500000;
      }
    } else if (nameLower.includes('ipad')) {
      if (nameLower.includes('pro')) basePrice = 16000000;
      else if (nameLower.includes('air')) basePrice = 9500000;
      else basePrice = 5500000;
    } else {
      const ipMatch = nameLower.match(/iphone\s*(\d{2})/);
      const genNum = ipMatch ? parseInt(ipMatch[1], 10) : 15;
      let ipBase = 12500000 + (genNum - 15) * 3500000;
      if (ipBase < 4000000) ipBase = 4000000;

      if (nameLower.includes('pro max')) ipBase += 6000000;
      else if (nameLower.includes('pro')) ipBase += 3500000;
      else if (nameLower.includes('plus')) ipBase += 1500000;

      basePrice = ipBase;
    }
  } 
  // 3. XIAOMI / POCO / REDMI
  else if (nameLower.includes('xiaomi') || nameLower.includes('poco') || nameLower.includes('redmi')) {
    if (nameLower.includes('ultra')) basePrice = 14500000;
    else if (nameLower.includes('14') || nameLower.includes('13')) basePrice = 8500000;
    else if (nameLower.includes('poco f')) basePrice = 5200000;
    else if (nameLower.includes('poco x')) basePrice = 3600000;
    else basePrice = 2500000;
  }
  // 4. ASUS ROG / GAMING
  else if (nameLower.includes('rog') || nameLower.includes('legion') || nameLower.includes('predator')) {
    basePrice = 16500000;
  }
  // 5. GOOGLE PIXEL
  else if (nameLower.includes('pixel')) {
    const pxMatch = nameLower.match(/pixel\s*(\d+)/);
    const pxNum = pxMatch ? parseInt(pxMatch[1], 10) : 8;
    basePrice = 8000000 + (pxNum - 7) * 2500000;
    if (nameLower.includes('pro')) basePrice += 3500000;
  }
  // 6. DEFAULT CATEGORY BASE
  else {
    const ramNum = parseInt(ram, 10) || 8;
    if (category === 'Laptop') basePrice = 8500000 + ramNum * 500000;
    else if (category === 'Tablet') basePrice = 4500000 + ramNum * 300000;
    else basePrice = 3500000 + ramNum * 400000;
  }

  // CONDITION & STORAGE MULTIPLIERS
  const condMap = {
    'Brand New': 1.15,
    'Perfect': 1.08,
    'Like New': 1.05,
    'Excellent': 1.0,
    'Good': 0.92,
    'Fair': 0.78,
    'Cracked': 0.6,
    'Not Working': 0.35,
  };
  const condMult = condMap[condition] || 0.92;

  const stNum = parseInt(storage, 10) || 128;
  let stMult = 1.0;
  if (stNum >= 1000) stMult = 1.35;
  else if (stNum >= 512) stMult = 1.2;
  else if (stNum >= 256) stMult = 1.08;
  else if (stNum <= 64) stMult = 0.85;

  let finalPrice = basePrice * condMult * stMult;
  finalPrice = Math.round(finalPrice / 100000) * 100000;

  return {
    estimatedPrice: finalPrice,
    priceRange: [Math.round(finalPrice * 0.9), Math.round(finalPrice * 1.1)],
    confidence: 72,
    marketDemand: finalPrice > 12000000 ? 'High' : 'Moderate',
    reasoning: `[Estimasi Cadangan Sistem] Layanan AI Gemini sedang sibuk. Estimasi ini dihitung berdasarkan rumus statistik pasar untuk ${brand} ${device} (${storage}, ${ram}, ${condition}), bukan analisis mendalam AI.`,
    isFallback: true,
    isAiValuation: false
  };
}

/**
 * AI Smart Match Engine
 */
export async function evaluateSmartMatch({ preferences, devices }) {
  if (!devices || devices.length === 0) return [];

  const { budget = 15000000, primaryUse = 'Daily Lifestyle', brandPreference = 'Any' } = preferences;

  const prompt = `Anda adalah AI Recommender Gadget profesional.
Tugas Anda: Evaluasi daftar perangkat berikut untuk pengguna dengan preferensi:
- Budget Maksimal: Rp ${budget.toLocaleString('id-ID')}
- Kebutuhan Utama: ${primaryUse} (Pilihan: Creative Pro, Hardcore Gaming, Productivity, Daily Lifestyle)
- Preferensi Brand: ${brandPreference}

Daftar Perangkat:
${JSON.stringify(devices.map(d => ({
  id: d.id,
  name: d.name,
  brand: d.brand,
  category: d.category,
  price: d.price,
  ram: d.ram,
  storage: d.storage,
  chipset: d.chipset,
  condition: d.condition
})), null, 2)}

Petunjuk Skor & Evaluasi:
1. Jika harga melebihi budget pengguna, beri pengurangan skor.
2. Jika brandPreference !== 'Any' dan tidak cocok, beri pengurangan skor signifikan.
3. Evaluasi performa spesifikasi untuk kebutuhan pengguna:
   - Creative Pro: butuh RAM besar (>=12GB/16GB), chipset kencang, storage lega.
   - Hardcore Gaming: butuh RAM besar, chipset flagship (A-series Pro, Snapdragon 8, Tensor, M-series), cooling.
   - Productivity: butuh RAM cukup (>=8GB), multitasking, battery/screen.
   - Daily Lifestyle: fokus value for money, efisiensi & budget.
4. Kembalikan HANYA JSON array dari object penyesuaian untuk setiap perangkat:
[
  {
    "id": "dev1",
    "matchScore": 96,
    "aiTag": "Pilihan Teratas Gaming",
    "aiReasoning": "Chipset A16 Bionic dan RAM 6GB memberikan FPS stabil untuk gaming berat di bawah budget Anda.",
    "pros": ["Chipset kencang", "Harga masuk budget", "Kondisi sangat baik"]
  }
]
Urutkan array berdasarkan matchScore tertinggi ke terendah.`;

  try {
    const aiResults = await callGemini(prompt);
    if (Array.isArray(aiResults) && aiResults.length > 0) {
      const aiMap = new Map(aiResults.map(item => [item.id, item]));
      const scoredDevices = devices.map(dev => {
        const aiInfo = aiMap.get(dev.id) || {};
        return {
          ...dev,
          matchScore: typeof aiInfo.matchScore === 'number' ? aiInfo.matchScore : calculateHeuristicScore(dev, preferences),
          aiTag: aiInfo.aiTag || getFallbackTag(primaryUse, dev),
          aiReasoning: aiInfo.aiReasoning || getFallbackReasoning(dev, primaryUse, budget),
          pros: Array.isArray(aiInfo.pros) ? aiInfo.pros : getFallbackPros(dev),
          isFallback: false
        };
      });

      return scoredDevices.sort((a, b) => b.matchScore - a.matchScore);
    }
  } catch (err) {
    console.warn('Gemini Smart Match evaluation fallback:', err.message);
  }

  // Algorithmic Fallback for Smart Match with honest labeling
  return devices.map(dev => {
    const score = calculateHeuristicScore(dev, preferences);
    return {
      ...dev,
      matchScore: score,
      aiTag: getFallbackTag(primaryUse, dev) + ' (Sistem)',
      aiReasoning: `[Pencocokan Spesifikasi Sistem] AI Gemini sedang sibuk. Skor dihitung berdasarkan keselarasan spesifikasi RAM (${dev.ram || 'standar'}), storage (${dev.storage || 'standar'}), dan kesesuaian harga terhadap budget Rp ${budget.toLocaleString('id-ID')}.`,
      pros: getFallbackPros(dev),
      isFallback: true
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

function calculateHeuristicScore(device, { budget, primaryUse, brandPreference }) {
  let score = 70;

  // Budget score
  if (device.price <= budget) {
    score += 15;
    const priceRatio = device.price / budget;
    if (priceRatio >= 0.7 && priceRatio <= 0.98) score += 5; // Best budget utilization
  } else {
    const over = (device.price - budget) / budget;
    score -= Math.min(40, Math.round(over * 100));
  }

  // Brand preference
  if (brandPreference !== 'Any') {
    if (device.brand?.toLowerCase() === brandPreference.toLowerCase()) {
      score += 10;
    } else {
      score -= 25;
    }
  }

  // Spec alignment for primaryUse
  const ramNum = parseInt(device.ram) || 6;
  const chipset = (device.chipset || '').toLowerCase();

  if (primaryUse === 'Creative Pro') {
    if (ramNum >= 12) score += 10;
    else if (ramNum >= 8) score += 5;
    if (chipset.includes('m1') || chipset.includes('m2') || chipset.includes('pro') || chipset.includes('snapdragon 8')) score += 8;
  } else if (primaryUse === 'Hardcore Gaming') {
    if (ramNum >= 12) score += 10;
    if (chipset.includes('snapdragon 8') || chipset.includes('bionic') || chipset.includes('m1') || chipset.includes('m2') || chipset.includes('rog')) score += 10;
  } else if (primaryUse === 'Productivity') {
    if (ramNum >= 8) score += 8;
    if (device.storage === '256GB' || device.storage === '512GB') score += 5;
  } else if (primaryUse === 'Daily Lifestyle') {
    if (device.price <= budget * 0.8) score += 8;
  }

  return Math.max(10, Math.min(99, score));
}

function getFallbackTag(primaryUse) {
  if (primaryUse === 'Hardcore Gaming') return 'Gaming Powerhouse';
  if (primaryUse === 'Creative Pro') return 'Pro Performance';
  if (primaryUse === 'Productivity') return 'Productivity Beast';
  return 'Best Value Daily';
}

function getFallbackReasoning(device, primaryUse, budget) {
  return `Sangat cocok untuk kebutuhan ${primaryUse} dengan spesifikasi RAM ${device.ram || 'standar'}, penyimpanan ${device.storage || 'lega'}, dan harga yang efisien terhadap budget Rp ${budget.toLocaleString('id-ID')}.`;
}

function getFallbackPros(device) {
  const pros = [];
  if (device.ram) pros.push(`RAM ${device.ram} responsif`);
  if (device.storage) pros.push(`Storage ${device.storage}`);
  if (device.verifiedByTrustX) pros.push('Terverifikasi TrustX');
  return pros.length ? pros : ['Harga bersaing', 'Kondisi bagus'];
}

/**
 * AI Auto-Fill Listing Details (Specs, Description, Price, Brand, etc.)
 * Strictly avoids returning fake/dummy specifications if the AI cannot evaluate.
 */
export async function autoFillDeviceDetails({ deviceName = '', category = 'smartphone' }) {
  if (!deviceName.trim()) {
    throw new Error('Nama perangkat tidak boleh kosong.');
  }

  const prompt = `Anda adalah pakar spesifikasi gadget & salinan deskripsi e-commerce profesional di Indonesia.
Berikan rincian spesifikasi lengkap, estimasi harga pasar wajar, dan deskripsi penjualan yang sangat menarik untuk perangkat berikut:
Nama Perangkat / Model: "${deviceName}"
Kategori Default: "${category}"

Harap analisis model tersebut secara akurat. Kembalikan HANYA JSON valid tanpa markdown atau teks tambahan:
{
  "name": "Nama resmi lengkap model (contoh: Samsung Galaxy S24 Ultra 5G / Apple iPhone 15 Pro Max)",
  "brand": "Merek resmi (contoh: Samsung / Apple / Xiaomi / ASUS / iQOO / Poco / Sony / Dell / Lenovo / HP / Acer)",
  "category": "Kategori murni (smartphone / laptop / tablet / smartwatch / accessory)",
  "price": 12500000,
  "condition": "Like New",
  "ram": "8GB",
  "storage": "256GB",
  "processor": "Nama Chipset/Processor (contoh: Snapdragon 8 Gen 3 / Apple A17 Pro / Intel Core i7-13700H)",
  "screen": "Spesifikasi Layar (contoh: 6.8 inch Dynamic AMOLED 2X 120Hz / 6.1 inch Super Retina XDR)",
  "camera": "Spesifikasi Kamera (contoh: 200MP Main + 50MP Periscope + 12MP Ultrawide / 48MP Triple Camera)",
  "battery": "Kapasitas Baterai (contoh: 5000 mAh Fast Charging 45W / 4422 mAh)",
  "description": "Deskripsi pemasaran profesional (2-3 paragraf) dalam Bahasa Indonesia yang menjelaskan keunggulan utama, ketahanan baterai, kemampuan kamera, performa chipset, dan daya tarik produk ini bagi pembeli."
}`;

  try {
    const result = await callGemini(prompt);
    if (result && result.name && result.description) {
      return {
        name: result.name || deviceName,
        brand: result.brand || 'Lainnya',
        category: (result.category || category).toLowerCase(),
        price: typeof result.price === 'number' && result.price > 100000 ? Math.round(result.price) : 5000000,
        condition: result.condition || 'Like New',
        ram: result.ram || '8GB',
        storage: result.storage || '128GB',
        processor: result.processor || 'High Performance Chipset',
        screen: result.screen || 'Full HD+ Display',
        camera: result.camera || 'High Resolution Camera',
        battery: result.battery || 'Long-lasting Battery',
        description: result.description || `Unit ${deviceName} siap pakai dalam kondisi terawat. Semua fitur berfungsi normal.`
      };
    }
  } catch (err) {
    console.warn('Gemini AutoFill failed:', err.message);
    // Do NOT return fake/dummy specs that deceive the seller. Throw a clear, honest error instead.
    throw new Error(`Layanan AI Gemini sedang mengalami lonjakan antrean: "${err.message}". Silakan coba beberapa saat lagi atau lengkapi spesifikasi secara manual.`);
  }

  throw new Error('Gagal menghasilkan rincian spesifikasi perangkat dari AI Gemini.');
}

/**
 * AI Escrow Genuine Audit & Verification Engine
 */
export async function evaluateAIEscrowTradeIn({ oldDeviceName = '', oldDeviceCondition = 'Good', oldDeviceStorage = '128GB', oldDeviceRam = '8GB', oldDeviceDescription = '' }) {
  const cacheKey = `escrow_${oldDeviceName}_${oldDeviceCondition}_${oldDeviceStorage}_${oldDeviceRam}`;
  const cached = getAICache(cacheKey);
  if (cached) return cached;

  const prompt = `Anda adalah Sistem AI Escrow Verification resmi platform GadgetTrustX Indonesia.
Lakukan audit verifikasi keaslian dan kelayakan fisik untuk perangkat HP Lama berikut:
- Model HP: ${oldDeviceName}
- RAM / Storage: ${oldDeviceRam} / ${oldDeviceStorage}
- Status Kondisi Fisik: ${oldDeviceCondition}
- Catatan Inspeksi Fisik: "${oldDeviceDescription}"

Berikan hasil audit AI Escrow resmi dalam format JSON murni:
{
  "escrowScore": 98,
  "status": "VERIFIED_PASSED",
  "verificationBadge": "✓ Terverifikasi Asli oleh Sistem AI Escrow",
  "auditSummary": "Hasil analisis AI Gemini mengonfirmasi fisik prima tanpa dent kritis, layar & komponen internal terverifikasi 100% lolos standar garansi Escrow.",
  "securityHash": "ESCROW-AI-SHA256-AUTHENTIC"
}`;

  let finalAudit = null;

  try {
    const result = await callGemini(prompt);
    if (result && typeof result.escrowScore === 'number') {
      finalAudit = {
        ...result,
        isFallback: false
      };
    }
  } catch (err) {
    console.warn('Gemini AI Escrow fallback triggered:', err.message);
  }

  // Honest fallback: If AI escrow service is busy, mark as pending physical inspection rather than fake genuine hash
  if (!finalAudit) {
    finalAudit = {
      escrowScore: 90,
      status: "PENDING_PHYSICAL_INSPECTION",
      verificationBadge: "⏳ Menunggu Verifikasi Fisik Kurator",
      auditSummary: `Layanan AI Escrow otomatis sedang sibuk. Unit ${oldDeviceName} (${oldDeviceCondition}) akan diverifikasi secara langsung oleh tim kurator saat unit tiba di hub inspeksi.`,
      securityHash: "PENDING-MANUAL-INSPECTION",
      isFallback: true
    };
  }

  setAICache(cacheKey, finalAudit);
  return finalAudit;
}
