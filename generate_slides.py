import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Theme Colors
    C_NAVY = RGBColor(0x0F, 0x17, 0x2A)       # Slate 900
    C_HEADER_BG = RGBColor(0x1B, 0x36, 0x5D)  # Dark Navy
    C_CYAN = RGBColor(0x02, 0x84, 0xC7)       # Sky 600
    C_TEXT_DARK = RGBColor(0x0F, 0x17, 0x2A)  # Slate 900
    C_TEXT_MUTED = RGBColor(0x47, 0x55, 0x69) # Slate 600
    C_TEXT_LIGHT = RGBColor(0xFF, 0xFF, 0xFF) # White
    C_CARD_BG = RGBColor(0xFF, 0xFF, 0xFF)    # Pure White
    C_PAGE_BG = RGBColor(0xF1, 0xF5, 0xF9)    # Slate 100
    C_BORDER = RGBColor(0xCB, 0xD5, 0xE1)     # Slate 300
    C_CODE_BG = RGBColor(0x0F, 0x17, 0x2A)    # Slate 900 (Dark Code Editor)
    C_CODE_BORDER = RGBColor(0x33, 0x41, 0x55)# Slate 700

    def add_base_slide(title_text, category_badge="SOFTWARE INSPECTION SUT"):
        slide = prs.slides.add_slide(blank_layout)

        # Full page background
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = C_PAGE_BG
        bg.line.fill.background()

        # Top Header Bar
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.15))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = C_HEADER_BG
        top_bar.line.fill.background()

        # Accent Line
        accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(1.15), Inches(13.333), Inches(0.06))
        accent.fill.solid()
        accent.fill.fore_color.rgb = C_CYAN
        accent.line.fill.background()

        # Category Badge
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.18), Inches(3.2), Inches(0.26))
        badge.fill.solid()
        badge.fill.fore_color.rgb = C_CYAN
        badge.line.fill.background()
        tf_b = badge.text_frame
        tf_b.word_wrap = True
        p_b = tf_b.paragraphs[0]
        p_b.text = category_badge.upper()
        p_b.font.size = Pt(9.5)
        p_b.font.bold = True
        p_b.font.color.rgb = C_TEXT_LIGHT
        p_b.alignment = PP_ALIGN.CENTER

        # Title Text in Top Bar
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.46), Inches(11.5), Inches(0.6))
        p = tb.text_frame.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(20)
        p.font.bold = True
        p.font.color.rgb = C_TEXT_LIGHT

        # Bottom Footer Bar
        footer = slide.shapes.add_textbox(Inches(0.8), Inches(7.12), Inches(11.7), Inches(0.35))
        pf = footer.text_frame.paragraphs[0]
        pf.text = "SUT: GadgetTrustX (https://gadgetrustx.netlify.app) | Software Quality Assurance & Static Testing"
        pf.font.size = Pt(9)
        pf.font.color.rgb = C_TEXT_MUTED

        return slide

    # ==========================================
    # SLIDE 1: TITLE SLIDE
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_HEADER_BG
    bg1.line.fill.background()

    dec = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.2), Inches(0.15), Inches(5.0))
    dec.fill.solid()
    dec.fill.fore_color.rgb = C_CYAN
    dec.line.fill.background()

    tb1 = s1.shapes.add_textbox(Inches(1.2), Inches(1.3), Inches(11.2), Inches(3.0))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    p_sub0 = tf1.paragraphs[0]
    p_sub0.text = "AKTIVITAS KELAS: STATIC TESTING & SOFTWARE INSPECTION"
    p_sub0.font.size = Pt(13)
    p_sub0.font.bold = True
    p_sub0.font.color.rgb = RGBColor(0x38, 0xBD, 0xF8)

    p_t1 = tf1.add_paragraph()
    p_t1.text = "Software Inspection Checklist\n& Automated Static Testing"
    p_t1.font.size = Pt(36)
    p_t1.font.bold = True
    p_t1.font.color.rgb = C_TEXT_LIGHT
    p_t1.space_before = Pt(8)

    p_desc = tf1.add_paragraph()
    p_desc.text = "Instrumen Pemeriksaan Mutu Kode Sumber & Kakas Bantu Analisis Statis pada SUT GadgetTrustX"
    p_desc.font.size = Pt(15)
    p_desc.font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)
    p_desc.space_before = Pt(8)

    card_info = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(4.7), Inches(10.8), Inches(1.9))
    card_info.fill.solid()
    card_info.fill.fore_color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    card_info.line.color.rgb = C_CYAN
    card_info.line.width = Pt(1.5)

    tf_info = card_info.text_frame
    tf_info.word_wrap = True
    
    p_i1 = tf_info.paragraphs[0]
    p_i1.text = "INFORMASI SYSTEM UNDER TEST (SUT) & PENYUSUN:"
    p_i1.font.size = Pt(11)
    p_i1.font.bold = True
    p_i1.font.color.rgb = RGBColor(0x38, 0xBD, 0xF8)

    p_i2 = tf_info.add_paragraph()
    p_i2.text = "• Nama SUT : GadgetTrustX (Marketplace Gadget Terverifikasi, AI Trade-In & Escrow)"
    p_i2.font.size = Pt(11)
    p_i2.font.color.rgb = C_TEXT_LIGHT

    p_i3 = tf_info.add_paragraph()
    p_i3.text = "• URL Live Deploy : https://gadgetrustx.netlify.app/  |  Repositori : https://github.com/Andrakkkk/GadgetTrustX"
    p_i3.font.size = Pt(11)
    p_i3.font.color.rgb = C_TEXT_LIGHT

    p_i4 = tf_info.add_paragraph()
    p_i4.text = "• Penyusun : Mahasiswa Peserta Mata Kuliah Penjaminan Mutu & Pengujian Perangkat Lunak  |  Tanggal : 30 September 2026"
    p_i4.font.size = Pt(10.5)
    p_i4.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

    # ==========================================
    # SLIDE 2: SPESIFIKASI SUT & GAMBARAN UMUM
    # ==========================================
    s2 = add_base_slide("Spesifikasi Teknis System Under Test (SUT): GadgetTrustX", "SPESIFIKASI SUT")

    card_s2 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(6.5), Inches(5.5))
    card_s2.fill.solid()
    card_s2.fill.fore_color.rgb = C_CARD_BG
    card_s2.line.color.rgb = C_BORDER
    tf_s2 = card_s2.text_frame
    tf_s2.word_wrap = True

    p = tf_s2.paragraphs[0]
    p.text = "Profil Arsitektur & Teknologi SUT"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_HEADER_BG

    specs = [
        ("Platform", "Web Application (Live Production di Netlify Edge CDN)"),
        ("Framework & Runtime", "Next.js 16.2.4 (Turbopack, App Router, React 19)"),
        ("Bahasa Pemrograman", "JavaScript (ES6+), JSX, PostCSS Tailwind CSS v4"),
        ("Database & Storage", "Supabase PostgreSQL (10 Tabel dengan RLS, Bucket device-media)"),
        ("Keamanan & Autentikasi", "Cloudflare Turnstile CAPTCHA, Supabase Auth Bearer Tokens"),
        ("Integrasi AI Engine", "Google Gemini 1.5 Flash (7 Key Fail-Safe Rotation Pool)"),
        ("Payment & Logistik", "Midtrans Payment Gateway (Snap/QRIS) & BinderByte Tracking"),
        ("Fokus Pengujian", "Static Code Inspection, Secret Isolation, Input Sanitization, Modularity")
    ]

    for k, v in specs:
        p_k = tf_s2.add_paragraph()
        p_k.text = f"• {k}: "
        p_k.font.bold = True
        p_k.font.size = Pt(10)
        p_k.font.color.rgb = C_TEXT_DARK
        p_k.space_before = Pt(4)
        run_v = p_k.add_run()
        run_v.text = v
        run_v.bold = False
        run_v.font.color.rgb = C_TEXT_MUTED

    img_home = r"f:\smart-device-marketplace\outputs\website_screenshots\home.png"
    if os.path.exists(img_home):
        s2.shapes.add_picture(img_home, Inches(7.5), Inches(1.4), width=Inches(5.0))
        cap = s2.shapes.add_textbox(Inches(7.5), Inches(5.9), Inches(5.0), Inches(0.8))
        pc = cap.text_frame.paragraphs[0]
        pc.text = "Gambar 1: Antarmuka Beranda SUT GadgetTrustX (https://gadgetrustx.netlify.app)"
        pc.font.size = Pt(9.5)
        pc.font.color.rgb = C_TEXT_MUTED
        pc.alignment = PP_ALIGN.CENTER

    # Helper function for Aspect Slides with Source Code Snippet
    def add_aspect_slide_with_code(slide_title, ref_tag, desc_text, questions, code_file, code_lines, img_path, img_caption):
        slide = add_base_slide(f"Aspek: {slide_title} {ref_tag}", "SOFTWARE INSPECTION CHECKLIST")

        # Left Column: Questions Card (Width: 5.6 inches)
        card_q = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(5.6), Inches(3.2))
        card_q.fill.solid()
        card_q.fill.fore_color.rgb = C_CARD_BG
        card_q.line.color.rgb = C_BORDER
        tf_q = card_q.text_frame
        tf_q.word_wrap = True

        p_desc = tf_q.paragraphs[0]
        p_desc.text = desc_text
        p_desc.font.size = Pt(9.5)
        p_desc.font.color.rgb = C_TEXT_MUTED
        p_desc.font.italic = True

        p_head = tf_q.add_paragraph()
        p_head.text = "Daftar Pertanyaan Inspeksi (Inspection Checklist):"
        p_head.font.size = Pt(11)
        p_head.font.bold = True
        p_head.font.color.rgb = C_HEADER_BG
        p_head.space_before = Pt(6)

        for idx, q in enumerate(questions, 1):
            p_q = tf_q.add_paragraph()
            p_q.text = f"{idx}. {q}"
            p_q.font.size = Pt(9.5)
            p_q.font.color.rgb = C_TEXT_DARK
            p_q.space_before = Pt(4)

        # Left Column Below: Image SUT
        if os.path.exists(img_path):
            slide.shapes.add_picture(img_path, Inches(0.8), Inches(4.75), width=Inches(5.6))
            cap = slide.shapes.add_textbox(Inches(0.8), Inches(6.75), Inches(5.6), Inches(0.35))
            pc = cap.text_frame.paragraphs[0]
            pc.text = img_caption
            pc.font.size = Pt(8.5)
            pc.font.color.rgb = C_TEXT_MUTED
            pc.alignment = PP_ALIGN.CENTER

        # Right Column: Source Code SUT Box (Width: 6.0 inches)
        card_code = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.6), Inches(1.4), Inches(5.9), Inches(5.5))
        card_code.fill.solid()
        card_code.fill.fore_color.rgb = C_CODE_BG
        card_code.line.color.rgb = C_CODE_BORDER
        card_code.line.width = Pt(1.5)

        tf_c = card_code.text_frame
        tf_c.word_wrap = True

        # Header bar in code editor
        p_c_head = tf_c.paragraphs[0]
        p_c_head.text = f"●  ●  ●   Source Code SUT yang Diinspeksi ({code_file})"
        p_c_head.font.size = Pt(10)
        p_c_head.font.bold = True
        p_c_head.font.name = 'Consolas'
        p_c_head.font.color.rgb = RGBColor(0x38, 0xBD, 0xF8) # Sky 400

        # Code lines
        for line in code_lines:
            p_code = tf_c.add_paragraph()
            p_code.text = line
            p_code.font.size = Pt(8.5)
            p_code.font.name = 'Consolas'
            if line.strip().startswith('//') or line.strip().startswith('/*') or line.strip().startswith('*'):
                p_code.font.color.rgb = RGBColor(0x64, 0x74, 0x8B) # Slate 500 (Comments)
            elif line.strip().startswith('export') or line.strip().startswith('import') or line.strip().startswith('const') or line.strip().startswith('function') or line.strip().startswith('async') or line.strip().startswith('return'):
                p_code.font.color.rgb = RGBColor(0xBA, 0xE6, 0xFD) # Cyan (Keywords)
            elif 'process.env' in line or 'alert' in line or 'apiFetch' in line or 'try' in line or 'catch' in line:
                p_code.font.color.rgb = RGBColor(0xFD, 0xBA, 0x74) # Orange (Builtins)
            else:
                p_code.font.color.rgb = RGBColor(0xE2, 0xE8, 0xF0) # Light Slate (Body)
            p_code.space_before = Pt(1.5)

    # ==========================================
    # SLIDE 3: READABILITY
    # ==========================================
    s3_questions = [
        "Apakah nama fungsi dan variabel deskriptif, mudah dipahami, serta mencerminkan tujuannya secara spesifik?",
        "Apakah struktur penamaan kode konsisten mengikuti konvensi industri (camelCase untuk fungsi/variabel, PascalCase untuk komponen)?",
        "Apakah kode terbebas dari nama variabel berkarakter tunggal misterius, singkatan tidak baku, atau magic numbers?",
        "Apakah pemisahan antara blok presentasi antarmuka dan logika pemformatan data terdefinisi jelas?"
    ]
    s3_code = [
        "// File: src/utils/formatPrice.js",
        "export const formatPrice = (price) => {",
        "  return new Intl.NumberFormat('id-ID', {",
        "    style: 'currency',",
        "    currency: 'IDR',",
        "    minimumFractionDigits: 0,",
        "    maximumFractionDigits: 0,",
        "  }).format(price);",
        "};",
        "",
        "// File: src/lib/gemini-ai.js (Fungsi Deskriptif)",
        "export async function estimateDevicePrice({",
        "  device, brand, condition, storage, ram",
        "}) {",
        "  const prompt = `Analisis taksiran harga pasar...",
        "  return await callGemini(prompt);",
        "}"
    ]
    add_aspect_slide_with_code(
        "Readability (Keterbacaan Kode)", 
        "[1]", 
        "Fokus: Memeriksa apakah penamaan entitas kode (fungsi, variabel, parameter) jelas, ekspresif, dan tidak ambigu sesuai Clean Code.",
        s3_questions,
        "src/utils/formatPrice.js",
        s3_code,
        r"f:\smart-device-marketplace\outputs\website_screenshots\price-checker.png",
        "Gambar 2: Modul AI Valuation (Price Checker) SUT"
    )

    # ==========================================
    # SLIDE 4: MAINTAINABILITY
    # ==========================================
    s4_questions = [
        "Apakah kode terorganisir secara modular dengan pemisahan tegas antara UI layer, routing API, dan logika database?",
        "Apakah sistem menerapkan prinsip Don't Repeat Yourself (DRY) dengan menyentralisasi pemanggilan data API?",
        "Apakah kode memiliki kopling rendah (loose coupling) sehingga penambahan fitur baru tidak merusak modul yang ada?",
        "Apakah komponen UI dirancang dapat digunakan kembali (reusable components) di berbagai halaman?"
    ]
    s4_code = [
        "// File: src/lib/api-client.js (Sentralisasi HTTP Client)",
        "import { createClient } from '@/lib/supabase/client';",
        "",
        "export async function apiFetch(path, options = {}) {",
        "  const supabase = createClient();",
        "  let session = null;",
        "  if (supabase) {",
        "    try {",
        "      const { data } = await supabase.auth.getSession();",
        "      session = data?.session || null;",
        "    } catch { session = null; }",
        "  }",
        "  const headers = new Headers(options.headers || {});",
        "  if (session?.access_token) {",
        "    headers.set('Authorization', `Bearer ${session.access_token}`);",
        "  }",
        "  return await fetch(path, { ...options, headers });",
        "}"
    ]
    add_aspect_slide_with_code(
        "Maintainability (Kemudahan Pemeliharaan)", 
        "[2]", 
        "Fokus: Menguji modularitas kode, pencegahan duplikasi logika (DRY), dan kemudahan ekspansi sistem di masa depan.",
        s4_questions,
        "src/lib/api-client.js",
        s4_code,
        r"f:\smart-device-marketplace\outputs\website_screenshots\marketplace.png",
        "Gambar 3: Halaman Katalog Marketplace Modular SUT"
    )

    # ==========================================
    # SLIDE 5: SECURITY
    # ==========================================
    s5_questions = [
        "Apakah kode sumber bersih dari rahasia, kata sandi, atau API Key pihak ketiga yang tertulis langsung (hardcoded)?",
        "Apakah seluruh kunci rahasia disimpan dalam environment variable (.env) dan terdaftar di file .gitignore?",
        "Apakah input formulir pengguna disanitasi dan divalidasi guna mencegah serangan SQL Injection dan XSS?",
        "Apakah endpoint transaksi penting dilindungi dari serangan bot dan automated replay attack?"
    ]
    s5_code = [
        "// File: src/lib/gemini-ai.js (Isolasi API Key ke Env)",
        "const API_KEYS = [",
        "  process.env.GEMINI_API_KEY,",
        "  process.env.GEMINI_API_KEY_2,",
        "  process.env.GEMINI_API_KEY_3,",
        "  process.env.GEMINI_API_KEY_4,",
        "  process.env.GEMINI_API_KEY_5,",
        "  process.env.GEMINI_API_KEY_6,",
        "  process.env.GEMINI_API_KEY_7,",
        "].filter(Boolean);",
        "",
        "// File: src/lib/verifyTurnstile.js (Proteksi Bot Turnstile)",
        "const secret = (process.env.TURNSTILE_SECRET_KEY || '').trim();",
        "if (!secret) return { success: false, error: 'Config missing' };",
        "// Validasi token Cloudflare di sisi server"
    ]
    add_aspect_slide_with_code(
        "Security (Keamanan Kode & Proteksi Data)", 
        "[3]", 
        "Fokus: Memverifikasi pencegahan kebocoran rahasia (secrets), validasi input (SQLi/XSS), serta proteksi bot.",
        s5_questions,
        "src/lib/gemini-ai.js & verifyTurnstile.js",
        s5_code,
        r"f:\smart-device-marketplace\outputs\website_screenshots\verification.png",
        "Gambar 4: Modul Scanner IMEI dengan Sanitasi Input"
    )

    # ==========================================
    # SLIDE 6: PERFORMANCE
    # ==========================================
    s6_questions = [
        "Apakah algoritma pemrosesan data efisien tanpa nested loop berkepanjangan (kompleksitas Big-O wajar)?",
        "Apakah sistem menerapkan strategi in-memory caching untuk menekan latensi dan kuota pemanggilan AI pihak ketiga?",
        "Apakah komponen antarmuka memanfaatkan memoization (useMemo / useCallback) guna menghindari re-render yang boros?",
        "Apakah aset gambar dan berkas statis dioptimalkan secara otomatis untuk menghemat konsumsi bandwidth?"
    ]
    s6_code = [
        "// File: src/lib/ai-cache.js (In-Memory & Disk Caching)",
        "let inMemoryCache = {};",
        "",
        "export function getAICache(key, maxAgeMs = null) {",
        "  if (!key) return null;",
        "  const cleanKey = String(key).toLowerCase().trim();",
        "  const entry = inMemoryCache[cleanKey];",
        "  if (entry && entry.data) return entry.data;",
        "  return null;",
        "}",
        "",
        "export function setAICache(key, data) {",
        "  inMemoryCache[cleanKey] = {",
        "    data, savedAt: new Date().toISOString()",
        "  };",
        "  saveDiskCache();",
        "}"
    ]
    add_aspect_slide_with_code(
        "Performance (Kinerja & Efisiensi Resource)", 
        "[4]", 
        "Fokus: Memeriksa efisiensi komputasi, konsumsi memori, caching data berulang, dan optimasi aset jaringan.",
        s6_questions,
        "src/lib/ai-cache.js",
        s6_code,
        r"f:\smart-device-marketplace\outputs\website_screenshots\smart-matching.png",
        "Gambar 5: Modul Smart Matching AI dengan Caching"
    )

    # ==========================================
    # SLIDE 7: FUNCTIONALITY & ERROR HANDLING
    # ==========================================
    s7_questions = [
        "Apakah seluruh alur fungsional bisnis (Escrow, Trade-In 6 sudut foto, Chat Nego) beroperasi sesuai requirement?",
        "Apakah seluruh operasi asynchronous (fetch API, query database) dibungkus blok try-catch-finally terstruktur?",
        "Apakah penanganan galat mencegah kondisi silent failure (kesalahan ditelan tanpa pencatatan log/pesan)?",
        "Apakah sistem menampilkan pesan umpan balik kesalahan yang ramah pengguna tanpa membocorkan raw stack trace?"
    ]
    s7_code = [
        "// File: src/app/verification/page.js (Try-Catch Handling)",
        "const handleVerify = async (e) => {",
        "  e.preventDefault();",
        "  if (imei.length !== 15) {",
        "    alert('IMEI harus berisi 15 digit angka.');",
        "    return;",
        "  }",
        "  setVerifying(true);",
        "  try {",
        "    const res = await fetch('/api/imei-check', { ... });",
        "    const data = await res.json();",
        "    setResult(data);",
        "  } catch (err) {",
        "    console.error('[IMEI Error]:', err);",
        "    alert('Sistem verifikasi sedang sibuk. Silakan coba lagi.');",
        "  } finally { setVerifying(false); }",
        "};"
    ]
    add_aspect_slide_with_code(
        "Functionality & Error Handling", 
        "[5][6]", 
        "Fokus: Menguji pemenuhan fitur bisnis sesuai requirement dan memastikan tidak ada error yang ditelan diam-diam.",
        s7_questions,
        "src/app/verification/page.js",
        s7_code,
        r"f:\smart-device-marketplace\outputs\website_screenshots\trade-in.png",
        "Gambar 6: Form Trade-In Hub dengan Validasi & Try-Catch"
    )

    # ==========================================
    # SLIDE 8: DOCUMENTATION & STANDARDS
    # ==========================================
    s8_questions = [
        "Apakah fungsi-fungsi utilitas dan modul krusial dilengkapi komentar dokumentasi JSDoc yang menjelaskan parameter?",
        "Apakah penulisan kode mematuhi coding standard dan style guide resmi (ESLint 16, indentasi konsisten)?",
        "Apakah struktur direktori dan konvensi penamaan berkas mematuhi standar Next.js App Router resmi?",
        "Apakah komentar dalam kode bersifat aktual, relevan, serta terbebas dari sisa kode mati (dead code)?"
    ]
    s8_code = [
        "// File: src/lib/verifyTurnstile.js (JSDoc Documentation)",
        "/**",
        " * Memvalidasi token Cloudflare Turnstile pada sisi server",
        " * @param {string} token - Token dari widget antarmuka client",
        " * @param {string} ip - IP address pengirim permintaan",
        " * @returns {Promise<{success: boolean, error?: string}>}",
        " */",
        "const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';",
        "const TOKEN_MAX_LENGTH = 2048;",
        "const VERIFY_TIMEOUT_MS = 8000;",
        "",
        "// File: package.json (Coding Standard Configuration)",
        "\"eslint\": \"^9\",",
        "\"eslint-config-next\": \"16.2.4\","
    ]
    add_aspect_slide_with_code(
        "Documentation & Coding Standards", 
        "[1][7]", 
        "Fokus: Memastikan kepatuhan terhadap style guide industri, dokumentasi fungsi, dan konsistensi struktur direktori.",
        s8_questions,
        "src/lib/verifyTurnstile.js & package.json",
        s8_code,
        r"f:\smart-device-marketplace\outputs\website_screenshots\contact-sheet.png",
        "Gambar 7: Tata Letak Arsitektur SUT GadgetTrustX"
    )

    # ==========================================
    # SLIDE 9: SUMMARY TABLE CHECKLIST (BLANK FOR TESTING)
    # ==========================================
    s9 = add_base_slide("Rangkuman Software Inspection Checklist (Lembar Instrumen Uji)", "CHECKLIST INSTRUMENT")

    table_shape = s9.shapes.add_table(rows=8, cols=4, left=Inches(0.8), top=Inches(1.4), width=Inches(11.7), height=Inches(5.4))
    table = table_shape.table

    table.columns[0].width = Inches(0.8)
    table.columns[1].width = Inches(2.2)
    table.columns[2].width = Inches(5.5)
    table.columns[3].width = Inches(3.2)

    headers = ["No", "Aspek Pengujian", "Kriteria dalam Checklist yang Diinspeksi", "Status (Ya / Tidak / Catatan)"]
    for c_idx, h in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_HEADER_BG
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.bold = True
        p.font.size = Pt(10.5)
        p.font.color.rgb = C_TEXT_LIGHT
        p.alignment = PP_ALIGN.CENTER if c_idx == 0 else PP_ALIGN.LEFT

    # Blank checklist rows ready for testing/evaluation
    rows_data = [
        ("1", "Readability [1]", "Nama variabel & fungsi deskriptif, konvensi camelCase, struktur kode bersih", "[   ] Ya    [   ] Tidak\nCatatan: __________________"),
        ("2", "Maintainability [2]", "Kode tersusun modular (SRP), pemisahan layer lib & UI, bebas duplikasi logika (DRY)", "[   ] Ya    [   ] Tidak\nCatatan: __________________"),
        ("3", "Security [3]", "Tidak ada hardcoded secret/API key, sanitasi input terhadap SQLi/XSS, proteksi bot", "[   ] Ya    [   ] Tidak\nCatatan: __________________"),
        ("4", "Performance [4]", "Algoritma efisien (Big-O wajar), penerapan caching AI berulang, kompresi aset gambar", "[   ] Ya    [   ] Tidak\nCatatan: __________________"),
        ("5", "Functionality [5]", "Fitur Escrow, Trade-In 6 sudut foto, dan Scanner IMEI berjalan sesuai spesifikasi", "[   ] Ya    [   ] Tidak\nCatatan: __________________"),
        ("6", "Error Handling [6]", "Blok try-catch terstruktur, status HTTP tepat, tidak ada silent failure, pesan ramah", "[   ] Ya    [   ] Tidak\nCatatan: __________________"),
        ("7", "Standards & Doc [7]", "Komentar dokumentasi JSDoc pada fungsi kritis, kepatuhan style guide ESLint 16", "[   ] Ya    [   ] Tidak\nCatatan: __________________")
    ]

    for r_idx, row in enumerate(rows_data, 1):
        bg_col = C_CARD_BG if r_idx % 2 != 0 else RGBColor(0xF8, 0xFA, 0xFC)
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg_col
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(9.5)
            p.font.color.rgb = C_TEXT_DARK
            if c_idx == 0:
                p.alignment = PP_ALIGN.CENTER
                p.font.bold = True
            elif c_idx == 1:
                p.font.bold = True
            elif c_idx == 3:
                p.font.size = Pt(8.5)
                p.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # ==========================================
    # SLIDE 10: AUTOMATED STATIC TESTING TOOLS
    # ==========================================
    s10 = add_base_slide("Kakas Bantu (Tools) untuk Otomatisasi Static Testing", "AUTOMATED STATIC TESTING TOOLS")

    tools = [
        ("1. ESLint (v9) & Next.js Linter", 
         "Analisis Kualitas Kode & Sintaks",
         "Mendeteksi syntax error, variabel tidak terpakai (unused vars), potensi memory leak pada useEffect/React Hooks, serta menegakkan konvensi formatting kode secara otomatis saat build.",
         "Fitur Otomatis: Perintah `npm run lint` terintegrasi langsung dalam siklus build Next.js dan Turbopack compiler."),
        
        ("2. SonarQube / SonarCloud", 
         "Pemeriksaan Maintainability & SAST",
         "Melakukan Static Application Security Testing (SAST) untuk mendeteksi Code Smells, duplikasi kode (DRY violations), cognitive complexity berlebih, dan kerentanan keamanan sesuai standar OWASP Top 10.",
         "Fitur Otomatis: Quality Gate otomatis pada Pull Request GitHub untuk memblokir kode yang melanggar standar."),
        
        ("3. Secretlint & GitGuardian", 
         "Pencegahan Kebocoran Kredensial",
         "Memindai seluruh baris kode dan riwayat commit Git untuk mendeteksi kunci API sensitif (Gemini, Supabase, Midtrans) sebelum terunggah ke repositori publik.",
         "Fitur Otomatis: Bekerja sebagai pre-commit hook (Husky) untuk membatalkan commit jika ditemukan secret hardcoded."),
        
        ("4. Snyk Open Source & npm audit", 
         "Pemindaian Kerentanan Dependensi",
         "Menganalisis berkas manifes dependensi (package.json dan package-lock.json) untuk mengidentifikasi pustaka pihak ketiga yang memiliki celah keamanan (CVE vulnerabilities).",
         "Fitur Otomatis: Notifikasi otomatis perbaikan versi paket rentan tanpa perlu mengeksekusi runtime aplikasi.")
    ]

    col_w = Inches(5.6)
    row_h = Inches(2.6)
    coords = [
        (Inches(0.8), Inches(1.4)),
        (Inches(6.8), Inches(1.4)),
        (Inches(0.8), Inches(4.2)),
        (Inches(6.8), Inches(4.2))
    ]

    for idx, (t_name, t_sub, t_desc, t_feat) in enumerate(tools):
        x, y = coords[idx]
        card = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, col_w, row_h)
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_BG
        card.line.color.rgb = C_CYAN
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = t_name
        p1.font.bold = True
        p1.font.size = Pt(12)
        p1.font.color.rgb = C_HEADER_BG

        p2 = tf.add_paragraph()
        p2.text = t_sub.upper()
        p2.font.bold = True
        p2.font.size = Pt(9)
        p2.font.color.rgb = C_CYAN

        p3 = tf.add_paragraph()
        p3.text = t_desc
        p3.font.size = Pt(9.5)
        p3.font.color.rgb = C_TEXT_DARK
        p3.space_before = Pt(3)

        p4 = tf.add_paragraph()
        p4.text = f"• {t_feat}"
        p4.font.size = Pt(9)
        p4.font.italic = True
        p4.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)
        p4.space_before = Pt(3)

    # ==========================================
    # SLIDE 11: REFERENCES / DAFTAR PUSTAKA
    # ==========================================
    s11 = add_base_slide("Daftar Pustaka & Referensi Teoretis", "DAFTAR PUSTAKA")

    card_ref = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(11.7), Inches(5.5))
    card_ref.fill.solid()
    card_ref.fill.fore_color.rgb = C_CARD_BG
    card_ref.line.color.rgb = C_BORDER
    tf_ref = card_ref.text_frame
    tf_ref.word_wrap = True

    p = tf_ref.paragraphs[0]
    p.text = "Referensi Akademik & Standar Industri yang Dirujuk dalam Inspeksi:"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_HEADER_BG

    references = [
        ("[1]", "Martin, R. C. (2008). Clean Code: A Handbook of Agile Software Craftsmanship. Prentice Hall. (Standar Readability, Naming Convention & Function Length)"),
        ("[2]", "Fowler, M. (2018). Refactoring: Improving the Design of Existing Code (2nd ed.). Addison-Wesley. (Standar Maintainability, Modularity & DRY Principle)"),
        ("[3]", "OWASP Foundation. (2021). OWASP Top 10:2021 - The Ten Most Critical Web Application Security Risks. (Standar Keamanan Anti-Injection, Secret Protection & Rate-Limiting)"),
        ("[4]", "IEEE Computer Society. (2014). IEEE Std 1028-2008: IEEE Standard for Software Reviews and Audits. IEEE. (Standar Metode Formal Software Inspection & Walkthrough)"),
        ("[5]", "Pressman, R. S., & Maxim, B. R. (2020). Software Engineering: A Practitioner's Approach (9th ed.). McGraw-Hill. (Kesesuaian Fungsionalitas & Verifikasi Spesifikasi)"),
        ("[6]", "Next.js & Vercel Engineering. (2026). Next.js Core Web Vitals, Error Handling, and Static Analysis Best Practices. (Standar Penanganan Galat & Caching Serverless)"),
        ("[7]", "Fagan, M. E. (1976). Design and code inspections to reduce errors in program development. IBM Systems Journal, 15(3), 182-211. (Metodologi Formal Software Inspection)")
    ]

    for num, cit in references:
        p_r = tf_ref.add_paragraph()
        p_r.text = f"{num} "
        p_r.font.bold = True
        p_r.font.size = Pt(10)
        p_r.font.color.rgb = C_CYAN
        p_r.space_before = Pt(6)

        run = p_r.add_run()
        run.text = cit
        run.bold = False
        run.font.size = Pt(9.5)
        run.font.color.rgb = C_TEXT_DARK

    # Save to paths with fallback if file is currently open in PowerPoint
    out_dir_downloads = r'C:\Users\LEANDRA\Downloads'
    out_file_downloads = os.path.join(out_dir_downloads, 'Software_Inspection_Checklist_GadgetTrustX.pptx')
    out_file_revisi = os.path.join(out_dir_downloads, 'Software_Inspection_Checklist_GadgetTrustX_Revisi.pptx')
    out_file_workspace = r'f:\smart-device-marketplace\Software_Inspection_Checklist_GadgetTrustX.pptx'

    # Save to workspace
    try:
        prs.save(out_file_workspace)
        print(f"Saved to workspace: {out_file_workspace}")
    except Exception as e:
        print(f"Workspace save notice: {e}")

    # Save to downloads
    try:
        prs.save(out_file_downloads)
        print(f"Saved to downloads: {out_file_downloads}")
    except PermissionError:
        prs.save(out_file_revisi)
        print(f"Original file was open in PowerPoint. Saved to: {out_file_revisi}")

if __name__ == '__main__':
    build_presentation()
