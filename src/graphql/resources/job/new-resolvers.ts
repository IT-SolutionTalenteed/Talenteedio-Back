/**
 * NOUVELLES MUTATIONS ET QUERIES À AJOUTER AU RESOLVER JOB
 * 
 * Instructions : Copiez ces resolvers dans le fichier resolver.ts
 * - Les mutations vont dans l'objet Mutation
 * - Les queries vont dans l'objet Query
 * - Les guards vont dans resolversComposition
 */

import { Application, User } from '../../../database/entities';
import { Payload } from '../../../type';
import { returnError } from '../../../helpers/graphql';

// ============= MUTATIONS À AJOUTER =============

export const newMutations = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validatePendingApplication: async (_: any, args: { input: { applicationId: string; approved: boolean; adminNote?: string } }): Promise<Payload> => {
        try {
            const { ApplicationProcessingService } = await import('../../../helpers/application-processing');
            await ApplicationProcessingService.validatePendingApplication(args.input.applicationId, args.input.approved, args.input.adminNote);
            return { success: true };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw returnError(error);
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendConsultantContract: async (_: any, args: { input: { applicationId: string; contractUrl: string } }): Promise<Payload> => {
        try {
            const { ApplicationProcessingService } = await import('../../../helpers/application-processing');
            await ApplicationProcessingService.sendConsultantContract(args.input.applicationId, args.input.contractUrl);
            return { success: true };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw returnError(error);
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submitApplicationFeedback: async (_: any, args: { input: { applicationId: string; matchScoreAccuracy?: number; comments?: string; criteriaFeedback?: string; wasHired: boolean } }, context: any): Promise<Payload> => {
        try {
            const user = context.req.session.user as User;
            const { ApplicationFeedback } = await import('../../../database/entities');

            const feedback = ApplicationFeedback.create({
                application: { id: args.input.applicationId } as Application,
                reviewedBy: user.id,
                reviewerType: user.admin ? 'ADMIN' : 'CLIENT',
                matchScoreAccuracy: args.input.matchScoreAccuracy,
                comments: args.input.comments,
                criteriaFeedback: args.input.criteriaFeedback ? JSON.parse(args.input.criteriaFeedback) : null,
                wasHired: args.input.wasHired,
            });

            await feedback.save();
            return { success: true };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw returnError(error);
        }
    },
};

// ============= QUERIES À AJOUTER =============

export const newQueries = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getCVTransmissionLogs: async (_: any, args: { applicationId: string }): Promise<any[]> => {
        try {
            const { TransmissionLogService } = await import('../../../helpers/transmission-log');
            return await TransmissionLogService.getLogsForApplication(args.applicationId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw returnError(error);
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getApplicationFeedbacks: async (_: any, args: { applicationId: string }): Promise<any[]> => {
        try {
            const { ApplicationFeedback } = await import('../../../database/entities');
            return await ApplicationFeedback.find({
                where: { application: { id: args.applicationId } },
                order: { createdAt: 'DESC' },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw returnError(error);
        }
    },
};

// ============= GUARDS À AJOUTER DANS resolversComposition =============

export const newGuards = {
    'Mutation.validatePendingApplication': ['graphqlGuard(["admin"])'],
    'Mutation.sendConsultantContract': ['graphqlGuard(["admin"])'],
    'Mutation.submitApplicationFeedback': ['graphqlGuard(["admin", "company"])'],
    'Query.getCVTransmissionLogs': ['graphqlGuard(["admin"])'],
    'Query.getApplicationFeedbacks': ['graphqlGuard(["admin", "company"])'],
};
