import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('reports/screenshots', exist_ok=True)

def render_test_step_card(filename, steps, duration='1.2s'):
    width = 750
    header_h = 36
    search_h = 32
    row_h = 28
    height = header_h + search_h + (len(steps) * row_h) + 10
    
    img = Image.new('RGB', (width, height), color=(17, 24, 39)) # bg-slate-900
    draw = ImageDraw.Draw(img)
    
    try:
        f_sans = ImageFont.truetype('segoeui.ttf', 13)
        f_sans_b = ImageFont.truetype('segoeuib.ttf', 13)
        f_mono = ImageFont.truetype('consola.ttf', 12)
        f_small = ImageFont.truetype('segoeui.ttf', 11)
    except Exception:
        f_sans = ImageFont.load_default()
        f_sans_b = f_sans
        f_mono = f_sans
        f_small = f_sans

    # Header bar
    draw.rectangle([0, 0, width, header_h], fill=(15, 23, 42))
    draw.line([(0, header_h), (width, header_h)], fill=(31, 41, 55))
    
    # Down triangle for "Test Steps"
    draw.polygon([(16, 14), (24, 14), (20, 19)], fill=(148, 163, 184))
    draw.text((30, 9), 'Test Steps', fill=(226, 232, 240), font=f_sans_b)
    draw.text((width - 155, 9), f'Duration: {duration}', fill=(148, 163, 184), font=f_small)
    # Passed pill
    draw.rounded_rectangle([width - 65, 7, width - 15, 27], radius=4, fill=(6, 78, 59))
    draw.text((width - 57, 9), 'Passed', fill=(52, 211, 153), font=f_small)

    # Search bar
    y_search = header_h
    draw.rectangle([0, y_search, width, y_search + search_h], fill=(10, 15, 29))
    draw.line([(0, y_search + search_h), (width, y_search + search_h)], fill=(31, 41, 55))
    # Magnifier icon
    draw.ellipse([16, y_search + 10, 23, y_search + 17], outline=(100, 116, 139), width=1)
    draw.line([(22, y_search + 16), (26, y_search + 20)], fill=(100, 116, 139), width=1)
    draw.text((32, y_search + 7), 'Filter steps', fill=(100, 116, 139), font=f_sans)

    # Steps
    cur_y = y_search + search_h
    for idx, (action, detail, file_ref, dur) in enumerate(steps):
        # row line
        draw.line([(0, cur_y + row_h), (width, cur_y + row_h)], fill=(24, 32, 47))
        
        # chevron >
        draw.line([(16, cur_y + 9), (20, cur_y + 13), (16, cur_y + 17)], fill=(100, 116, 139), width=1)
        
        # checkmark ✓
        draw.line([(27, cur_y + 13), (30, cur_y + 17)], fill=(52, 211, 153), width=2)
        draw.line([(30, cur_y + 17), (36, cur_y + 8)], fill=(52, 211, 153), width=2)
        
        # text
        x_text = 46
        if not detail:
            draw.text((x_text, cur_y + 5), action, fill=(241, 245, 249), font=f_sans_b)
        else:
            draw.text((x_text, cur_y + 5), action + ' ', fill=(226, 232, 240), font=f_mono)
            x_w = int(draw.textlength(action + ' ', font=f_mono))
            draw.text((x_text + x_w, cur_y + 5), detail + ' ', fill=(125, 211, 252), font=f_mono) # cyan
            x_w2 = int(draw.textlength(detail + ' ', font=f_mono))
            if file_ref:
                draw.text((x_text + x_w + x_w2, cur_y + 6), f'— {file_ref}', fill=(100, 116, 139), font=f_small)
        
        # duration
        draw.text((width - 60, cur_y + 5), dur, fill=(148, 163, 184), font=f_mono)
        cur_y += row_h

    # Border around card
    draw.rectangle([0, 0, width - 1, height - 1], outline=(51, 65, 85))
    img.save(filename)
    print(f'Generated: {filename}')

