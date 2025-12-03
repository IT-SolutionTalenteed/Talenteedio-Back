import { CVTransmissionLog, RECIPIENT_TYPE, TRANSMISSION_METHOD, Application, CV } from '../database/entities';

export interface TransmissionLogData {
    applicationId: string;
    cvId: string;
    recipientEmail: string;
    recipientType: RECIPIENT_TYPE;
    transmissionMethod: TRANSMISSION_METHOD;
    hasWatermark: boolean;
    watermarkText?: string;
    metadata?: any;
}

export class TransmissionLogService {
    /**
     * Enregistre une transmission de CV
     */
    static async logTransmission(data: TransmissionLogData): Promise<CVTransmissionLog> {
        const log = CVTransmissionLog.create({
            application: { id: data.applicationId } as Application,
            cv: { id: data.cvId } as CV,
            recipientEmail: data.recipientEmail,
            recipientType: data.recipientType,
            transmissionMethod: data.transmissionMethod,
            hasWatermark: data.hasWatermark,
            watermarkText: data.watermarkText,
            metadata: data.metadata,
        });

        await log.save();
        return log;
    }

    /**
     * Récupère tous les logs de transmission pour une candidature
     */
    static async getLogsForApplication(applicationId: string): Promise<CVTransmissionLog[]> {
        return CVTransmissionLog.find({
            where: { application: { id: applicationId } },
            relations: ['cv', 'application'],
            order: { transmittedAt: 'DESC' },
        });
    }

    /**
     * Récupère tous les logs de transmission pour un CV
     */
    static async getLogsForCV(cvId: string): Promise<CVTransmissionLog[]> {
        return CVTransmissionLog.find({
            where: { cv: { id: cvId } },
            relations: ['cv', 'application'],
            order: { transmittedAt: 'DESC' },
        });
    }

    /**
     * Vérifie si un CV a déjà été envoyé à un destinataire
     */
    static async hasBeenSentTo(cvId: string, recipientEmail: string): Promise<boolean> {
        const count = await CVTransmissionLog.count({
            where: {
                cv: { id: cvId },
                recipientEmail: recipientEmail,
            },
        });

        return count > 0;
    }
}
