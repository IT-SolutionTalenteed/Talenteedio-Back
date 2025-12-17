import path from 'path';
import { Application, APPLICATION_STATUS, Admin, CV, ProfileMatchResult } from '../database/entities';
import transporter from './mailer';
import { CVWatermarkService } from './cv-watermark';
import { TransmissionLogService } from './transmission-log';
import { RECIPIENT_TYPE, TRANSMISSION_METHOD } from '../database/entities/CVTransmissionLog';

export interface ProcessingResult {
    success: boolean;
    action: 'AUTO_SENT' | 'PENDING_REVIEW' | 'REJECTED';
    matchScore: number;
    message: string;
}

export class ApplicationProcessingService {
    private static readonly AUTO_SEND_THRESHOLD = parseInt(process.env.AUTO_SEND_THRESHOLD || '80');
    private static readonly MANUAL_REVIEW_THRESHOLD = parseInt(process.env.MANUAL_REVIEW_THRESHOLD || '60');
    private static readonly ADMIN_EMAIL = process.env.ADMIN_CONTACT_EMAIL || 'contact@solutiontalentit.com';

    /**
     * Traite automatiquement une candidature basée sur le score de matching
     */
    static async processApplication(applicationId: string): Promise<ProcessingResult> {
        try {
            // Charger la candidature avec toutes les relations nécessaires
            const application = await Application.findOne({
                where: { id: applicationId },
                relations: [
                    'job',
                    'job.company',
                    'job.company.contact',
                    'talent',
                    'talent.user',
                    'talent.contact',
                    'cv',
                    'cv.file',
                    'profileMatchResult',
                ],
            });

            if (!application) {
                throw new Error('Application not found');
            }

            // Récupérer le score de matching
            const matchScore = application.profileMatchResult?.pythonReturn?.matchPercentage || 0;
            application.matchScore = matchScore;

            // Déterminer l'action basée sur le score
            if (matchScore >= this.AUTO_SEND_THRESHOLD) {
                // Score ≥ 80% : Envoi automatique au client
                await this.autoSendToClient(application);
                application.status = APPLICATION_STATUS.AUTO_SENT_TO_CLIENT;
                application.processingType = 'AUTO';
                await application.save();

                return {
                    success: true,
                    action: 'AUTO_SENT',
                    matchScore,
                    message: 'Candidature envoyée automatiquement au client',
                };
            } else if (matchScore >= this.MANUAL_REVIEW_THRESHOLD) {
                // Score 60-79% : Mise en attente pour validation manuelle
                await this.sendForManualReview(application);
                application.status = APPLICATION_STATUS.PENDING_REVIEW;
                application.processingType = 'AUTO';
                await application.save();

                return {
                    success: true,
                    action: 'PENDING_REVIEW',
                    matchScore,
                    message: 'Candidature mise en attente pour validation manuelle',
                };
            } else {
                // Score < 60% : Rejet automatique
                await this.autoReject(application);
                application.status = APPLICATION_STATUS.DENIED;
                application.processingType = 'AUTO';
                application.rejectionReason = 'Score de matching insuffisant (< 60%)';
                await application.save();

                return {
                    success: true,
                    action: 'REJECTED',
                    matchScore,
                    message: 'Candidature rejetée automatiquement',
                };
            }
        } catch (error) {
            console.error('Error processing application:', error);
            throw error;
        }
    }

    /**
     * Envoi automatique au client (score ≥ 80%)
     */
    private static async autoSendToClient(application: Application): Promise<void> {
        const matchData = application.profileMatchResult?.pythonReturn || {};
        const cvUrl = application.cv?.file?.fileUrl;

        // Vérifier que l'email du client existe
        const clientEmail = application.job.company.contact?.email;
        if (!clientEmail) {
            console.error('Client email not found for application:', application.id);
            throw new Error('Email du client non trouvé. Impossible d\'envoyer le CV.');
        }

        // Préparer le CV avec filigrane si disponible
        let watermarkedCvBuffer: Buffer | null = null;
        if (cvUrl) {
            const fullCvUrl = new URL(path.join(process.env.HOST as string, cvUrl)).toString();
            watermarkedCvBuffer = await CVWatermarkService.addWatermark(fullCvUrl);

            // Logger la transmission
            await TransmissionLogService.logTransmission({
                applicationId: application.id,
                cvId: application.cv.id,
                recipientEmail: clientEmail,
                recipientType: RECIPIENT_TYPE.CLIENT,
                transmissionMethod: TRANSMISSION_METHOD.EMAIL,
                hasWatermark: true,
                watermarkText: `Transmis par SolutionTalentIT - ${new Date().toLocaleDateString('fr-FR')} - Confidentiel`,
                metadata: {
                    matchScore: application.matchScore,
                    jobTitle: application.job.title,
                    sentDate: new Date(),
                },
            });
        }

        // Envoyer l'email au client (company)
        await transporter.sendMail({
            from: 'Talenteed.io ' + process.env.MAILUSER,
            to: clientEmail,
            subject: `Nouveau candidat qualifié - ${application.job.title}`,
            template: 'client-candidate-notification',
            context: {
                companyName: application.job.company.company_name || 'Client',
                jobTitle: application.job.title,
                candidateName: application.talent.user.name,
                candidateEmail: application.talent.user.email,
                matchScore: application.matchScore,
                strengths: matchData.strengths || [],
                recommendation: matchData.recommendation || '',
                applicationUrl: new URL(path.join(process.env.FRONTEND_HOST as string, 'admin', 'application', application.id)).toString(),
                host: process.env.FRONTEND_HOST,
                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
            },
            attachments: watermarkedCvBuffer
                ? [
                      {
                          filename: `CV_${application.talent.user.name}_watermarked.pdf`,
                          content: watermarkedCvBuffer,
                      },
                  ]
                : [],
        } as any);

        // Notifier l'admin
        await transporter.sendMail({
            from: 'Talenteed.io ' + process.env.MAILUSER,
            to: this.ADMIN_EMAIL,
            subject: `[AUTO] Candidature envoyée - ${application.job.title}`,
            template: 'admin-high-match-notification',
            context: {
                jobTitle: application.job.title,
                candidateName: application.talent.user.name,
                candidateEmail: application.talent.user.email,
                companyName: application.job.company.company_name || 'Client',
                matchScore: application.matchScore,
                sentDate: new Date().toLocaleString('fr-FR'),
                strengths: matchData.strengths || [],
                recommendation: matchData.recommendation || '',
                applicationUrl: new URL(path.join(process.env.FRONTEND_HOST as string, 'admin', 'application', application.id)).toString(),
                host: process.env.FRONTEND_HOST,
                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
            },
        } as any);
    }

