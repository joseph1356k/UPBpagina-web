/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  Invitation email template registry                                 ║
 * ╚════════════════════════════════════════════════════════════════════╝
 *
 * Each event selects a template (ceremonies.email_template); invitations
 * render through `renderInvitation(key, vars)`. All templates share one
 * variable contract, so adding a design = adding one entry here — no
 * changes anywhere else.
 *
 * Deliberate v1 constraints (security > flexibility):
 *   · Predesigned templates only — admins SELECT, they don't author HTML.
 *     Email HTML is an injection/phishing surface; an upload/editor path
 *     needs sanitization + preview infra we don't want to improvise.
 *   · Every dynamic value passes through escapeHtml().
 *   · Photo is optional: templates render a clean layout without it.
 *
 * Email-client rules honored here: tables for layout, inline styles only,
 * no external CSS, fixed photo dimensions, border-radius degrades
 * gracefully in Outlook (square photo — acceptable).
 */

export interface InvitationTemplateVars {
  /** Guest receiving the pass. */
  guestFirstName: string;
  /** Participant (graduate/host/organizer) who invited them. */
  participantName: string;
  /** Optional public photo URL of the participant. */
  participantPhotoUrl: string | null;
  /** e.g. "te ha invitado a acompañarle en su ceremonia de grado". */
  invitePhrase: string;
  eventName: string;
  /** Display label of the event type ("Ceremonia de grado", "Conferencia"…). */
  eventTypeLabel: string;
  dateLong: string;
  time: string;
  venue: string;
  /** Link to the digital pass page (renders the QR). */
  invitationUrl: string;
  supportEmail: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

interface TemplateDef {
  key: string;
  name: string;
  description: string;
  render: (vars: InvitationTemplateVars) => RenderedEmail;
}

/* ────────────────────────────────────────────────────────────────────
   Shared helpers
   ──────────────────────────────────────────────────────────────────── */

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]!);
}

function textBody(v: InvitationTemplateVars): string {
  return (
    `Hola ${v.guestFirstName},\n\n` +
    `${v.participantName} ${v.invitePhrase}.\n\n` +
    `${v.eventName}\n` +
    `Fecha: ${v.dateLong} a las ${v.time}\n` +
    `Lugar: ${v.venue}\n\n` +
    `Tu pase de ingreso (con QR) está aquí:\n${v.invitationUrl}\n\n` +
    `Guarda este enlace. Lo necesitarás el día del evento.\n\n` +
    `— Universidad Pontificia Bolivariana`
  );
}

function photoBlock(v: InvitationTemplateVars, ringColor: string): string {
  if (!v.participantPhotoUrl) return "";
  return `
    <tr><td align="center" style="padding:0 32px;">
      <img src="${escapeHtml(v.participantPhotoUrl)}" alt="${escapeHtml(v.participantName)}"
           width="96" height="96"
           style="width:96px;height:96px;border-radius:48px;object-fit:cover;
                  border:3px solid ${ringColor};display:block;" />
    </td></tr>`;
}

function ctaButton(url: string, label: string, bg: string): string {
  return `
    <p style="text-align:center;margin:0 0 24px;">
      <a href="${escapeHtml(url)}"
         style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;
                padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
        ${label}
      </a>
    </p>`;
}

function footer(supportEmail: string): string {
  return `
    <tr><td style="background:#faf7f2;padding:18px 32px;font-size:11px;color:#999;text-align:center;border-top:1px solid #f0e8d8;">
      Universidad Pontificia Bolivariana · Circular 1 #70-01, Medellín<br>
      ¿Preguntas? Escríbenos a <a href="mailto:${escapeHtml(supportEmail)}" style="color:#A6192E;text-decoration:none;">${escapeHtml(supportEmail)}</a>
    </td></tr>`;
}

function wrap(inner: string): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,0.04);overflow:hidden;">
        ${inner}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/* ────────────────────────────────────────────────────────────────────
   Template: Clásica institucional
   Neutral, sober. Works for conferences, business and institutional
   events. Red header band, no ornament.
   ──────────────────────────────────────────────────────────────────── */

