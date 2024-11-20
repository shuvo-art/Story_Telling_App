const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const sendEmail = asyncHandler(async (data) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MP,
    },
  });

  await transporter.sendMail({
    from: `"Support" <${process.env.MAIL_ID}>`,
    to: data.to,
    subject: data.subject,
    text: data.text,
  });
});

module.exports = { sendEmail };