    /**
     * Mise en attente pour validation manuelle (score 60-79%)
     */
    private static async sendForManualReview(application: Application): Promise<void> {
        const matchData = application.profileMatchResult?.pythonReturn || {};

        // Notifier l'admin
        await transporter.sendMail({
            from: 'Talenteed.io ' + process.env.MAILUSER,
            to: this.ADMIN_EMAIL,
            subject: `[VALIDATION REQUISE] Candidature en attente - ${application.job.title}`,
            template: 'admin-pending-review',
            context: {
                jobTitle: application.job.title,
                candidateName: application.talent.user.name,
                candidateEmail: application.talent.user.email,
                companyName: application.job.company.company_name || 'Client',
                matchScore: application.matchScore,
                applicationDate: new Date().toLocaleString('fr-FR'),
                strengths: matchData.strengths || [],
                gaps: matchData.gaps || [],
                recommendation: matchData.recommendation || '',
                applicationUrl: new URL(path.join(process.env.FRONTEND_HOST as string, 'admin', 'application', application.id)).toString(),
                host: process.env.FRONTEND_HOST,
                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
            },
        } as any);
    }

    /**
     * Rejet automatique (score < 60%)
     */
    private static async autoReject(application: Application): Promise<void> {
        // Envoyer un email d'encouragement au candidat
        await transporter.sendMail({
            from: 'Talenteed.io ' + process.env.MAILUSER,
            to: application.talent.user.email,
            subject: `Votre candidature - ${application.job.title}`,
            template: 'candidate-rejection-encouragement',
            context: {
                candidateName: application.talent.user.name,
                jobTitle: application.job.title,
                jobsPageUrl: new URL(path.join(process.env.FRONTEND_HOST as string, 'jobs')).toString(),
                host: process.env.FRONTEND_HOST,
                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
            },
        } as any);
    }

    /**
     * Envoyer un contrat à un consultant validé
     */
    static async sendConsultantContract(applicationId: string, contractUrl: string): Promise<void> {
        const application = await Application.findOne({
            where: { id: applicationId },
            relations: ['job', 'job.company', 'job.company.contact', 'talent', 'talent.user', 'consultant'],
        });

        if (!application) {
            throw new Error('Application not found');
        }

        application.status = APPLICATION_STATUS.AWAITING_CONTRACT;
        await application.save();

        await transporter.sendMail({
            from: 'Talenteed.io ' + process.env.MAILUSER,
            to: application.talent.user.email,
            subject: `Félicitations ! Contrat à signer - ${application.job.title}`,
            template: 'consultant-contract-request',
            context: {
                consultantName: application.talent.user.name,
                jobTitle: application.job.title,
                companyName: application.job.company.company_name || 'Client',
                contractUrl: contractUrl,
                contractDetails: '',
                host: process.env.FRONTEND_HOST,
                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
            },
        } as any);
    }

    /**
     * Valider manuellement une candidature en attente
     */
    static async validatePendingApplication(applicationId: string, approved: boolean, adminNote?: string): Promise<void> {
        const application = await Application.findOne({
            where: { id: applicationId },
            relations: [
                'job',
                'job.company',
                'job.company.contact',
                'talent',
                'talent.user',
                'talent.contact',
                'cv',
                'cv.file',
                'profileMatchResult',
            ],
        });

        if (!application) {
            throw new Error('Application not found');
        }

        if (approved) {
            // Envoyer au client comme si c'était un envoi automatique
            await this.autoSendToClient(application);
            application.status = APPLICATION_STATUS.VALIDATED;
        } else {
            // Rejeter avec note
            await this.autoReject(application);
            application.status = APPLICATION_STATUS.DENIED;
            application.rejectionReason = adminNote || 'Rejeté après validation manuelle';
        }

        application.processingType = 'MANUAL';
        await application.save();
    }
}
