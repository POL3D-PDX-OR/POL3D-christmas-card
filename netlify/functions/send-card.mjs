// netlify/functions/send-card.mjs
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Ustaw w Netlify -> Site settings -> Environment variables
// RESEND_API_KEY=...
// RESEND_FROM="POL3D <kartka@send.pol3d.com>"  (musi być domena zweryfikowana w Resend)

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

function buildEmail({ senderName }) {
  const subject =
    "🎄 Świąteczna kartka od POL3D — młodej polonijnej inicjatywy z Portland";

  const friendLine = senderName
    ? `Otrzymałeś tę kartkę, ponieważ <b>${escapeHtml(senderName)}</b> postanowił(a) złożyć Ci świąteczne życzenia za naszym pośrednictwem.`
    : `Otrzymałeś tę kartkę, ponieważ ktoś bliski postanowił złożyć Ci świąteczne życzenia za naszym pośrednictwem.`;

  // Placeholder do filmu – zgodnie z Twoją prośbą (wymienisz sam później)
  const filmUrl =
    "https://drive.google.com/file/d/1CjcY98qUJZJ6O_3KZs7hobXbc50QWoRm/view?usp=sharing";

  const grantUrl = "https://przedsiebiorczydzek.pl/polonia/";

  const html = `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;background:#f6f6f6;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1f2937;">
  <div style="max-width:720px;margin:0 auto;padding:22px;">
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
      <div style="padding:22px 22px 10px 22px;">
        <div style="font-size:20px;font-weight:800;line-height:1.25;">
          Serdeczne życzenia od zespołu POL3D
        </div>
        <div style="margin-top:10px;font-size:14px;line-height:1.6;color:#374151;">
          ${friendLine}
          <br/><br/>
          Cieszymy się, że możemy uczestniczyć w dzieleniu się życzeniami — i życzymy Wesołych Świąt oraz Szczęśliwego Nowego Roku!
        </div>

        <div style="margin-top:16px;padding:14px 14px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;">
          <div style="font-weight:700;">📎 Co zrobić teraz</div>
          <div style="margin-top:8px;font-size:14px;line-height:1.6;color:#374151;">
            Otwórz załączoną kartkę PNG, aby zobaczyć świąteczne życzenia.<br/>
            A potem — wejdź na <a href="https://pol3d.com" style="color:#0b5fff;text-decoration:none;font-weight:700;">POL3D.com</a> i stwórz własną kartkę:
            dodaj tekst, naklejki i zdjęcie, a następnie wyślij ją dalej do swoich bliskich.
          </div>
        </div>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0;"/>

        <div style="font-size:16px;font-weight:800;">POL3D — Polska w trzech wymiarach</div>
        <div style="margin-top:8px;font-size:14px;line-height:1.7;color:#374151;">
          POL3D to grupa polskich nastolatków działająca przy Polskiej Szkole w Portland (Oregon, USA),
          powstała jako inicjatywa młodych przedsiębiorców.
          Wspólnie tworzymy projekty, które rozwijają nasze umiejętności, kreatywność
          i zaangażowanie w życie lokalnej Polonii.
        </div>

        <div style="margin-top:10px;font-size:14px;line-height:1.7;color:#374151;">
          Projektujemy i wykonujemy gadżety oraz upominki 3D, które w nowoczesny sposób promują polską kulturę i tradycję.
          Działamy w trzech zespołach: <b>design</b> (projektowanie modeli i koncepcji),
          <b>technicznym</b> (digitalizacja i druk 3D) oraz <b>marketingowym</b> (promocja i kontakt z odbiorcami).
        </div>

        <div style="margin-top:12px;font-size:14px;line-height:1.7;color:#374151;">
          Naszą przygodę rozpoczęliśmy w październiku 2025 roku, od uzyskania grantu w ramach programu
          „Polonijna Akademia Przedsiębiorczości” (<a href="${grantUrl}" style="color:#0b5fff;text-decoration:none;">${grantUrl}</a>),
          realizowanego w ramach sprawowania opieki Senatu RP nad Polonią i Polakami za granicą.
          Polska Szkoła w Portland otrzymała grant na zakup drukarki 3D i materiałów do pracy.
          Od tego momentu wszystko, co tworzymy, jest efektem naszej własnej pracy, pomysłów i zaangażowania.
        </div>

        <div style="margin-top:12px;font-size:14px;line-height:1.7;color:#374151;">
          Stworzyliśmy własne logo, identyfikację wizualną i stronę internetową,
          a pierwsze projekty przekształciliśmy w realne produkty wydrukowane na drukarce 3D.
          Naszym pierwszym publicznym występem był Kiermasz Świąteczny w Domu Polskim w Portland (14 grudnia 2025),
          gdzie zaprezentowaliśmy gotowe produkty społeczności polonijnej.
          <br/>
          🎥 Film (placeholder): <a href="${filmUrl}" style="color:#0b5fff;text-decoration:none;">zobacz materiał</a>
        </div>

        <div style="margin-top:12px;font-size:14px;line-height:1.7;color:#374151;">
          To dopiero początek. Już dziś realizujemy indywidualne, personalizowane zamówienia 3D,
          a w planach mamy uruchomienie sklepu internetowego oraz obecność na Polskim Festiwalu w Portland (Oregon).
          <br/>
          📩 Kontakt: <a href="mailto:info.pol3d@gmail.com" style="color:#0b5fff;text-decoration:none;">info.pol3d@gmail.com</a>
        </div>

        <div style="margin-top:18px;font-size:14px;line-height:1.7;color:#111827;font-weight:700;">
          Dziękujemy za chwilę uwagi i życzymy spokojnych, radosnych Świąt oraz wszystkiego dobrego w Nowym Roku.
        </div>

        <div style="margin-top:10px;font-size:13px;line-height:1.6;color:#6b7280;">
          Zespół POL3D — Polska w trzech wymiarach<br/>
          Portland, Oregon
        </div>
      </div>

      <div style="padding:14px 22px;background:#0b1220;color:#cbd5e1;font-size:12px;line-height:1.5;">
        Ten e-mail został wysłany przez narzędzie POL3D do tworzenia kartek świątecznych.
        Jeśli chcesz stworzyć własną kartkę: <a href="https://pol3d.com" style="color:#93c5fd;text-decoration:none;font-weight:700;">pol3d.com</a>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = [
    "Serdeczne życzenia od zespołu POL3D",
    "",
    senderName
      ? `Otrzymałeś tę kartkę, ponieważ ${senderName} postanowił(a) złożyć Ci świąteczne życzenia za naszym pośrednictwem.`
      : "Otrzymałeś tę kartkę, ponieważ ktoś bliski postanowił złożyć Ci świąteczne życzenia za naszym pośrednictwem.",
    "Cieszymy się, że możemy uczestniczyć w dzieleniu się życzeniami — i życzymy Wesołych Świąt oraz Szczęśliwego Nowego Roku!",
    "",
    "Co zrobić teraz:",
    "- Otwórz załączoną kartkę PNG, aby zobaczyć życzenia.",
    "- Wejdź na https://pol3d.com i stwórz własną kartkę: dodaj tekst, naklejki i zdjęcie, a potem wyślij dalej.",
    "",
    "POL3D — Polska w trzech wymiarach",
    "POL3D to grupa polskich nastolatków działająca przy Polskiej Szkole w Portland (Oregon, USA) — inicjatywa młodych przedsiębiorców.",
    "",
    "Rozpoczęliśmy w październiku 2025 roku dzięki grantowi „Polonijna Akademia Przedsiębiorczości”: https://przedsiebiorczydzek.pl/polonia/",
    "Polska Szkoła w Portland otrzymała grant na zakup drukarki 3D i materiałów do pracy.",
    "",
    "Nasz pierwszy publiczny występ: Kiermasz Świąteczny w Domu Polskim w Portland (14 grudnia 2025).",
    "Film (placeholder): " + filmUrl,
    "",
    "Kontakt: info.pol3d@gmail.com",
    "",
    "Zespół POL3D — Portland, Oregon",
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}

export default async (req) => {
  try {
    if (req.method === "OPTIONS") return json(200, { ok: true });
    if (req.method !== "POST") return json(405, { error: "Method Not Allowed" });

    const from = asTextSafe(process.env.RESEND_FROM);
    if (!from) {
      return json(500, {
        error:
          "Brak zmiennej środowiskowej RESEND_FROM. Ustaw np. 'POL3D <kartka@send.pol3d.com>'.",
      });
    }

    const body = await req.json().catch(() => null);
    if (!body) return json(400, { error: "Niepoprawny JSON." });

    const to = asTextSafe(body.to);
    const filename = asTextSafe(body.filename) || "POL3D_kartka.png";
    const mime = asTextSafe(body.mime) || "image/png";
    const base64 = asTextSafe(body.base64);

    // Opcjonalnie (jeśli dodasz na froncie): senderName = fromField
    const senderName = asTextSafe(body.senderName);

    if (!to) return json(400, { error: "Brak pola 'to'." });
    if (!base64) return json(400, { error: "Brak pola 'base64'." });

    // Dekodujemy base64 do Buffer – to jest najczęstszy powód, że „działało, a potem przestało”.
    let fileBuf;
    try {
      fileBuf = Buffer.from(base64, "base64");
    } catch (e) {
      return json(400, { error: "Nie udało się zdekodować base64." });
    }

    const { subject, html, text } = buildEmail({ senderName });

    const result = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      text,
      attachments: [
        {
          filename,
          content: fileBuf, // Buffer
          contentType: mime, // ważne: contentType (nie content_type)
        },
      ],
    });

    return json(200, { ok: true, result });
  } catch (err) {
    // Resend często zwraca czytelny błąd w err.message
    return json(500, {
      ok: false,
      error: err?.message || String(err),
    });
  }
};
