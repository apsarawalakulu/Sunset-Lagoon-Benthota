const RESEND_API_URL = "https://api.resend.com/emails";

function getApiKey(): string {
  return process.env["RESEND_API_KEY"] ?? "";
}

export function getAdminEmail(): string {
  return process.env["ADMIN_NOTIFICATION_EMAIL"] || "sunsetlagoon.boats@gmail.com";
}

export function getFromAddress(): string {
  return process.env["EMAIL_FROM"] || "Sunset Lagoon <bookings@sunsetlagoon.boats>";
}

export function isEmailConfigured(): boolean {
  return getApiKey() !== "";
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string | undefined;
}

export async function sendEmail(input: SendEmailInput): Promise<{ id: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Email service is not configured. Set RESEND_API_KEY in your .env file.");
  }
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: Array.isArray(input.to) ? input.to : [input.to],
      reply_to: input.replyTo,
      subject: input.subject,
      html: input.html,
    }),
  });
  let json: { id?: string; message?: string } | null = null;
  try {
    json = (await res.json()) as { id?: string; message?: string };
  } catch {
    json = null;
  }
  if (!res.ok || !json?.id) {
    throw new Error(json?.message || `Email send failed (HTTP ${res.status}).`);
  }
  return { id: json.id };
}

const BRAND = {
  forest: "#2E3B33",
  forestDark: "#1F2A25",
  gold: "#C29A5B",
  bronze: "#96702F",
  sand: "#E8E1D1",
  paper: "#F5F1E6",
  ink: "#2A2A26",
  muted: "#6B6B64",
};

function shell(title: string, preheader: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:${BRAND.paper};font-family:Georgia,'Times New Roman',serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.paper};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5ddc9;">
<tr><td style="background-color:${BRAND.forest};padding:28px 32px;text-align:center;">
<div style="color:${BRAND.gold};font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Sunset Lagoon Boat House · Bentota</div>
<div style="color:${BRAND.sand};font-size:24px;margin-top:8px;">${title}</div>
</td></tr>
<tr><td style="padding:32px;color:${BRAND.ink};font-size:15px;line-height:1.7;">${body}</td></tr>
<tr><td style="background-color:${BRAND.forestDark};padding:20px 32px;text-align:center;color:${BRAND.sand};font-size:12px;font-family:Arial,Helvetica,sans-serif;">
Bentota · Sri Lanka<br><span style="color:${BRAND.gold};">Discover the beauty of Bentota from the water.</span>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr><td style="padding:8px 0;color:${BRAND.muted};font-size:12px;text-transform:uppercase;letter-spacing:1px;font-family:Arial,Helvetica,sans-serif;width:38%;">${label}</td><td style="padding:8px 0;font-weight:bold;">${value}</td></tr>`;
}

export interface BookingEmailData {
  booking_reference: string;
  experience: string;
  booking_date: string;
  preferred_time: string;
  duration?: string | null;
  number_of_guests: number;
  full_name: string;
  country: string;
  phone: string;
  email: string | null;
  special_request: string | null;
}

const esc = (v: string | null | undefined): string =>
  String(v ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function bookingAdminAlertHtml(b: BookingEmailData): string {
  const body = `
<p style="margin:0 0 16px;">A new booking request just came in from the website:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.paper};border-radius:8px;padding:8px 20px;margin:0 0 20px;">
${detailRow("Reference", `<span style="font-family:monospace;font-size:17px;color:${BRAND.bronze};">${esc(b.booking_reference)}</span>`)}
${detailRow("Experience", esc(b.experience))}
${detailRow("Date", esc(b.booking_date))}
${detailRow("Safari time", esc(b.preferred_time))}
${detailRow("Guests", esc(String(b.number_of_guests)))}
${detailRow("Name", esc(b.full_name))}
${detailRow("Country", esc(b.country))}
${detailRow("Phone", esc(b.phone))}
${detailRow("Email", esc(b.email))}
${detailRow("Requests", esc(b.special_request))}
</table>
<p style="margin:0;">Review it in the <a href="/admin/bookings" style="color:${BRAND.bronze};">bookings panel</a> and confirm or reply to the guest.</p>`;
  return shell("New Booking Request", `New booking ${b.booking_reference} from ${b.full_name}`, body);
}

export function bookingGuestConfirmedHtml(b: BookingEmailData): string {
  const body = `
<p style="margin:0 0 16px;">Dear ${esc(b.full_name)},</p>
<p style="margin:0 0 16px;">Great news — your safari with <strong>Sunset Lagoon Boat House</strong> is <strong style="color:${BRAND.bronze};">confirmed</strong>. We look forward to welcoming you onto the Bentota River.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.paper};border-radius:8px;padding:8px 20px;margin:0 0 20px;">
${detailRow("Reference", `<span style="font-family:monospace;font-size:17px;color:${BRAND.bronze};">${esc(b.booking_reference)}</span>`)}
${detailRow("Experience", esc(b.experience))}
${detailRow("Date", esc(b.booking_date))}
${detailRow("Safari time", esc(b.preferred_time))}
${detailRow("Guests", esc(String(b.number_of_guests)))}
</table>
<p style="margin:0;">Please arrive a few minutes early. If your plans change, just reply to this email or message us on WhatsApp.</p>`;
  return shell("Booking Confirmed", `Your safari ${b.booking_reference} is confirmed`, body);
}

export function bookingGuestCancelledHtml(b: BookingEmailData, reason?: string | null): string {
  const body = `
<p style="margin:0 0 16px;">Dear ${esc(b.full_name)},</p>
<p style="margin:0 0 16px;">We are sorry to let you know that booking <strong style="font-family:monospace;">${esc(b.booking_reference)}</strong> (${esc(b.experience)} on ${esc(b.booking_date)}) has been <strong>cancelled</strong>${reason ? ` — ${esc(reason)}` : ""}. Please reply to this email if you would like to rebook for another date.</p>`;
  return shell("Booking Cancelled", `Booking ${b.booking_reference} was cancelled`, body);
}

export function contactAdminAlertHtml(c: {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
}): string {
  const body = `
<p style="margin:0 0 16px;">New contact message from the website:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.paper};border-radius:8px;padding:8px 20px;margin:0 0 20px;">
${detailRow("Name", esc(c.name))}
${detailRow("Email", esc(c.email))}
${detailRow("Phone", esc(c.phone))}
${detailRow("Subject", esc(c.subject))}
</table>
<p style="margin:0 0 8px;font-weight:bold;">Message</p>
<p style="margin:0;background-color:${BRAND.paper};border-radius:8px;padding:16px 20px;white-space:pre-wrap;">${esc(c.message)}</p>`;
  return shell("New Contact Message", `New message from ${c.name}`, body);
}
