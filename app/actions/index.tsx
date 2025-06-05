"use server";
import { createTransport } from "nodemailer";

// The email address you want to send from
const FROM_EMAIL = "tools@bluerobins.com";
const FROM_NAME = "Blue Robins Support"; // Display name for the sender

export async function sendEmail({
  to,
  subject,
  message,
}: {
  to: string;
  subject: string;
  message: string;
}) {
  try {
    // Validate inputs
    if (!to || !subject || !message) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Create a Nodemailer transporter using SMTP
    const transporter = createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // use SSL
      auth: {
        user: FROM_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD, // Use an app password instead of service account
      },
    });

    // Send the email
    console.log(`Sending email from ${FROM_NAME} <${FROM_EMAIL}> to ${to}...`);
    const info = await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`, // Format: "Display Name <email@example.com>"
      to,
      subject,
      html: `${message}`,
    });

    console.log("Email sent successfully:", info.messageId);
    return {
      success: true,
      data: { messageId: info.messageId },
    };
  } catch (error) {
    console.error("Error in sendEmail:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
