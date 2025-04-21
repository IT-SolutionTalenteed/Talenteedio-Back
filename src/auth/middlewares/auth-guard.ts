import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';

import { User } from '../../database/entities';

dotenv.config();

// Routes protection 's middlware

export default (req: Request, res: Response, next: NextFunction) => {
    let token = '';

    if (req.headers && req.headers['authorization']) token = req.headers['authorization'].split(' ')[1];

    if (!token) {
        res.status(401).json({ msg: 'Access denied: token missing!' });
        return;
    }

    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN as string, async (err) => {
        if (err) {
            console.log(err);
            res.status(401).json({ msg: 'Access denied: token invalid!' });
            return;
        }

        if (req.session.accessToken && req.session.accessToken === token) {
            const user = (await User.findOne({ where: { id: req.session.user?.id }, relations: ['admin', 'company.permission', 'referral', 'talent', 'hrFirstClub'] })) as User;

            if (!user) {
                res.status(401).json({ msg: 'Access denied: user not found!' });
                return;
            }

            req.session.user = user;

            next();
        } else {
            req.session.destroy(async () => {
                res.status(401).json({ msg: 'Access denied: session invalid!' });
                return;
            });
        }
    });
};
