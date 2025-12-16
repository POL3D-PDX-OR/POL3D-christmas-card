// netlify/functions/send-card.mjs

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function json(statusCode, obj) {
  return new Response(JSON.stringify(obj, null, 2), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

function asTextSafe(v) {
  return String(v ?? "").trim();
}

/* ==========================================================
   JEDYNE MIEJSCE DO EDYCJI TREŚCI E-MAILA
   ========================================================== */
function buildEmail({ senderName }) {
  const subject = "🎄 Świąteczna kartka od POL3D";

  const intro = senderName
    ? `Otrzymałeś tę kartkę, ponieważ <b>${escapeHtml(senderName)}</b> postanowił(a) podzielić się z Tobą świątecznymi życzeniami.`
    : `Otrzymałeś tę kartkę, ponieważ ktoś bliski postanowił podzielić się z Tobą świątecznymi życzeniami.`;

  const filmUrl = "https://drive.google.com/file/d/1CjcY98qUJZJ6O_3KZs7hobXbc50QWoRm/view?usp=sharing";
  const grantUrl = "https://przedsiebiorczydzek.pl/polonia/";

  const html = `<!doctype html>
<html lang="pl">
<body style="font-family:system-ui,Segoe UI,Arial,sans-serif;background:#f6f6f6;padding:24px;">
  <div style="max-width:720px;margin:auto;background:#ffffff;border-radius:14px;padding:24px;">

    <h2>Serdeczne życzenia od zespołu POL3D</h2>

    <p>${intro}</p>

    <p>Cieszymy się, że możemy uczestniczyć w dzieleniu się życzeniami i dobrem.
    Życzymy Wesołych Świąt oraz wszystkiego najlepszego w Nowym Roku.</p>

    <p><b>📎 Otwórz załączoną kartkę PNG</b>, aby zobaczyć świąteczne życzenia.</p>

    <p>Chcesz wysłać własną kartkę?
    Wejdź na <a href="https://pol3d.com">pol3d.com</a>, ułóż własną kartkę,
    dodaj tekst, naklejki i zdjęcia — i wyślij ją dalej.</p>

    <hr />

    <h3>POL3D — Polska w trzech wymiarach</h3>

    <p>POL3D to grupa polskich nastolatków działająca przy Polskiej Szkole w Portland (Oregon, USA),
    powstała jako inicjatywa młodych przedsiębiorców.</p>

    <p>Projektujemy i wykonujemy gadżety oraz upominki 3D promujące polską kulturę i tradycję.
    Działamy w zespołach design, technicznym (druk 3D) oraz marketingowym.</p>

    <p>Naszą przygodę rozpoczęliśmy w październiku 2025 roku dzięki grantowi
    <a href="${grantUrl}">Polonijna Akademia Przedsiębiorczości</a>.
    Polska Szkoła w Portland otrzymała środki na zakup drukarki 3D i materiałów.</p>

    <p>Pierwsza prezentacja naszych produktów odbyła się podczas
    Kiermaszu Świątecznego w Domu Polskim w Portland (14 grudnia 2025).
    <br />🎥 <a href="${filmUrl}">Zobacz film</a></p>

    <p>To dopiero początek — realizujemy zamówienia indywidualne i planujemy sklep online.
    Kontakt: <a href="mailto:info.pol3d@gmail.com">info.pol3d@gmail.com</a></p>

    <p><b>Zespół POL3D — Portland, Oregon</b></p>
  </div>
</body>
</html>`;

  const text = `Serdeczne życzenia od zespołu POL3D

${senderName ? `Kartkę przesyła: ${senderName}` : "Kartkę przesłała osoba bliska."}

Otwórz załączoną kartkę PNG, aby zobaczyć życzenia.

Chcesz stworzyć własną kartkę? Wejdź na https://pol3d.com

POL3D — Polska w trzech wymiarach
Portland, Oregon
Kontakt: info.pol3d@gmail.com`;

  return { subject, html, text };
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

export default async (req) => {
  try {
    if (req.method === "OPTIONS") return json(200, { ok: true });
    if (req.method !== "POST") return json(405, { error: "Method Not Allowed" });

    const from = asTextSafe(process.env.RESEND_FROM);
    if (!from) {
      return json(500, { error: "Brak RESEND_FROM (np. POL3D <kartka@pol3d.com>)" });
    }

    const body = await req.json();
    const to = asTextSafe(body.to);
    const base64 = asTextSafe(body.base64);
    const filename = body.filename || "POL3D_kartka.png";

    if (!to || !base64) return json(400, { error: "Brak danych wejściowych." });

    const buffer = Buffer.from(base64, "base64");
    const { subject, html, text } = buildEmail({ senderName: body.senderName });

    const result = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      text,
      attachments: [{ filename, content: buffer, contentType: "image/png" }],
    });

    return json(200, { ok: true, result });
  } catch (err) {
    return json(500, { ok: false, error: err.message || String(err) });
  }
};
