const nodemailer = require('nodemailer');

let transporter;

const parseBoolean = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    return String(value).toLowerCase() === 'true';
};

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

    const port = Number(process.env.MAIL_PORT) || 587;
    const secure = parseBoolean(process.env.MAIL_SECURE, port === 465);
    const family = Number(process.env.MAIL_IP_FAMILY) || 4;

    console.log('[Mailer] Creating SMTP transport', {
        host: process.env.MAIL_HOST,
        port,
        secure,
        requireTLS: !secure,
        user: process.env.MAIL_USER,
        from: buildFromAddress(),
        family,
        connectionTimeout: Number(process.env.MAIL_CONNECTION_TIMEOUT) || 15000,
        greetingTimeout: Number(process.env.MAIL_GREETING_TIMEOUT) || 10000,
        socketTimeout: Number(process.env.MAIL_SOCKET_TIMEOUT) || 20000,
        hasPassword: Boolean(process.env.MAIL_PASS)
    });

    transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port,
        secure,
        requireTLS: !secure,
        connectionTimeout: Number(process.env.MAIL_CONNECTION_TIMEOUT) || 15000,
        greetingTimeout: Number(process.env.MAIL_GREETING_TIMEOUT) || 10000,
        socketTimeout: Number(process.env.MAIL_SOCKET_TIMEOUT) || 20000,
        family,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });

    return transporter;
};

const sendVerificationCodeEmail = async ({ to, name, code }) => {
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.error('[Mailer] Missing SMTP configuration', {
            hasHost: Boolean(process.env.MAIL_HOST),
            hasUser: Boolean(process.env.MAIL_USER),
            hasPassword: Boolean(process.env.MAIL_PASS),
            hasFrom: Boolean(process.env.MAIL_FROM)
        });
        throw new Error('Mail service is not configured');
    }

    const appName = 'SportsSphere';
    const safeName = name || 'there';

    try {
        console.log('[Mailer] Sending verification email', {
            to,
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT) || 587,
            secure: parseBoolean(process.env.MAIL_SECURE, (Number(process.env.MAIL_PORT) || 587) === 465)
        });

        const info = await getTransporter().sendMail({
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

        console.log('[Mailer] Verification email accepted', {
            to,
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
            response: info.response
        });
    } catch (error) {
        console.error('[Mailer] Verification email failed', {
            to,
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT) || 587,
            secure: parseBoolean(process.env.MAIL_SECURE, (Number(process.env.MAIL_PORT) || 587) === 465),
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            response: error.response,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

module.exports = {
    sendVerificationCodeEmail
};