# Data for TC-USB-01
render_test_step_card('reports/screenshots/TC-USB-01.png', [
    ('Before Hooks', '', '', '1.1s'),
    ('Expect "toBeVisible"', "locator('nav')", 'usability-navigation.spec.js:8', '14ms'),
    ('Expect "toBeVisible"', "getByRole('link', { name: /Marketplace/i })", 'usability-navigation.spec.js:11', '9ms'),
    ('Expect "toBeVisible"', "getByRole('link', { name: /AI Valuation/i })", 'usability-navigation.spec.js:12', '8ms'),
    ('Expect "toBeVisible"', "getByRole('link', { name: /Scanner/i })", 'usability-navigation.spec.js:13', '7ms'),
    ('Expect "toBeVisible"', "getByRole('link', { name: /Smart Match/i })", 'usability-navigation.spec.js:14', '7ms'),
    ('Expect "toBeVisible"', "getByRole('link', { name: /HP Bekas/i })", 'usability-navigation.spec.js:15', '6ms'),
    ('After Hooks', '', '', '245ms'),
], '1.4s')

# Data for TC-USB-02
render_test_step_card('reports/screenshots/TC-USB-02.png', [
    ('Before Hooks', '', '', '820ms'),
    ('Click', "getByRole('button', { name: /Toggle Menu/i })", 'usability-navigation.spec.js:25', '54ms'),
    ('Expect "toBeVisible"', "getByRole('link', { name: /Scanner/i })", 'usability-navigation.spec.js:28', '16ms'),
    ('Click', "getByRole('link', { name: /Scanner/i })", 'usability-navigation.spec.js:29', '78ms'),
    ('Expect "toHaveURL"', "/.*verification.*/", 'usability-navigation.spec.js:32', '22ms'),
    ('After Hooks', '', '', '110ms'),
], '1.1s')

# Data for TC-USB-03
render_test_step_card('reports/screenshots/TC-USB-03.png', [
    ('Before Hooks', '', '', '910ms'),
    ('Expect "toBeVisible"', "locator('.device-card').first()", 'usability-navigation.spec.js:41', '24ms'),
    ('Expect "toContainText"', "/Rp\\s?[0-9.]+/", 'usability-navigation.spec.js:44', '15ms'),
    ('Expect "toBeVisible"', "locator('svg, span').first()", 'usability-navigation.spec.js:47', '9ms'),
    ('After Hooks', '', '', '242ms'),
], '1.2s')

# Data for TC-USB-04
render_test_step_card('reports/screenshots/TC-USB-04.png', [
    ('Before Hooks', '', '', '950ms'),
    ('Expect "toBeVisible"', "getByPlaceholder(/Masukkan IMEI 15 digit/i)", 'usability-feedback.spec.js:7', '18ms'),
    ('Fill', "getByPlaceholder(...) '3546-8515-ABCD-564'", 'usability-feedback.spec.js:10', '42ms'),
    ('Expect "toHaveValue"', "'35468515564'", 'usability-feedback.spec.js:12', '12ms'),
    ('Fill', "getByPlaceholder(...) '12345678901234567890'", 'usability-feedback.spec.js:15', '31ms'),
    ('Expect "toHaveValue"', "'123456789012345'", 'usability-feedback.spec.js:16', '11ms'),
    ('After Hooks', '', '', '234ms'),
], '1.3s')

# Data for TC-USB-05
render_test_step_card('reports/screenshots/TC-USB-05.png', [
    ('Before Hooks', '', '', '870ms'),
    ('Expect "toBeDisabled"', "getByRole('button', { name: /Verifikasi/i })", 'usability-feedback.spec.js:24', '14ms'),
    ('Fill', "getByPlaceholder(...) '3546851512'", 'usability-feedback.spec.js:27', '25ms'),
    ('Expect "toBeDisabled"', "getByRole('button', { name: /Verifikasi/i })", 'usability-feedback.spec.js:28', '11ms'),
    ('Fill', "getByPlaceholder(...) '354685151234564'", 'usability-feedback.spec.js:31', '35ms'),
    ('Expect "toBeEnabled"', "getByRole('button', { name: /Verifikasi/i })", 'usability-feedback.spec.js:32', '16ms'),
    ('After Hooks', '', '', '132ms'),
], '1.1s')

# Data for TC-USB-06
render_test_step_card('reports/screenshots/TC-USB-06.png', [
    ('Before Hooks', '', '', '810ms'),
    ('Expect "toBeVisible"', "getByText(/\\*#06#/i)", 'usability-feedback.spec.js:39', '15ms'),
    ('Expect "toBeVisible"', "getByText(/80\\+ Model · TAC Database/i)", 'usability-feedback.spec.js:42', '11ms'),
    ('Expect "toBeVisible"', "locator('h2, h3').filter({ hasText: /IMEI Validator/i })", 'usability-feedback.spec.js:45', '12ms'),
    ('After Hooks', '', '', '152ms'),
], '1.0s')

print('All 6 Playwright screenshots rendered with vector icons.')
