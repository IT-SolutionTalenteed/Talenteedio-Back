import { In } from 'typeorm';
import transporter from '../helpers/mailer';
import {
    Newsletter,
    NEWSLETTER_STATUS,
    NEWSLETTER_RECIPIENT_TYPE,
    User,
    Company,
    Talent,
    Consultant,
    Application,
    CompanyAppointment,
    Job,
} from '../database/entities';

export class NewsletterService {
    /**
     * Récupère les emails des destinataires selon les types sélectionnés
     */
    static async getRecipientEmails(recipientTypes: NEWSLETTER_RECIPIENT_TYPE[], customEmails?: string[]): Promise<string[]> {
        const emails = new Set<string>();

        // Ajouter les emails personnalisés
        if (customEmails && customEmails.length > 0) {
            customEmails.forEach((email) => emails.add(email.toLowerCase().trim()));
        }

        for (const type of recipientTypes) {
            switch (type) {
                case NEWSLETTER_RECIPIENT_TYPE.ALL_COMPANIES: {
                    const companies = await Company.find({
                        relations: ['user'],
                        where: { user: { validateAt: In([null]) } },
                    });
                    companies.forEach((c) => c.user?.email && emails.add(c.user.email.toLowerCase()));
                    break;
                }

                case NEWSLETTER_RECIPIENT_TYPE.ALL_TALENTS: {
                    const talents = await Talent.find({
                        relations: ['user'],
                    });
                    talents.forEach((t) => t.user?.email && emails.add(t.user.email.toLowerCase()));
                    break;
                }

                case NEWSLETTER_RECIPIENT_TYPE.ALL_CONSULTANTS: {
                    const consultants = await Consultant.find({
                        relations: ['user'],
                    });
                    consultants.forEach((c) => c.user?.email && emails.add(c.user.email.toLowerCase()));
                    break;
                }

                case NEWSLETTER_RECIPIENT_TYPE.TALENTS_WITH_ACTIVE_APPOINTMENTS: {
                    const now = new Date();
                    const appointments = await CompanyAppointment.createQueryBuilder('appointment')
                        .leftJoinAndSelect('appointment.user', 'user')
                        .leftJoinAndSelect('user.talent', 'talent')
                        .where('appointment.appointmentDate >= :now', { now })
                        .andWhere('talent.id IS NOT NULL')
                        .getMany();

                    appointments.forEach((a) => a.user?.email && emails.add(a.user.email.toLowerCase()));
                    break;
                }

                case NEWSLETTER_RECIPIENT_TYPE.TALENTS_WITHOUT_APPOINTMENTS: {
                    const talentsWithAppointments = await CompanyAppointment.createQueryBuilder('appointment')
                        .leftJoin('appointment.user', 'user')
                        .leftJoin('user.talent', 'talent')
                        .select('talent.id')
                        .where('talent.id IS NOT NULL')
                        .distinct(true)
                        .getRawMany();

                    const talentIdsWithAppointments = talentsWithAppointments.map((a) => a.talent_id).filter(Boolean);

                    const talents = await Talent.createQueryBuilder('talent')
                        .leftJoinAndSelect('talent.user', 'user')
                        .where(talentIdsWithAppointments.length > 0 ? 'talent.id NOT IN (:...ids)' : '1=1', {
                            ids: talentIdsWithAppointments,
                        })
                        .getMany();

                    talents.forEach((t) => t.user?.email && emails.add(t.user.email.toLowerCase()));
                    break;
                }

                case NEWSLETTER_RECIPIENT_TYPE.TALENTS_WITH_RECENT_APPLICATIONS: {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    const applications = await Application.createQueryBuilder('application')
                        .leftJoinAndSelect('application.talent', 'talent')
                        .leftJoinAndSelect('talent.user', 'user')
                        .where('application.createdAt >= :date', { date: thirtyDaysAgo })
                        .getMany();

                    applications.forEach((a) => a.talent?.user?.email && emails.add(a.talent.user.email.toLowerCase()));
                    break;
                }

                case NEWSLETTER_RECIPIENT_TYPE.TALENTS_WITHOUT_APPLICATIONS: {
                    const talentsWithApplications = await Application.createQueryBuilder('application')
                        .select('application.talentId')
                        .distinct(true)
                        .getRawMany();

                    const talentIdsWithApplications = talentsWithApplications.map((a) => a.application_talentId);

                    const talents = await Talent.createQueryBuilder('talent')
                        .leftJoinAndSelect('talent.user', 'user')
                        .where(talentIdsWithApplications.length > 0 ? 'talent.id NOT IN (:...ids)' : '1=1', {
                            ids: talentIdsWithApplications,
                        })
                        .getMany();

                    talents.forEach((t) => t.user?.email && emails.add(t.user.email.toLowerCase()));
                    break;
                }

                case NEWSLETTER_RECIPIENT_TYPE.COMPANIES_WITH_ACTIVE_JOBS: {
                    const jobs = await Job.createQueryBuilder('job')
                        .leftJoinAndSelect('job.company', 'company')
                        .leftJoinAndSelect('company.user', 'user')
                        .where('job.status = :status', { status: 'public' })
                        .getMany();

                    jobs.forEach((j) => j.company?.user?.email && emails.add(j.company.user.email.toLowerCase()));
                    break;
                }

                case NEWSLETTER_RECIPIENT_TYPE.COMPANIES_WITHOUT_JOBS: {
                    const companiesWithJobs = await Job.createQueryBuilder('job')
                        .select('job.companyId')
                        .distinct(true)
                        .getRawMany();

                    const companyIdsWithJobs = companiesWithJobs.map((j) => j.job_companyId);

                    const companies = await Company.createQueryBuilder('company')
                        .leftJoinAndSelect('company.user', 'user')
                        .where(companyIdsWithJobs.length > 0 ? 'company.id NOT IN (:...ids)' : '1=1', {
                            ids: companyIdsWithJobs,
                        })
                        .getMany();

                    companies.forEach((c) => c.user?.email && emails.add(c.user.email.toLowerCase()));
                    break;
                }

                case NEWSLETTER_RECIPIENT_TYPE.VERIFIED_USERS: {
                    const users = await User.createQueryBuilder('user')
                        .where('user.validateAt IS NOT NULL')
                        .andWhere('user.validateAt <= :now', { now: new Date() })
                        .getMany();

                    users.forEach((u) => u.email && emails.add(u.email.toLowerCase()));
                    break;
                }

                case NEWSLETTER_RECIPIENT_TYPE.UNVERIFIED_USERS: {
                    const users = await User.createQueryBuilder('user')
                        .where('user.validateAt IS NULL OR user.validateAt > :now', { now: new Date() })
                        .getMany();

                    users.forEach((u) => u.email && emails.add(u.email.toLowerCase()));
                    break;
                }

                case NEWSLETTER_RECIPIENT_TYPE.CUSTOM:
                    // Déjà géré au début
                    break;
            }
        }

        return Array.from(emails);
    }

