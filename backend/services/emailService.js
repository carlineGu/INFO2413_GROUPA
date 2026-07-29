const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendVerificationEmail(email, fullName, verificationLink) {
  await transporter.sendMail({
    from: `"Campus Marketplace" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your Campus Marketplace account",
    text: `
Hello ${fullName},

Please verify your Campus Marketplace account by opening this link:

${verificationLink}

This link expires in 30 days.

If you did not create this account, you can ignore this email.
    `,
    html: `
      <h2>Verify your account</h2>

      <p>Hello ${fullName},</p>

      <p>
        Please verify your Campus Marketplace account by clicking the
        button below.
      </p>

      <p>
        <a
          href="${verificationLink}"
          style="
            display:inline-block;
            padding:12px 20px;
            background:#000;
            color:#fff;
            text-decoration:none;
          "
        >
          Verify email
        </a>
      </p>

      <p>This link expires in 30 days.</p>

      <p>
        If you did not create this account, you can ignore this email.
      </p>
    `
  });
}

module.exports = {
  sendVerificationEmail
};