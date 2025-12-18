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

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { ...JSON_HEADERS, ...corsHeaders },
    body: JSON.stringify(body),
  };
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
}

function stripDataUrlToBase64(input) {
  const s = String(input || "").trim();
  if (!s) return "";
  // Accept either raw base64 or full data URL
  const idx = s.indexOf("base64,");
  if (idx >= 0) return s.slice(idx + "base64,".length).trim();
  return s;
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function buildCopy({ toEmail }) {
  const subject = "🎄 Świąteczna kartka od POL3D — młodej polonijnej inicjatywy z Portland";

  const intro1 = "Cześć,";
  const intro2 = "Ktoś z Twoich bliskich postanowił złożyć Ci świąteczne życzenia z naszym udziałem.";
  const cta1 = "Otwórz załączoną kartkę, aby zobaczyć życzenia.";
  const cta2 = "Możesz się zrewanżować — zrób własną kartkę na POL3D.com.";
  const cta3 = "Ułóż układankę z naszym logo, dodaj tekst, naklejki i zdjęcie — a gotową kartkę wyślij dalej.";

  const hWho = "Kim jesteśmy";
  const who1 = "POL3D — Polska w trzech wymiarach";
  const who2 = "POL3D to grupa polskich nastolatków działająca przy Polskiej Szkole w Portland (Oregon, USA), powstała jako inicjatywa młodych przedsiębiorców.";
  const who3 = "Wspólnie tworzymy projekty, które rozwijają nasze umiejętności, kreatywność i zaangażowanie w życie lokalnej Polonii.";

  const hWhat = "Co robimy";
  const what1 = "Projektujemy i wykonujemy gadżety oraz upominki 3D, które w nowoczesny sposób promują polską kulturę i tradycję.";
  const what2a = "Działamy w trzech zespołach:";
  const what2b = "design — projektowanie modeli i koncepcji,";
  const what2c = "techniczny — digitalizacja i druk 3D,";
  const what2d = "marketingowy — promocja i kontakt z odbiorcami.";

  const hStory = "Jak to się zaczęło";
  const story1 = "Naszą przygodę rozpoczęliśmy w październiku 2025 roku od uzyskania grantu w ramach programu „Polonijna Akademia Przedsiębiorczości”, realizowanego w ramach opieki Senatu RP nad Polonią i Polakami za granicą.";
  const story2 = "Od tego momentu wszystko, co tworzymy, jest efektem naszej własnej pracy, pomysłów i zaangażowania.";

  const hProof = "Pierwszy krok";
  const proof1 = "Stworzyliśmy własne logo, identyfikację wizualną i stronę internetową, a pierwsze projekty przekształciliśmy w realne produkty wydrukowane na drukarce 3D.";
  const proof2 = "Naszym pierwszym publicznym występem był Kiermasz Świąteczny w Domu Polskim w Portland (14 grudnia 2025), gdzie zaprezentowaliśmy gotowe produkty społeczności polonijnej.";
  const filmLabel = "🎥 Film z Kiermaszu:";
  const filmUrl = "https://drive.google.com/file/d/1CjcY98qUJZJ6O_3KZs7hobXbc50QWoRm/view?usp=sharing";

  const hNext = "Co dalej";
  const next1 = "To dopiero początek. W planach mamy uruchomienie sklepu internetowego oraz obecność na Polskim Festiwalu w Portland (Oregon).";

  const contactLabel = "📩 Kontakt:";
  const contact1 = "info.pol3d@gmail.com";
  const contact2 = "szkolapolskapdx@gmail.com";

  const closing1 = "Dziękujemy za chwilę uwagi i życzymy spokojnych, radosnych Świąt oraz wszystkiego dobrego w Nowym Roku.";
  const sign1 = "Zespół POL3D — Polska w trzech wymiarach";
  const sign2 = "Portland, Oregon";

  // TEXT (plain)
  const text = [
    intro1,
    "",
    intro2,
    "",
    cta1,
    cta2,
    cta3,
    "",
    `${hWho}\n${who1}\n${who2}\n${who3}`,
    "",
    `${hWhat}\n${what1}\n${what2a}\n- ${what2b}\n- ${what2c}\n- ${what2d}`,
    "",
    `${hStory}\n${story1}\nLink: https://przedsiebiorczydzek.pl/polonia/\n${story2}`,
    "",
    `${hProof}\n${proof1}\n${proof2}\n${filmLabel} ${filmUrl}`,
    "",
    `${hNext}\n${next1}`,
    "",
    `${contactLabel}\n${contact1}\n${contact2}`,
    "",
    closing1,
    "",
    sign1,
    sign2,
  ].join("\n");

  // HTML
  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; line-height:1.5; color:#1f2937;">
    <p style="margin:0 0 12px 0;"><b>${escapeHtml(intro1)}</b></p>
    <p style="margin:0 0 12px 0;">${escapeHtml(intro2)}</p>

    <div style="margin:14px 0 18px 0; padding:12px 14px; border:1px solid #e5e7eb; border-radius:12px; background:#fafafa;">
      <p style="margin:0 0 10px 0;">📎 ${escapeHtml(cta1)}</p>
      <p style="margin:0 0 10px 0;">${escapeHtml(cta2)}</p>
      <p style="margin:0;">${escapeHtml(cta3)}</p>
      <p style="margin:12px 0 0 0;">
        <a href="https://pol3d.com" style="display:inline-block; text-decoration:none; padding:10px 12px; border-radius:10px; background:#0f766e; color:#fff; font-weight:700;">
          Wejdź na POL3D.com
        </a>
      </p>
    </div>

    <h3 style="margin:18px 0 8px 0;">${escapeHtml(hWho)}</h3>
    <p style="margin:0 0 10px 0;"><b>${escapeHtml(who1)}</b></p>
    <p style="margin:0 0 10px 0;">${escapeHtml(who2)}</p>
    <p style="margin:0 0 10px 0;">${escapeHtml(who3)}</p>

    <h3 style="margin:18px 0 8px 0;">${escapeHtml(hWhat)}</h3>
    <p style="margin:0 0 10px 0;">${escapeHtml(what1)}</p>
    <p style="margin:0 0 6px 0;">${escapeHtml(what2a)}</p>
    <ul style="margin:0 0 10px 18px; padding:0;">
      <li>${escapeHtml(what2b)}</li>
      <li>${escapeHtml(what2c)}</li>
      <li>${escapeHtml(what2d)}</li>
    </ul>

    <h3 style="margin:18px 0 8px 0;">${escapeHtml(hStory)}</h3>
    <p style="margin:0 0 10px 0;">${escapeHtml(story1)}</p>
    <p style="margin:0 0 10px 0;">
      <a href="https://przedsiebiorczydzek.pl/polonia/" style="color:#0f766e; text-decoration:underline;">
        https://przedsiebiorczydzek.pl/polonia/
      </a>
    </p>
    <p style="margin:0 0 10px 0;">${escapeHtml(story2)}</p>

    <h3 style="margin:18px 0 8px 0;">${escapeHtml(hProof)}</h3>
    <p style="margin:0 0 10px 0;">${escapeHtml(proof1)}</p>
    <p style="margin:0 0 10px 0;">${escapeHtml(proof2)}</p>
    <p style="margin:0 0 10px 0;">${escapeHtml(filmLabel)} <a href="${escapeHtml(filmUrl)}" style="color:#0f766e; text-decoration:underline;">${escapeHtml(filmUrl)}</a></p>

    <h3 style="margin:18px 0 8px 0;">${escapeHtml(hNext)}</h3>
    <p style="margin:0 0 10px 0;">${escapeHtml(next1)}</p>

    <p style="margin:14px 0 0 0;"><b>${escapeHtml(contactLabel)}</b><br>
      <a href="mailto:${escapeHtml(contact1)}" style="color:#0f766e; text-decoration:underline;">${escapeHtml(contact1)}</a><br>
      <a href="mailto:${escapeHtml(contact2)}" style="color:#0f766e; text-decoration:underline;">${escapeHtml(contact2)}</a>
    </p>

    <hr style="border:none; border-top:1px solid #e5e7eb; margin:18px 0;">

    <p style="margin:0 0 10px 0;">${escapeHtml(closing1)}</p>
    <p style="margin:0;"><b>${escapeHtml(sign1)}</b><br>${escapeHtml(sign2)}</p>
  </div>
  `.trim();

  return { subject, html, text };
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: { ...corsHeaders }, body: "" };
    }
    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method not allowed" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return json(500, { ok: false, error: "Missing RESEND_API_KEY" });

    // Use ENV if present; otherwise fallback to a sane default.
    // (If your domain isn't verified, Resend will reject; set RESEND_FROM in Netlify to the verified sender.)
    const from = (process.env.RESEND_FROM || "POL3D <kartka@pol3d.com>").trim();
    const replyTo = (process.env.RESEND_REPLY_TO || "info.pol3d@gmail.com").trim();

    const body = JSON.parse(event.body || "{}");

    const to = String(body.to || "").trim();
    if (!isEmail(to)) return json(400, { ok: false, error: "Invalid recipient email" });

    const filename = String(body.filename || "POL3D_kartka.png").trim();
    const mime = String(body.mime || "image/png").trim();
    const base64 = stripDataUrlToBase64(body.base64);

    if (!base64) return json(400, { ok: false, error: "Missing attachment base64" });

    const { subject, html, text } = buildCopy({ toEmail: to });

    const resendPayload = {
      from,
      to: [to],
      subject,
      html,
      text,
      reply_to: replyTo,
      attachments: [
        {
          filename,
          content: base64,
          content_type: mime,
        },
      ],
    };

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return json(502, {
        ok: false,
        error: "Resend API error",
        details: data?.message || data || `HTTP ${resp.status}`,
      });
    }

    return json(200, { ok: true, id: data?.id || null });
  } catch (err) {
    return json(500, {
      ok: false,
      error: "Server error",
      details: err?.message || String(err),
    });
  }
}
