// netlify/functions/send-card.mjs
// Node 18+ (Netlify Functions)
// Sends an email via Resend with PNG attachment from base64 payload.

const RESEND_API_URL = "https://api.resend.com/emails";

// Helper: JSON response
function json(statusCode, bodyObj, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
    body: JSON.stringify(bodyObj),
  };
}

// Helper: basic email validation
function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Helper: base64 sanity check (not perfect, but prevents obvious garbage)
function looksLikeBase64(str) {
  if (typeof str !== "string") return false;
  const s = str.trim();
  if (s.length < 100) return false; // PNG base64 will be much longer
  // base64 charset check (allow = padding)
  return /^[A-Za-z0-9+/=\r\n]+$/.test(s);
}

// Compose the final email (subject + HTML + text)
function composeEmail({ recipientEmail }) {
  // Placeholder link (as requested)
  const filmUrl =
    "https://drive.google.com/file/d/1CjcY98qUJZJ6O_3KZs7hobXbc50QWoRm/view?usp=sharing";

  const subject = "🎄 Świąteczna kartka od POL3D — młodej polonijnej inicjatywy z Portland";

  const text = [
    "Otrzymałeś tę kartkę, ponieważ ktoś z Twoich przyjaciół lub znajomych postanowił złożyć Ci świąteczne życzenia za naszym pośrednictwem — wykorzystując kartkę stworzoną w projekcie POL3D.",
    "",
    "Cieszymy się, że możemy uczestniczyć w dzieleniu się życzeniami i dobrem i z tej okazji życzymy Ci Wesołych Świąt oraz Szczęśliwego Nowego Roku.",
    "",
    "Otwórz załączoną kartkę (PNG), aby zobaczyć świąteczne życzenia.",
    "",
    "Chcesz wysłać własną? Wejdź na https://pol3d.com, ułóż układankę z naszym logo, dodaj własny tekst, naklejki lub zdjęcie i wyślij ją dalej.",
    "",
    "POL3D — Polska w trzech wymiarach to grupa polskich nastolatków działająca przy Polskiej Szkole w Portland (Oregon, USA), powstała jako inicjatywa młodych przedsiębiorców.",
    "",
    "Naszą przygodę rozpoczęliśmy w październiku 2025 roku dzięki uzyskaniu grantu w ramach programu „Polonijna Akademia Przedsiębiorczości”: https://przedsiebiorczydzek.pl/polonia/ (w ramach opieki Senatu RP nad Polonią i Polakami za granicą).",
    "",
    "Naszym pierwszym publicznym występem był Kiermasz Świąteczny w Domu Polskim w Portland (14 grudnia 2025).",
    `Relacja wideo (placeholder): ${filmUrl}`,
    "",
    "Kontakt: info.pol3d@gmail.com",
    "",
    "Zespół POL3D — Polska w trzech wymiarach",
    "Portland, Oregon 🇺🇸🇵🇱",
  ].join("\n");

  // Minimal, czytelny HTML
  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.5;color:#1f2937;">
    <h2 style="margin:0 0 10px 0;">Serdeczne życzenia od zespołu POL3D</h2>

    <p style="margin:0 0 12px 0;">
      Otrzymałeś tę kartkę, ponieważ ktoś z Twoich przyjaciół lub znajomych postanowił złożyć Ci świąteczne życzenia
      <strong>za naszym pośrednictwem</strong> — wykorzystując kartkę stworzoną w projekcie <strong>POL3D</strong>.
    </p>

    <p style="margin:0 0 12px 0;">
      Cieszymy się, że możemy <strong>uczestniczyć w dzieleniu się życzeniami i dobrem</strong><br/>
      i z tej okazji życzymy Ci <strong>Wesołych Świąt oraz Szczęśliwego Nowego Roku</strong>.
    </p>

    <div style="padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;margin:14px 0;">
      <p style="margin:0 0 6px 0;"><strong>Co zrobić teraz?</strong></p>
      <ol style="margin:0 0 0 18px;padding:0;">
        <li>📎 Otwórz załączoną kartkę (PNG), aby zobaczyć świąteczne życzenia.</li>
        <li>🎁 Zrób własną kartkę: wejdź na <a href="https://pol3d.com" target="_blank" rel="noreferrer">pol3d.com</a>,
            dodaj tekst, naklejki i zdjęcie — i wyślij ją dalej.</li>
      </ol>
    </div>

    <h3 style="margin:18px 0 8px 0;">Kim jesteśmy?</h3>
    <p style="margin:0 0 10px 0;">
      <strong>POL3D — Polska w trzech wymiarach</strong> to grupa polskich nastolatków działająca przy
      <strong>Polskiej Szkole w Portland (Oregon, USA)</strong>, powstała jako inicjatywa młodych przedsiębiorców.
      Projektujemy i wykonujemy gadżety oraz upominki 3D promujące polską kulturę i tradycję.
    </p>

    <h3 style="margin:18px 0 8px 0;">Jak to się zaczęło?</h3>
    <p style="margin:0 0 10px 0;">
      Naszą przygodę rozpoczęliśmy w <strong>październiku 2025 roku</strong> dzięki grantowi w ramach programu
      <a href="https://przedsiebiorczydzek.pl/polonia/" target="_blank" rel="noreferrer">„Polonijna Akademia Przedsiębiorczości”</a>
      (w ramach opieki Senatu RP nad Polonią i Polakami za granicą).
      Od tego momentu wszystko, co tworzymy, jest efektem naszej własnej pracy, pomysłów i zaangażowania.
    </p>

    <h3 style="margin:18px 0 8px 0;">Pierwszy publiczny występ</h3>
    <p style="margin:0 0 10px 0;">
      Naszym pierwszym publicznym występem był <strong>Kiermasz Świąteczny w Domu Polskim w Portland (14 grudnia 2025)</strong>.
      <br/>🎥 Relacja wideo (placeholder): <a href="${filmUrl}" target="_blank" rel="noreferrer">${filmUrl}</a>
    </p>

    <p style="margin:18px 0 4px 0;">
      Kontakt: <a href="mailto:info.pol3d@gmail.com">info.pol3d@gmail.com</a>
    </p>

    <p style="margin:12px 0 0 0;">
      <strong>Zespół POL3D — Polska w trzech wymiarach</strong><br/>
      Portland, Oregon 🇺🇸🇵🇱
    </p>
  </div>`;

  return { subject, text, html, filmUrl };
}

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return json(
      405,
      { ok: false, error: "Method not allowed. Use POST." },
      { "Access-Control-Allow-Origin": "*" }
    );
  }

  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL; // e.g. "POL3D <kartka@send.pol3d.com>"
    const REPLY_TO = process.env.REPLY_TO || "info.pol3d@gmail.com";

    if (!RESEND_API_KEY) {
      return json(
        500,
        { ok: false, error: "Missing RESEND_API_KEY in environment." },
        { "Access-Control-Allow-Origin": "*" }
      );
    }
    if (!FROM_EMAIL) {
      return json(
        500,
        { ok: false, error: "Missing FROM_EMAIL in environment (must be on your verified domain)." },
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    const payload = JSON.parse(event.body || "{}");
    const to = (payload.to || "").trim();
    const filename = (payload.filename || "POL3D_kartka.png").trim();
    const mime = (payload.mime || "image/png").trim();
    const base64 = (payload.base64 || "").trim();

    if (!isValidEmail(to)) {
      return json(400, { ok: false, error: "Invalid `to` email address." }, { "Access-Control-Allow-Origin": "*" });
    }
    if (!looksLikeBase64(base64)) {
      return json(400, { ok: false, error: "Invalid `base64` payload (too short or not base64-like)." }, { "Access-Control-Allow-Origin": "*" });
    }
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(mime)) {
      return json(400, { ok: false, error: "Unsupported mime type. Use image/png, image/jpeg, image/webp." }, { "Access-Control-Allow-Origin": "*" });
    }

    const { subject, text, html } = composeEmail({ recipientEmail: to });

    // Resend API request
    const resendBody = {
      from: FROM_EMAIL,
      to: [to],
      subject,
      text,
      html,
      reply_to: REPLY_TO,
      attachments: [
        {
          filename,
          content: base64, // Resend expects base64 string (no data: prefix)
          content_type: mime,
        },
      ],
    };

    const resp = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendBody),
    });

    const respText = await resp.text().catch(() => "");
    let respJson = {};
    try { respJson = respText ? JSON.parse(respText) : {}; } catch (_) {}

    if (!resp.ok) {
      // Pass through Resend error details
      return json(
        resp.status,
        {
          ok: false,
          error: "Resend API error",
          details: respJson?.message || respText || `HTTP ${resp.status}`,
        },
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    return json(
      200,
      {
        ok: true,
        id: respJson?.id || null,
        to,
        filename,
      },
      { "Access-Control-Allow-Origin": "*" }
    );
  } catch (err) {
    return json(
      500,
      {
        ok: false,
        error: "Server error",
        details: err?.message || String(err),
      },
      { "Access-Control-Allow-Origin": "*" }
    );
  }
}
