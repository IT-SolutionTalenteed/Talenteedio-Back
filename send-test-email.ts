import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.MAILHOST,
    port: Number(process.env.MAILPORT),
    auth: {
        user: process.env.MAILUSER,
        pass: process.env.MAILPWD,
    },
});

async function sendTestEmail() {
    const info = await transporter.sendMail({
        from: process.env.MAILUSER,
        to: 'patricio.kendon@forliion.com',
        subject: 'Test',
        text: 'salut',
    });

    console.log('✅ Email envoyé:', info.messageId);
}

sendTestEmail().catch((err) => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
});
