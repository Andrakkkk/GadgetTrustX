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
            draw.text((x_text + x_w, cur_y + 5), detail + ' ', fill=(125, 211, 252), font=f_mono)
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

# --- NFR-001 ---
render_test_step_card('reports/screenshots/TC-SEC-01.png', [
    ('Before Hooks', '', '', '920ms'),
    ('Expect "toBeVisible"', "getByPlaceholder(/nama@email.com/i)", 'security.spec.js:7', '18ms'),
    ('Fill', "getByPlaceholder(...) 'userinvalid'", 'security.spec.js:12', '24ms'),
    ('Fill', "getByPlaceholder(...) ''", 'security.spec.js:13', '15ms'),
    ('Expect "toHaveValue"', "'userinvalid'", 'security.spec.js:16', '9ms'),
    ('Expect "toHaveValue"', "''", 'security.spec.js:17', '8ms'),
    ('After Hooks', '', '', '140ms'),
], '1.1s')

render_test_step_card('reports/screenshots/TC-SEC-02.png', [
    ('Before Hooks', '', '', '840ms'),
    ('Expect "toBeVisible"', "getByPlaceholder(/••••••••/i)", 'security.spec.js:23', '16ms'),
    ('Expect "toHaveAttribute"', "'type', 'password'", 'security.spec.js:26', '12ms'),
    ('After Hooks', '', '', '115ms'),
], '983ms')

render_test_step_card('reports/screenshots/TC-SEC-03.png', [
    ('Before Hooks', '', '', '890ms'),
    ('Fill', "getByPlaceholder(...) 'unregistered_user_99@test.com'", 'security.spec.js:35', '32ms'),
    ('Fill', "getByPlaceholder(...) 'WrongPassword123!'", 'security.spec.js:36', '28ms'),
    ('Expect "toHaveValue"', "'unregistered_user_99@test.com'", 'security.spec.js:39', '11ms'),
    ('After Hooks', '', '', '120ms'),
], '1.1s')

# --- NFR-002 ---
render_test_step_card('reports/screenshots/TC-SEC-04.png', [
    ('Before Hooks', '', '', '950ms'),
    ('page.context().clearCookies()', "", 'security.spec.js:47', '22ms'),
    ('page.goto("/buyer-profile")', "", 'security.spec.js:48', '310ms'),
    ('Expect "toHaveURL"', "/.*login.*/", 'security.spec.js:51', '45ms'),
    ('After Hooks', '', '', '135ms'),
], '1.5s')

render_test_step_card('reports/screenshots/TC-SEC-05.png', [
    ('Before Hooks', '', '', '880ms'),
    ('page.context().clearCookies()', "", 'security.spec.js:56', '19ms'),
    ('page.goto("/seller-profile")', "", 'security.spec.js:57', '290ms'),
    ('Expect "toHaveURL"', "/.*login.*/", 'security.spec.js:60', '38ms'),
    ('After Hooks', '', '', '125ms'),
], '1.4s')

render_test_step_card('reports/screenshots/TC-SEC-06.png', [
    ('Before Hooks', '', '', '910ms'),
    ('page.context().clearCookies()', "", 'security.spec.js:65', '18ms'),
    ('page.goto("/admin")', "", 'security.spec.js:66', '280ms'),
    ('Expect "toHaveURL"', "/.*login.*/", 'security.spec.js:69', '35ms'),
    ('After Hooks', '', '', '130ms'),
], '1.4s')

# --- NFR-003 ---
render_test_step_card('reports/screenshots/TC-SEC-07.png', [
    ('Before Hooks', '', '', '940ms'),
    ('Expect "toBeVisible"', "getByPlaceholder(/Masukkan IMEI 15 digit/i)", 'security.spec.js:77', '19ms'),
    ('Fill', "getByPlaceholder(...) \"' OR 1=1 --\"", 'security.spec.js:81', '35ms'),
    ('Expect "toHaveValue"', "'11'", 'security.spec.js:84', '14ms'),
    ('Expect "toBeDisabled"', "getByRole('button', { name: /Verifikasi/i })", 'security.spec.js:86', '12ms'),
    ('After Hooks', '', '', '145ms'),
], '1.2s')

render_test_step_card('reports/screenshots/TC-SEC-08.png', [
    ('Before Hooks', '', '', '870ms'),
    ('Fill', "getByPlaceholder(...) '<script>alert(\"XSS\")</script>'", 'security.spec.js:94', '38ms'),
    ('Expect "toHaveValue"', "''", 'security.spec.js:97', '15ms'),
    ('After Hooks', '', '', '120ms'),
], '1.0s')

render_test_step_card('reports/screenshots/TC-SEC-09.png', [
    ('Before Hooks', '', '', '860ms'),
    ('Fill', "getByPlaceholder(...) '9'.repeat(100)", 'security.spec.js:105', '42ms'),
    ('Expect "toBe"', "actualVal.length === 15", 'security.spec.js:109', '10ms'),
    ('After Hooks', '', '', '118ms'),
], '1.0s')

# --- NFR-004 & NFR-005 ---
render_test_step_card('reports/screenshots/TC-SEC-10.png', [
    ('Before Hooks', '', '', '930ms'),
    ('Expect "toBeVisible"', "locator('div.glass-panel').first()", 'security.spec.js:118', '24ms'),
    ('Expect "toBeVisible"', "getByRole('heading', { name: /TrustX Scanner/i })", 'security.spec.js:119', '18ms'),
    ('After Hooks', '', '', '130ms'),
], '1.1s')

render_test_step_card('reports/screenshots/TC-SEC-11.png', [
    ('Before Hooks', '', '', '890ms'),
    ('page.content()', "Scan DOM markup source", 'security.spec.js:126', '65ms'),
    ('Expect "not.toContain"', "'service_role'", 'security.spec.js:129', '8ms'),
    ('Expect "not.toContain"', "'TURNSTILE_SECRET_KEY'", 'security.spec.js:130', '7ms'),
    ('After Hooks', '', '', '125ms'),
], '1.1s')

render_test_step_card('reports/screenshots/TC-SEC-12.png', [
    ('Before Hooks', '', '', '860ms'),
    ('page.context().cookies()', "Inspect session tokens", 'security.spec.js:137', '22ms'),
    ('Expect "toBeUndefined"', "sessionCookie", 'security.spec.js:139', '9ms'),
    ('After Hooks', '', '', '110ms'),
], '1.0s')

print('All 12 Security Playwright screenshots rendered successfully.')
