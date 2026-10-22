import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_styled_table(doc, rows, cols, col_widths=None):
    table = doc.add_table(rows=rows, cols=cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    # Border style
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="D3D3D3"/>
            <w:left w:val="none"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="A0A0A0"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)
    return table

def build_test_plan():
    doc = docx.Document()
    
    # Page Setup - Margins 1 inch
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    # Set default font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    # Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("Dokumen Rencana Pengujian (Test Plan)")
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D) # Navy

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(16)
    run_sub = p_sub.add_run("GadgetTrustX (Smart Device Marketplace)")
    run_sub.font.size = Pt(16)
    run_sub.font.color.rgb = RGBColor(0x4A, 0x55, 0x68)

    # Metadata Table
    meta_data = [
        ("Identifikasi Test Plan", "TP-GADGETTRUSTX-MOD1-[NIM]"),
        ("Nama Aplikasi", "GadgetTrustX (Smart Device Marketplace)"),
        ("Versi", "v1.0"),
        ("Peran yang Dipilih untuk Diuji", "Pembeli (Buyer)"),
        ("Nama Praktikan", "[Nama Lengkap Praktikan]"),
        ("NIM", "[NIM Praktikan]"),
        ("Kelas", "PKPL-[Kelas]"),
        ("Tanggal Dibuat", "08 Oktober 2026"),
        ("Tanggal Terakhir Diperbarui", "08 Oktober 2026"),
        ("Status", "Final")
    ]

    table_meta = create_styled_table(doc, len(meta_data)+1, 2)
    hdr_cells = table_meta.rows[0].cells
    hdr_cells[0].text = "Bidang"
    hdr_cells[1].text = "Detail"
    for i in range(2):
        set_cell_background(hdr_cells[i], "2B6CB0")
        set_cell_margins(hdr_cells[i], 120, 120, 160, 160)
        p = hdr_cells[i].paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    for idx, (k, v) in enumerate(meta_data):
        row_cells = table_meta.rows[idx+1].cells
        row_cells[0].text = k
        row_cells[1].text = v
        for c in row_cells:
            set_cell_margins(c, 100, 100, 150, 150)
            if idx % 2 == 1:
                set_cell_background(c, "F7FAFC")
        row_cells[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Riwayat Revisi
    h_rev = doc.add_heading("Riwayat Revisi", level=2)
    h_rev.paragraph_format.space_before = Pt(14)
    h_rev.paragraph_format.space_after = Pt(6)

    rev_data = [
        ("1.0", "08 Oktober 2026", "[Nama Praktikan]", "Draf awal dokumen Test Plan Modul 1")
    ]
    t_rev = create_styled_table(doc, len(rev_data)+1, 4)
    r_hdr = t_rev.rows[0].cells
    r_hdr[0].text = "Versi"
    r_hdr[1].text = "Tanggal Revisi"
    r_hdr[2].text = "Diperbarui Oleh"
    r_hdr[3].text = "Deskripsi Perubahan"
    for c in r_hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 120, 120, 160, 160)
        p = c.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    for idx, row in enumerate(rev_data):
        c_cells = t_rev.rows[idx+1].cells
        for col_idx, text in enumerate(row):
            c_cells[col_idx].text = text
            set_cell_margins(c_cells[col_idx], 100, 100, 150, 150)

    doc.add_page_break()

    # DAFTAR ISI
    h_toc = doc.add_heading("DAFTAR ISI", level=1)
    h_toc.paragraph_format.space_after = Pt(8)
    toc_lines = [
        ("1. Konteks Pengujian", "3"),
        ("   1.1 Item Uji", "3"),
        ("   1.2 Cakupan Pengujian", "3"),
        ("   1.3 Peran yang Dipilih untuk Diuji", "4"),
        ("   1.4 Asumsi dan Batasan", "4"),
        ("2. Daftar Risiko", "5"),
        ("3. Strategi Pengujian", "6"),
        ("   3.1 Pendekatan Keseluruhan", "6"),
        ("   3.2 Arah Pengujian yang Direncanakan", "6"),
        ("   3.3 Kriteria", "6"),
        ("4. Lingkungan Pengujian", "7"),
        ("   4.1 Perangkat dan Perangkat Keras", "7"),
        ("   4.2 Perangkat Lunak dan Alat", "7"),
        ("   4.3 Jaringan dan Backend", "7"),
        ("   4.4 Data Uji", "7"),
        ("5. Jadwal Pengujian", "8"),
        ("6. Luaran Pengujian", "8"),
        ("Lampiran A: Glosarium", "9")
    ]
    for line, page in toc_lines:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(2)
        p_t.paragraph_format.space_after = Pt(2)
        r1 = p_t.add_run(line)
        r1.font.size = Pt(10)
        # dot leader / tab
        p_t.add_run(f"    {page}")

    doc.add_page_break()

    # SECTION 1: Konteks Pengujian
    h1 = doc.add_heading("1. Konteks Pengujian", level=1)
    p_srs_note = doc.add_paragraph()
    p_srs_note.add_run("Software Requirements Specification (SRS) merupakan salah satu item persiapan untuk Modul 2. Pada Modul 1, praktikan mengidentifikasi sumber kebutuhan yang tersedia dan mulai menyiapkan SRS secara bertahap. SRS belum harus selesai atau dikumpulkan pada Modul 1; batas waktu penyelesaian dan pengumpulannya mengikuti petunjuk pada materi Modul 2.")
    p_srs_note.paragraph_format.space_after = Pt(8)

    # 1.1 Item Uji
    doc.add_heading("1.1 Item Uji", level=2)
    item_uji_data = [
        ("Nama Aplikasi", "GadgetTrustX (Smart Device Marketplace)"),
        ("Platform", "Web"),
        ("Versi", "v1.0"),
        ("URL Deployment / Akses", "https://gadgetrustx.netlify.app/ (dan http://localhost:3000)"),
        ("Tumpukan Teknologi", "Next.js 15, React, Tailwind CSS, Supabase (Auth, PostgreSQL, Storage), Netlify"),
        ("Deskripsi Singkat", "GadgetTrustX adalah platform marketplace smart device terpadu berbasis web yang dirancang untuk memfasilitasi transaksi jual-beli gadget bekas dan baru secara aman dan terpercaya, dilengkapi dengan fitur verifikasi keaslian IMEI TAC global, valuasi harga pasar berbasis kecerdasan buatan (Gemini AI), sistem pengajuan tukar tambah (Trade-In), dan rekening bersama escrow.")
    ]
    t_item = create_styled_table(doc, len(item_uji_data)+1, 2)
    hdr = t_item.rows[0].cells
    hdr[0].text = "Bidang"
    hdr[1].text = "Deskripsi"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, (k, v) in enumerate(item_uji_data):
        row = t_item.rows[idx+1].cells
        row[0].text = k
        row[1].text = v
        for c in row:
            set_cell_margins(c, 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(c, "F7FAFC")
        row[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 1.2 Cakupan Pengujian
    doc.add_heading("1.2 Cakupan Pengujian", level=2)
    p_in_note = doc.add_paragraph()
    r_in = p_in_note.add_run("Fitur dalam Cakupan (In-Scope)\n")
    r_in.bold = True
    p_in_note.add_run("Cantumkan minimal delapan fitur secara keseluruhan, yaitu Login, Register, Forgot Password, dan lima fitur tambahan. Fitur tambahan boleh berupa subfeature apabila memiliki fungsi dan test scenario yang jelas. Proyek secara keseluruhan memiliki variasi input, proses, behavior, state, dan business rule yang memadai untuk mendukung rangkaian praktikum.")

    in_scope_data = [
        ("1", "Login", "Fitur Autentikasi", "Pembeli terdaftar masuk ke akun menggunakan kredensial email dan kata sandi yang divalidasi via Supabase Auth dengan proteksi Cloudflare Turnstile."),
        ("2", "Register", "Fitur Autentikasi", "Pengguna baru membuat akun pembeli dengan menginput nama lengkap, alamat email valid, nomor telepon, dan kata sandi baru."),
        ("3", "Forgot Password", "Fitur Autentikasi", "Pembeli meminta tautan pemulihan kata sandi yang dikirimkan ke email terdaftar untuk mengatur ulang password yang lupa."),
        ("4", "Jelajah & Pencarian Produk Marketplace", "Fitur Tambahan", "Pembeli mencari katalog gadget aktif menggunakan kata kunci nama perangkat, brand, atau model pada search bar marketplace."),
        ("5", "Filter Multi-Parameter Produk", "Fitur Tambahan", "Pembeli memfilter katalog produk berdasarkan kategori, brand, kapasitas RAM, internal storage, kondisi fisik unit, dan batasan rentang harga minimum/maksimum."),
        ("6", "Keranjang Belanja (Shopping Cart)", "Fitur Tambahan", "Pembeli menambahkan unit gadget ke keranjang belanja, memperbarui jumlah kuantitas sesuai stok tersedia, dan menghapus item dari keranjang."),
        ("7", "Checkout dan Pembayaran (Midtrans Payment)", "Fitur Tambahan", "Pembeli mengisi/memilih alamat tujuan pengiriman, menghitung estimasi ongkir kurir ekspedisi, memilih metode pembayaran (QRIS/Transfer), memproses token Midtrans, dan memverifikasi status pembayaran lunas."),
        ("8", "Verifikasi Keaslian IMEI (TrustX Scanner)", "Fitur Tambahan", "Pembeli memasukkan 15 digit nomor IMEI pada modul scanner untuk divalidasi menggunakan algoritma Luhn dan dicocokkan dengan database TAC global serta status legalitas perangkat."),
        ("9", "Smart Price Checker (Valuasi Harga AI)", "Fitur Tambahan", "Pembeli memasukkan spesifikasi detail gadget (merek, tipe, kapasitas, kondisi, kelengkapan) untuk mendapatkan estimasi nilai wajar pasar dan rentang harga referensi."),
        ("10", "Smart Matching (Rekomendasi Cerdas)", "Fitur Tambahan", "Pembeli memasukkan kriteria kebutuhan performa (gaming, fotografi, baterai awet) dan pagu anggaran (budget) untuk mendapatkan rekomendasi gadget terbaik."),
        ("11", "Ulasan dan Penilaian Produk (Review & Rating)", "Fitur Tambahan", "Pembeli yang telah menyelesaikan transaksi memberikan rating bintang (1–5) serta ulasan teks pengalaman kualitas unit gadget yang dibeli."),
        ("12", "Pengajuan Retur / Komplain Barang", "Fitur Tambahan", "Pembeli mengajukan klaim pengembalian dana/barang saat menerima unit yang cacat atau tidak sesuai deskripsi, menyertakan alasan retur, dan memantau status resolusi komplain.")
    ]

    t_in = create_styled_table(doc, len(in_scope_data)+1, 4)
    hdr = t_in.rows[0].cells
    hdr[0].text = "No."
    hdr[1].text = "Nama Fitur"
    hdr[2].text = "Jenis Fitur"
    hdr[3].text = "Deskripsi Singkat"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, row in enumerate(in_scope_data):
        cells = t_in.rows[idx+1].cells
        for col_i, val in enumerate(row):
            cells[col_i].text = val
            set_cell_margins(cells[col_i], 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(cells[col_i], "F7FAFC")
        cells[1].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    p_out_note = doc.add_paragraph()
    r_out = p_out_note.add_run("Di Luar Cakupan (Out-of-Scope)\n")
    r_out.bold = True
    p_out_note.add_run("Aspek atau fungsionalitas berikut sengaja dikecualikan dari cakupan pengujian:")

    out_scope_data = [
        ("1", "Sistem Tukar Tambah (Trade-In)", "Alur fitur tukar tambah perangkat dinonaktifkan dari cakupan uji peran Pembeli pada versi rilis saat ini dan difokuskan pada transaksi pembelian langsung."),
        ("2", "Dasbor Penjual (Seller) & Manajemen Stok Listing", "Merupakan alur kerja peran Penjual untuk pendaftaran toko, pengunggahan produk baru, manajemen inventori, dan penginputan nomor resi pengiriman."),
        ("3", "Dasbor Administrator & Approval Tiket Sengketa Retur", "Merupakan kewenangan peran Administrator/Superadmin untuk memoderasi listing, menengahi sengketa, dan persetujuan klaim retur."),
        ("4", "Pemberitahuan Push Real-Time Native Browser", "Belum diimplementasikan secara menyeluruh pada rilis web saat ini.")
    ]

    t_out = create_styled_table(doc, len(out_scope_data)+1, 3)
    hdr = t_out.rows[0].cells
    hdr[0].text = "No."
    hdr[1].text = "Fitur / Aspek"
    hdr[2].text = "Alasan Pengecualian"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, row in enumerate(out_scope_data):
        cells = t_out.rows[idx+1].cells
        for col_i, val in enumerate(row):
            cells[col_i].text = val
            set_cell_margins(cells[col_i], 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(cells[col_i], "F7FAFC")
        cells[1].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 1.3 Peran yang Dipilih
    doc.add_heading("1.3 Peran yang Dipilih untuk Diuji", level=2)
    role_data = [
        ("Nama Peran", "Pembeli (Buyer)"),
        ("Deskripsi Peran", "Pembeli adalah pengguna akhir yang menjelajahi katalog produk smart device, memeriksa keaslian IMEI melalui pemindai, mengevaluasi valuasi harga pasar, mengelola keranjang, melakukan transaksi checkout dengan pembayaran Midtrans, memberikan ulasan produk, dan mengajukan komplain/retur barang bila diperlukan."),
        ("Fitur yang Dapat Diakses", "Login, Register, Forgot Password, Jelajah & Pencarian Produk, Filter Multi-Parameter, Keranjang Belanja, Checkout dan Pembayaran, Verifikasi Keaslian IMEI, Smart Price Checker, Smart Matching, Ulasan/Review Produk, Pengajuan Retur."),
        ("Alasan Pemilihan", "Peran Pembeli merepresentasikan alur utama pengguna (core user journey) pada platform yang memiliki variasi input teks dan numerik terlengkap (filter multi-parameter, 15 digit IMEI, form alamat, ulasan teks), melibatkan logika perhitungan finansial dan pembayaran, serta memiliki konsentrasi risiko bisnis tertinggi terhadap kepuasan dan kepercayaan pengguna. Pemilihan peran ini tetap konsisten hingga penilaian akhir praktikum.")
    ]

    t_role = create_styled_table(doc, len(role_data)+1, 2)
    hdr = t_role.rows[0].cells
    hdr[0].text = "Bidang"
    hdr[1].text = "Detail"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, (k, v) in enumerate(role_data):
        row = t_role.rows[idx+1].cells
        row[0].text = k
        row[1].text = v
        for c in row:
            set_cell_margins(c, 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(c, "F7FAFC")
        row[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 1.4 Asumsi dan Batasan
    doc.add_heading("1.4 Asumsi dan Batasan", level=2)
    asumsi_data = [
        ("Asumsi", "Seluruh fitur yang terdaftar (3 autentikasi dan fitur tambahan peran Pembeli) berfungsi dengan baik dan dapat didemonstrasikan pada build yang telah di-deploy secara online di Vercel/Netlify maupun dijalankan di localhost."),
        ("Asumsi", "Minimal satu akun uji Pembeli yang valid dan data katalog perangkat pada database Supabase telah tersedia sebelum pengujian dimulai."),
        ("Batasan", "Pengujian dibatasi secara ketat hanya pada alur dan antarmuka peran Pembeli; fungsionalitas peran Penjual dan Administrator tidak diuji pada praktikum ini."),
        ("Batasan", "Integrasi payment gateway (Midtrans) diuji menggunakan lingkungan sandbox / mock testing untuk mencegah transaksi moneter riil.")
    ]

    t_asumsi = create_styled_table(doc, len(asumsi_data)+1, 2)
    hdr = t_asumsi.rows[0].cells
    hdr[0].text = "Jenis"
    hdr[1].text = "Deskripsi"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, (k, v) in enumerate(asumsi_data):
        row = t_asumsi.rows[idx+1].cells
        row[0].text = k
        row[1].text = v
        for c in row:
            set_cell_margins(c, 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(c, "F7FAFC")
        row[0].paragraphs[0].runs[0].font.bold = True

    doc.add_page_break()

    # SECTION 2: Daftar Risiko
    doc.add_heading("2. Daftar Risiko", level=1)
    p_risk_note = doc.add_paragraph()
    p_risk_note.add_run("Identifikasi minimal lima risiko yang terkait dengan proyek yang dipilih. Prioritas = Dampak × Kemungkinan, masing-masing menggunakan skala 1 sampai 5, dengan 1 berarti sangat rendah dan 5 berarti sangat tinggi.\nRisiko produk adalah potensi cacat pada fitur atau kualitas produk. Risiko proyek adalah masalah pengelolaan, seperti tenggat waktu yang ketat, perubahan kebutuhan, atau keterbatasan sumber daya.")
    p_risk_note.paragraph_format.space_after = Pt(8)

    risk_data = [
        ("R-01", "Total pembayaran pada Checkout dihitung keliru saat menggabungkan harga unit barang, jumlah kuantitas, dan estimasi ongkos kirim ekspedisi.", "Produk", "5", "3", "15", "Menempatkan kalkulasi harga, biaya kirim, dan invoice sebagai fokus pengujian berprioritas tertinggi, serta memverifikasi kalkulasi server-side sebelum penerbitan token Midtrans."),
        ("R-02", "Validasi format 15 digit IMEI dan algoritma Luhn Check pada TrustX Scanner mengalami kegagalan atau terjadi timeout saat mencocokkan database TAC global.", "Produk", "4", "3", "12", "Menerapkan boundary value analysis (<15 digit dan >15 digit) serta equivalence partitioning pada input non-numerik, dan memastikan ketersediaan pesan penanganan bila lookup API eksternal lambat."),
        ("R-03", "Terbentuknya pesanan ganda (duplicate order/race condition) ketika pengguna menekan tombol 'Bayar Sekarang' pada halaman Checkout berulang kali dengan cepat akibat koneksi lambat.", "Produk", "4", "3", "12", "Menguji pengiriman formulir berulang secara cepat (rapid submission), memastikan tombol bayar langsung berstatus disabled setelah klik pertama, dan memverifikasi token sesi pembayaran."),
        ("R-04", "Form pengajuan retur barang gagal memproses lampiran bukti kendala atau gagal memperbarui status pesanan pada database Supabase.", "Produk", "4", "2", "8", "Menguji validasi form retur dengan berbagai skenario kelengkapan data dan format gambar, serta memverifikasi integritas perubahan state status pesanan di database."),
        ("R-05", "Keterbatasan alokasi waktu dan perangkat praktikan dalam menyusun serta mengeksekusi skenario uji untuk seluruh fitur peran Pembeli secara mendalam.", "Proyek", "3", "3", "9", "Menerapkan Risk-Based Testing dengan memprioritaskan pengujian pada alur kritis transaksi (Checkout & Pembayaran, Autentikasi) terlebih dahulu sebelum menguji fitur penunjang lainnya."),
        ("R-06", "Ketergantungan terhadap koneksi internet laboratorium dan ketersediaan layanan cloud (Supabase Database, Vercel/Netlify hosting) saat sesi demonstrasi.", "Proyek", "3", "2", "6", "Menyiapkan lingkungan pengujian cadangan berupa local dev server (http://localhost:3000) dengan data seed lengkap di mesin penguji sebagai langkah kontinjensi bila koneksi internet lab terganggu.")
    ]

    t_risk = create_styled_table(doc, len(risk_data)+1, 7)
    hdr = t_risk.rows[0].cells
    hdr[0].text = "ID Risiko"
    hdr[1].text = "Deskripsi Risiko"
    hdr[2].text = "Jenis"
    hdr[3].text = "Dampak"
    hdr[4].text = "Kemungkinan"
    hdr[5].text = "Prioritas"
    hdr[6].text = "Strategi Mitigasi"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 120, 120)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    for idx, row in enumerate(risk_data):
        cells = t_risk.rows[idx+1].cells
        for col_i, val in enumerate(row):
            cells[col_i].text = val
            set_cell_margins(cells[col_i], 80, 80, 100, 100)
            if idx % 2 == 1:
                set_cell_background(cells[col_i], "F7FAFC")
        cells[0].paragraphs[0].runs[0].font.bold = True
        cells[5].paragraphs[0].runs[0].font.bold = True

    doc.add_page_break()

    # SECTION 3: Strategi Pengujian
    doc.add_heading("3. Strategi Pengujian", level=1)
    
    doc.add_heading("3.1 Pendekatan Keseluruhan", level=2)
    strat_data = [
        ("Pendekatan Pengujian", "<Belum ditetapkan; dilengkapi pada modul berikutnya>"),
        ("Tingkat Pengujian", "<Belum ditetapkan; dilengkapi pada modul berikutnya>"),
        ("Jenis Pengujian Utama", "<Belum ditetapkan; dilengkapi pada modul berikutnya>"),
        ("Fitur Berprioritas Tinggi", "Checkout dan Pembayaran, Keranjang Belanja, serta Verifikasi Keaslian IMEI via TrustX Scanner (skor prioritas risiko tertinggi pada Bagian 2)")
    ]
    t_strat = create_styled_table(doc, len(strat_data)+1, 2)
    hdr = t_strat.rows[0].cells
    hdr[0].text = "Bidang"
    hdr[1].text = "Deskripsi"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, (k, v) in enumerate(strat_data):
        row = t_strat.rows[idx+1].cells
        row[0].text = k
        row[1].text = v
        for c in row:
            set_cell_margins(c, 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(c, "F7FAFC")
        row[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    doc.add_heading("3.2 Arah Pengujian yang Direncanakan", level=2)
    p_arah_note = doc.add_paragraph()
    p_arah_note.add_run("Pada Modul 1, arah dan teknik pengujian belum perlu ditentukan. Bagian ini dilengkapi secara bertahap setelah materi terkait dipelajari pada modul berikutnya. Pertahankan placeholder berikut dan jangan menambahkan nama teknik pada Modul 1.")
    p_arah_note.paragraph_format.space_after = Pt(6)

    arah_data = [
        ("Arah dan Teknik Pengujian", "<Belum ditetapkan>", "Dilengkapi setelah materi terkait dipelajari pada modul berikutnya.")
    ]
    t_arah = create_styled_table(doc, len(arah_data)+1, 3)
    hdr = t_arah.rows[0].cells
    hdr[0].text = "Aspek"
    hdr[1].text = "Status"
    hdr[2].text = "Catatan"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, row in enumerate(arah_data):
        cells = t_arah.rows[idx+1].cells
        for col_i, val in enumerate(row):
            cells[col_i].text = val
            set_cell_margins(cells[col_i], 80, 80, 120, 120)
        cells[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    doc.add_heading("3.3 Kriteria", level=2)
    crit_data = [
        ("Kriteria Masuk", "Delapan fitur yang terdaftar sudah tersedia pada staging (deploy Netlify atau localhost), dan minimal satu akun uji Pembeli yang valid sudah siap digunakan."),
        ("Kriteria Keluar", "Seluruh test case yang direncanakan untuk delapan fitur terdaftar telah dieksekusi dan dicatat, serta tidak ada blocker defect yang belum teridentifikasi."),
        ("Kriteria Lolos", "Hasil aktual sesuai dengan hasil yang diharapkan (expected result) pada spesifikasi kasus uji."),
        ("Kriteria Gagal", "Hasil aktual tidak sesuai dengan hasil yang diharapkan, terdapat kegagalan validasi logika, atau terjadi unhandled error / crash pada aplikasi."),
        ("Pengujian Ulang", "Test case yang gagal dieksekusi ulang setelah defect yang dilaporkan berhasil diperbaiki oleh pengembang."),
        ("Pengujian Regresi", "Test case kritis (Autentikasi dan Checkout) dieksekusi ulang setelah setiap perbaikan atau modifikasi kode untuk memastikan fungsionalitas lain tidak terganggu.")
    ]
    t_crit = create_styled_table(doc, len(crit_data)+1, 2)
    hdr = t_crit.rows[0].cells
    hdr[0].text = "Jenis Kriteria"
    hdr[1].text = "Deskripsi"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, (k, v) in enumerate(crit_data):
        row = t_crit.rows[idx+1].cells
        row[0].text = k
        row[1].text = v
        for c in row:
            set_cell_margins(c, 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(c, "F7FAFC")
        row[0].paragraphs[0].runs[0].font.bold = True

    doc.add_page_break()

    # SECTION 4: Lingkungan Pengujian
    doc.add_heading("4. Lingkungan Pengujian", level=1)

    doc.add_heading("4.1 Perangkat dan Perangkat Keras", level=2)
    hw_data = [
        ("Jenis Perangkat", "Laptop / PC"),
        ("Processor", "Intel Core i5-1135G7 / AMD Ryzen 5 setara"),
        ("RAM", "16 GB (minimal 8 GB)"),
        ("Sistem Operasi", "Windows 11 Home / Pro 64-bit")
    ]
    t_hw = create_styled_table(doc, len(hw_data)+1, 2)
    hdr = t_hw.rows[0].cells
    hdr[0].text = "Item"
    hdr[1].text = "Detail"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, (k, v) in enumerate(hw_data):
        row = t_hw.rows[idx+1].cells
        row[0].text = k
        row[1].text = v
        for c in row:
            set_cell_margins(c, 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(c, "F7FAFC")
        row[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    doc.add_heading("4.2 Perangkat Lunak dan Alat", level=2)
    sw_data = [
        ("Browser / Perangkat", "Google Chrome 126+ (Desktop)", "Eksekusi pengujian fungsional dan verifikasi antarmuka"),
        ("Alat Dokumentasi", "Google Docs / Microsoft Word", "Penyusunan dokumen Test Plan dan pelaporan SQA"),
        ("Alat Tangkapan Layar", "Snipping Tool / Lightshot", "Pengumpulan bukti pengujian (evidence) dan tangkapan layar bug"),
        ("Version Control & Editor", "Visual Studio Code, Git, GitHub", "Akses kode sumber dan peninjauan implementasi logika")
    ]
    t_sw = create_styled_table(doc, len(sw_data)+1, 3)
    hdr = t_sw.rows[0].cells
    hdr[0].text = "Alat / Perangkat Lunak"
    hdr[1].text = "Versi / Detail"
    hdr[2].text = "Tujuan"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, row in enumerate(sw_data):
        cells = t_sw.rows[idx+1].cells
        for col_i, val in enumerate(row):
            cells[col_i].text = val
            set_cell_margins(cells[col_i], 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(cells[col_i], "F7FAFC")
        cells[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    doc.add_heading("4.3 Jaringan dan Backend", level=2)
    net_data = [
        ("Jaringan", "Koneksi Wi-Fi Kampus / Hotspot Seluler stabil (kecepatan >= 10 Mbps)"),
        ("Backend / API", "Next.js Route Handlers, Supabase PostgreSQL, Supabase Auth, Supabase Storage"),
        ("URL Dasar Pengujian", "https://gadgetrustx.netlify.app/ (Deploy) atau http://localhost:3000 (Lokal)")
    ]
    t_net = create_styled_table(doc, len(net_data)+1, 2)
    hdr = t_net.rows[0].cells
    hdr[0].text = "Item"
    hdr[1].text = "Detail"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, (k, v) in enumerate(net_data):
        row = t_net.rows[idx+1].cells
        row[0].text = k
        row[1].text = v
        for c in row:
            set_cell_margins(c, 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(c, "F7FAFC")
        row[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    doc.add_heading("4.4 Data Uji", level=2)
    p_dt_note = doc.add_paragraph()
    p_dt_note.add_run("Identifikasi jenis data uji secara umum yang dibutuhkan. Kumpulan data uji secara detail akan disiapkan pada modul berikutnya.")
    p_dt_note.paragraph_format.space_after = Pt(6)

    data_uji_data = [
        ("Akun Uji Valid", "buyer.test@gadgettrustx.com, akun Pembeli terdaftar dan terverifikasi dengan riwayat transaksi aktif."),
        ("Akun Uji Tidak Valid", "Alamat email yang belum pernah didaftarkan (misal nonexisting@test.com), format email salah (@domain), atau password keliru."),
        ("Contoh Data Input", "Nomor 15-digit IMEI valid (TAC iPhone 13 / Samsung Galaxy S21) dan invalid (<15 digit), data gadget trade-in (RAM 8GB, Storage 128GB, kondisi 'Mulus 95%'), serta sampel batasan harga filter (Rp 3.000.000 - Rp 10.000.000)."),
        ("Data Uji Tambahan", "<Belum ditetapkan; dilengkapi pada modul berikutnya>")
    ]
    t_dt = create_styled_table(doc, len(data_uji_data)+1, 2)
    hdr = t_dt.rows[0].cells
    hdr[0].text = "Jenis Data"
    hdr[1].text = "Deskripsi"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, (k, v) in enumerate(data_uji_data):
        row = t_dt.rows[idx+1].cells
        row[0].text = k
        row[1].text = v
        for c in row:
            set_cell_margins(c, 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(c, "F7FAFC")
        row[0].paragraphs[0].runs[0].font.bold = True

    doc.add_page_break()

    # SECTION 5: Jadwal Pengujian
    doc.add_heading("5. Jadwal Pengujian", level=1)
    p_sch_note = doc.add_paragraph()
    p_sch_note.add_run("Pada Modul 1, isi hanya jadwal dan luaran yang memang ditetapkan untuk Modul 1. Detail Modul 2 sampai Modul 6 dan UAP tetap berupa placeholder sampai modul terkait dibahas dan ditetapkan.")
    p_sch_note.paragraph_format.space_after = Pt(8)

    sch_data = [
        ("Modul 1", "Perencanaan pengujian, analisis risiko, dan registrasi proyek", "Minggu 1-2", "Dokumen Test Plan dan entri registrasi proyek"),
        ("Modul 2", "<Belum ditetapkan>", "<Belum ditetapkan>", "<Belum ditetapkan>"),
        ("Modul 3", "<Belum ditetapkan>", "<Belum ditetapkan>", "<Belum ditetapkan>"),
        ("Modul 4", "<Belum ditetapkan>", "<Belum ditetapkan>", "<Belum ditetapkan>"),
        ("Modul 5", "<Belum ditetapkan>", "<Belum ditetapkan>", "<Belum ditetapkan>"),
        ("Modul 6", "<Belum ditetapkan>", "<Belum ditetapkan>", "<Belum ditetapkan>"),
        ("UAP", "<Belum ditetapkan>", "<Belum ditetapkan>", "<Belum ditetapkan>")
    ]
    t_sch = create_styled_table(doc, len(sch_data)+1, 4)
    hdr = t_sch.rows[0].cells
    hdr[0].text = "Modul"
    hdr[1].text = "Aktivitas Pengujian Utama"
    hdr[2].text = "Perkiraan Waktu"
    hdr[3].text = "Luaran Utama"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, row in enumerate(sch_data):
        cells = t_sch.rows[idx+1].cells
        for col_i, val in enumerate(row):
            cells[col_i].text = val
            set_cell_margins(cells[col_i], 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(cells[col_i], "F7FAFC")
        cells[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # SECTION 6: Luaran Pengujian
    doc.add_heading("6. Luaran Pengujian", level=1)
    p_del_note = doc.add_paragraph()
    p_del_note.add_run("Pada Modul 1, luaran yang perlu diselesaikan adalah dokumen Test Plan dan entri registrasi proyek. Luaran, format, dan status untuk Modul 2 sampai Modul 6 serta UAP belum ditetapkan pada dokumen ini.")
    p_del_note.paragraph_format.space_after = Pt(8)

    del_data = [
        ("Modul 1", "Dokumen Test Plan", "DOCX / PDF", "Sedang Berjalan"),
        ("Modul 1", "Entri Lembar Registrasi Proyek", "Google Sheets", "Sedang Berjalan"),
        ("Modul 2", "<Belum ditetapkan>", "<Belum ditetapkan>", "<Belum ditetapkan>"),
        ("Modul 3", "<Belum ditetapkan>", "<Belum ditetapkan>", "<Belum ditetapkan>"),
        ("Modul 4", "<Belum ditetapkan>", "<Belum ditetapkan>", "<Belum ditetapkan>"),
        ("Modul 5", "<Belum ditetapkan>", "<Belum ditetapkan>", "<Belum ditetapkan>"),
        ("Modul 6", "<Belum ditetapkan>", "<Belum ditetapkan>", "<Belum ditetapkan>"),
        ("UAP", "<Belum ditetapkan>", "<Belum ditetapkan>", "<Belum ditetapkan>")
    ]
    t_del = create_styled_table(doc, len(del_data)+1, 4)
    hdr = t_del.rows[0].cells
    hdr[0].text = "Modul"
    hdr[1].text = "Luaran"
    hdr[2].text = "Format"
    hdr[3].text = "Status"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, row in enumerate(del_data):
        cells = t_del.rows[idx+1].cells
        for col_i, val in enumerate(row):
            cells[col_i].text = val
            set_cell_margins(cells[col_i], 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(cells[col_i], "F7FAFC")
        cells[0].paragraphs[0].runs[0].font.bold = True

    doc.add_page_break()

    # Lampiran A: Glosarium
    doc.add_heading("Lampiran A: Glosarium", level=1)
    p_glos_note = doc.add_paragraph()
    p_glos_note.add_run("Istilah kunci yang digunakan dalam dokumen ini, berdasarkan ISO/IEC/IEEE 29119-1.")
    p_glos_note.paragraph_format.space_after = Pt(8)

    glos_data = [
        ("Item Uji", "Objek yang diuji. Dalam praktikum ini, objek tersebut adalah aplikasi web atau mobile yang dipilih oleh masing-masing praktikan."),
        ("Dasar Pengujian", "Sumber diturunkannya sebuah test condition, dapat berupa kebutuhan, user story, atau perilaku yang sudah disepakati."),
        ("Kondisi Pengujian", "Aspek dari aplikasi yang dapat diuji secara spesifik, dan menjadi dasar penulisan test case."),
        ("Kasus Uji", "Input konkret, langkah-langkah, dan hasil yang diharapkan, yang digunakan untuk memeriksa satu test condition."),
        ("Lingkungan Pengujian", "Perangkat, software, dan akses yang dibutuhkan untuk benar-benar menjalankan pengujian."),
        ("Risk", "Kemungkinan terjadinya suatu masalah, baik pada produk itu sendiri (Risiko Produk) maupun pada proyek di sekitarnya, seperti tenggat waktu yang ketat (Risiko Proyek)."),
        ("Incident", "Segala sesuatu yang tidak terduga yang ditemukan selama pengujian dan perlu ditelusuri lebih lanjut."),
        ("Traceability", "Kemampuan untuk menelusuri hubungan dari sebuah kebutuhan, ke sebuah fitur, hingga ke test case yang memeriksanya."),
        ("Dampak", "Seberapa serius akibat yang akan timbul apabila sebuah risiko benar-benar terjadi, dinilai dengan skala 1 sampai 5."),
        ("Kemungkinan", "Seberapa besar kemungkinan sebuah risiko benar-benar terjadi, dinilai dengan skala 1 sampai 5."),
        ("Prioritas", "Tingkat kepentingan suatu risiko secara keseluruhan, dihitung sebagai Dampak dikalikan Kemungkinan. Digunakan untuk menentukan risiko mana yang perlu ditangani lebih dulu."),
        ("Strategi Mitigasi", "Tindakan yang direncanakan untuk mengurangi dampak suatu risiko atau kemungkinan risiko tersebut terjadi."),
        ("Kriteria Masuk", "Kondisi yang harus terpenuhi sebelum pengujian dapat dimulai."),
        ("Kriteria Keluar", "Kondisi yang menandakan bahwa pengujian telah selesai.")
    ]
    t_glos = create_styled_table(doc, len(glos_data)+1, 2)
    hdr = t_glos.rows[0].cells
    hdr[0].text = "Istilah"
    hdr[1].text = "Definisi"
    for c in hdr:
        set_cell_background(c, "2B6CB0")
        set_cell_margins(c, 100, 100, 150, 150)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for idx, (k, v) in enumerate(glos_data):
        row = t_glos.rows[idx+1].cells
        row[0].text = k
        row[1].text = v
        for c in row:
            set_cell_margins(c, 80, 80, 120, 120)
            if idx % 2 == 1:
                set_cell_background(c, "F7FAFC")
        row[0].paragraphs[0].runs[0].font.bold = True

    output_path = "f:/smart-device-marketplace/Test_Plan_GadgetTrustX_Modul1.docx"
    doc.save(output_path)
    print(f"Test Plan saved successfully to {output_path}")

if __name__ == "__main__":
    build_test_plan()
