import { Request, Response } from 'express';
import ent from 'ent';
import jwt from 'jsonwebtoken';
import path from 'path';
import dotenv from 'dotenv';
import generatePassword from 'generate-password';

import AppDataSource from '../../database';
import { CV, Contact, Media, Referral, Freelance, Consultant, Talent, User, UserSession, Value, Company, Permission, Category, Address } from '../../database/entities';
import { validateEmail } from '../../helpers/utils';
import transporter from '../../helpers/mailer';

import { Class, RoleModel, RoleRegitration } from '../../type';
import { generateConsentForTalent } from '../../helpers/generatePdf';

dotenv.config();

declare module 'express-session' {
    export interface SessionData {
        userAttempt: number;
        lastAttemptTime: number;
        user: User;
        accessToken: string;
        refreshToken: string;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const refreshTokens: Record<string, any> = {}; // Store valid refresh token per user

const generateAccessToken = (req: Request, res: Response, user: User, withRefreshToken = true) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt.sign({ user: user }, process.env.SECRET_ACCESS_TOKEN as string, { expiresIn: '1h' }, async (error: any, accessToken: string | undefined) => {
        if (error) {
            res.status(500).json({ msg: 'Internal error!' });
            throw error;
        }

        if (withRefreshToken) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jwt.sign({ user: user }, process.env.SECRET_REFRESH_TOKEN as string, async (e: any, refreshToken: string | undefined) => {
                if (e) {
                    res.status(500).json({ msg: 'Internal error!' });
                    throw e;
                }

                req.session.accessToken = accessToken;
                req.session.refreshToken = refreshToken;
                req.session.user = user;
                req.session.userAttempt = 0;

                !refreshTokens[user.id] && (refreshTokens[user.id] = new Set());
                refreshTokens[user.id].add(refreshToken);

                res.status(200).json({ success: true, accessToken: accessToken, refreshToken: refreshToken, user: user });
                return;
            });
        } else {
            req.session.accessToken = accessToken;
            req.session.user = user;
            req.session.userAttempt = 0;

            res.status(200).json({ success: true, accessToken: accessToken, user: user });
            return;
        }
    });
};

export const loginMiddleware = async (req: Request, res: Response, cb: (user: User, withRefreshToken: boolean) => void) => {
    const now = Date.now();
    const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes
    
    // Réinitialiser le compteur si plus de 5 minutes se sont écoulées depuis la dernière tentative
    if (req.session.lastAttemptTime && (now - req.session.lastAttemptTime) > LOCKOUT_DURATION) {
        req.session.userAttempt = 0;
        req.session.lastAttemptTime = undefined;
    }
    
    req.session.userAttempt = typeof req.session.userAttempt !== 'number' ? 0 : req.session.userAttempt;

    try {
        const { password, email, rememberMe } = {
            email: req.body.email ? ent.encode(req.body.email) : '',
            password: req.body.password || '',
            rememberMe: req.body.rememberMe && ['true', 'false', true, false].includes(req.body.rememberMe) ? JSON.parse(req.body.rememberMe) : false,
        };

        // Error handling
        if (!email || !password) {
            res.status(400).json({ msg: 'Email and password are required!' });
            return;
        }
        //

        const user = await User.findOne({ where: { email: email }, relations: ['admin', 'company.permission', 'referral', 'talent', 'talent.values', 'consultant', 'profilePicture'] });

        if (user) {
            // Vérifier si c'est un consultant non validé
            if (user.consultant && !user.isVerified) {
                res.status(403).json({ 
                    msg: 'Votre compte consultant est en attente de validation par notre équipe. Vous recevrez un email dès que votre compte sera activé.',
                    pending: true 
                });
                return;
            }

            // test a matching password
            const userWithPassword = await User.findOne({ where: { email }, select: ['password'] });

            const isMatch = await userWithPassword?.checkPasswd(password);

            if (isMatch) {
                // Réinitialiser le compteur en cas de connexion réussie
                req.session.userAttempt = 0;
                req.session.lastAttemptTime = undefined;
                cb(user, rememberMe);
            } else {
                req.session.userAttempt++;
                req.session.lastAttemptTime = Date.now();
                
                // Bloquer après 3 tentatives échouées
                if (req.session.userAttempt >= 3) {
                    res.status(401).json({ msg: 'Email ou mot de passe incorrect' });
                } else {
                    res.status(401).json({ msg: 'Email ou mot de passe incorrect' });
                }
            }
        } else {
            req.session.userAttempt++;
            req.session.lastAttemptTime = Date.now();
            
            // Bloquer après 3 tentatives échouées
            if (req.session.userAttempt >= 3) {
                res.status(401).json({ msg: 'Email ou mot de passe incorrect' });
            } else {
                res.status(401).json({ msg: 'Email ou mot de passe incorrect' });
            }
        }
    } catch (error) {
        res.status(500).json({ msg: 'Internal error!' });
        throw error;
    }
};

