import { createTransport } from "nodemailer";
const smtpHost = process.env.SMTP_HOST || "smtp-relay.brevo.com";
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
// Create a transporter using SMTP
const transporter = createTransport(smtpUser.endsWith("@gmail.com") && !process.env.SMTP_HOST
    ? {
        service: "gmail",
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    }
    : {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });
const sendEmail = async ({ to, subject, body }) => {
    const sender = process.env.SENDER_EMAIL || process.env.SMTP_USER || "";
    const formattedFrom = sender.includes("<")
        ? sender
        : `"Apna Bazar" <${sender}>`;
    return await transporter.sendMail({
        from: formattedFrom,
        to,
        subject,
        html: body,
    });
};
export default sendEmail;
