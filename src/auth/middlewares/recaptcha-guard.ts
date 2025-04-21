import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import axios from 'axios';

dotenv.config();

export default async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'production') {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;

        const captcha = req.headers['x-captcha-response'];

        if (!captcha) {
            console.error('Error verifying CAPTCHA: CAPTCHA missing');
            return res.status(400).json({ msg: 'CAPTCHA missing!' });
        }

        const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}`;

        try {
            const result = await axios.get(verificationURL);

            if (result?.data?.success) {
                return next();
            } else {
                return res.status(400).json({ success: false, message: 'CAPTCHA verification failed!' });
            }
        } catch (error) {
            res.status(500).json({ msg: 'Internal server error!' });
            throw error;
        }
    } else {
        return next();
    }
};
