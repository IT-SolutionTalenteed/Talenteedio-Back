import { Router } from 'express';
import { changePassword, login, loginAdmin, logout, logoutAll, me, register, resetPassword, verifyEmail, refreshToken, googleAuth, linkGoogleAccount } from './controllers';

import auth from './middlewares/auth-guard';
import recaptcha from './middlewares/recaptcha-guard';

const authRouter = Router();

// prettier-ignore
authRouter
    .post('/login', recaptcha, login)
    .post('/login-app', login)
    .post('/login-admin', loginAdmin)
    .post('/refresh-token', refreshToken)
    .post('/register', recaptcha, register)
    .post('/register-app', recaptcha, register)
    .post('/reset-password', resetPassword)
    .post('/auth/google', googleAuth);

// prettier-ignore
authRouter
    .get('/me', auth, me)
    .post('/verify-email', auth, verifyEmail)
    .post('/change-password', auth, changePassword)
    .post('/logout', auth, logout)
    .post('/logout-all', auth, logoutAll)
    .post('/auth/link-google', auth, linkGoogleAccount);

export default authRouter;