function renderClasica(v: InvitationTemplateVars): RenderedEmail {
  const subject = `Tu invitación · ${v.eventName}`;
  const html = wrap(`
    <tr><td style="background:#A6192E;padding:20px 32px;">
      <p style="margin:0;font-size:11px;color:#ffffffcc;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
        Universidad Pontificia Bolivariana
      </p>
      <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:18px;color:#ffffff;font-weight:600;">
        ${escapeHtml(v.eventTypeLabel)}
      </p>
    </td></tr>
    ${photoBlock({ ...v }, "#A6192E").replace('style="padding:0 32px;"', 'style="padding:24px 32px 0;"')}
    <tr><td style="padding:24px 32px 32px;">
      <h1 style="font-family:Georgia,serif;font-size:22px;color:#1a1a1a;margin:0 0 8px;">
        Hola ${escapeHtml(v.guestFirstName)},
      </h1>
      <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.55;">
        <strong style="color:#1a1a1a;">${escapeHtml(v.participantName)}</strong>
        ${escapeHtml(v.invitePhrase)}.
      </p>
      <div style="background:#faf7f2;border:1px solid #eee;padding:18px 22px;border-radius:10px;
                  margin:24px 0;font-size:14px;color:#333;line-height:1.6;">
        <p style="margin:0 0 6px;font-weight:bold;color:#1a1a1a;">${escapeHtml(v.eventName)}</p>
        <p style="margin:0;color:#555;">📅 ${escapeHtml(v.dateLong)} · ${escapeHtml(v.time)}</p>
        <p style="margin:0;color:#555;">📍 ${escapeHtml(v.venue)}</p>
      </div>
      <p style="margin:0 0 24px;color:#555;font-size:14px;">
        Tu pase de ingreso con código QR está disponible aquí:
      </p>
      ${ctaButton(v.invitationUrl, "Ver mi pase de ingreso", "#A6192E")}
      <p style="margin:0;color:#999;font-size:12px;line-height:1.55;">
        Guarda este enlace. Lo necesitarás el día del evento. El pase es
        personal y solo permite un ingreso.
      </p>
    </td></tr>
    ${footer(v.supportEmail)}
  `);
  return { subject, html, text: textBody(v) };
}

/* ────────────────────────────────────────────────────────────────────
   Template: Elegante ceremonial
   Serif-forward, gold ribbon, generous spacing. Default for
   graduations, also fits galas and formal catering.
   ──────────────────────────────────────────────────────────────────── */

function renderElegante(v: InvitationTemplateVars): RenderedEmail {
  const subject = `Tu invitación a ${v.eventName}`;
  const html = wrap(`
    <tr><td style="height:5px;background:linear-gradient(90deg,#A6192E,#E8B931,#A6192E);"></td></tr>
    <tr><td align="center" style="padding:30px 32px 6px;">
      <p style="margin:0;font-size:11px;color:#888;letter-spacing:3px;text-transform:uppercase;font-weight:600;">
        Universidad Pontificia Bolivariana
      </p>
      <p style="margin:6px 0 0;font-family:Georgia,serif;font-size:14px;color:#A6192E;font-style:italic;">
        ${escapeHtml(v.eventTypeLabel)}
      </p>
    </td></tr>
    ${photoBlock(v, "#E8B931").replace('style="padding:0 32px;"', 'style="padding:18px 32px 0;"')}
    <tr><td align="center" style="padding:18px 40px 0;">
      <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1a1a;margin:0 0 6px;font-weight:600;">
        ${escapeHtml(v.participantName)}
      </h1>
      <p style="margin:0 0 18px;color:#555;font-size:15px;line-height:1.6;">
        ${escapeHtml(v.invitePhrase)}
      </p>
      <p style="margin:0;color:#1a1a1a;font-family:Georgia,serif;font-size:17px;">
        ${escapeHtml(v.eventName)}
      </p>
    </td></tr>
    <tr><td align="center" style="padding:18px 40px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
        <tr>
          <td style="padding:0 18px;border-right:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:10px;color:#999;letter-spacing:1.5px;text-transform:uppercase;">Fecha</p>
            <p style="margin:4px 0 0;font-size:13px;color:#1a1a1a;">${escapeHtml(v.dateLong)}</p>
          </td>
          <td style="padding:0 18px;border-right:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:10px;color:#999;letter-spacing:1.5px;text-transform:uppercase;">Hora</p>
            <p style="margin:4px 0 0;font-size:13px;color:#1a1a1a;">${escapeHtml(v.time)}</p>
          </td>
          <td style="padding:0 18px;text-align:center;">
            <p style="margin:0;font-size:10px;color:#999;letter-spacing:1.5px;text-transform:uppercase;">Lugar</p>
            <p style="margin:4px 0 0;font-size:13px;color:#1a1a1a;">${escapeHtml(v.venue)}</p>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:22px 40px 30px;">
      <p style="margin:0 0 18px;color:#555;font-size:14px;">
        Hola ${escapeHtml(v.guestFirstName)}, tu pase personal de ingreso está listo:
      </p>
      ${ctaButton(v.invitationUrl, "Ver mi pase de ingreso", "#A6192E")}
      <p style="margin:0;color:#999;font-size:12px;line-height:1.55;">
        El pase es personal e intransferible · solo permite un ingreso.
      </p>
    </td></tr>
    ${footer(v.supportEmail)}
  `);
  return { subject, html, text: textBody(v) };
}

