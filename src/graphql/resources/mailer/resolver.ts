import path from 'path';
import { composeResolvers } from '@graphql-tools/resolvers-composition';

import transporter from '../../../helpers/mailer';
import recaptchaGuard from '../../middleware/recaptcha-guard';

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendMail: async (_: any, args: { to: string; subject: string; message: string; name: string; email: string }): Promise<string> => {
            try {
                const message = args.message.replace(/(\r\n|\n|\r)/gm, '<br>');

                await transporter.sendMail({
                    from: 'Talenteed.io ' + process.env.MAILUSER,
                    to: args.to,
                    subject: args.subject,
                    template: 'contact',
                    context: {
                        name: args.name,
                        email: args.email,
                        message: message,
                        host: process.env.FRONTEND_HOST,
                        imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any);

                return 'Mail Sent!';
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                console.log(error);
                throw new Error(error);
            }
        },
    },
};

const resolversComposition = {
    'Query.sendMail': [recaptchaGuard],
};

export default composeResolvers(resolver, resolversComposition);
