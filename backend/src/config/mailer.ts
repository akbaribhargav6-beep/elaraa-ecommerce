import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env';

let transporterPromise: Promise<Transporter> | null = null;

// Uses real SMTP credentials if provided; otherwise auto-provisions a fully
// working Ethereal test-SMTP account on first use (no user secrets needed,
// emails genuinely send and are viewable via the logged inbox URL).
//
// Only reached when RESEND_API_KEY isn't set — real SMTP is left in place
// for local dev (no outbound-port restrictions there), but most PaaS hosts
// block outbound SMTP entirely (Railway confirmed: ports 25/465/587 all
// time out), so this branch alone can never deliver mail in production.
function createTransporter(): Promise<Transporter> {
  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      connectionTimeout: 10_000,
      socketTimeout: 10_000,
    });
    console.log(`✓ Mailer configured with real SMTP host ${env.SMTP_HOST}`);
    return Promise.resolve(transporter);
  }

  return nodemailer.createTestAccount().then((testAccount) => {
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
      connectionTimeout: 10_000,
      socketTimeout: 10_000,
    });
    console.log('✓ Mailer configured with Ethereal test SMTP (dev sandbox)');
    console.log(`  Inbox: https://ethereal.email  (user: ${testAccount.user})`);
    return transporter;
  });
}

function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }
  return transporterPromise;
}

// Resend accepts the same "Name <email@domain>" combined format as SMTP's
// `from` field, so env.MAIL_FROM works unchanged for both paths.
async function sendViaResend(opts: { to: string; subject: string; html: string; text?: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { id: string };
  console.log(`✉ Email sent via Resend — id: ${data.id}`);
  return data;
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
  if (env.RESEND_API_KEY) {
    return sendViaResend(opts);
  }

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: env.MAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`✉ Email sent — preview: ${previewUrl}`);
  }
  return info;
}
