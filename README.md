# POL3D Kartka — Netlify (Static + Functions)

## Struktura
- `public/index.html` — kartka (frontend)
- `netlify/functions/send-card.mjs` — Netlify Function do wysyłki maila (Resend)
- `netlify.toml` — konfiguracja build/publish + opcjonalny redirect `/api/send-card`

## Wymagania
1) Konto w Resend (https://resend.com) lub inny provider mailowy.
2) Zweryfikowany nadawca (FROM_EMAIL) w Resend.
3) Ustawione zmienne środowiskowe w Netlify.

## Deploy na Netlify
1) Wrzuć to repo na GitHub.
2) Netlify → **Add new site** → Import from Git.
3) Build settings:
   - Build command: (puste)
   - Publish directory: `public`
   - Functions directory: `netlify/functions` (już w netlify.toml)

## Zmienne środowiskowe (Netlify → Site settings → Environment variables)
- `RESEND_API_KEY` = Twój klucz API
- `FROM_EMAIL` = np. `POL3D <no-reply@twojadomena.pl>`
Opcjonalnie:
- `EMAIL_SUBJECT`
- `EMAIL_TEXT`
- `MAX_B64_BYTES` (domyślnie ~5MB)

## Endpoint
Frontend domyślnie wysyła na:
- `/.netlify/functions/send-card`
Opcjonalnie redirect (już w netlify.toml):
- `/api/send-card` → `/.netlify/functions/send-card`

## Assety (PNG/GIF)
Umieść pliki PNG/GIF w `public/` obok `index.html`:
- POL3D_WATERMARK_OUTLINES.png
- POL3D_TXT-POL.png
- POL3D_TXT-3D.png
- POL3D_TXT-.com.png
- POL3D_TXT-POLwTRZECH-W.png
- POL3D_MT.HOOD_COLOR.png
- POL3D_MT.HOOD_WIRE_w_HORIZON.png
- POL3D-O-EMIOJI-OCZKO-ANIMA-L.gif

## Bezpieczeństwo (zalecane)
- Dodaj prosty limit (captcha Turnstile/hCaptcha) zanim uruchomisz publicznie.
- W funkcji możesz sprawdzać `Origin` lub `Referer` i odrzucać obce domeny.
