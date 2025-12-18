// netlify/functions/send-card.mjs
// Resend email sender (ESM) — production-ready, no hardcoded placeholder copy.
// Uses ENV for subject/body; optionally accepts subject/html/text in request JSON.

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { ...JSON_HEADERS, ...corsHeaders },
    body: JSON.stringify(body),
  };
}

function isEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function safeStr(s, max = 5000) {
  if (typeof s !== "string") return "";
  const t = s.trim();
  return t.length > max ? t.slice(0, max) : t;
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: corsHeaders, body: "" };
    }
    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method not allowed" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    const replyTo = process.env.RESEND_REPLY_TO || undefined;

    if (!apiKey) return json(500, { ok: false, error: "Missing RESEND_API_KEY" });
    if (!from) return json(500, { ok: false, error: "Missing RESEND_FROM" });

    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { ok: false, error: "Invalid JSON body" });
    }

    const to = safeStr(payload.to, 320);
    const filename = safeStr(payload.filename || "kartka.png", 120) || "kartka.png";
    const mime = safeStr(payload.mime || "image/png", 120) || "image/png";
    const base64 = safeStr(payload.base64, 20_000_000); // allow big PNGs

    if (!isEmail(to)) return json(400, { ok: false, error: "Invalid recipient email" });
    if (!base64) return json(400, { ok: false, error: "Missing base64 attachment" });
    if (!/^image\/png$/i.test(mime)) {
      return json(400, { ok: false, error: "Only image/png is allowed" });
    }

    // Subject/body sources:
    // 1) request JSON fields (subject/html/text)
    // 2) ENV fields (MAIL_SUBJECT/MAIL_HTML/MAIL_TEXT)
    // 3) minimal neutral fallback (not “placeholder marketing”, just functional)
    const subject =
      safeStr(payload.subject, 200) ||
      safeStr(process.env.MAIL_SUBJECT, 200) ||
      "Kartka świąteczna";

    const html =
      safeStr(payload.html, 100_000) ||
      safeStr(process.env.MAIL_HTML, 100_000) ||
      "<p>W załączniku znajduje się kartka PNG.</p>";

    const text =
      safeStr(payload.text, 100_000) ||
      safeStr(process.env.MAIL_TEXT, 100_000) ||
      "W załączniku znajduje się kartka PNG.";

    const resendRequest = {
      from,
      to: [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      attachments: [
        {
          filename,
          content: base64,
          content_type: "image/png",
        },
      ],
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendRequest),
    });

    const dataText = await res.text().catch(() => "");
    let dataJson = null;
    try {
      dataJson = dataText ? JSON.parse(dataText) : null;
    } catch {
      // keep as text
    }

    if (!res.ok) {
      return json(res.status, {
        ok: false,
        error: "Resend API error",
        details: dataJson || dataText || `HTTP ${res.status}`,
      });
    }

    return json(200, { ok: true, result: dataJson || { raw: dataText } });
  } catch (err) {
    return json(500, {
      ok: false,
      error: "Server error",
      details: err?.message || String(err),
    });
  }
}
