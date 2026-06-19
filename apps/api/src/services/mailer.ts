import nodemailer from 'nodemailer';

type MailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function createTransport() {
  const host = process.env.SMTP_HOST;
  // If no SMTP host configured, use Ethereal-style preview (log only)
  if (!host) return null;

  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: false,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });
}

export async function sendMail(opts: MailOptions): Promise<void> {
  const transport = createTransport();

  if (!transport) {
    // Dev mode — log instead of sending
    console.log(`[MAIL] To: ${opts.to} | Subject: ${opts.subject}`);
    console.log(`[MAIL] ${opts.text}`);
    return;
  }

  await transport.sendMail({
    from: `"OBEY Platform" <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? opts.text,
  });
}
