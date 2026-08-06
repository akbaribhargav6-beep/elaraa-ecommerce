import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env';

let transporterPromise: Promise<Transporter> | null = null;

// Uses real SMTP credentials if provided; otherwise auto-provisions a fully
// working Ethereal test-SMTP account on first use (no user secrets needed,
// emails genuinely send and are viewable via the logged inbox URL).
function createTransporter(): Promise<Transporter> {
  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
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

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
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
