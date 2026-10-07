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
    C_EMERALD = RGBColor(0x05, 0x96, 0x69)    # Emerald 600
    C_ROSE = RGBColor(0xE1, 0x1D, 0x48)       # Rose 600
    C_AMBER = RGBColor(0xD9, 0x77, 0x06)      # Amber 600
    C_PURPLE = RGBColor(0x7C, 0x3A, 0xED)     # Purple 600
    C_TEXT_DARK = RGBColor(0x0F, 0x17, 0x2A)  # Slate 900
    C_TEXT_MUTED = RGBColor(0x47, 0x55, 0x69) # Slate 600
    C_TEXT_LIGHT = RGBColor(0xFF, 0xFF, 0xFF) # White
    C_CARD_BG = RGBColor(0xFF, 0xFF, 0xFF)    # Pure White
    C_PAGE_BG = RGBColor(0xF8, 0xFA, 0xFC)    # Slate 50
    C_BORDER = RGBColor(0xCB, 0xD5, 0xE1)     # Slate 300
    C_CODE_BG = RGBColor(0x0F, 0x17, 0x2A)    # Slate 900 (Dark Code Editor)
    C_CODE_BORDER = RGBColor(0x33, 0x41, 0x55)# Slate 700

    def add_base_slide(title_text, category_badge="COVERAGE ITEMS TESTING"):
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
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.18), Inches(4.5), Inches(0.26))
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
        pf.text = "SUT: GadgetTrustX (https://gadgetrustx.netlify.app) | PKPL Kelas B - Kelompok 13 | Test Design Specification"
        pf.font.size = Pt(9)
        pf.font.color.rgb = C_TEXT_MUTED

        return slide

    def add_aspect_slide_with_code(slide_title, ref_tag, desc_text, questions, code_file, code_lines, img_path, img_caption):
        slide = add_base_slide(f"Aspek: {slide_title} {ref_tag}", "COVERAGE ITEMS TESTING")

        # Left Column: Questions Card (Width: 5.6 inches)
        card_q = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), Inches(5.6), Inches(3.25))
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
        p_head.text = "Kriteria & Pertanyaan Inspeksi (Inspection Checklist):"
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
        card_code = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.6), Inches(1.35), Inches(5.9), Inches(5.55))
        card_code.fill.solid()
        card_code.fill.fore_color.rgb = C_CODE_BG
        card_code.line.color.rgb = C_CODE_BORDER
        card_code.line.width = Pt(1.5)

        tf_c = card_code.text_frame
        tf_c.word_wrap = True

        p_c_head = tf_c.paragraphs[0]
        p_c_head.text = f"●  ●  ●   Source Code SUT yang Diinspeksi ({code_file})"
        p_c_head.font.size = Pt(10)
        p_c_head.font.bold = True
        p_c_head.font.name = 'Consolas'
        p_c_head.font.color.rgb = RGBColor(0x38, 0xBD, 0xF8)

        for line in code_lines:
            p_code = tf_c.add_paragraph()
            p_code.text = line
            p_code.font.size = Pt(8.5)
            p_code.font.name = 'Consolas'
            if line.strip().startswith('//') or line.strip().startswith('/*') or line.strip().startswith('*'):
                p_code.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)
            elif line.strip().startswith('export') or line.strip().startswith('import') or line.strip().startswith('const') or line.strip().startswith('function') or line.strip().startswith('async') or line.strip().startswith('return'):
                p_code.font.color.rgb = RGBColor(0xBA, 0xE6, 0xFD)
            elif 'process.env' in line or 'alert' in line or 'apiFetch' in line or 'try' in line or 'catch' in line or 'expect' in line or 'test' in line:
                p_code.font.color.rgb = RGBColor(0xFD, 0xBA, 0x74)
            else:
                p_code.font.color.rgb = RGBColor(0xE2, 0xE8, 0xF0)
            p_code.space_before = Pt(1.5)

    # ==========================================
    # SLIDE 1: TITLE SLIDE
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_NAVY
    bg1.line.fill.background()

    tag_shape = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(1.0), Inches(6.5), Inches(0.35))
    tag_shape.fill.solid()
    tag_shape.fill.fore_color.rgb = C_CYAN
    tag_shape.line.fill.background()
    tf_tag = tag_shape.text_frame
    pt = tf_tag.paragraphs[0]
    pt.text = "TEST DESIGN SPECIFICATION FROM INSPECTION CHECKLIST"
    pt.font.size = Pt(10.5)
    pt.font.bold = True
    pt.font.color.rgb = C_TEXT_LIGHT
    pt.alignment = PP_ALIGN.CENTER

    tbox = s1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.3), Inches(2.2))
    tf1 = tbox.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "Software Inspection Checklist &\nAutomated Testing Specification"
    p1.font.size = Pt(32)
    p1.font.bold = True
    p1.font.color.rgb = C_TEXT_LIGHT

    p1_sub = tf1.add_paragraph()
    p1_sub.text = "Laporan Pengujian 5 Kategori Coverage Items SUT GadgetTrustX Sesuai Form Spesifikasi Tim"
    p1_sub.font.size = Pt(15)
    p1_sub.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
    p1_sub.space_before = Pt(10)

    # Card Kelompok & SUT Info
    card_info = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(4.0), Inches(11.333), Inches(2.7))
    card_info.fill.solid()
    card_info.fill.fore_color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    card_info.line.color.rgb = RGBColor(0x33, 0x41, 0x55)
    tf_info = card_info.text_frame
    tf_info.word_wrap = True

    pi1 = tf_info.paragraphs[0]
    pi1.text = "INFORMASI KELOMPOK 13 & SYSTEM UNDER TEST (SUT):"
    pi1.font.size = Pt(12)
    pi1.font.bold = True
    pi1.font.color.rgb = RGBColor(0x38, 0xBD, 0xF8)

    members = [
        "1. Leandra Chelsea Geovani (NIM: 202310370331421)",
        "2. Muhammad Zaky Praditama (NIM: 202310370311416)",
        "3. Reyvaldi Febryan Widya Utomo (NIM: 202310370311409)",
        "4. Reno Wahyu Sanrama (NIM: 202310370311118)"
    ]
    for m in members:
        pm = tf_info.add_paragraph()
        pm.text = f"• {m}"
        pm.font.size = Pt(10.5)
        pm.font.color.rgb = C_TEXT_LIGHT
        pm.space_before = Pt(2)

    psut = tf_info.add_paragraph()
    psut.text = "Mata Kuliah: Penjaminan Mutu & Pengujian Perangkat Lunak (PKPL Kelas B) | SUT: GadgetTrustX (https://gadgetrustx.netlify.app)"
    psut.font.size = Pt(10)
    psut.font.italic = True
    psut.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
    psut.space_before = Pt(8)

    # ==========================================
    # SLIDE 2: TUJUAN PEMBELAJARAN (Sesuai Foto 1)
    # ==========================================
    s2 = add_base_slide("Tujuan Pembelajaran & Ruang Lingkup Static Testing", "TUJUAN PEMBELAJARAN")

    goals = [
        ("1. Software Testing Life Cycle (STLC)",
         "Mahasiswa Mampu Menjelaskan Software Testing Lifecycle",
         "Memahami siklus hidup pengujian sistematis dari Requirement Analysis, Test Planning, Test Case Development, Test Execution, hingga Test Closure pada SUT.",
         C_ROSE),
        ("2. Model dalam Static Testing",
         "Mahasiswa Mampu Menjelaskan Model dalam Static Testing",
         "Menguasai teknik Fagan Inspection, Technical Reviews, Walkthrough, dan Desk Checking untuk mendeteksi defect seawal mungkin tanpa mengeksekusi kode.",
         C_CYAN),
        ("3. Penerapan Tahap Static Testing",
         "Mahasiswa Mampu Menerapkan Tahap Static Testing",
         "Menyusun instrumen Software Inspection Checklist dan mengintegrasikan kakas bantu otomatis (Linter, SAST, E2E Runner) pada kode sumber riil.",
         C_AMBER)
    ]

    for idx, (title, sub, desc, color) in enumerate(goals):
        x = Inches(0.8 + idx * 3.95)
        c_goal = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(1.6), Inches(3.75), Inches(5.1))
        c_goal.fill.solid()
        c_goal.fill.fore_color.rgb = C_CARD_BG
        c_goal.line.color.rgb = color
        c_goal.line.width = Pt(2.0)

        tf_g = c_goal.text_frame
        tf_g.word_wrap = True

        circ = s2.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(1.3), Inches(1.9), Inches(1.15), Inches(1.15))
        circ.fill.solid()
        circ.fill.fore_color.rgb = color
        circ.line.fill.background()
        tf_circ = circ.text_frame
        p_ci = tf_circ.paragraphs[0]
        p_ci.text = f"0{idx+1}"
        p_ci.font.size = Pt(18)
        p_ci.font.bold = True
        p_ci.font.color.rgb = C_TEXT_LIGHT
        p_ci.alignment = PP_ALIGN.CENTER

        pg1 = tf_g.paragraphs[0]
        pg1.text = "\n\n\n\n" + title
        pg1.font.bold = True
        pg1.font.size = Pt(13)
        pg1.font.color.rgb = C_HEADER_BG
        pg1.alignment = PP_ALIGN.CENTER

        pg2 = tf_g.add_paragraph()
        pg2.text = sub.upper()
        pg2.font.bold = True
        pg2.font.size = Pt(9.5)
        pg2.font.color.rgb = color
        pg2.alignment = PP_ALIGN.CENTER
        pg2.space_before = Pt(4)

        pg3 = tf_g.add_paragraph()
        pg3.text = desc
        pg3.font.size = Pt(10)
        pg3.font.color.rgb = C_TEXT_DARK
        pg3.space_before = Pt(12)

    # ==========================================
    # SLIDE 3: SPESIFIKASI TEKNIS SUT (Sesuai Foto 3 Poin 2)
    # ==========================================
    s3 = add_base_slide("Spesifikasi Teknis System Under Test (SUT): GadgetTrustX", "SPESIFIKASI SUT")

    card_sut = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(6.0), Inches(5.4))
    card_sut.fill.solid()
    card_sut.fill.fore_color.rgb = C_CARD_BG
    card_sut.line.color.rgb = C_BORDER
    tf_sut = card_sut.text_frame
    tf_sut.word_wrap = True

    ps_head = tf_sut.paragraphs[0]
    ps_head.text = "Profil Arsitektur & Teknologi SUT GadgetTrustX"
    ps_head.font.size = Pt(13)
    ps_head.font.bold = True
    ps_head.font.color.rgb = C_HEADER_BG

    specs = [
        ("Nama Platform", "GadgetTrustX (Marketplace Gadget Terverifikasi, AI Trade-In & Escrow)"),
        ("URL Live Deploy", "https://gadgetrustx.netlify.app/ (Production Serverless Environment)"),
        ("Repositori Git", "https://github.com/Andrakkkk/GadgetTrustX (Branch: main & main2)"),
        ("Framework Utama", "Next.js 16.2.4 (React 19.2.4 Compiler, Turbopack, App Router)"),
        ("Runtime & Bahasa", "Node.js v24.19.0, JavaScript (ES2024 Modules / ESM)"),
        ("Styling Antarmuka", "Tailwind CSS v4 Engine, Lucide Icons, GSAP Motion Animations"),
        ("Backend & Database", "Supabase Database (PostgreSQL 15), Supabase SSR Client, Row Level Security"),
        ("Payment Gateway", "Midtrans Client SDK v1.4.3 (Escrow & Virtual Account Integration)"),
        ("Mesin Kecerdasan", "Google Gemini AI Flash 2.5 API (Dynamic Price Valuation & Trade-In)"),
        ("Testing Harness", "Playwright Test Suite v1.63, k6 Load Tester, Node.js Native Test Runner")
    ]

    for k, v in specs:
        p_row = tf_sut.add_paragraph()
        p_row.text = f"• {k}: {v}"
        p_row.font.size = Pt(9.5)
        p_row.font.color.rgb = C_TEXT_DARK
        p_row.space_before = Pt(3.5)

    if os.path.exists(r"outputs/website_screenshots/home.png"):
        s3.shapes.add_picture(r"outputs/website_screenshots/home.png", Inches(7.1), Inches(1.4), width=Inches(5.4))
        cap = s3.shapes.add_textbox(Inches(7.1), Inches(6.0), Inches(5.4), Inches(0.8))
        pc = cap.text_frame.paragraphs[0]
        pc.text = "Gambar 1: Antarmuka Beranda SUT GadgetTrustX (https://gadgetrustx.netlify.app)"
        pc.font.size = Pt(9.5)
        pc.font.color.rgb = C_TEXT_MUTED
        pc.alignment = PP_ALIGN.CENTER

    # ==========================================
    # SLIDE 4: ASPEK 1 — SECURITY (Coverage Items for Security: NFR-001 s/d NFR-005)
    # ==========================================
    s4_questions = [
        "NFR-001: Apakah form login memvalidasi email, password kosong, dan menerapkan type=password?",
        "NFR-002: Apakah rute sensitif (/buyer-profile, /seller-profile, /admin) terproteksi oleh AuthGuard?",
        "NFR-003: Apakah input formulir IMEI disanitasi dari muatan SQL Injection (' OR 1=1 --) dan XSS?",
        "NFR-004 & 005: Apakah rahasia API (Turnstile, service role) terisolasi dan sesi dibersihkan saat logout?"
    ]
    s4_code = [
        "// File: src/components/AuthGuard.jsx (Route Protection NFR-002)",
        "export default function AuthGuard({ children }) {",
        "  const { user, isLoading } = useAuth();",
        "  const router = useRouter();",
        "  useEffect(() => {",
        "    if (!isLoading && !user) router.push('/login');",
        "  }, [user, isLoading, router]);",
        "  if (isLoading || !user) return <LoadingSpinner />;",
        "  return children;",
        "}",
        "",
        "// File: e2e/security.spec.js (Playwright Security Harness NFR-003)",
        "test('TC-SEC-07: Sanitasi SQL Injection', async ({ page }) => {",
        "  await page.goto('/verification');",
        "  await imeiInput.fill(\"' OR 1=1 --\");",
        "  await expect(imeiInput).toHaveValue('11');",
        "});"
    ]
    add_aspect_slide_with_code(
        "Security (Coverage Items for Security)", 
        "[1][2]", 
        "Fokus Dokumen: NFR-001 s/d NFR-005 (12 Test Cases) — Validasi kredensial login, AuthGuard protected route, sanitasi anti-SQLi/XSS, dan pembersihan sesi logout.",
        s4_questions,
        "src/components/AuthGuard.jsx & e2e/security.spec.js",
        s4_code,
        r"outputs/website_screenshots/verification.png",
        "Gambar 2: Modul Scanner IMEI dengan Proteksi Anti-Injection SUT"
    )

    # ==========================================
    # SLIDE 5: ASPEK 2 — FUNCTIONALITY (Coverage Items for Functionality: NFR-006 s/d NFR-011)
    # ==========================================
    s5_questions = [
        "NFR-006 & 007: Apakah fungsi autentikasi (role switch, register) dan navigasi beranda beroperasi tepat?",
        "NFR-008: Apakah katalog marketplace dan fitur pencarian perangkat menyajikan data inventaris valid?",
        "NFR-009: Apakah kalkulator Price Checker dan alur wizard 3-step Smart Match bekerja sesuai spesifikasi?",
        "NFR-010 & 011: Apakah alur Trade-In 6 sudut foto dan verifikasi TAC 80+ model IMEI berjalan sempurna?"
    ]
    s5_code = [
        "// File: e2e/marketplace.spec.js (Playwright Functionality NFR-008)",
        "test('TC-MKT-02: Membuka katalog produk & pencarian', async ({ page }) => {",
        "  await page.goto('/marketplace');",
        "  const searchInput = page.getByPlaceholder(/Cari gadget.../i);",
        "  await searchInput.fill('iPhone');",
        "  await expect(page.locator('.device-card')).toBeVisible();",
        "});",
        "",
        "// File: src/app/api/imei-check/route.js (TAC Lookup NFR-011)",
        "const tac = imei.substring(0, 8);",
        "const deviceData = TAC_DATABASE[tac] || guessBrandFromPrefix(tac);",
        "return NextResponse.json({ status: 'VERIFIED', device: deviceData });"
    ]
    add_aspect_slide_with_code(
        "Functionality (Coverage Items for Functionality)", 
        "[3]", 
        "Fokus Dokumen: NFR-006 s/d NFR-011 (19 Test Cases) — Memenuhi alur bisnis autentikasi, hero navigasi, marketplace, AI valuation, trade-in, dan validasi IMEI.",
        s5_questions,
        "e2e/marketplace.spec.js & imei-check/route.js",
        s5_code,
        r"outputs/website_screenshots/trade-in.png",
        "Gambar 3: Halaman Trade-In Hub dengan Upload 6 Sudut Foto SUT"
    )

    # ==========================================
    # SLIDE 6: ASPEK 3 — PERFORMANCE (Coverage Items for Performance: NFR-012 s/d NFR-015)
    # ==========================================
    s6_questions = [
        "NFR-012: Apakah Largest Contentful Paint (LCP) pada Beranda, Marketplace, dan AI Valuation <= 2.5 detik?",
        "NFR-013: Apakah skor Cumulative Layout Shift (CLS) stabil dan tidak melebihi ambang batas <= 0.1?",
        "NFR-014: Apakah waktu muat awal halaman beranda (TTFB + Load) tuntas dalam durasi kurang dari 3 detik?",
        "NFR-015: Apakah waktu respon navigasi transisi antar rute beroperasi cepat dengan latensi di bawah 2 detik?"
    ]
    s6_code = [
        "// File: tests/performance/coverage-items-load-test.js (k6 Load Test)",
        "import http from 'k6/http';",
        "import { check, sleep } from 'k6';",
        "",
        "export const options = {",
        "  thresholds: {",
        "    http_req_duration: ['p(95)<2000'], // NFR-015: respon < 2 detik",
        "    'browser_web_vital_lcp': ['p(90)<2500'], // NFR-012: LCP <= 2.5s",
        "    'browser_web_vital_cls': ['p(90)<0.1'],  // NFR-013: CLS <= 0.1",
        "  },",
        "};",
        "",
        "export default function () {",
        "  const res = http.get('https://gadgetrustx.netlify.app/');",
        "  check(res, { 'status is 200': (r) => r.status === 200 });",
        "}"
    ]
    add_aspect_slide_with_code(
        "Performance (Coverage Items for Performance)", 
        "[4]", 
        "Fokus Dokumen: NFR-012 s/d NFR-015 (4 Test Cases k6) — Pengujian kuantitatif Core Web Vitals (LCP, CLS), load time beranda, dan efisiensi waktu respon navigasi.",
        s6_questions,
        "tests/performance/coverage-items-load-test.js",
        s6_code,
        r"outputs/website_screenshots/smart-matching.png",
        "Gambar 4: Modul Smart Matching AI dengan Evaluasi Kinerja Kuantitatif"
    )

    # ==========================================
    # SLIDE 7: ASPEK 4 — USABILITY (Coverage Items for Usability: NFR-016 & NFR-017)
    # ==========================================
    s7_questions = [
        "NFR-016: Apakah struktur navigasi 5 menu utama intuitif dan drawer mobile menutup otomatis saat rute berpindah?",
        "NFR-016: Apakah format nilai harga disajikan dalam standar Rupiah (IDR) dan menyematkan badge seller 'Verified'?",
        "NFR-017: Apakah form menerapkan input masking real-time (otomatis menyaring non-angka & membatasi 15 digit)?",
        "NFR-017: Apakah tombol submit berstatus disabled saat data belum lengkap guna mencegah double-submission?"
    ]
    s7_code = [
        "// File: e2e/usability-feedback.spec.js (Playwright Usability NFR-017)",
        "test('TC-USB-04: Validasi input masking IMEI', async ({ page }) => {",
        "  await page.goto('/verification');",
        "  const imeiInput = page.getByPlaceholder(/Masukkan IMEI 15 digit/i);",
        "  await imeiInput.fill('3546-8515-ABCD-564');",
        "  await expect(imeiInput).toHaveValue('35468515564');",
        "});",
        "",
        "test('TC-USB-05: Tombol disabled saat data belum lengkap', async ({ page }) => {",
        "  const verifyBtn = page.getByRole('button', { name: /Verifikasi/i });",
        "  await expect(verifyBtn).toBeDisabled();",
        "});"
    ]
    add_aspect_slide_with_code(
        "Usability (Coverage Items for Usability)", 
        "[5]", 
        "Fokus Dokumen: NFR-016 & NFR-017 (6 Test Cases) — Kemudahan navigasi visual, mobile responsiveness, input masking formulir, dan pencegahan galat (Error Prevention Heuristics).",
        s7_questions,
        "e2e/usability-feedback.spec.js & Navbar.jsx",
        s7_code,
        r"reports/screenshots/TC-USB-01.png",
        "Gambar 5: Bukti Pengujian Playwright untuk Usability Navigasi (TC-USB-01)"
    )

    # ==========================================
    # SLIDE 8: ASPEK 5 — RELIABILITY (Coverage Items for Reliability: NFR-018 & NFR-019)
    # ==========================================
    s8_questions = [
        "NFR-018: Apakah seluruh tautan internal pada halaman utama berstatus sehat dan merespons tanpa error (status < 400)?",
        "NFR-019: Apakah rute yang tidak terdaftar ditangani dengan elegan dengan menyajikan halaman galat 404 informatif?",
        "NFR-019: Apakah konsol browser bebas dari kegagalan eksekusi skrip JavaScript kritis saat halaman dimuat?",
        "Evaluasi: Apakah temuan React hydration mismatch (#418) pada serverless environment telah terisolasi aman?"
    ]
    s8_code = [
        "// File: testing/tests/reliability/reliability.spec.ts (NFR-018 & 019)",
        "test('TC-024: Verifikasi semua link internal di beranda', async ({ page }) => {",
        "  await page.goto('/');",
        "  const links = await page.locator('nav a, footer a').all();",
        "  for (const link of links) {",
        "    const href = await link.getAttribute('href');",
        "    const res = await page.request.get(href);",
        "    expect(res.status()).toBeLessThan(400);",
        "  }",
        "});",
        "",
        "test('TC-025: Halaman 404 untuk rute tidak ada', async ({ page }) => {",
        "  const res = await page.goto('/halaman-acak-tidak-ada');",
        "  expect(res.status()).toBe(404);",
        "});"
    ]
    add_aspect_slide_with_code(
        "Reliability (Coverage Items for Reliability)", 
        "[6]", 
        "Fokus Dokumen: NFR-018 & NFR-019 (3 Test Cases) — Keutuhan link internal bebas broken link, penanganan halaman 404, dan monitoring konsol browser terhadap galat runtime.",
        s8_questions,
        "testing/tests/reliability/reliability.spec.ts",
        s8_code,
        r"outputs/website_screenshots/home.png",
        "Gambar 6: Halaman Beranda SUT dengan 10 Link Navigasi Terverifikasi Sehat"
    )

    # ==========================================
    # SLIDE 9: TABEL SOFTWARE INSPECTION CHECKLIST (SESUAI 5 KATEGORI DOKUMEN TIM)
    # ==========================================
    s9 = add_base_slide("Rangkuman Software Inspection Checklist (Sesuai Form Dokumen)", "CHECKLIST INSTRUMENT")

    table_shape = s9.shapes.add_table(rows=6, cols=4, left=Inches(0.8), top=Inches(1.4), width=Inches(11.733), height=Inches(5.4))
    table = table_shape.table

    table.columns[0].width = Inches(0.8)
    table.columns[1].width = Inches(2.2)
    table.columns[2].width = Inches(5.6)
    table.columns[3].width = Inches(3.133)

    headers = ["No", "Aspek (Coverage Items)", "Kriteria dalam Checklist yang Diinspeksi (Sesuai Form)", "Status (Ya / Catatan Evaluasi)"]
    for c_idx, h in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_HEADER_BG
        p_h = cell.text_frame.paragraphs[0]
        p_h.text = h
        p_h.font.bold = True
        p_h.font.size = Pt(10)
        p_h.font.color.rgb = C_TEXT_LIGHT
        p_h.alignment = PP_ALIGN.CENTER

    checklist_items = [
        ("1", "Security [1][2]\n(NFR-001 s/d NFR-005)", "Validasi kredensial login, type=password, AuthGuard route protection, sanitasi input anti-SQLi/XSS, isolasi rahasia Turnstile, dan pembersihan sesi logout.", "[✓] Ya — Terpenuhi 100%\n12/12 Test Cases Lulus pada Playwright Security Suite"),
        ("2", "Functionality [3]\n(NFR-006 s/d NFR-011)", "Setiap fungsi autentikasi, navigasi beranda, katalog marketplace, valuasi harga AI, Trade-In HP bekas, dan verifikasi TAC IMEI beroperasi sesuai requirement.", "[✓] Ya — Terpenuhi 100%\n19/19 Test Cases Lulus pada Playwright E2E Suite"),
        ("3", "Performance [4]\n(NFR-012 s/d NFR-015)", "LCP <= 2.5s pada 3 halaman utama, CLS <= 0.1 stabil, waktu muat beranda < 3 detik, dan respon navigasi antar halaman < 2 detik pada kondisi pengujian.", "[✓] Ya — Terpenuhi 100%\n4/4 Test Cases Lulus pada Pengujian Beban k6"),
        ("4", "Usability [5]\n(NFR-016 & NFR-017)", "Navigasi intuitif (5 menu), responsive mobile drawer, format harga Rupiah (IDR), input masking real-time form IMEI, dan status tombol disabled saat loading.", "[✓] Ya — Terpenuhi 100%\n6/6 Test Cases Lulus pada Playwright Usability Suite"),
        ("5", "Reliability [6]\n(NFR-018 & NFR-019)", "Semua link internal beranda bebas broken link (status < 400), penanganan rute tidak terdaftar via halaman 404, dan monitoring console JavaScript.", "[✓] Ya — Terpenuhi Sebagian\n2/3 Lulus (Catatan: Temuan React Hydration Mismatch #418)")
    ]

    for r_idx, (no, asp, crit, stat) in enumerate(checklist_items, 1):
        row_cells = [table.cell(r_idx, 0), table.cell(r_idx, 1), table.cell(r_idx, 2), table.cell(r_idx, 3)]
        row_vals = [no, asp, crit, stat]
        for c_idx, cell in enumerate(row_cells):
            cell.fill.solid()
            cell.fill.fore_color.rgb = C_CARD_BG if r_idx % 2 == 1 else RGBColor(0xF1, 0xF5, 0xF9)
            p_c = cell.text_frame.paragraphs[0]
            p_c.text = row_vals[c_idx]
            p_c.font.size = Pt(9.5)
            p_c.font.color.rgb = C_TEXT_DARK
            if c_idx == 0:
                p_c.alignment = PP_ALIGN.CENTER
                p_c.font.bold = True
            elif c_idx == 1:
                p_c.font.bold = True
                p_c.font.color.rgb = C_HEADER_BG
            elif c_idx == 3:
                p_c.font.color.rgb = C_EMERALD if "100%" in stat else C_AMBER

    # ==========================================
    # SLIDE 10: KAKAS BANTU PENGUJIAN OTOMATIS (Sesuai Foto 3 Poin 2)
    # ==========================================
    s10 = add_base_slide("Kakas Bantu (Tools) untuk Otomatisasi Static & Dynamic Testing", "AUTOMATED TESTING TOOLS")

    tools = [
        ("1. Playwright Test Suite v1.63", 
         "PENGUJIAN OTOMATIS END-TO-END (SECURITY, FUNCTIONALITY & USABILITY)",
         "Menjalankan browser automation headless untuk memverifikasi alur otentikasi login, navigasi navbar, input masking IMEI, dan error prevention tanpa intervensi manual.",
         "Fitur Otomatis: Trace Viewer, HTML web report interaktif, assertion web-first (toBeVisible, toBeDisabled), dan eksekusi multi-worker paralel."),
        
        ("2. k6 Load Tester (Grafana Labs)", 
         "PENGUKURAN KUANTITATIF PERFORMANCE & CORE WEB VITALS",
         "Menguji performa halaman di bawah beban lalu lintas virtual user, mengukur metrik Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), dan waktu respons navigasi antar rute.",
         "Fitur Otomatis: Threshold otomatis batas lulus (p(95)<2000ms untuk navigasi, p(90)<2500ms untuk LCP)."),
        
        ("3. ESLint (v9) & Next.js Linter", 
         "ANALISIS KUALITAS KODE STATIS & SINTAKS",
         "Mendeteksi syntax error, variabel tidak terpakai (unused vars), potensi memory leak pada useEffect/React Hooks, serta menegakkan konvensi formatting kode secara otomatis saat build.",
         "Fitur Otomatis: Perintah `npm run lint` terintegrasi langsung dalam siklus build Next.js dan Turbopack compiler."),
        
        ("4. Node.js Native Test Runner (node:test)", 
         "ORKESTRASI SUITE PENGUJIAN OTOMATIS & GENERASI LAPORAN",
         "Mengeksekusi automated test script (usability & logic verification) secara native dan terisolasi tanpa overhead browser, serta mengompilasi rekapitulasi pengujian ke dalam laporan HTML visual mandiri.",
         "Fitur Otomatis: Eksekusi batch CLI (node tests/run-usability.mjs), assertions ketat (node:assert/strict), dan generator laporan visual HTML interaktif.")
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
        p2.font.size = Pt(8.5)
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
    # SLIDE 11: RINGKASAN HASIL PENGUJIAN OTOMATIS (DARI FORM GOOGLE DOCS KELOMPOK 13)
    # ==========================================
    s11 = add_base_slide("Ringkasan Hasil Eksekusi Pengujian Otomatis (Kelompok 13)", "HASIL PENGUJIAN SUT")

    summary_cards = [
        ("1. Security (NFR-001 s/d NFR-005)", "12 / 12 Lulus (100%)", "Otentikasi Login, Route Protection AuthGuard, Sanitasi SQLi/XSS, Turnstile, & Secure Logout.", C_ROSE),
        ("2. Functionality (NFR-006 s/d NFR-011)", "19 / 19 Lulus (100%)", "Alur Autentikasi, Landing Hero, Marketplace, AI Valuation, Trade-In Hub, & Scanner IMEI.", C_CYAN),
        ("3. Performance (NFR-012 s/d NFR-015)", "4 / 4 Lulus (100%)", "LCP <= 2.5s, CLS <= 0.1, Beranda < 3s, dan Waktu Respon Navigasi < 2s pada k6.", C_AMBER),
        ("4. Usability (NFR-016 & NFR-017)", "6 / 6 Lulus (100%)", "Struktur Navigasi 5 Menu Utama, Mobile Drawer, Real-Time Input Masking, & Disabled Submit.", C_EMERALD),
        ("5. Reliability (NFR-018 & NFR-019)", "2 / 3 Lulus (67%)", "10 link internal beranda sehat (< 400), penanganan 404 lulus, temuan hydration mismatch #418.", C_PURPLE)
    ]

    card_coords = [
        (Inches(0.8), Inches(1.4), Inches(5.6), Inches(2.55)),
        (Inches(6.8), Inches(1.4), Inches(5.6), Inches(2.55)),
        (Inches(0.8), Inches(4.15), Inches(3.6), Inches(2.65)),
        (Inches(4.8), Inches(4.15), Inches(3.6), Inches(2.65)),
        (Inches(8.8), Inches(4.15), Inches(3.6), Inches(2.65))
    ]

    for idx, (title, score, desc, color) in enumerate(summary_cards):
        x, y, w, h = card_coords[idx]
        card = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_BG
        card.line.color.rgb = color
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.bold = True
        p1.font.size = Pt(11)
        p1.font.color.rgb = C_HEADER_BG

        p2 = tf.add_paragraph()
        p2.text = score
        p2.font.bold = True
        p2.font.size = Pt(16)
        p2.font.color.rgb = color
        p2.space_before = Pt(3)

        p3 = tf.add_paragraph()
        p3.text = desc
        p3.font.size = Pt(9)
        p3.font.color.rgb = C_TEXT_DARK
        p3.space_before = Pt(4)

        p4 = tf.add_paragraph()
        p4.text = "Status: Terverifikasi di GitHub main2"
        p4.font.size = Pt(8.5)
        p4.font.italic = True
        p4.font.color.rgb = C_TEXT_MUTED
        p4.space_before = Pt(3)

    # ==========================================
    # SLIDE 12: DAFTAR PUSTAKA [1] - [6]
    # ==========================================
    s12 = add_base_slide("Daftar Pustaka & Referensi Teoretis", "DAFTAR PUSTAKA")

    card_ref = s12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(11.733), Inches(5.5))
    card_ref.fill.solid()
    card_ref.fill.fore_color.rgb = C_CARD_BG
    card_ref.line.color.rgb = C_BORDER
    tf_ref = card_ref.text_frame
    tf_ref.word_wrap = True

    pr_head = tf_ref.paragraphs[0]
    pr_head.text = "Referensi Akademik & Standar Industri yang Dirujuk dalam Pengujian 5 Kategori SUT:"
    pr_head.font.size = Pt(12)
    pr_head.font.bold = True
    pr_head.font.color.rgb = C_HEADER_BG

    references = [
        "[1] OWASP Foundation. (2021). OWASP Top 10:2021 - The Ten Most Critical Web Application Security Risks. (Rujukan Security, Anti-Injection & Credential Protection)",
        "[2] Stuttard, P., & Pinto, M. (2011). The Web Application Hacker's Handbook: Finding and Exploiting Security Flaws (2nd ed.). Wiley. (Rujukan Input Validation & AuthGuard)",
        "[3] Pressman, R. S., & Maxim, B. R. (2020). Software Engineering: A Practitioner's Approach (9th ed.). McGraw-Hill. (Rujukan Kesesuaian Fungsionalitas & Spesifikasi SUT)",
        "[4] Google Chrome Engineering. (2024). Web Vitals: Essential metrics for a healthy site (LCP, CLS, INP). (Rujukan Pengujian Kuantitatif Performance k6)",
        "[5] Nielsen, J. (1994). 10 Usability Heuristics for User Interface Design. Nielsen Norman Group. (Rujukan Usability, Error Prevention & Visibility of System Status)",
        "[6] IEEE Computer Society. (2014). IEEE Std 1028-2008: IEEE Standard for Software Reviews and Audits. IEEE. (Rujukan Standar Pengujian Reliabilitas & Tautan Internal)",
        "[7] Next.js & Vercel Engineering. (2026). Next.js Core Web Vitals, Error Handling, and Static Analysis Best Practices. (Rujukan Serverless & Hydration Handling)",
        "[8] ISO/IEC/IEEE. (2013). ISO/IEC/IEEE 29119: Software and systems engineering - Software testing. IEEE. (Rujukan Metodologi Automated Test Case Execution)"
    ]

    for ref in references:
        pref = tf_ref.add_paragraph()
        pref.text = ref
        pref.font.size = Pt(10)
        pref.font.color.rgb = C_TEXT_DARK
        pref.space_before = Pt(4)

    # Save to disk
    output_filename = "Software_Inspection_Checklist_GadgetTrustX.pptx"
    try:
        prs.save(output_filename)
        print(f"Presentation saved successfully as '{output_filename}' ({len(prs.slides)} slides).")
    except PermissionError:
        try:
            output_filename = "Software_Inspection_Checklist_GadgetTrustX_Updated.pptx"
            prs.save(output_filename)
            print(f"File utama terkunci. Berhasil disimpan sebagai '{output_filename}' ({len(prs.slides)} slides).")
        except PermissionError:
            output_filename = "Software_Inspection_Checklist_GadgetTrustX_Rev.pptx"
            prs.save(output_filename)
            print(f"Kedua file terkunci. Berhasil disimpan sebagai '{output_filename}' ({len(prs.slides)} slides).")

if __name__ == "__main__":
    build_presentation()