/* ────────────────────────────────────────────────────────────────────
   Template: Moderna neutra
   Clean and compact, dark header, minimal copy. Fits talks, workshops,
   sports and tech-leaning events.
   ──────────────────────────────────────────────────────────────────── */

function renderModerna(v: InvitationTemplateVars): RenderedEmail {
  const subject = `Pase de ingreso · ${v.eventName}`;
  const html = wrap(`
    <tr><td style="background:#1a1a1a;padding:22px 32px;">
      <p style="margin:0;font-size:12px;color:#E8B931;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
        ${escapeHtml(v.eventTypeLabel)}
      </p>
      <p style="margin:6px 0 0;font-size:19px;color:#ffffff;font-weight:600;">
        ${escapeHtml(v.eventName)}
      </p>
      <p style="margin:8px 0 0;font-size:13px;color:#ffffffb3;">
        ${escapeHtml(v.dateLong)} · ${escapeHtml(v.time)} · ${escapeHtml(v.venue)}
      </p>
    </td></tr>
    ${photoBlock(v, "#1a1a1a").replace('style="padding:0 32px;"', 'style="padding:24px 32px 0;"')}
    <tr><td style="padding:24px 32px 30px;">
      <p style="margin:0 0 14px;color:#1a1a1a;font-size:15px;line-height:1.6;">
        Hola <strong>${escapeHtml(v.guestFirstName)}</strong> —
        ${escapeHtml(v.participantName)} ${escapeHtml(v.invitePhrase)}.
      </p>
      ${ctaButton(v.invitationUrl, "Abrir mi pase QR", "#1a1a1a")}
      <p style="margin:0;color:#999;font-size:12px;line-height:1.55;">
        Funciona desde el celular, en captura de pantalla o impreso.
        Un solo ingreso por pase.
      </p>
    </td></tr>
    ${footer(v.supportEmail)}
  `);
  return { subject, html, text: textBody(v) };
}

/* ────────────────────────────────────────────────────────────────────
   Registry
   ──────────────────────────────────────────────────────────────────── */

export const EMAIL_TEMPLATES: readonly TemplateDef[] = [
  {
    key: "clasica",
    name: "Clásica institucional",
    description: "Sobria y neutra. Conferencias, reuniones y eventos institucionales.",
    render: renderClasica,
  },
  {
    key: "elegante",
    name: "Elegante ceremonial",
    description: "Formal con detalles dorados. Grados, galas y eventos de etiqueta.",
    render: renderElegante,
  },
  {
    key: "moderna",
    name: "Moderna neutra",
    description: "Compacta y directa. Charlas, talleres y eventos deportivos.",
    render: renderModerna,
  },
] as const;

export const EMAIL_TEMPLATE_KEYS = EMAIL_TEMPLATES.map((t) => t.key) as [
  string,
  ...string[],
];

const TEMPLATES_BY_KEY = new Map(EMAIL_TEMPLATES.map((t) => [t.key, t]));

/** Render an invitation with the given template. Unknown keys fall back
 *  to "clasica" so a stale DB value can never break sending. */
export function renderInvitation(
  templateKey: string | null | undefined,
  vars: InvitationTemplateVars,
): RenderedEmail {
  const tpl = TEMPLATES_BY_KEY.get(templateKey ?? "") ?? TEMPLATES_BY_KEY.get("clasica")!;
  return tpl.render(vars);
}
