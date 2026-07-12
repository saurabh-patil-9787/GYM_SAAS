const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  return await resend.emails.send({
    from: "Majhi Gym <support@majhigym.com>",
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
