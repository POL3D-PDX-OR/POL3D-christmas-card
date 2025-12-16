/**
 * Netlify Function: /.netlify/functions/send-card
 * Wysyła e-mail z załącznikiem PNG przez Resend.
 *
 * Wymagane ENV:
 * - RESEND_API_KEY = re_HMunkuKn_AMmaEnfCsLmXqnLuska7ynWj
 *
 * Opcjonalne ENV:
 * - RESEND_FROM = np. "Kartka POL3D <kartka@pol3d.com>"  (MUSI być w zweryfikowanej domenie w Resend)
 * - RESEND_REPLY_TO = np. "info.pol3d@gmail.com"
 * - RESEND_SUBJECT = np. "POL3D — Twoja kartka świąteczna"
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

  // UWAGA: To jest kluczowy punkt dla Twojego 403.
  // FROM musi być adresem w ZWERYFIKOWANEJ domenie Resend (np. @pol3d.com).
  const from =
    process.env.RESEND_FROM ||
    "Kartka POL3D <kartka@pol3d.com>"; // <- jeśli Twoja zweryfikowana domena to inna (np. send.pol3d.com), zmień w ENV RESEND_FROM

  const replyTo = process.env.RESEND_REPLY_TO || undefined;
  const subject =
    process.env.RESEND_SUBJECT || "POL3D — Twoja kartka świąteczna";

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

  // Zbuduj treść maila (prosto, skutecznie)
  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.45;">
    <h2 style="margin: 0 0 10px 0;">POL3D — kartka świąteczna</h2>
    <p style="margin: 0 0 14px 0;">W załączniku znajdziesz wygenerowaną kartkę PNG.</p>
    <p style="margin: 0; color:#444;">Wesołych Świąt życzy zespół POL3D!</p>
  </div>
  `.trim();

  const text = `POL3D — kartka świąteczna

W załączniku znajdziesz wygenerowaną kartkę PNG.

Wesołych Świąt życzy zespół POL3D!`;

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
    try { data = JSON.parse(dataText || "{}"); } catch { data = { raw: dataText }; }

    if (!res.ok) {
      // To właśnie pokaże, czy Resend nadal widzi złe FROM / domenę / itp.
      return {
        statusCode: res.status,
        headers: { ...JSON_HEADERS, ...cors },
        body: JSON.stringify({
          error: "Resend API error",
          status: res.status,
          details: data,
          hint:
            "Jeśli widzisz 403 validation_error: sprawdź RESEND_FROM (musi być @TwojaZweryfikowanaDomena).",
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
        error: "Server error while sending email.",
        message: err?.message || String(err),
      }),
    };
  }
};
