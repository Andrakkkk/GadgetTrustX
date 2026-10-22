import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_styled_table(doc, rows, cols):
    table = doc.add_table(rows=rows, cols=cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="2B6CB0"/>
            <w:left w:val="none"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="2B6CB0"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)
    return table

def add_header_row(table, headers, bg_color="1E3A8A"):
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], bg_color)
        set_cell_margins(hdr_cells[i], 120, 120, 160, 160)
        p = hdr_cells[i].paragraphs[0]
        if len(p.runs) > 0:
            p.runs[0].font.bold = True
            p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            p.runs[0].font.size = Pt(9.5)

def add_body_rows(table, data, alternate_color="F8FAFC"):
    for row_idx, row_data in enumerate(data):
        cells = table.rows[row_idx + 1].cells
        for col_idx, val in enumerate(row_data):
            cells[col_idx].text = str(val)
            set_cell_margins(cells[col_idx], 90, 90, 130, 130)
            p = cells[col_idx].paragraphs[0]
            if len(p.runs) > 0:
                p.runs[0].font.size = Pt(9)
                p.runs[0].font.color.rgb = RGBColor(0x1A, 0x20, 0x2C)
            if row_idx % 2 == 1:
                set_cell_background(cells[col_idx], alternate_color)
        if len(cells[0].paragraphs[0].runs) > 0:
            cells[0].paragraphs[0].runs[0].font.bold = True

