import { sendEmail } from "../mailer/mailer";

export const sendTestEmailService = async (email: string) => {
  const subject = "Test Email from Render Deployment";
  const message = "This is a plain text test email.";
  const html = `<h2>Hello from Render!</h2>
                <p>This is a <b>test email</b> sent using your Gmail SMTP setup.</p>`;

  return await sendEmail(email, subject, message, html);
};
