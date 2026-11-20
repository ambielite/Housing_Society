const tls = require('node:tls');

const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 465;
const SMTP_TIMEOUT_MS = 20000;

// Corporate antivirus/proxy software may sign outbound TLS with a CA that is
// trusted by Windows but absent from Node's bundled Mozilla CA list. Include
// the OS trust store when this Node version exposes it, while retaining
// Node's normal public roots and strict certificate validation.
const getSmtpCaCertificates = () => {
    if (typeof tls.getCACertificates !== 'function') return undefined;
    return [...new Set([
        ...tls.getCACertificates('default'),
        ...tls.getCACertificates('system'),
    ])];
};

const encodeHeader = (value) => `=?UTF-8?B?${Buffer.from(String(value), 'utf8').toString('base64')}?=`;

const wrapBase64 = (value) => Buffer.from(String(value), 'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n') || '';

const extractMailbox = (value, settingName) => {
    const mailbox = String(value || '').match(/<\s*([^<>\s]+)\s*>/)?.[1] || String(value || '').trim();
    if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(mailbox)) {
        throw new Error(`${settingName} must contain a valid email address`);
    }
    return mailbox;
};

const openSmtpConnection = () => new Promise((resolve, reject) => {
    const ca = getSmtpCaCertificates();
    const socket = tls.connect({
        host: SMTP_HOST,
        port: SMTP_PORT,
        servername: SMTP_HOST,
        ...(ca?.length ? { ca } : {}),
    });
    socket.setEncoding('utf8');
    socket.setTimeout(SMTP_TIMEOUT_MS, () => socket.destroy(new Error('Gmail SMTP connection timed out')));

    let buffer = '';
    let responseLines = [];
    const responses = [];
    const waiters = [];
    let connected = false;
    let connectionError;

    const fail = (error) => {
        connectionError = error;
        if (!connected) {
            reject(error);
        }
        while (waiters.length) waiters.shift().reject(error);
        socket.destroy();
    };

    const deliverResponse = (response) => {
        const waiter = waiters.shift();
        if (waiter) waiter.resolve(response);
        else responses.push(response);
    };

    socket.on('data', (chunk) => {
        buffer += chunk;
        let lineEnd;
        while ((lineEnd = buffer.indexOf('\r\n')) !== -1) {
            const line = buffer.slice(0, lineEnd);
            buffer = buffer.slice(lineEnd + 2);
            responseLines.push(line);
            const match = line.match(/^(\d{3})([ -])/);
            if (match && match[2] === ' ') {
                deliverResponse({ code: Number(match[1]), lines: responseLines });
                responseLines = [];
            }
        }
    });
    socket.on('error', fail);
    socket.on('close', () => {
        if (waiters.length) fail(new Error('Gmail SMTP connection closed unexpectedly'));
    });
    socket.once('secureConnect', () => {
        connected = true;
        resolve({
            socket,
            readResponse: () => {
                if (connectionError) return Promise.reject(connectionError);
                if (responses.length) return Promise.resolve(responses.shift());
                return new Promise((responseResolve, responseReject) => waiters.push({ resolve: responseResolve, reject: responseReject }));
            },
            write: (data) => new Promise((writeResolve, writeReject) => {
                socket.write(data, 'utf8', (error) => error ? writeReject(error) : writeResolve());
            }),
        });
    });
});

const sendGmailSmtpEmail = async ({ to, from, username, appPassword, subject, message }) => {
    const recipient = extractMailbox(to, 'Email recipient');
    const sender = extractMailbox(from || username, 'EMAIL_FROM');
    const authPassword = String(appPassword).replace(/\s/g, '');
    if (!authPassword) throw new Error('GMAIL_SMTP_APP_PASSWORD is empty');

    const smtp = await openSmtpConnection();
    const expect = async (acceptedCodes, command) => {
        if (command) await smtp.write(`${command}\r\n`);
        const response = await smtp.readResponse();
        if (!acceptedCodes.includes(response.code)) {
            throw new Error(`Gmail SMTP rejected a command (${response.code}): ${response.lines.join(' ')}`);
        }
        return response;
    };

    try {
        await expect([220]);
        await expect([250], 'EHLO housing-society');
        await expect([334], 'AUTH LOGIN');
        await expect([334], Buffer.from(username, 'utf8').toString('base64'));
        await expect([235], Buffer.from(authPassword, 'utf8').toString('base64'));
        await expect([250], `MAIL FROM:<${sender}>`);
        await expect([250, 251], `RCPT TO:<${recipient}>`);
        await expect([354], 'DATA');

        const body = [
            `From: <${sender}>`,
            `To: <${recipient}>`,
            `Subject: ${encodeHeader(subject || 'Society notification')}`,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            wrapBase64(message || ''),
            '.',
            '',
        ].join('\r\n');
        await smtp.write(body);
        const sent = await expect([250]);
        await expect([221], 'QUIT').catch(() => {});
        return { success: true, channel: 'EMAIL', provider: 'GMAIL_SMTP', messageId: sent.lines.join(' ').match(/<([^>]+)>/)?.[1] };
    } finally {
        smtp.socket.destroy();
    }
};

const sendEmail = async (notification) => {
    if (!notification) throw new Error('Notification data is required');

    const username = process.env.GMAIL_SMTP_USER?.trim();
    const appPassword = process.env.GMAIL_SMTP_APP_PASSWORD?.trim();
    if (username && appPassword) {
        return sendGmailSmtpEmail({
            to: notification.email,
            // Use the authenticated mailbox as the sender to avoid Gmail
            // rejecting a leftover Resend address or an unapproved alias.
            from: username,
            username,
            appPassword,
            subject: notification.subject || notification.title || 'Society notification',
            message: notification.message,
        });
    }

    if (process.env.NODE_ENV !== 'development') {
        throw new Error('Email delivery is not configured. Set GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD.');
    }
    console.log('DEVELOPMENT EMAIL OTP', notification.email, notification.subject || notification.title || 'Notification', notification.message);
    return { success: true, channel: 'EMAIL', provider: 'DEVELOPMENT_CONSOLE', messageId: notification.id };
};

module.exports = { sendEmail };
