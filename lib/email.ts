/**
 * Email sender via Resend.
 *
 * Falls back to console.log when RESEND_API_KEY is not set, so local
 * development without an API key still completes the OTP/invitation
 * flow (you just read the code from the terminal).
 */

import "server-only";

import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "UPB Ceremonias <ceremonias@upb.edu.co>";
const API_KEY = process.env.RESEND_API_KEY;
const TEST_REDIRECT = process.env.RESEND_TEST_REDIRECT?.trim() || null;

let _client: Resend | null = null;
function client(): Resend | null {
  if (!API_KEY) return null;
  if (_client) return _client;
  _client = new Resend(API_KEY);
  return _client;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(args: SendArgs): Promise<{ id: string }> {
  const c = client();

  if (!c) {
    // Dev fallback — no Resend key configured
    console.warn(
      "[email] RESEND_API_KEY not set — logging instead of sending:",
    );
    console.warn(`  to:      ${args.to}`);
    console.warn(`  subject: ${args.subject}`);
    console.warn(`  text:    ${args.text ?? "(html-only)"}`);
    return { id: `dev_${Date.now()}` };
  }

  // Test mode: redirect every send to a single mailbox so Resend's
  // "you can only send to your own email" restriction (free tier without
  // verified domain) doesn't break the flow. The original recipient is
  // injected into the subject so testers can tell who it was for.
  const recipient = TEST_REDIRECT ?? args.to;
  const subject = TEST_REDIRECT
    ? `[→ ${args.to}] ${args.subject}`
    : args.subject;

  if (TEST_REDIRECT) {
    console.warn(
      `[email] TEST_REDIRECT active — sending to ${TEST_REDIRECT} instead of ${args.to}`,
    );
  }

  const { data, error } = await c.emails.send({
    from: FROM,
    to: [recipient],
    subject,
    html: args.html,
    text: args.text,
  });
  if (error) {
    throw new Error(`[email] Resend send failed: ${error.message}`);
  }
  return { id: data?.id ?? "" };
}

/* ────────────────────────────────────────────────────────────────────
   Templates
   ──────────────────────────────────────────────────────────────────── */

export function otpEmailTemplate(args: {
  graduateName: string;
  code: string;
  ttlMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = `Tu código de acceso · UPB Ceremonias`;
  const text =
    `Hola ${args.graduateName.split(" ")[0]},\n\n` +
    `Tu código de acceso es: ${args.code}\n\n` +
    `Vence en ${args.ttlMinutes} minutos. Nunca compartas este código.\n\n` +
    `Si no solicitaste este acceso, ignora este correo.\n\n` +
    `— Universidad Pontificia Bolivariana`;
  const html = baseEmailFrame(`
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#1a1a1a;margin:0 0 8px;">
      Hola ${escapeHtml(args.graduateName.split(" ")[0])},
    </h1>
    <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.55;">
      Usa el siguiente código de un solo uso para acceder al portal de invitados:
    </p>
    <div style="background:#fff7e6;border:1px solid #E8B931;padding:18px 24px;border-radius:10px;
                font-family:'Courier New',monospace;font-size:34px;letter-spacing:8px;font-weight:bold;
                color:#A6192E;text-align:center;margin:24px 0;">
      ${args.code}
    </div>
    <p style="margin:0 0 8px;color:#666;font-size:13px;line-height:1.55;">
      Este código vence en <strong>${args.ttlMinutes} minutos</strong> y solo puede usarse una vez.
    </p>
    <p style="margin:0;color:#999;font-size:12px;line-height:1.55;">
      Si no solicitaste este acceso, ignora este correo.
    </p>
  `);
  return { subject, html, text };
}

export function invitationEmailTemplate(args: {
  guestFirstName: string;
  graduateFullName: string;
  ceremonyName: string;
  ceremonyDate: string;
  ceremonyTime: string;
  ceremonyVenue: string;
  invitationUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Tu invitación a la ceremonia de grado de ${args.graduateFullName.split(" ")[0]}`;
  const text =
    `Hola ${args.guestFirstName},\n\n` +
    `${args.graduateFullName} te ha invitado a su ceremonia de grado.\n\n` +
    `Fecha: ${args.ceremonyDate} a las ${args.ceremonyTime}\n` +
    `Lugar: ${args.ceremonyVenue}\n\n` +
    `Tu pase de ingreso (con QR) está aquí:\n` +
    `${args.invitationUrl}\n\n` +
    `Guarda este enlace. Lo necesitarás el día de la ceremonia.\n\n` +
    `— Universidad Pontificia Bolivariana`;
  const html = baseEmailFrame(`
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#1a1a1a;margin:0 0 8px;">
      Hola ${escapeHtml(args.guestFirstName)},
    </h1>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.55;">
      <strong style="color:#1a1a1a;">${escapeHtml(args.graduateFullName)}</strong>
      te ha invitado a acompañarle en su ceremonia de grado.
    </p>
    <div style="background:#faf7f2;border:1px solid #eee;padding:18px 22px;border-radius:10px;
                margin:24px 0;font-size:14px;color:#333;line-height:1.6;">
      <p style="margin:0 0 6px;font-weight:bold;color:#1a1a1a;">${escapeHtml(args.ceremonyName)}</p>
      <p style="margin:0;color:#555;">📅 ${escapeHtml(args.ceremonyDate)} · ${escapeHtml(args.ceremonyTime)}</p>
      <p style="margin:0;color:#555;">📍 ${escapeHtml(args.ceremonyVenue)}</p>
    </div>
    <p style="margin:0 0 24px;color:#555;font-size:14px;">
      Tu pase de ingreso con código QR está disponible aquí:
    </p>
    <p style="text-align:center;margin:0 0 24px;">
      <a href="${args.invitationUrl}"
         style="display:inline-block;background:#A6192E;color:#fff;text-decoration:none;
                padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
        Ver mi pase de ingreso
      </a>
    </p>
    <p style="margin:0;color:#999;font-size:12px;line-height:1.55;">
      Guarda este enlace. Lo necesitarás el día de la ceremonia. El QR funciona incluso sin conexión a internet.
    </p>
  `);
  return { subject, html, text };
}

export function invitationsSentConfirmationTemplate(args: {
  graduateName: string;
  ceremonyName: string;
  guests: Array<{ name: string; email: string | null }>;
}): { subject: string; html: string; text: string } {
  const first = args.graduateName.split(" ")[0];
  const subject = `Confirmación: ${args.guests.length} invitación${args.guests.length !== 1 ? "es" : ""} enviada${args.guests.length !== 1 ? "s" : ""} · UPB Ceremonias`;
  const listText = args.guests
    .map((g) => `  · ${g.name}${g.email ? ` (${g.email})` : " — sin correo, entrégale el pase manualmente"}`)
    .join("\n");
  const text =
    `Hola ${first},\n\n` +
    `Confirmamos el envío de las invitaciones para tu ceremonia ` +
    `"${args.ceremonyName}":\n\n${listText}\n\n` +
    `Cada invitado recibió un correo con su pase QR personal. ` +
    `Recuérdales revisar la carpeta de spam si no lo ven.\n\n` +
    `— Universidad Pontificia Bolivariana`;
  const listHtml = args.guests
    .map(
      (g) => `
      <li style="padding:6px 0;border-bottom:1px solid #f0ece4;">
        <strong style="color:#1a1a1a;">${escapeHtml(g.name)}</strong>
        ${
          g.email
            ? `<span style="color:#777;font-size:13px;"> · ${escapeHtml(g.email)}</span>`
            : `<span style="color:#A6192E;font-size:13px;"> · sin correo — comparte su pase manualmente</span>`
        }
      </li>`,
    )
    .join("");
  const html = baseEmailFrame(`
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#1a1a1a;margin:0 0 8px;">
      Invitaciones enviadas ✓
    </h1>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.55;">
      Hola ${escapeHtml(first)}, confirmamos el envío de los pases para
      <strong style="color:#1a1a1a;">${escapeHtml(args.ceremonyName)}</strong>:
    </p>
    <ul style="list-style:none;margin:0 0 20px;padding:0;font-size:14px;">
      ${listHtml}
    </ul>
    <p style="margin:0;color:#999;font-size:12px;line-height:1.55;">
      Cada invitado recibió un correo con su código QR personal. Si alguno no
      lo encuentra, pídele revisar la carpeta de spam — o entra a tu portal
      para reenviar la invitación.
    </p>
  `);
  return { subject, html, text };
}

export function welcomeGraduateEmailTemplate(args: {
  graduateName: string;
  ceremonyName: string;
  ceremonyDate: string;
  ceremonyTime: string;
  ceremonyVenue: string;
  maxGuests: number;
  registrationClosesAt: string;
  portalUrl: string;
}): { subject: string; html: string; text: string } {
  const first = args.graduateName.split(" ")[0];
  const subject = `Registra a tus invitados · Ceremonia de grado UPB`;
  const text =
    `Hola ${first},\n\n` +
    `¡Felicitaciones por tu grado! Ya puedes registrar a tus invitados ` +
    `para la ceremonia.\n\n` +
    `Ceremonia: ${args.ceremonyName}\n` +
    `Fecha: ${args.ceremonyDate} a las ${args.ceremonyTime}\n` +
    `Lugar: ${args.ceremonyVenue}\n` +
    `Cupo: hasta ${args.maxGuests} invitados\n` +
    `Fecha límite de registro: ${args.registrationClosesAt}\n\n` +
    `Ingresa con tu número de documento aquí:\n${args.portalUrl}\n\n` +
    `Cada invitado recibirá un código QR personal por correo — ese es su ` +
    `pase de ingreso el día de la ceremonia.\n\n` +
    `— Universidad Pontificia Bolivariana`;
  const html = baseEmailFrame(`
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#1a1a1a;margin:0 0 8px;">
      ¡Felicitaciones, ${escapeHtml(first)}! 🎓
    </h1>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.55;">
      Tu ceremonia de grado está programada y ya puedes registrar a las
      personas que te acompañarán.
    </p>
    <div style="background:#faf7f2;border:1px solid #eee;padding:18px 22px;border-radius:10px;
                margin:24px 0;font-size:14px;color:#333;line-height:1.6;">
      <p style="margin:0 0 6px;font-weight:bold;color:#1a1a1a;">${escapeHtml(args.ceremonyName)}</p>
      <p style="margin:0;color:#555;">📅 ${escapeHtml(args.ceremonyDate)} · ${escapeHtml(args.ceremonyTime)}</p>
      <p style="margin:0;color:#555;">📍 ${escapeHtml(args.ceremonyVenue)}</p>
      <p style="margin:8px 0 0;color:#555;">👥 Cupo: hasta <strong>${args.maxGuests} invitados</strong></p>
      <p style="margin:0;color:#A6192E;font-size:13px;">⏰ Registra antes del ${escapeHtml(args.registrationClosesAt)}</p>
    </div>
    <p style="text-align:center;margin:0 0 24px;">
      <a href="${args.portalUrl}"
         style="display:inline-block;background:#A6192E;color:#fff;text-decoration:none;
                padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
        Registrar mis invitados
      </a>
    </p>
    <p style="margin:0;color:#999;font-size:12px;line-height:1.55;">
      Ingresarás con tu número de documento — te enviaremos un código de
      verificación a este correo. Cada invitado recibirá su pase QR personal.
    </p>
  `);
  return { subject, html, text };
}

function baseEmailFrame(body: string): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,0.04);overflow:hidden;">
        <!-- Brand bar with gold ribbon -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#A6192E,#E8B931,#A6192E);"></td></tr>
        <tr><td style="padding:24px 32px 0;">
          <p style="margin:0;font-size:11px;color:#888;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
            Universidad Pontificia Bolivariana
          </p>
          <p style="margin:2px 0 0;font-family:Georgia,serif;font-size:15px;color:#1a1a1a;font-weight:600;">
            Ceremonia de grado
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px 32px;">${body}</td></tr>
        <tr><td style="background:#faf7f2;padding:18px 32px;font-size:11px;color:#999;text-align:center;border-top:1px solid #f0e8d8;">
          Universidad Pontificia Bolivariana · Circular 1 #70-01, Medellín<br>
          ¿Preguntas? Escríbenos a <a href="mailto:ceremonias@upb.edu.co" style="color:#A6192E;text-decoration:none;">ceremonias@upb.edu.co</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]!);
}
