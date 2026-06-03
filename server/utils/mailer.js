const nodemailer = require('nodemailer');

let transporter;

const buildFromAddress = () => {
    const configuredFrom = process.env.MAIL_FROM;
    const mailUser = process.env.MAIL_USER;

    if (!configuredFrom) return mailUser;

    const trimmed = configuredFrom.trim();
    if (trimmed.endsWith('<') && mailUser) {
        return `${trimmed}${mailUser}>`;
    }

    return trimmed;
};

const getTransporter = () => {
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT) || 465,
        secure: String(process.env.MAIL_SECURE).toLowerCase() !== 'false',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });

    return transporter;
};

const sendVerificationCodeEmail = async ({ to, name, code }) => {
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
        throw new Error('Mail service is not configured');
    }

    const appName = 'SportsSphere';
    const safeName = name || 'there';

    await getTransporter().sendMail({
        from: buildFromAddress(),
        to,
        subject: `${appName} email verification code`,
        text: `Hi ${safeName},\n\nYour ${appName} verification code is ${code}.\n\nThis code expires in 10 minutes. If you did not request this, you can ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
                <h2 style="margin: 0 0 12px;">Verify your SportsSphere email</h2>
                <p>Hi ${safeName},</p>
                <p>Use this code to finish creating your account:</p>
                <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 20px 0;">${code}</p>
                <p>This code expires in 10 minutes.</p>
                <p style="color: #6b7280; font-size: 13px;">If you did not request this, you can ignore this email.</p>
            </div>
        `
    });
};

module.exports = {
    sendVerificationCodeEmail
};
