import nodemailer from 'nodemailer'

let transporterInstance: nodemailer.Transporter | null = null

export function getEmailTransporter() {
  if (!process.env.GMAIL_SMTP_USER || !process.env.GMAIL_SMTP_PASSWORD) {
    throw new Error('GMAIL_SMTP_USER and GMAIL_SMTP_PASSWORD environment variables are required')
  }

  if (!transporterInstance) {
    const port = parseInt(process.env.GMAIL_SMTP_PORT || '587', 10)
    const isSecurePort = port === 465
    const useSecure = process.env.GMAIL_SMTP_SECURE === 'true' || isSecurePort

    transporterInstance = nodemailer.createTransport({
      host: process.env.GMAIL_SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: useSecure,
      // For port 587 (STARTTLS), secure should be false but requireTLS true
      requireTLS: port === 587 || process.env.GMAIL_SMTP_REQUIRE_TLS === 'true',
      auth: {
        user: process.env.GMAIL_SMTP_USER,
        pass: process.env.GMAIL_SMTP_PASSWORD,
      },
    })
  }

  return transporterInstance
}

export async function sendEmail(options: { to: string; subject: string; html: string; from?: string }) {
  const transporter = getEmailTransporter()
  // Gmail requires the from address to match the authenticated user
  // It will overwrite any different from address, so we use the authenticated email
  const fromEmail = options.from || process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_SMTP_USER

  if (!fromEmail) {
    throw new Error('From email address is required. Set GMAIL_FROM_EMAIL or GMAIL_SMTP_USER environment variable')
  }

  return transporter.sendMail({
    from: fromEmail,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}
