const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const sendEmail = asyncHandler(async (data, req, res) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.MAIL_ID, // Ensure this is correct
      pass: process.env.MP, // Ensure this is correct
    },
  });

  // Send mail with defined transport object
  let info = await transporter.sendMail({
    from: `"Your Name" <${process.env.MAIL_ID}>`, // sender address
    to: data.to, // list of receivers
    subject: data.subject, // Subject line
    text: data.text, // plain text body
    html: data.htm, // html body
  });

  console.log("Message sent: %s", info.messageId);
});

module.exports = {
  sendEmail,
};
