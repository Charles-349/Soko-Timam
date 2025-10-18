import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (
  email: string,
  subject: string,
  message: string,
  html?: string
) => {
  try {
    const result = await resend.emails.send({
      from: "Soko Timam <onboarding@resend.dev>", 
      to: email,
      subject,
      text: message,
      html: html || `<p>${message}</p>`,
    });

    console.log("📨 Email result:", result);
    return { success: true, result };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, message: error.message };
  }
};
