/**
 * Netlify Function: send-card
 * Receives JSON: { to, filename, mime, base64 }
 * Sends an email with the PNG attached via Resend API.
 *
 * Env vars required:
 * - RESEND_API_KEY
 * - FROM_EMAIL   (must be a sender you configured/verified in Resend)
 *
 * Optional env vars:
 * - EMAIL_SUBJECT
 * - EMAIL_TEXT
 * - MAX_B64_BYTES (default ~5MB)
 */
export async function handler(event) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };
  }

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL;
    if (!apiKey || !from) {
      return { statusCode: 500, headers: corsHeaders, body: "Missing RESEND_API_KEY or FROM_EMAIL in environment." };
    }

    const payload = JSON.parse(event.body || "{}");
    const to = String(payload.to || "").trim();
    const filename = String(payload.filename || "POL3D_kartka.png").trim();
    const mime = String(payload.mime || "image/png").trim();
    const base64 = String(payload.base64 || "").trim();

    // Basic validation
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return { statusCode: 400, headers: corsHeaders, body: "Invalid 'to' email." };
    }
    if (!base64 || base64.length < 100) {
      return { statusCode: 400, headers: corsHeaders, body: "Missing/empty base64 attachment." };
    }
    // Size limit (roughly base64 chars ≈ bytes*1.37)
    const maxBytes = parseInt(process.env.MAX_B64_BYTES || "5242880", 10); // 5 MB raw approx
    const approxBytes = Math.floor(base64.length * 0.75); // base64 chars -> bytes
    if (approxBytes > maxBytes) {
      return { statusCode: 413, headers: corsHeaders, body: "Attachment too large." };
    }

    const subject = process.env.EMAIL_SUBJECT || "POL3D — kartka świąteczna";
    const text = process.env.EMAIL_TEXT || "W załączniku znajdziesz kartkę świąteczną POL3D w formacie PNG.";

    const resendBody = {
      from,
      to: [to],
      subject,
      text,
      attachments: [
        {
          filename,
          content: base64, // Resend expects base64
          content_type: mime,
        },
      ],
    };

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendBody),
    });

    const respText = await resp.text();
    if (!resp.ok) {
      return { statusCode: 502, headers: corsHeaders, body: respText || "Email provider error." };
    }

    return { statusCode: 200, headers: corsHeaders, body: respText || "{}" };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: String(err?.message || err) };
  }
}