    /**
     * Envoie la newsletter à tous les destinataires
     */
    static async sendNewsletter(newsletterId: string): Promise<void> {
        const newsletter = await Newsletter.findOne({
            where: { id: newsletterId },
            relations: ['createdBy'],
        });

        if (!newsletter) {
            throw new Error('Newsletter not found');
        }

        if (newsletter.status === NEWSLETTER_STATUS.SENT) {
            throw new Error('Newsletter already sent');
        }

        // Mettre à jour le statut
        newsletter.status = NEWSLETTER_STATUS.SENDING;
        await newsletter.save();

        try {
            // Récupérer les emails des destinataires
            const recipientEmails = await this.getRecipientEmails(newsletter.recipientTypes, newsletter.customRecipientEmails || []);

            newsletter.totalRecipients = recipientEmails.length;
            await newsletter.save();

            let sentCount = 0;
            let failedCount = 0;

            // Préparer les pièces jointes
            const attachments = newsletter.attachments || [];

            // Envoyer les emails par batch de 50
            const batchSize = 50;
            for (let i = 0; i < recipientEmails.length; i += batchSize) {
                const batch = recipientEmails.slice(i, i + batchSize);

                const promises = batch.map(async (email) => {
                    try {
                        const mailOptions: any = {
                            from: process.env.MAILUSER,
                            to: email,
                            subject: newsletter.subject,
                        };

                        // Si htmlMessage existe, l'utiliser directement
                        if (newsletter.htmlMessage) {
                            mailOptions.html = newsletter.htmlMessage;
                            mailOptions.text = newsletter.message;
                        } else {
                            // Sinon, utiliser le template avec le message
                            mailOptions.template = 'newsletter';
                            mailOptions.context = {
                                message: newsletter.message.replace(/\n/g, '<br>'),
                            };
                        }

                        // Ajouter les pièces jointes
                        if (attachments.length > 0) {
                            mailOptions.attachments = attachments.map((att) => ({
                                filename: att.filename,
                                path: att.path,
                                contentType: att.contentType,
                            }));
                        }

                        await transporter.sendMail(mailOptions);
                        sentCount++;
                    } catch (error) {
                        console.error(`Failed to send email to ${email}:`, error);
                        failedCount++;
                    }
                });

                await Promise.all(promises);

                // Mettre à jour la progression
                newsletter.sentCount = sentCount;
                newsletter.failedCount = failedCount;
                await newsletter.save();
            }

            // Finaliser
            newsletter.status = NEWSLETTER_STATUS.SENT;
            newsletter.sentAt = new Date();
            await newsletter.save();
        } catch (error) {
            newsletter.status = NEWSLETTER_STATUS.FAILED;
            await newsletter.save();
            throw error;
        }
    }

    /**
     * Compte le nombre de destinataires pour une newsletter
     */
    static async countRecipients(recipientTypes: NEWSLETTER_RECIPIENT_TYPE[], customEmails?: string[]): Promise<number> {
        const emails = await this.getRecipientEmails(recipientTypes, customEmails);
        return emails.length;
    }
}