export const login = (req: Request, res: Response) => {
    loginMiddleware(req, res, (user, rememberMe) => {
        generateAccessToken(req, res, user, rememberMe);
        return;
    });
};

export const loginAdmin = (req: Request, res: Response) => {
    loginMiddleware(req, res, (user, rememberMe) => {
        if (user.admin) {
            generateAccessToken(req, res, user, rememberMe);
            return;
        }

        res.status(401).json({ msg: 'Access Denied' });
        return;
    });
};

export const refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
        res.status(498).send({ message: 'Refresh token missing!' });
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt.verify(refreshToken, process.env.SECRET_REFRESH_TOKEN as string, (err: any, decoded: any) => {
        if (err) {
            console.log(err);
            res.status(498).json({ msg: 'Refresh token invalid!' });
            return;
        }

        const userId = decoded.user.id;

        if (!refreshTokens[userId] || !refreshTokens[userId].has(refreshToken)) return res.status(498).send({ message: 'Access denied: refresh token invalid!' });

        // Revoke refresh_token
        refreshTokens[userId].delete(refreshToken);

        generateAccessToken(req, res, decoded.user);
    });
};

export const register = async (req: Request, res: Response) => {
    const queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.startTransaction();

    try {
        console.log('[REGISTER] Starting registration process');
        const { firstname, lastname, email, password, confirmationPassword, role, phone, values, cvId, tjm, mobility, availabilityDate, desiredLocation, workMode, company_name, contactEmail, categoryId, address_line, postalCode, city, state, country, logoId } = {
            firstname: req.body.firstname ? ent.encode(req.body.firstname) : null,
            lastname: req.body.lastname ? ent.encode(req.body.lastname) : null,
            email: req.body.email ? ent.encode(req.body.email) : null,
            confirmationPassword: req.body.confirmationPassword || null,
            password: req.body.password || null,
            role: req.body.role ? (ent.encode(req.body.role) as RoleRegitration) : null,
            phone: req.body.phone ? ent.encode(req.body.phone) : null,
            values: req.body.values ? req.body.values : [],
            cvId: req.body.cvId ? ent.encode(req.body.cvId) : null,
            tjm: req.body.tjm ? parseFloat(req.body.tjm) : null,
            mobility: req.body.mobility ? ent.encode(req.body.mobility) : null,
            availabilityDate: req.body.availabilityDate ? ent.encode(req.body.availabilityDate) : null,
            desiredLocation: req.body.desiredLocation ? ent.encode(req.body.desiredLocation) : null,
            workMode: req.body.workMode ? ent.encode(req.body.workMode) : null,
            company_name: req.body.company_name ? ent.encode(req.body.company_name) : null,
            contactEmail: req.body.contactEmail ? ent.encode(req.body.contactEmail) : null,
            categoryId: req.body.categoryId ? ent.encode(req.body.categoryId) : null,
            address_line: req.body.address_line ? ent.encode(req.body.address_line) : null,
            postalCode: req.body.postalCode ? ent.encode(req.body.postalCode) : null,
            city: req.body.city ? ent.encode(req.body.city) : null,
            state: req.body.state ? ent.encode(req.body.state) : null,
            country: req.body.country ? ent.encode(req.body.country) : null,
            logoId: req.body.logoId ? ent.encode(req.body.logoId) : null,
        };

        // Error handling
        console.log('[REGISTER] Validating fields for role:', role, { email, firstname, lastname, phone, cvId, categoryId });
        if (!email || !password || !confirmationPassword || !lastname || !firstname || !role || !phone
            || ((role === 'talent' || role === 'freelance') && (values.length === 0 || !cvId))
            || (role === 'consultant' && !cvId)
            || (role === 'company' && !company_name)
        ) {
            await queryRunner.rollbackTransaction();
            res.status(400).json({ msg: 'All fields are required!' });
            return;
        }

        if (!validateEmail(email)) {
            res.status(400).json({ msg: 'Invalid email!' });
            return;
        }

        if (password !== confirmationPassword) {
            res.status(400).json({ msg: "Password doesn't match with its confirmation!" });
            return;
        }

        const roles: Record<RoleRegitration, Class<RoleModel>> = {
            talent: Talent,
            referral: Referral,
            freelance: Freelance,
            consultant: Consultant,
            company: Company as unknown as Class<RoleModel>,
        };

        if (!Object.keys(roles).includes(role)) {
            res.status(400).json({ msg: 'Role not valid!' });
            return;
        }
        //

        console.log('[REGISTER] Checking if user exists');
        const user = await User.findOneBy({ email: email });

        if (user) {
            await queryRunner.rollbackTransaction();
            res.status(400).json({ msg: 'This email already exists!' });
            return;
        } else {
            console.log('[REGISTER] Creating new user for role:', role);
            const newUser = new User();

            newUser.email = email;
            newUser.firstname = firstname;
            newUser.lastname = lastname;
            newUser.setPasswd(password);

            if (role === 'talent') {
                newUser.talent = new Talent();
                newUser.talent.values = [];
                for (const value of values) {
                    const fetchedValue = await Value.findOneBy({ id: value });
                    fetchedValue && newUser.talent.values.push(fetchedValue);
                }
                newUser.talent.contact = new Contact();
                newUser.talent.contact.phoneNumber = phone;
                // Nouveaux champs
                if (tjm !== null) newUser.talent.tjm = tjm;
                if (mobility !== null) newUser.talent.mobility = mobility;
                if (availabilityDate !== null) newUser.talent.availabilityDate = availabilityDate as any;
                if (desiredLocation !== null) newUser.talent.desiredLocation = desiredLocation;
                if (workMode !== null) newUser.talent.workMode = workMode as any;
            } else if (role === 'freelance') {
                newUser.freelance = new Freelance();
                newUser.freelance.values = [];
                for (const value of values) {
                    const fetchedValue = await Value.findOneBy({ id: value });
                    fetchedValue && newUser.freelance.values.push(fetchedValue);
                }
                newUser.freelance.contact = new Contact();
                newUser.freelance.contact.phoneNumber = phone;
                // Nouveaux champs
                if (tjm !== null) newUser.freelance.tjm = tjm;
                if (mobility !== null) newUser.freelance.mobility = mobility;
                if (availabilityDate !== null) newUser.freelance.availabilityDate = availabilityDate as any;
                if (desiredLocation !== null) newUser.freelance.desiredLocation = desiredLocation;
                if (workMode !== null) newUser.freelance.workMode = workMode as any;
            } else if (role === 'consultant') {
                console.log('[REGISTER] Creating consultant with cvId:', cvId);
                newUser.consultant = new Consultant();
                newUser.consultant.values = [];
                for (const value of values) {
                    const fetchedValue = await Value.findOneBy({ id: value });
                    fetchedValue && newUser.consultant.values.push(fetchedValue);
                }
                newUser.consultant.contact = new Contact();
                newUser.consultant.contact.phoneNumber = phone;
                // Champs spécifiques consultant
                if (tjm !== null) newUser.consultant.tjm = tjm;
                if (mobility !== null) newUser.consultant.mobility = mobility;
                if (availabilityDate !== null) newUser.consultant.availabilityDate = availabilityDate as any;
                if (desiredLocation !== null) newUser.consultant.desiredLocation = desiredLocation;
                if (workMode !== null) newUser.consultant.workMode = workMode as any;
                // Champs additionnels pour consultant
                const { expertise, yearsOfExperience } = req.body;
                if (expertise !== null && expertise !== undefined) newUser.consultant.expertise = expertise;
                if (yearsOfExperience !== null && yearsOfExperience !== undefined) newUser.consultant.yearsOfExperience = parseInt(yearsOfExperience);
                // Category
                if (categoryId) {
                    const category = await Category.findOne({ where: { id: categoryId } });
                    if (category) {
                        newUser.consultant.category = category;
                    }
                }
            } else if (role === 'referral') {
                newUser.referral = new Referral();
                newUser.referral.contact = new Contact();
                newUser.referral.contact.phoneNumber = phone;
            } else {
                // company
                newUser.company = new Company();
                newUser.company.company_name = company_name as string;
                newUser.company.contact = new Contact();
                newUser.company.contact.phoneNumber = phone;
                if (contactEmail) {
                    newUser.company.contact.email = contactEmail;
                }
                // Address (create only if at least minimal info provided)
                if (address_line || postalCode || city || country) {
                    const address = new Address();
                    address.line = address_line || '';
                    address.postalCode = postalCode || '';
                    address.city = city || '';
                    address.state = state || undefined;
                    address.country = country || '';
                    // Save address through manager so Contact can reference it
                    await queryRunner.manager.save(address);
                    newUser.company.contact.address = address;
                }
                // Category
                if (categoryId) {
                    const category = await Category.findOne({ where: { id: categoryId } });
                    if (category) {
                        newUser.company.category = category;
                    }
                }
                // Logo
                if (logoId) {
                    const logo = await Media.findOne({ where: { id: logoId } });
                    if (logo) {
                        newUser.company.logo = logo;
                    }
                }

                // Assign default permission package
                const defaultPermission =
                    (await Permission.findOne({ where: { title: 'Initial Package' } })) ||
                    undefined;
                if (defaultPermission) {
                    newUser.company.permission = defaultPermission;
                } else {
                    // Fallback: create a minimal permission if seed not run
                    const permission = Object.assign(new Permission(), {
                        title: 'Initial Package',
                        numberOfJobsPerYear: 5,
                        numberOfArticlesPerYear: 5,
                        validityPeriodOfAJob: 60,
                    });
                    await queryRunner.manager.save(permission);
                    newUser.company.permission = permission;
                }
            }

            // Then save contact and role-specific entity
            if (role === 'consultant') {
                // Save address first if provided
                if (address_line || postalCode || city || country) {
                    const address = new Address();
                    address.line = address_line || '';
                    address.postalCode = postalCode || '';
                    address.city = city || '';
                    address.state = state || undefined;
                    address.country = country || '';
                    await queryRunner.manager.save(address);
                    newUser.consultant.contact.address = address;
                }
                await queryRunner.manager.save(newUser.consultant.contact);
            } else {
                await queryRunner.manager.save(newUser[role].contact);
            }

            // Save user first
            console.log('[REGISTER] Saving user');
            await queryRunner.manager.save(newUser);
            
            // Link role entity to user and save
            console.log('[REGISTER] Saving role entity');
            if (role === 'consultant') {
                newUser.consultant.user = newUser;
                await queryRunner.manager.save(newUser.consultant);
            } else if (role === 'talent') {
                newUser.talent.user = newUser;
                await queryRunner.manager.save(newUser.talent);
            } else if (role === 'freelance') {
                newUser.freelance.user = newUser;
                await queryRunner.manager.save(newUser.freelance);
            } else if (role === 'company') {
                newUser.company.user = newUser;
                await queryRunner.manager.save(newUser.company);
            } else if (role === 'referral') {
                newUser.referral.user = newUser;
                await queryRunner.manager.save(newUser.referral);
            }

            console.log('[REGISTER] Creating CV if needed');
            if (role === 'talent') {
                const cv = Object.assign(new CV(), { file: { id: cvId }, title: `${newUser.firstname} ${newUser.lastname}` }) as CV;
                cv.talent = newUser.talent;
                await queryRunner.manager.save(cv);
            } else if (role === 'freelance') {
                const cv = Object.assign(new CV(), { file: { id: cvId }, title: `${newUser.firstname} ${newUser.lastname}` }) as CV;
                cv.freelance = newUser.freelance;
                await queryRunner.manager.save(cv);
            } else if (role === 'consultant' && cvId) {
                // CV optionnel pour les consultants lors de l'inscription
                const cv = Object.assign(new CV(), { file: { id: cvId }, title: `${newUser.firstname} ${newUser.lastname}` }) as CV;
                cv.consultant = newUser.consultant;
                await queryRunner.manager.save(cv);
            }

            // Commit DB changes BEFORE sending email to avoid failing registration on mail errors
            console.log('[REGISTER] Committing transaction');
            await queryRunner.commitTransaction();

            // Generate JWT token synchronously
            const token = jwt.sign(email, process.env.SECRET_VERIFY_MAIL as string);

            try {
                if (role === 'consultant') {
                        // Pour les consultants : email de confirmation d'inscription
                        await transporter.sendMail({
                            from: 'Talenteed.io ' + process.env.MAILUSER,
                            to: email,
                            subject: 'Inscription en attente de validation',
                            template: 'index',
                            context: {
                                title: `Bonjour ${newUser.firstname} ${newUser.lastname}`,
                                message: `Merci pour votre inscription en tant que consultant. Votre compte est en attente de validation par notre équipe. Vous recevrez un email dès que votre compte sera activé.`,
                                host: process.env.FRONTEND_HOST,
                                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                imageTitle: 'Inscription reçue',
                                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                            },
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any);

                        // Email à l'administrateur avec CV en pièce jointe
                        const adminEmail = process.env.ADMIN_EMAIL || process.env.MAILUSER;
                        
                        // Récupérer le nom de la catégorie et le CV
                        let categoryName = 'Non spécifiée';
                        let cvUrl = '';
                        
                        if (categoryId) {
                            try {
                                const category = await Category.findOne({ where: { id: categoryId } });
                                if (category) {
                                    categoryName = category.name;
                                }
                            } catch (error) {
                                console.error('Erreur lors de la récupération de la catégorie:', error);
                            }
                        }
                        
                        // Récupérer l'URL du CV
                        if (cvId) {
                            try {
                                const cvMedia = await Media.findOne({ where: { id: cvId } });
                                if (cvMedia && cvMedia.fileUrl) {
                                    cvUrl = cvMedia.fileUrl;
                                }
                            } catch (error) {
                                console.error('Erreur lors de la récupération du CV:', error);
                            }
                        }
                        
                        // Préparer les informations du consultant avec lien CV cliquable
                        const consultantInfoLines = [
                            `<strong>Nom :</strong> ${newUser.firstname} ${newUser.lastname}`,
                            `<strong>Email :</strong> ${email}`,
                            `<strong>Téléphone :</strong> ${phone}`,
                            `<strong>Catégorie :</strong> ${categoryName}`,
                            `<strong>Expertise :</strong> ${req.body.expertise || 'Non spécifiée'}`,
                            `<strong>Années d'expérience :</strong> ${req.body.yearsOfExperience || 'Non spécifiée'}`,
                            `<strong>Adresse :</strong> ${address_line || ''}, ${postalCode || ''} ${city || ''}, ${state || ''} ${country || ''}`,
                        ];
                        
                        if (cvUrl) {
                            consultantInfoLines.push(`<strong>CV :</strong> <a href="${cvUrl}" target="_blank" style="color: #007bff; text-decoration: underline;">Télécharger le CV</a>`);
                        }
                        
                        const consultantInfo = consultantInfoLines.join('<br>');

                        const mailOptions: any = {
                            from: 'Talenteed.io ' + process.env.MAILUSER,
                            to: adminEmail,
                            subject: 'Nouvelle inscription consultant à valider',
                            template: 'index',
                            context: {
                                title: 'Nouvelle inscription consultant',
                                message: `Un nouveau consultant s'est inscrit et attend votre validation :<br><br>${consultantInfo}<br><br>Connectez-vous à l'administration pour valider ce compte.`,
                                host: process.env.FRONTEND_HOST,
                                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                imageTitle: 'Action requise',
                                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                            },
                        };

                        // Le CV est déjà inclus dans le message via son URL

                    await transporter.sendMail(mailOptions);
                } else {
                    // Pour les autres rôles : email de vérification classique
                        await transporter.sendMail({
                            from: 'Talenteed.io ' + process.env.MAILUSER,
                            to: email,
                            subject: 'Welcome',
                            template: 'index',
                            context: {
                                title: `Hi ${newUser.firstname} ${newUser.lastname}`,
                                message: `Thank you for signing up, you can verify your your email here: ${new URL(path.join(process.env.FRONTEND_HOST as string, 'authentication', 'account-validation', token as string)).toString()}`,
                                host: process.env.FRONTEND_HOST,
                                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                imageTitle: 'Welcome aboard',
                                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                            },
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any);
                }
            } catch (error) {
                // Log and continue – registration is successful, but email failed
                console.error('Email sending failed on registration:', error);
            }

            try {
                if (role === 'talent') {
                        const talent = (await Talent.findOne({ where: { id: newUser.talent.id }, relations: ['user'] })) as Talent;

                        const { fileUrl, fileName, fileType } = await generateConsentForTalent(talent, talent.user);
                        const consent = Media.create({
                            fileUrl,
                            fileName,
                            fileType,
                        });
                        await consent.save();

                    talent.consent = consent;
                    await talent.save();
                }
            } catch (error) {
                // Do not fail registration if consent generation fails; just log
                console.error('Post-registration processing failed:', error);
            }

            // Pour les consultants, ne pas générer de token - compte en attente de validation
            if (role === 'consultant') {
                res.status(200).json({ 
                    msg: 'Inscription réussie. Votre compte est en attente de validation par notre équipe. Vous recevrez un email dès que votre compte sera activé.',
                    pending: true 
                });
            } else {
                generateAccessToken(req, res, newUser);
            }
        }
    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error('Registration error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ msg: 'Internal error!', error: errorMessage });
        return;
    } finally {
        // Ensure queryRunner is released
        if (!queryRunner.isReleased) {
            await queryRunner.release();
        }
    }
};

export const verifyEmail = (req: Request, res: Response) => {
    try {
        const token = req.body.token as string;

        if (token) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jwt.verify(token, process.env.SECRET_VERIFY_MAIL as string, async (error: any, email: any) => {
                if (error) {
                    console.log(error);
                    res.status(498).json({ msg: 'Token invalid!' });
                    return;
                }

                const user = await User.findOne({ where: { email: email }, relations: ['admin', 'company.permission', 'referral', 'talent', 'talent.values', 'profilePicture'] });

                if (user && !user.validateAt) {
                    user.validateAt = new Date();

                    await user.save();

                    req.session.user = user;

                    await transporter.sendMail({
                        from: 'Talenteed.io ' + process.env.MAILUSER,
                        to: email,
                        subject: 'Email verification',
                        template: 'index',
                        context: {
                            title: `Hi ${user.name}`,
                            message: `Congratulations! Your email has been verified!`,
                            host: process.env.FRONTEND_HOST,
                            imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                            imageTitle: 'Email verification',
                            backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                        },
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any);
                }

                res.status(200).json({ success: true, user: user });
            });
        } else {
            res.status(400).json({ msg: 'Bad request!' });
        }
    } catch (error) {
        res.status(500).json({ msg: 'Internal error!' });
        throw error;
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const email = req.body.email;

        if (!email) {
            res.status(400).json({ msg: 'Email required!' });
            return;
        }

        const user = (await User.findOne({ where: { email }, select: ['password', 'id', 'email'] })) as User;

        if (!user) {
            res.status(404).json({ msg: 'User not found required!' });
            return;
        }

        // Generate new password
        const newPassword = generatePassword.generate({
            length: 10,
            numbers: true,
        });

        user.setPasswd(newPassword);
        await user.save();

        req.session.destroy(async () => {
            const repository = AppDataSource.getRepository(UserSession);

            refreshTokens[user.id] && (refreshTokens[user.id] = new Set());

            await repository
                .createQueryBuilder('user_session')
                .delete()
                .where('user_session.data like :userId', { userId: `%${user.id}%` })
                .execute();

            await transporter.sendMail({
                from: 'Talenteed.io ' + process.env.MAILUSER,
                to: user.email,
                subject: 'Reset password',
                template: 'index',
                context: {
                    title: `Hi ${user.name}`,
                    message: `You have requested a new password, you can login with it and change the password: ${newPassword}`,
                    host: process.env.FRONTEND_HOST,
                    imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                    imageTitle: 'Reset password',
                    backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            res.status(200).json({ success: true, msg: 'New password sent to your email!' });
        });
    } catch (error) {
        res.status(500).json({ msg: 'Internal error!' });
        throw error;
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { newPassword, password, confirmationPassword } = {
            password: req.body.password || null,
            confirmationPassword: req.body.confirmationPassword || null,
            newPassword: req.body.newPassword || null,
        };

        // Error handling
        if (!password || !confirmationPassword || !newPassword) {
            res.status(400).json({ msg: 'All fields are required!' });
            return;
        }

        if (newPassword !== confirmationPassword) {
            res.status(400).json({ msg: "New password doesn't match with its confirmation!" });
            return;
        }
        //

        const user = await User.findOne({ where: { email: req.session.user?.email }, select: ['password', 'id'] });

        if (user && (await user.checkPasswd(password))) {
            user.setPasswd(newPassword);

            await user.save();

            await transporter.sendMail({
                from: 'Talenteed.io ' + process.env.MAILUSER,
                to: req.session.user?.email,
                subject: 'Change password',
                template: 'index',
                context: {
                    title: `Hi ${user.name}`,
                    message: `You have changed successfully your password!`,
                    host: process.env.FRONTEND_HOST,
                    imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                    imageTitle: 'Change password',
                    backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            res.status(200).json({ success: true, msg: 'Password changed successfully!' });
        } else {
            res.status(401).json({ msg: 'Access denied: wrong password!' });
            return;
        }
    } catch (error) {
        res.status(500).json({ msg: 'Internal error!' });
        throw error;
    }
};

export const logout = (req: Request, res: Response) => {
    const userId = req.session.user?.id as string;
    const refreshToken = req.session.refreshToken;

    req.session.destroy(async () => {
        refreshTokens[userId] && refreshTokens[userId].delete(refreshToken);
        res.status(200).json({ msg: 'Logged out!' });
    });
};

export const logoutAll = async (req: Request, res: Response) => {
    const userId = req.session.user?.id as string;

    req.session.destroy(async () => {
        const repository = AppDataSource.getRepository(UserSession);

        refreshTokens[userId] && (refreshTokens[userId] = new Set());

        await repository
            .createQueryBuilder('user_session')
            .delete()
            .where('user_session.data like :userId', { userId: `%${userId}%` })
            .execute();

        res.status(200).json({ msg: 'Logged out!' });
    });
};

export const me = async (req: Request, res: Response) => {
    if (!req.session.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    
    // Reload user with all relations to ensure consultant data is included
    const user = await User.findOne({ 
        where: { id: req.session.user.id }, 
        relations: ['admin', 'company.permission', 'referral', 'talent', 'talent.values', 'consultant', 'profilePicture', 'hrFirstClub'] 
    });
    
    if (user) {
        res.status(200).json({ user });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
};

export const googleAuth = async (req: Request, res: Response) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            res.status(400).json({ msg: 'Google credential required!' });
            return;
        }

        // Décoder le JWT Google
        const payload = decodeGoogleJWT(credential);
        if (!payload) {
            res.status(400).json({ msg: 'Invalid Google credential!' });
            return;
        }

        const { email, name, given_name, family_name, picture, sub: googleId } = payload;

        if (!email) {
            res.status(400).json({ msg: 'Email not provided by Google!' });
            return;
        }

        // Chercher un utilisateur existant avec cet email
        let user = await User.findOne({ 
            where: { email }, 
            relations: ['admin', 'company.permission', 'referral', 'talent', 'talent.values', 'consultant', 'profilePicture'] 
        });

        if (user) {
            // Utilisateur existant - mettre à jour les informations Google si nécessaire
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Nouvel utilisateur - créer un compte
            user = new User();
            user.email = email;
            user.firstname = given_name || name?.split(' ')[0] || 'Utilisateur';
            user.lastname = family_name || name?.split(' ').slice(1).join(' ') || 'Google';
            user.googleId = googleId;
            user.validateAt = new Date(); // Compte Google automatiquement validé
            
            // Pas de mot de passe pour les comptes Google
            user.setPasswd(generateRandomPassword());
            
            await user.save();
        }

        // Réinitialiser le compteur de tentatives
        req.session.userAttempt = 0;
        req.session.lastAttemptTime = undefined;

        // Générer les tokens
        generateAccessToken(req, res, user, true);

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ msg: 'Internal error during Google authentication!' });
    }
};

export const linkGoogleAccount = async (req: Request, res: Response) => {
    try {
        if (!req.session.user) {
            res.status(401).json({ msg: 'Not authenticated!' });
            return;
        }

        const { credential } = req.body;

        if (!credential) {
            res.status(400).json({ msg: 'Google credential required!' });
            return;
        }

        // Décoder le JWT Google
        const payload = decodeGoogleJWT(credential);
        if (!payload) {
            res.status(400).json({ msg: 'Invalid Google credential!' });
            return;
        }

        const { email, sub: googleId } = payload;

        // Vérifier que l'email correspond à l'utilisateur connecté
        if (email !== req.session.user.email) {
            res.status(400).json({ msg: 'Google account email does not match your account email!' });
            return;
        }

        // Vérifier qu'aucun autre compte n'utilise déjà ce Google ID
        const existingUser = await User.findOne({ where: { googleId } });
        if (existingUser && existingUser.id !== req.session.user.id) {
            res.status(400).json({ msg: 'This Google account is already linked to another user!' });
            return;
        }

        // Lier le compte Google
        const user = await User.findOne({ where: { id: req.session.user.id } });
        if (user) {
            user.googleId = googleId;
            await user.save();
            
            res.status(200).json({ success: true, msg: 'Google account linked successfully!' });
        } else {
            res.status(404).json({ msg: 'User not found!' });
        }

    } catch (error) {
        console.error('Link Google account error:', error);
        res.status(500).json({ msg: 'Internal error during Google account linking!' });
    }
};

export const unlinkGoogleAccount = async (req: Request, res: Response) => {
    try {
        if (!req.session.user) {
            res.status(401).json({ msg: 'Not authenticated!' });
            return;
        }

        // Délier le compte Google
        const user = await User.findOne({ where: { id: req.session.user.id } });
        if (user) {
            user.googleId = null;
            await user.save();
            
            res.status(200).json({ success: true, msg: 'Google account unlinked successfully!' });
        } else {
            res.status(404).json({ msg: 'User not found!' });
        }

    } catch (error) {
        console.error('Unlink Google account error:', error);
        res.status(500).json({ msg: 'Internal error during Google account unlinking!' });
    }
};

// Fonction utilitaire pour décoder le JWT Google
function decodeGoogleJWT(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            Buffer.from(base64, 'base64')
                .toString()
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding Google JWT:', error);
        return null;
    }
}

// Fonction utilitaire pour générer un mot de passe aléatoire
function generateRandomPassword(): string {
    return generatePassword.generate({
        length: 16,
        numbers: true,
        symbols: true,
        uppercase: true,
        lowercase: true,
    });
}
