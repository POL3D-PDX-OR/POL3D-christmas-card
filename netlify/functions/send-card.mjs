/**
 * Netlify Function: /.netlify/functions/send-card
 * Sends an email with PNG attachment using Resend.
 *
 * Required ENV:
 *  - RESEND_API_KEY
 *
 * Optional ENV:
 *  - RESEND_FROM      e.g. "POL3D <kartka@pol3d.com>"
 *  - RESEND_REPLY_TO  e.g. "info.pol3d@gmail.com"
 */

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FUNCTION_VERSION = "send-card.mjs v2025-12-18-01";

function json(statusCode, body) {
  return { statusCode, headers: { ...JSON_HEADERS, ...corsHeaders }, body: JSON.stringify(body) };
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
}

function stripDataUrlToBase64(input) {
  const s = String(input || "").trim();
  if (!s) return "";
  const idx = s.indexOf("base64,");
  return (idx >= 0 ? s.slice(idx + "base64,".length) : s).trim();
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function buildCopy() {
  const subject = "🎄 Świąteczna kartka od POL3D — młodej polonijnej inicjatywy z Portland";

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; line-height:1.5; color:#1f2937;">
    <p style="margin:0 0 12px 0;"><b>Cześć,</b></p>
    <p style="margin:0 0 12px 0;">Ktoś z Twoich bliskich postanowił złożyć Ci świąteczne życzenia z naszym udziałem.</p>

    <div style="margin:14px 0 18px 0; padding:12px 14px; border:1px solid #e5e7eb; border-radius:12px; background:#fafafa;">
      <p style="margin:0 0 10px 0;">📎 Otwórz załączoną kartkę, aby zobaczyć życzenia.</p>
      <p style="margin:0 0 10px 0;">Możesz się zrewanżować — zrób własną kartkę na POL3D.com.</p>
      <p style="margin:0;">Ułóż układankę z naszym logo, dodaj tekst, naklejki i zdjęcie — a gotową kartkę wyślij dalej.</p>
      <p style="margin:12px 0 0 0;">
        <a href="https://pol3d.com" style="display:inline-block; text-decoration:none; padding:10px 12px; border-radius:10px; background:#0f766e; color:#fff; font-weight:700;">
          Wejdź na POL3D.com
        </a>
      </p>
    </div>

    <h3 style="margin:18px 0 8px 0;">Kim jesteśmy</h3>
    <p style="margin:0 0 10px 0;"><b>POL3D — Polska w trzech wymiarach</b></p>
    <p style="margin:0 0 10px 0;">POL3D to grupa polskich nastolatków działająca przy Polskiej Szkole w Portland (Oregon, USA), powstała jako inicjatywa młodych przedsiębiorców.</p>
    <p style="margin:0 0 10px 0;">Wspólnie tworzymy projekty, które rozwijają nasze umiejętności, kreatywność i zaangażowanie w życie lokalnej Polonii.</p>

    <h3 style="margin:18px 0 8px 0;">Co robimy</h3>
    <p style="margin:0 0 10px 0;">Projektujemy i wykonujemy gadżety oraz upominki 3D, które w nowoczesny sposób promują polską kulturę i tradycję.</p>
    <ul style="margin:0 0 10px 18px; padding:0;">
      <li>design — projektowanie modeli i koncepcji,</li>
      <li>techniczny — digitalizacja i druk 3D,</li>
      <li>marketingowy — promocja i kontakt z odbiorcami.</li>
    </ul>

    <h3 style="margin:18px 0 8px 0;">Jak to się zaczęło</h3>
    <p style="margin:0 0 10px 0;">Naszą przygodę rozpoczęliśmy w październiku 2025 roku od uzyskania grantu w ramach programu „Polonijna Akademia Przedsiębiorczości”, realizowanego w ramach opieki Senatu RP nad Polonią i Polakami za granicą.</p>
    <p style="margin:0 0 10px 0;">
      <a href="https://przedsiebiorczydzek.pl/polonia/" style="color:#0f766e; text-decoration:underline;">
        https://przedsiebiorczydzek.pl/polonia/
      </a>
    </p>

    <h3 style="margin:18px 0 8px 0;">Pierwszy krok</h3>
    <p style="margin:0 0 10px 0;">Naszym pierwszym publicznym występem był Kiermasz Świąteczny w Domu Polskim w Portland (14 grudnia 2025).</p>
    <p style="margin:0 0 10px 0;">🎥 Film (placeholder): <a href="https://drive.google.com/file/d/1CjcY98qUJZJ6O_3KZs7hobXbc50QWoRm/view?usp=sharing" style="color:#0f766e; text-decoration:underline;">link</a></p>

    <h3 style="margin:18px 0 8px 0;">Co dalej</h3>
    <p style="margin:0 0 10px 0;">To dopiero początek. W planach mamy uruchomienie sklepu internetowego oraz obecność na Polskim Festiwalu w Portland (Oregon).</p>

    <p style="margin:14px 0 0 0;"><b>📩 Kontakt:</b><br>
      <a href="mailto:info.pol3d@gmail.com" style="color:#0f766e; text-decoration:underline;">info.pol3d@gmail.com</a><br>
      <a href="mailto:szkolapolskapdx@gmail.com" style="color:#0f766e; text-decoration:underline;">szkolapolskapdx@gmail.com</a>
    </p>

    <hr style="border:none; border-top:1px solid #e5e7eb; margin:18px 0;">

    <p style="margin:0 0 10px 0;">Dziękujemy za chwilę uwagi i życzymy spokojnych, radosnych Świąt oraz wszystkiego dobrego w Nowym Roku.</p>
    <p style="margin:0;"><b>Zespół POL3D — Polska w trzech wymiarach</b><br>Portland, Oregon</p>
  </div>
  `.trim();

  const text = [
    "Cześć,",
    "",
    "Ktoś z Twoich bliskich postanowił złożyć Ci świąteczne życzenia z naszym udziałem.",
    "",
    "Otwórz załączoną kartkę, aby zobaczyć życzenia.",
    "Możesz się zrewanżować — zrób własną kartkę na https://pol3d.com",
    "",
    "Kontakt:",
    "info.pol3d@gmail.com",
    "szkolapolskapdx@gmail.com",
  ].join("\n");

  return { subject, html, text };
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: { ...corsHeaders }, body: "" };
    }
    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method not allowed", functionVersion: FUNCTION_VERSION });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return json(500, { ok: false, error: "Missing RESEND_API_KEY", functionVersion: FUNCTION_VERSION });

    // NEVER require RESEND_FROM — always fallback
    const from = String(process.env.RESEND_FROM || "POL3D <kartka@pol3d.com>").trim();
    const replyTo = String(process.env.RESEND_REPLY_TO || "info.pol3d@gmail.com").trim();

    const body = JSON.parse(event.body || "{}");
    const to = String(body.to || "").trim();
    if (!isEmail(to)) return json(400, { ok: false, error: "Invalid recipient email", functionVersion: FUNCTION_VERSION });

    const filename = String(body.filename || "POL3D_kartka.png").trim();
    const mime = String(body.mime || "image/png").trim();
    const base64 = stripDataUrlToBase64(body.base64);

    if (!base64) return json(400, { ok: false, error: "Missing attachment base64", functionVersion: FUNCTION_VERSION });

    const { subject, html, text } = buildCopy();

    const resendPayload = {
      from,
      to: [to],
      subject,
      html,
      text,
      reply_to: replyTo,
      attachments: [
        { filename, content: base64, content_type: mime },
      ],
    };

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(resendPayload),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return json(502, {
        ok: false,
        error: "Resend API error",
        details: data?.message || data || `HTTP ${resp.status}`,
        usedFrom: from,
        functionVersion: FUNCTION_VERSION,
      });
    }

    return json(200, { ok: true, id: data?.id || null, usedFrom: from, functionVersion: FUNCTION_VERSION });
  } catch (err) {
    return json(500, { ok: false, error: "Server error", details: err?.message || String(err), functionVersion: FUNCTION_VERSION });
  }
}
