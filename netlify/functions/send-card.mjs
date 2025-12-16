/**
 * Netlify Function: /.netlify/functions/send-card
 * Wysyła e-mail z załącznikiem PNG przez Resend (bez SDK; czysty fetch).
 *
 * Wymagane ENV (Netlify -> Site configuration -> Environment variables):
 * - RESEND_API_KEY = Twój klucz API z Resend
 *
 * Opcjonalne ENV:
 * - RESEND_FROM = np. "POL3D <kartka@pol3d.com>"  (MUSI być w zweryfikowanej domenie w Resend)
 * - RESEND_REPLY_TO = np. "info.pol3d@gmail.com"
 * - RESEND_SUBJECT = np. "🎄 Świąteczna kartka od POL3D — młodej polonijnej inicjatywy z Portland"
 */

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

function corsHeaders(origin) {
  // Jeśli chcesz ograniczyć domeny, wpisz tu konkretnie np. https://pol3d.com
  const allowOrigin = origin || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
}

function safeJsonParse(body) {
  try {
    return { ok: true, value: JSON.parse(body || "{}") };
  } catch (e) {
    return { ok: false, error: e };
  }
}

function stripDataUrlPrefix(base64OrDataUrl) {
  const s = String(base64OrDataUrl || "").trim();
  if (!s) return "";
  // jeśli przyjdzie dataURL: data:image/png;base64,AAAA...
  const commaIdx = s.indexOf(",");
  if (s.startsWith("data:") && commaIdx !== -1) return s.slice(commaIdx + 1).trim();
  return s;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  const cors = corsHeaders(origin);

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { ...cors } };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...JSON_HEADERS, ...cors },
      body: JSON.stringify({ error: "Method Not Allowed. Use POST." }),
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { ...JSON_HEADERS, ...cors },
      body: JSON.stringify({
        error: "Server misconfigured: missing RESEND_API_KEY env var.",
      }),
    };
  }

  // FROM musi być adresem w ZWERYFIKOWANEJ domenie Resend (np. @pol3d.com).
  const from = process.env.RESEND_FROM || "POL3D <kartka@pol3d.com>";
  const replyTo = process.env.RESEND_REPLY_TO || undefined;
  const subject =
    process.env.RESEND_SUBJECT ||
    "🎄 Świąteczna kartka od POL3D — młodej polonijnej inicjatywy z Portland";

  const parsed = safeJsonParse(event.body);
  if (!parsed.ok) {
    return {
      statusCode: 400,
      headers: { ...JSON_HEADERS, ...cors },
      body: JSON.stringify({ error: "Invalid JSON body." }),
    };
  }

  const { to, filename, mime, base64 } = parsed.value || {};

  if (!isValidEmail(to)) {
    return {
      statusCode: 400,
      headers: { ...JSON_HEADERS, ...cors },
      body: JSON.stringify({ error: "Invalid recipient email address." }),
    };
  }

  const safeName = String(filename || "POL3D_kartka.png").slice(0, 120);
  const contentType = String(mime || "image/png").toLowerCase();
  if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(contentType)) {
    return {
      statusCode: 400,
      headers: { ...JSON_HEADERS, ...cors },
      body: JSON.stringify({ error: "Unsupported mime type." }),
    };
  }

  const b64 = stripDataUrlPrefix(base64);
  if (!b64 || b64.length < 1000) {
    return {
      statusCode: 400,
      headers: { ...JSON_HEADERS, ...cors },
      body: JSON.stringify({ error: "Missing/invalid base64 payload." }),
    };
  }

  // Bezpiecznik: ogranicz rozmiar (base64 jest większe niż binarka ~33%)
  // 6 MB base64 ~ 4.5 MB PNG realnie. Dla kartek IG to aż nadto.
  const MAX_B64_CHARS = 6_000_000;
  if (b64.length > MAX_B64_CHARS) {
    return {
      statusCode: 413,
      headers: { ...JSON_HEADERS, ...cors },
      body: JSON.stringify({
        error: "Payload too large. Please export a smaller format/resolution.",
      }),
    };
  }

  // ========= TREŚĆ WIADOMOŚCI =========
  const senderNote = "Ktoś z Twoich bliskich postanowił złożyć Ci świąteczne życzenia z naszym udziałem.";
  const ctaLine1 = "📎 Otwórz załączoną kartkę, aby zobaczyć świąteczne życzenia.";
  const ctaLine2 = "Zrób własną kartkę na pol3d.com: ułóż układankę z naszym logo, dodaj tekst, naklejki i zdjęcie — a gotową kartkę wyślij dalej.";

  const about1 = "POL3D — Polska w trzech wymiarach — to grupa polskich nastolatków działająca przy Polskiej Szkole w Portland (Oregon, USA), powstała jako inicjatywa młodych przedsiębiorców.";
  const about2 = "Wspólnie tworzymy projekty, które rozwijają nasze umiejętności, kreatywność i zaangażowanie w życie lokalnej Polonii.";

  const do1 = "Projektujemy i wykonujemy gadżety oraz upominki 3D, które w nowoczesny sposób promują polską kulturę i tradycję.";
  const do2 = "Działamy w trzech zespołach: design (modele i koncepcje), technicznym (digitalizacja i druk 3D) oraz marketingowym (promocja i kontakt z odbiorcami).";

  const grantUrl = "https://przedsiebiorczydzek.pl/polonia/";
  const story1 = "Naszą przygodę rozpoczęliśmy w październiku 2025 roku dzięki grantowi w ramach programu „Polonijna Akademia Przedsiębiorczości”, realizowanego w ramach sprawowania opieki Senatu RP nad Polonią i Polakami za granicą.";
  const story2 = "Polska Szkoła w Portland otrzymała w tym programie wsparcie na zakup drukarki 3D i materiałów, a od tego momentu wszystko, co tworzymy, jest efektem naszej własnej pracy, pomysłów i zaangażowania.";

  const proof1 = "Stworzyliśmy własne logo, identyfikację wizualną i stronę internetową, a pierwsze projekty przekształciliśmy w realne produkty wydrukowane na drukarce 3D.";
  const proof2 = "Naszym pierwszym publicznym debiutem był Kiermasz Świąteczny w Domu Polskim w Portland (14 grudnia 2025), gdzie zaprezentowaliśmy nasze produkty społeczności polonijnej.";
  const filmUrl = "https://drive.google.com/file/d/1CjcY98qUJZJ6O_3KZs7hobXbc50QWoRm/view?usp=sharing";

  const next1 = "To dopiero początek. W planach mamy uruchomienie sklepu internetowego oraz obecność na Polskim Festiwalu w Portland (Oregon).";
  const contact = `
Kontakt:<br>
<a href="mailto:info.pol3d@gmail.com">info.pol3d@gmail.com</a><br>
<a href="mailto:szkolapolskapdx@gmail.com">szkolapolskapdx@gmail.com</a>
`;

  const close1 = "Dziękujemy za chwilę uwagi i życzymy spokojnych, radosnych Świąt oraz wszystkiego dobrego w Nowym Roku.";
  const sign = "Zespół POL3D — Polska w trzech wymiarach\n przy Polish Cultural Enrichment Program at PLBA - Polska Szkola\nPortland, Oregon";

  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.55; color:#111;">
    <h2 style="margin:0 0 10px 0;">Serdeczne życzenia od zespołu POL3D</h2>
    <p style="margin:0 0 10px 0;">${escapeHtml(senderNote)}</p>
    <p style="margin:0 0 14px 0;">Cieszymy się, że możemy uczestniczyć w dzieleniu się życzeniami. Życzymy Wesołych Świąt i Szczęśliwego Nowego Roku.</p>

    <div style="margin:14px 0 18px 0; padding:12px 14px; border:1px solid #e7e7e7; border-radius:12px; background:#fafafa;">
      <p style="margin:0 0 8px 0;"><b>${escapeHtml(ctaLine1)}</b></p>
      <p style="margin:0;">${escapeHtml(ctaLine2)}</p>
    </div>

    <h3 style="margin:18px 0 8px 0;">Kim jesteśmy</h3>
    <p style="margin:0 0 8px 0;">${escapeHtml(about1)}</p>
    <p style="margin:0 0 8px 0;">${escapeHtml(about2)}</p>

    <h3 style="margin:18px 0 8px 0;">Co robimy</h3>
    <p style="margin:0 0 8px 0;">${escapeHtml(do1)}</p>
    <p style="margin:0 0 8px 0;">${escapeHtml(do2)}</p>

    <h3 style="margin:18px 0 8px 0;">Jak to się zaczęło</h3>
    <p style="margin:0 0 8px 0;">${escapeHtml(story1)}</p>
    <p style="margin:0 0 8px 0;">${escapeHtml(story2)} <a href="${grantUrl}">${grantUrl}</a></p>

    <h3 style="margin:18px 0 8px 0;">Pierwsze kroki i debiut</h3>
    <p style="margin:0 0 8px 0;">${escapeHtml(proof1)}</p>
    <p style="margin:0 0 8px 0;">${escapeHtml(proof2)}</p>
    <p style="margin:0 0 8px 0;">🎥 Obejrzyj nasz pierwszy Film promocyjny: <a href="${filmUrl}">${filmUrl}</a></p>

    <h3 style="margin:18px 0 8px 0;">Co dalej</h3>
    <p style="margin:0 0 8px 0;">${escapeHtml(next1)}</p>
    <p style="margin:0 0 18px 0;">📩 ${escapeHtml(contact)}</p>

    <p style="margin:0 0 8px 0;">${escapeHtml(close1)}</p>
    <p style="margin:0; white-space:pre-line;"><b>${escapeHtml(sign)}</b></p>
  </div>
  `.trim();

  const text = [
    "Serdeczne życzenia od zespołu POL3D",
    "",
    senderNote,
    "Cieszymy się, że możemy uczestniczyć w dzieleniu się życzeniami. Życzymy Wesołych Świąt i Szczęśliwego Nowego Roku.",
    "",
    ctaLine1,
    ctaLine2,
    "",
    "Kim jesteśmy",
    about1,
    about2,
    "",
    "Co robimy",
    do1,
    do2,
    "",
    "Jak to się zaczęło",
    story1,
    story2 + " " + grantUrl,
    "",
    "Dowód działania",
    proof1,
    proof2,
    "Film (placeholder): " + filmUrl,
    "",
    "Co dalej",
    next1,
    contact,
    "",
    close1,
    sign,
  ].join("\n");

  // Resend API: https://api.resend.com/emails
  // attachments[].content = base64 (bez data:image/png;base64,)
  const payload = {
    from,
    to,
    subject,
    html,
    text,
    attachments: [
      {
        filename: safeName,
        content: b64,
        content_type: contentType,
      },
    ],
  };

  if (replyTo) payload.reply_to = replyTo;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const dataText = await res.text().catch(() => "");
    let data;
    try {
      data = JSON.parse(dataText || "{}");
    } catch {
      data = { raw: dataText };
    }

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { ...JSON_HEADERS, ...cors },
        body: JSON.stringify({
          ok: false,
          error: "Resend API error",
          status: res.status,
          details: data,
          hint:
            "Jeśli widzisz 403 validation_error: sprawdź RESEND_FROM (musi być adresem w zweryfikowanej domenie Resend).",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...JSON_HEADERS, ...cors },
      body: JSON.stringify({ ok: true, id: data?.id || null, details: data }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...JSON_HEADERS, ...cors },
      body: JSON.stringify({
        ok: false,
        error: "Server error while sending email.",
        message: err?.message || String(err),
      }),
    };
  }
};
