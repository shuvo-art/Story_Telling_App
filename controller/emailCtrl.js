/* const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const sendEmail = asyncHandler(async (data) => {
  try {
    console.log("Email Configuration:", {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      authUser: process.env.MAIL_ID,
      authPass: process.env.MP ? "[REDACTED]" : "MISSING",
    });

    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // Use 587 for TLS
      secure: false, // Must be false for port 587
      auth: {
        user: process.env.MAIL_ID,
        pass: process.env.MP,
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
      tls: {
        rejectUnauthorized: false, // Optional: for testing
      },
    });

    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("SMTP server connection verified successfully");

    const mailOptions = {
      from: `"Support" <${process.env.MAIL_ID}>`,
      to: data.to,
      subject: data.subject,
      text: data.text,
    };
    console.log("Sending email with options:", mailOptions);

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", {
      messageId: info.messageId,
      response: info.response,
    });
    return info;
  } catch (error) {
    console.error("Error sending email:", {
      error: error.message,
      stack: error.stack,
      code: error.code,
      command: error.command,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
});

module.exports = { sendEmail };
 */


const sgMail = require('@sendgrid/mail');
const asyncHandler = require("express-async-handler");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = asyncHandler(async (data) => {
  try {
    const msg = {
      to: data.to,
      from: process.env.MAIL_ID,
      subject: data.subject,
      text: data.text,
    };
    console.log("Sending email with SendGrid options:", msg);

    const info = await sgMail.send(msg);
    console.log("Email sent successfully via SendGrid:", info);
    return info;
  } catch (error) {
    console.error("Error sending email via SendGrid:", {
      error: error.message,
      response: error.response ? error.response.body : null,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
});

module.exports = { sendEmail };