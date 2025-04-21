import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';

dotenv.config();

// create transporter object with smtp server details
const transporter = nodemailer.createTransport({
    host: process.env.MAILHOST,
    port: Number(process.env.MAILPORT),
    auth: {
        user: process.env.MAILUSER,
        pass: process.env.MAILPWD,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

transporter.use(
    'compile',
    hbs({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        viewEngine: {
            layoutsDir: path.join(__dirname, './mail-templates/layouts'),
            defaultLayout: 'index',
        },
        viewPath: path.join(__dirname, './mail-templates/'),
    })
);

export default transporter;
