const nodemailer = require("nodemailer");
const { convert } = require("html-to-text");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAILTRANSPORTER_HOST,
    port: process.env.MAILTRANSPORTER_PORT,
    auth: {
      user: process.env.MAILTRANSPORTER_USERNAME,
      pass: process.env.MAILTRANSPORTER_PASSWORD,
    },
    debug: true,
    logger: true,
  });
};

// NOTE: Use for testing when in need to.
// if (process.env.NODE_ENV !== "production") {
//   createTransporter().verify(function (error, success) {
//     if (error) {
//       console.log("Mail Transporter", error);
//     } else {
//       console.log("Mail Transporter", success);
//     }
//   });
// }

exports.sendWelcome = async (user) => {
  const transporter = createTransporter();

  const htmlBody = `<p>Welcome <strong>${user.name.split(" ")[0]}
  </strong> to our web application.</p>`;

  try {
    await transporter.sendMail({
      from: process.env.MAILTRANSPORTER_FROM,
      to: user.email,
      subject: `Welcome New User`,
      html: htmlBody,
      text: convert(htmlBody),
    });
  } catch (error) {
    return error;
  }
};

exports.sendPasswordResetUrl = async (user, url) => {
  const transporter = createTransporter();

  const htmlBody = `<p>Please submit a PATCH request with your email and a new password (data: {email: ..., password: ...}) to this URL: ${url}. The URL is valid for 10 minutes only.</p>`;

  try {
    await transporter.sendMail({
      from: process.env.MAILTRANSPORTER_FROM,
      to: user.email,
      subject: `Your Password Reset URL`,
      html: htmlBody,
      text: convert(htmlBody),
    });
  } catch (error) {
    return error;
  }
};
