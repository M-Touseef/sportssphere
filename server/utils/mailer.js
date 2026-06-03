const nodemailer = require('nodemailer');

let transporter;

const parseBoolean = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    return String(value).toLowerCase() === 'true';
};

const getMailTransportSettings = () => {
    const port = Number(process.env.MAIL_PORT) || 587;
    let secure = parseBoolean(process.env.MAIL_SECURE, port === 465);

    if (port === 587 && secure) {
        console.warn('[Mailer] MAIL_SECURE=true is invalid for Gmail port 587. Using STARTTLS with secure=false.');
        secure = false;
    }

    return {
        port,
        secure,
        requireTLS: !secure,
        family: Number(process.env.MAIL_IP_FAMILY) || 4,
        connectionTimeout: Number(process.env.MAIL_CONNECTION_TIMEOUT) || 15000,
        greetingTimeout: Number(process.env.MAIL_GREETING_TIMEOUT) || 10000,
        socketTimeout: Number(process.env.MAIL_SOCKET_TIMEOUT) || 20000
    };
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

const extractEmailAddress = (address) => {
    const match = String(address || '').match(/<([^>]+)>/);
    return (match ? match[1] : address || '').trim();
};

const extractDisplayName = (address) => {
    const match = String(address || '').match(/^(.+?)\s*</);
    return match ? match[1].replace(/^"|"$/g, '').trim() : '';
};

const getEmailProvider = () => {
    if (process.env.EMAIL_PROVIDER) {
        return String(process.env.EMAIL_PROVIDER).toLowerCase();
    }

    if (process.env.SENDGRID_API_KEY) return 'sendgrid';
    if (process.env.RESEND_API_KEY) return 'resend';

    return 'smtp';
};

const getSmtpHost = () => {
    if (getEmailProvider() === 'gmail') {
        return process.env.MAIL_HOST || 'smtp.gmail.com';
    }

    return process.env.MAIL_HOST;
};

const buildVerificationEmail = ({ to, name, code }) => {
    const appName = 'SportsSphere';
    const safeName = name || 'there';

    return {
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
    };
};

const getTransporter = () => {
    if (transporter) return transporter;

    const settings = getMailTransportSettings();

    console.log('[Mailer] Creating SMTP transport', {
        host: getSmtpHost(),
        port: settings.port,
        secure: settings.secure,
        requireTLS: settings.requireTLS,
        user: process.env.MAIL_USER,
        from: buildFromAddress(),
        family: settings.family,
        connectionTimeout: settings.connectionTimeout,
        greetingTimeout: settings.greetingTimeout,
        socketTimeout: settings.socketTimeout,
        hasPassword: Boolean(process.env.MAIL_PASS)
    });

    transporter = nodemailer.createTransport({
        host: getSmtpHost(),
        port: settings.port,
        secure: settings.secure,
        requireTLS: settings.requireTLS,
        connectionTimeout: settings.connectionTimeout,
        greetingTimeout: settings.greetingTimeout,
        socketTimeout: settings.socketTimeout,
        family: settings.family,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });

    return transporter;
};

const sendWithResend = async (email) => {
    if (!process.env.RESEND_API_KEY) {
        console.error('[Mailer] Missing Resend configuration', {
            hasApiKey: Boolean(process.env.RESEND_API_KEY),
            hasFrom: Boolean(process.env.MAIL_FROM)
        });
        throw new Error('Mail service is not configured');
    }

    console.log('[Mailer] Sending verification email through Resend', {
        to: email.to,
        from: email.from,
        endpoint: 'https://api.resend.com/emails'
    });

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: email.from,
            to: [email.to],
            subject: email.subject,
            text: email.text,
            html: email.html
        })
    });

    const responseText = await response.text();
    let responseBody;

    try {
        responseBody = responseText ? JSON.parse(responseText) : {};
    } catch {
        responseBody = { raw: responseText };
    }

    if (!response.ok) {
        const error = new Error(responseBody.message || responseBody.error || 'Resend email request failed');
        error.code = 'RESEND_REQUEST_FAILED';
        error.responseCode = response.status;
        error.response = responseBody;
        throw error;
    }

    console.log('[Mailer] Resend verification email accepted', {
        to: email.to,
        id: responseBody.id
    });

    return responseBody;
};

