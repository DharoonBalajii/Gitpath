import { Resend } from 'resend';

// Initialize Resend with the provided API key
const resend = new Resend(process.env.RESEND_API_KEY || 're_RV5je658_AxTNGjUHaUS5wg4xVWcsCF7d');

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>', // Replace with your verified domain
      to: [to],
      subject: subject,
      html: html,
    });
    
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