def generate_lab_session_docx():
    doc = docx.Document()
    
    # Page setup - Margins 1 inch
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Document Title
    title_p = doc.add_paragraph()
    title_run = title_p.add_run("LAB SESSION MODUL 2: TEST DESIGN & TRACEABILITY")
    title_run.font.bold = True
    title_run.font.size = Pt(16)
    title_run.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    title_p.paragraph_format.space_after = Pt(2)

    sub_p = doc.add_paragraph()
    sub_run = sub_p.add_run("Test Design Specification (TDS) & Test Traceability Matrix (TTM) — ISO/IEC/IEEE 29119-3\nSistem Teruji (SUT): GadgetTrustX Platform (Role: Pembeli / Buyer)")
    sub_run.font.size = Pt(11)
    sub_run.font.color.rgb = RGBColor(0x4A, 0x55, 0x68)
    sub_p.paragraph_format.space_after = Pt(14)

    # Identity Box
    meta_table = doc.add_table(rows=4, cols=2)
    meta_data = [
        ("Nama Praktikan", ": Leandra Chelsea Geovani Karyono"),
        ("NIM", ": 202310370311421"),
        ("Kelas / Mata Kuliah", ": PKPL-B / Praktikum Kualitas Perangkat Lunak"),
        ("Lingkup Pengujian", ": Seluruh Fitur Fungsional Pembeli (Buyer Role) & UI Integritas")
    ]
    for r_idx, (k, v) in enumerate(meta_data):
        cells = meta_table.rows[r_idx].cells
        cells[0].text = k
        cells[1].text = v
        set_cell_margins(cells[0], 40, 40, 80, 80)
        set_cell_margins(cells[1], 40, 40, 80, 80)
        cells[0].paragraphs[0].runs[0].font.bold = True
        cells[0].paragraphs[0].runs[0].font.size = Pt(9.5)
        cells[1].paragraphs[0].runs[0].font.size = Pt(9.5)
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 1
    h1 = doc.add_heading("1. Software Requirements (Kebutuhan Perangkat Lunak Teruji)", level=2)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    reqs = [
        ("REQ-F-01: Autentikasi Pengguna (Login)", "Sistem harus menyediakan mekanisme autentikasi akun pembeli melalui input email dan kata sandi yang divalidasi ke database Supabase Auth, dilengkapi proteksi brute-force Cloudflare Turnstile CAPTCHA."),
        ("REQ-F-02: Registrasi Akun Pembeli", "Sistem harus memfasilitasi pembuatan akun pembeli baru dengan validasi format email unik, kata sandi minimal 6 karakter, dan pemberian role default 'buyer'."),
        ("REQ-F-03: Pemulihan Kata Sandi (Forgot Password)", "Sistem harus menyediakan alur reset kata sandi melalui input email terdaftar untuk mengirimkan tautan token pemulihan kredensial pembeli."),
        ("REQ-F-04: Jelajah Katalog & Pencarian Produk", "Sistem harus menyediakan fitur pencarian katalog perangkat gadget secara real-time berdasarkan kata kunci nama produk, model, atau merek, serta menampilkan pesan informatif saat produk tidak ditemukan."),
        ("REQ-F-05: Filter Multi-Parameter Produk", "Sistem harus memungkinkan pembeli menyaring katalog gadget berdasarkan kombinasi multi-kriteria (Brand, kapasitas RAM, internal storage hingga 2TB, rentang harga, dan kondisi baru/bekas) serta menyediakan tombol reset semua filter."),
        ("REQ-F-06: Keranjang Belanja (Shopping Cart)", "Sistem harus memfasilitasi pembeli untuk menambahkan produk gadget ke keranjang belanja, memperbarui jumlah kuantitas tanpa melebihi batas sisa stok inventori toko, dan menghapus item dari keranjang belanja."),
        ("REQ-F-07: Checkout dan Pembayaran Terpadu (Midtrans Payment)", "Sistem harus menghitung subtotal belanja dan estimasi ongkos kirim ekspedisi secara akurat pada checkout pesanan, serta menerbitkan token transaksi pembayaran Midtrans Snap untuk menampilkan dialog pembayaran bagi pembeli."),
        ("REQ-F-08: Verifikasi Keaslian IMEI (TrustX Scanner)", "Sistem harus memverifikasi keaslian perangkat seluler melalui input 15-digit nomor IMEI yang divalidasi menggunakan algoritma Luhn checksum dan dicocokkan dengan database TAC (Type Allocation Code) resmi global."),
        ("REQ-F-09: Smart Price Checker (Valuasi Harga Pasar AI)", "Sistem harus menyajikan estimasi nilai wajar pasar dan analisis depresiasi harga gadget berdasarkan spesifikasi dan kondisi fisik menggunakan model Google Gemini AI (dengan dukungan fallback database lokal)."),
        ("REQ-F-10: Smart Matching Rekomendasi Cerdas", "Sistem harus menyediakan wizard rekomendasi bertahap berbasis batas pagu anggaran (budget slider) dan prioritas penggunaan (gaming, fotografi, baterai) untuk menyajikan top-3 rekomendasi gadget paling relevan."),
        ("REQ-F-11: Penjualan Gadget Bekas oleh Pengguna (C2C Sell & Trade-In Hub)", "Sistem harus memungkinkan pengguna/pembeli menginput spesifikasi HP lama, memperoleh valuasi instan AI, mengunggah foto fisik unit (maksimal 5MB per file), dan menerbitkan listing penjualan gadget bekas ke marketplace.")
    ]
    for r_title, r_desc in reqs:
        p = doc.add_paragraph()
        run_b = p.add_run(f"• {r_title}: ")
        run_b.font.bold = True
        run_b.font.size = Pt(9.5)
        run_d = p.add_run(r_desc)
        run_d.font.size = Pt(9.5)
        p.paragraph_format.space_after = Pt(4)

    # Section 2
    h2 = doc.add_heading("2. Feature Sets (Kumpulan Fitur Pengujian)", level=2)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)

    fsets = [
        ("FS-01 – User Authentication Management", "Mengelola registrasi akun pembeli, autentikasi sesi login yang aman, dan prosedur pemulihan kata sandi.", "High", "REQ-F-01, REQ-F-02, REQ-F-03"),
        ("FS-02 – Catalog Exploration & Discovery", "Menyediakan kapabilitas pencarian kata kunci real-time dan penyaringan multi-parameter spesifikasi produk.", "High", "REQ-F-04, REQ-F-05"),
        ("FS-03 – Shopping Cart Management", "Menangani penambahan barang ke keranjang, manipulasi kuantitas item sesuai stok, dan kalkulasi subtotal.", "High", "REQ-F-06"),
        ("FS-04 – Order Checkout & Payment Escrow", "Memvalidasi pemilihan kurir ekspedisi, kalkulasi ongkos kirim, dan integrasi modal pembayaran Midtrans Snap pada sisi pembeli.", "High", "REQ-F-07"),
        ("FS-05 – Device Authenticity Verification (Scanner)", "Memverifikasi integritas nomor IMEI 15 digit melalui algoritma Luhn dan pencocokan TAC database global.", "High", "REQ-F-08"),
        ("FS-06 – AI Market Price Valuation", "Menghasilkan taksiran harga pasar wajar dan depresiasi gadget berbasis pemrosesan Gemini AI.", "High", "REQ-F-09"),
        ("FS-07 – Smart Recommendation System", "Menghasilkan rekomendasi cerdas perangkat gadget berdasarkan filter budget dan preferensi kebutuhan.", "Medium", "REQ-F-10"),
        ("FS-08 – C2C Preloved Selling & Trade-In Hub", "Memfasilitasi penjualan gadget bekas mandiri oleh pembeli dengan valuasi AI dan unggah foto fisik.", "High", "REQ-F-11")
    ]
    for fs_title, fs_obj, fs_pri, fs_tr in fsets:
        p = doc.add_paragraph()
        rb = p.add_run(f"• {fs_title}\n")
        rb.font.bold = True
        rb.font.size = Pt(9.5)
        p.add_run(f"   Objective: {fs_obj}\n   Priority: {fs_pri} | Traceability: {fs_tr}").font.size = Pt(9)
        p.paragraph_format.space_after = Pt(4)

    # Section 3: Test Conditions Table
    h3 = doc.add_heading("3. Test Conditions (Tabel Kondisi Pengujian)", level=2)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)

    tc_data = [
        ("TCond-001", "FS-01", "Login berhasil menggunakan email dan password valid terdaftar", "High", "REQ-F-01"),
        ("TCond-002", "FS-01", "Login ditolak saat menginputkan password salah atau email belum terdaftar", "High", "REQ-F-01"),
        ("TCond-003", "FS-01", "Registrasi akun baru berhasil dengan data lengkap dan email unik", "High", "REQ-F-02"),
        ("TCond-004", "FS-01", "Registrasi akun ditolak saat mendaftar dengan email yang sudah ada di database", "High", "REQ-F-02"),
        ("TCond-005", "FS-01", "Permintaan reset password berhasil mengirim tautan token ke email pembeli", "Medium", "REQ-F-03"),
        ("TCond-006", "FS-01", "Permintaan reset password menampilkan error saat format email tidak valid", "Medium", "REQ-F-03"),
        ("TCond-007", "FS-02", "Pencarian katalog menampilkan kartu produk yang sesuai dengan kata kunci", "High", "REQ-F-04"),
        ("TCond-008", "FS-02", "Pencarian katalog menampilkan pesan kosong saat kata kunci tidak ditemukan", "Medium", "REQ-F-04"),
        ("TCond-009", "FS-02", "Filter katalog menyaring produk secara tepat berdasarkan kombinasi RAM, Storage, dan Harga", "High", "REQ-F-05"),
        ("TCond-010", "FS-02", "Katalog mengembalikan seluruh produk saat tombol 'Reset Semua' filter ditekan", "Low", "REQ-F-05"),
        ("TCond-011", "FS-03", "Menambahkan produk ke keranjang berhasil dan menaikkan kuantitas badge cart", "High", "REQ-F-06"),
        ("TCond-012", "FS-03", "Penambahan kuantitas produk dibatasi dan ditolak saat melebihi sisa stok toko", "High", "REQ-F-06"),
        ("TCond-013", "FS-03", "Menghapus item dari keranjang belanja berhasil dan mengupdate subtotal", "Medium", "REQ-F-06"),
        ("TCond-014", "FS-04", "Checkout menghitung total bayar secara presisi (subtotal barang + ongkir kurir)", "High", "REQ-F-07"),
        ("TCond-015", "FS-04", "Pembuatan token transaksi Midtrans Snap berhasil dan memunculkan popup pembayaran", "High", "REQ-F-07"),
        ("TCond-016", "FS-04", "Pemilihan alamat dan opsi kurir ekspedisi memperbarui kalkulasi tarif ongkir secara real-time", "High", "REQ-F-07"),
        ("TCond-017", "FS-04", "Penutupan atau pembatalan modal pembayaran Midtrans Snap oleh pembeli tidak menghilangkan produk terpilih", "Medium", "REQ-F-07"),
        ("TCond-018", "FS-05", "Scanner memverifikasi keaslian dan detail model untuk 15-digit IMEI valid", "High", "REQ-F-08"),
        ("TCond-019", "FS-05", "Scanner menolak input IMEI dengan panjang tidak pas 15 digit (<15 atau >15 digit)", "High", "REQ-F-08"),
        ("TCond-020", "FS-05", "Scanner menolak input IMEI yang mengandung karakter non-angka (huruf/simbol)", "High", "REQ-F-08"),
        ("TCond-021", "FS-06", "Smart Price Checker menyajikan valuasi harga wajar pasar berbasis model Gemini AI", "High", "REQ-F-09"),
        ("TCond-022", "FS-06", "Price Checker beralih ke tabel harga cadangan lokal saat API AI mengalami timeout", "Medium", "REQ-F-09"),
        ("TCond-023", "FS-07", "Smart Matching wizard menyajikan rekomendasi top-3 gadget sesuai preferensi budget", "High", "REQ-F-10"),
        ("TCond-024", "FS-07", "Slider budget Smart Matching dibatasi pada rentang valid (Rp 1jt s/d Rp 30jt)", "Medium", "REQ-F-10"),
        ("TCond-025", "FS-08", "Pengguna berhasil menginput spesifikasi HP bekas, valuasi AI, dan menerbitkan listing", "High", "REQ-F-11"),
        ("TCond-026", "FS-08", "Form jual HP bekas menolak file foto non-gambar atau ukuran file melebihi batas 5MB", "Medium", "REQ-F-11"),
    ]
    t_tc = create_styled_table(doc, len(tc_data) + 1, 5)
    add_header_row(t_tc, ["ID", "Feature Set", "Description (Kondisi Pengujian)", "Priority", "Traceability"])
    add_body_rows(t_tc, tc_data)
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 4: Coverage Items Table
    h4 = doc.add_heading("4. Coverage Items (Tabel Item Cakupan Pengujian)", level=2)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)

    ci_data = [
        ("CI-001", "Form Login (Input email, password, tombol submit)", "TCond-001, TCond-002", "High", "REQ-F-01"),
        ("CI-002", "Notifikasi validasi kredensial login Supabase Auth", "TCond-002", "High", "REQ-F-01"),
        ("CI-003", "Form Registrasi (Nama, email, password min 6 char)", "TCond-003", "High", "REQ-F-02"),
        ("CI-004", "Validasi keunikan alamat email terdaftar", "TCond-004", "High", "REQ-F-02"),
        ("CI-005", "Form pemulihan kata sandi (Forgot password dialog)", "TCond-005, TCond-006", "Medium", "REQ-F-03"),
        ("CI-006", "Search bar pencarian katalog produk marketplace", "TCond-007, TCond-008", "High", "REQ-F-04"),
        ("CI-007", "Placeholder 'Tidak ada produk ditemukan' pada search", "TCond-008", "Medium", "REQ-F-04"),
        ("CI-008", "Panel filter multi-parameter (RAM, Storage, Harga)", "TCond-009", "High", "REQ-F-05"),
        ("CI-009", "Tombol dan fungsi 'Reset Semua' filter katalog", "TCond-010", "Low", "REQ-F-05"),
        ("CI-010", "Tombol penambahan unit barang ke keranjang belanja", "TCond-011", "High", "REQ-F-06"),
        ("CI-011", "Validasi batas stok inventori produk pada keranjang", "TCond-012", "High", "REQ-F-06"),
        ("CI-012", "Tombol hapus item dan kalkulasi subtotal keranjang", "TCond-013", "Medium", "REQ-F-06"),
        ("CI-013", "Kalkulasi total tagihan invoice checkout dan ongkir", "TCond-014", "High", "REQ-F-07"),
        ("CI-014", "Integrasi pembuatan Snap Token API Midtrans", "TCond-015", "High", "REQ-F-07"),
        ("CI-015", "Selector alamat pengiriman pembeli dan kalkulator tarif ongkir kurir", "TCond-016", "High", "REQ-F-07"),
        ("CI-016", "Penanganan interaksi penutupan dialog pembayaran Midtrans Snap", "TCond-017", "Medium", "REQ-F-07"),
        ("CI-017", "Input field 15-digit nomor IMEI TrustX Scanner", "TCond-018, TCond-019", "High", "REQ-F-08"),
        ("CI-018", "Validasi checksum Luhn dan pencocokan database TAC", "TCond-018, TCond-020", "High", "REQ-F-08"),
        ("CI-019", "Form kalkulator spesifikasi gadget Smart Price Checker", "TCond-021", "High", "REQ-F-09"),
        ("CI-020", "Mekanisme fail-safe fallback database harga lokal", "TCond-022", "Medium", "REQ-F-09"),
        ("CI-021", "Wizard bertahap dan slider budget Smart Matching", "TCond-023, TCond-024", "High", "REQ-F-10"),
        ("CI-022", "Form input spesifikasi dan kondisi jual HP bekas", "TCond-025", "High", "REQ-F-11"),
        ("CI-023", "Validasi upload file gambar fisik gadget (MIME & 5MB)", "TCond-026", "Medium", "REQ-F-11"),
    ]
    t_ci = create_styled_table(doc, len(ci_data) + 1, 5)
    add_header_row(t_ci, ["ID", "Description (Objek Cakupan Pengujian)", "Related Test Condition", "Priority", "Traceability"])
    add_body_rows(t_ci, ci_data)
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 5: TTM Table
    h5 = doc.add_heading("5. Test Traceability Matrix (TTM)", level=2)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)

    ttm_data = [
        ("REQ-F-01", "FS-01", "TCond-001", "CI-001"),
        ("REQ-F-01", "FS-01", "TCond-002", "CI-001, CI-002"),
        ("REQ-F-02", "FS-01", "TCond-003", "CI-003"),
        ("REQ-F-02", "FS-01", "TCond-004", "CI-004"),
        ("REQ-F-03", "FS-01", "TCond-005", "CI-005"),
        ("REQ-F-03", "FS-01", "TCond-006", "CI-005"),
        ("REQ-F-04", "FS-02", "TCond-007", "CI-006"),
        ("REQ-F-04", "FS-02", "TCond-008", "CI-007"),
        ("REQ-F-05", "FS-02", "TCond-009", "CI-008"),
        ("REQ-F-05", "FS-02", "TCond-010", "CI-009"),
        ("REQ-F-06", "FS-03", "TCond-011", "CI-010"),
        ("REQ-F-06", "FS-03", "TCond-012", "CI-011"),
        ("REQ-F-06", "FS-03", "TCond-013", "CI-012"),
        ("REQ-F-07", "FS-04", "TCond-014", "CI-013"),
        ("REQ-F-07", "FS-04", "TCond-015", "CI-014"),
        ("REQ-F-07", "FS-04", "TCond-016", "CI-015"),
        ("REQ-F-07", "FS-04", "TCond-017", "CI-016"),
        ("REQ-F-08", "FS-05", "TCond-018", "CI-017, CI-018"),
        ("REQ-F-08", "FS-05", "TCond-019", "CI-017"),
        ("REQ-F-08", "FS-05", "TCond-020", "CI-017, CI-018"),
        ("REQ-F-09", "FS-06", "TCond-021", "CI-019"),
        ("REQ-F-09", "FS-06", "TCond-022", "CI-020"),
        ("REQ-F-10", "FS-07", "TCond-023", "CI-021"),
        ("REQ-F-10", "FS-07", "TCond-024", "CI-021"),
        ("REQ-F-11", "FS-08", "TCond-025", "CI-022"),
        ("REQ-F-11", "FS-08", "TCond-026", "CI-023"),
    ]
    t_ttm = create_styled_table(doc, len(ttm_data) + 1, 4)
    add_header_row(t_ttm, ["Requirement", "Feature Set", "Test Condition", "Coverage Item"])
    add_body_rows(t_ttm, ttm_data)
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 6: Test Design Technique Summary
    h6 = doc.add_heading("6. Test Design Technique Summary (Ringkasan Teknik Desain Uji)", level=2)
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(6)

    tech_data = [
        ("TCond-001, 002", "Equivalence Partitioning", "Mempartisi input kredensial ke dalam kelas valid (terdaftar) dan invalid (salah password)."),
        ("TCond-003, 004", "Equivalence Partitioning", "Mempartisi data registrasi berdasarkan keunikan email (email baru vs email duplikat)."),
        ("TCond-005, 006", "Equivalence Partitioning", "Mempartisi format email pada permintaan reset password (format valid RFC vs invalid)."),
        ("TCond-007, 008", "Equivalence Partitioning", "Menguji respons pencarian saat query cocok dengan item vs saat query tidak cocok (empty)."),
        ("TCond-009, 010", "Combinatorial / Decision Table", "Menguji kombinasi penyaringan multi-parameter RAM, ROM, dan rentang harga."),
        ("TCond-011, 012", "Boundary Value Analysis", "Menguji nilai batas maksimum kuantitas keranjang belanja terhadap sisa stok inventori."),
        ("TCond-013", "Equivalence Partitioning", "Menguji pembaruan subtotal keranjang belanja saat item dihapus."),
        ("TCond-014, 015", "Equivalence Partitioning", "Menguji kalkulasi finansial invoice pembayaran dan pembuatan token Snap Midtrans."),
        ("TCond-016, 017", "Equivalence Partitioning", "Mempartisi respon checkout pembeli (pemilihan kurir pengiriman valid vs penanganan penutupan dialog bayar)."),
        ("TCond-018, 019, 020", "Boundary Value Analysis & Luhn", "Menguji batas digit nomor IMEI (14, 15, 16 digit) dan validitas algoritma checksum modulo 10."),
        ("TCond-021, 022", "Equivalence Partitioning & Fallback", "Menguji keakuratan estimasi harga model Gemini AI dan mekanisme fail-safe fallback lokal."),
        ("TCond-023, 024", "Boundary Value Analysis", "Menguji nilai batas minimum (Rp 1.000.000) dan maksimum (Rp 30.000.000) pada slider budget."),
        ("TCond-025, 026", "Equivalence Partitioning & BVA", "Menguji proses penerbitan listing bekas dan batas ukuran file foto kondisi fisik (<= 5MB).")
    ]
    t_tech = create_styled_table(doc, len(tech_data) + 1, 3)
    add_header_row(t_tech, ["Test Condition ID", "Test Design Technique", "Rationale (Alasan Pemilihan Teknik)"])
    add_body_rows(t_tech, tech_data)

    output_path = "Dokumen_Lab_Session_TDS_TTM_GadgetTrustX.docx"
    doc.save(output_path)
    print(f"Successfully generated {output_path}")

if __name__ == "__main__":
    generate_lab_session_docx()