const sendWithSendGrid = async (email) => {
    if (!process.env.SENDGRID_API_KEY) {
        console.error('[Mailer] Missing SendGrid configuration', {
            hasApiKey: Boolean(process.env.SENDGRID_API_KEY),
            hasFrom: Boolean(process.env.MAIL_FROM)
        });
        throw new Error('Mail service is not configured');
    }

    console.log('[Mailer] Sending verification email through SendGrid', {
        to: email.to,
        from: email.from,
        endpoint: 'https://api.sendgrid.com/v3/mail/send'
    });

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: [
                {
                    to: [{ email: email.to }]
                }
            ],
            from: {
                email: extractEmailAddress(email.from),
                name: extractDisplayName(email.from) || 'SportsSphere'
            },
            subject: email.subject,
            content: [
                {
                    type: 'text/plain',
                    value: email.text
                },
                {
                    type: 'text/html',
                    value: email.html
                }
            ]
        })
    });

    const responseText = await response.text();
    let responseBody;

    try {
        responseBody = responseText ? JSON.parse(responseText) : {};
    } catch {
        responseBody = { raw: responseText };
    }

    if (!response.ok) {
        const message = Array.isArray(responseBody.errors)
            ? responseBody.errors.map((item) => item.message).join('; ')
            : responseBody.message || responseBody.error || 'SendGrid email request failed';
        const error = new Error(message);
        error.code = 'SENDGRID_REQUEST_FAILED';
        error.responseCode = response.status;
        error.response = responseBody;
        throw error;
    }

    console.log('[Mailer] SendGrid verification email accepted', {
        to: email.to,
        status: response.status,
        messageId: response.headers.get('x-message-id')
    });

    return {
        status: response.status,
        messageId: response.headers.get('x-message-id'),
        response: responseBody
    };
};

const sendWithSmtp = async (email) => {
    if (!getSmtpHost() || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.error('[Mailer] Missing SMTP configuration', {
            hasHost: Boolean(getSmtpHost()),
            hasUser: Boolean(process.env.MAIL_USER),
            hasPassword: Boolean(process.env.MAIL_PASS),
            hasFrom: Boolean(process.env.MAIL_FROM)
        });
        throw new Error('Mail service is not configured');
    }

    const settings = getMailTransportSettings();

    console.log('[Mailer] Sending verification email through SMTP', {
        to: email.to,
        host: getSmtpHost(),
        port: settings.port,
        secure: settings.secure,
        requireTLS: settings.requireTLS
    });

    const info = await getTransporter().sendMail(email);

    console.log('[Mailer] SMTP verification email accepted', {
        to: email.to,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response
    });

    return info;
};

const sendVerificationCodeEmail = async ({ to, name, code }) => {
    const email = buildVerificationEmail({ to, name, code });
    const provider = getEmailProvider();

    try {
        console.log('[Mailer] Preparing verification email', {
            to: email.to,
            from: email.from,
            provider
        });

        if (provider === 'resend') {
            return await sendWithResend(email);
        }

        if (provider === 'sendgrid') {
            return await sendWithSendGrid(email);
        }

        if (provider === 'smtp' || provider === 'gmail') {
            return await sendWithSmtp(email);
        }

        console.error('[Mailer] Unsupported email provider', { provider });
        throw new Error('Mail service is not configured');
    } catch (error) {
        const settings = getMailTransportSettings();

        console.error('[Mailer] Verification email failed', {
            to: email.to,
            provider,
            host: getSmtpHost(),
            port: settings.port,
            secure: settings.secure,
            requireTLS: settings.requireTLS,
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
