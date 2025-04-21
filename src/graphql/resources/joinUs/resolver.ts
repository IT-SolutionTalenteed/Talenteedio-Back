import path from 'path';
import { composeResolvers } from '@graphql-tools/resolvers-composition';

import transporter from '../../../helpers/mailer';
import recaptchaGuard from '../../middleware/recaptcha-guard';
import { JoinUsForm } from '../../../type';
import { Admin } from '../../../database/entities';

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        joinUs: async (_: any, args: { input: JoinUsForm }): Promise<string> => {
            try {
                const admins = await Admin.find({ where: {}, relations: ['user'] });

                await Promise.all(
                    admins.map(async (admin) => {
                        await transporter.sendMail({
                            from: 'Talenteed.io ' + process.env.MAILUSER,
                            to: admin.user.email,
                            subject: 'Become a member',
                            template: 'index',
                            context: {
                                title: 'Become member request',
                                message: `
                                <div>
                                    <h5>Company</h5>
                                    <p>Social Reason : ${args.input.socialReason}</p>
                                    <p>Adress : ${args.input.address}</p>
                                    <br />
                                    <h5>Referent</h5>
                                    <p>First name : ${args.input.firstName}</p>
                                    <p>Last name : ${args.input.lastName}</p>
                                    <p>Email : ${args.input.professionalEmail}</p>
                                    <p>Role : ${args.input.role}</p>
                                    <p>Phone : ${args.input.phone}</p>
                                    <br />
                                    <h5>Why become a member</h5>
                                    <p>Motivation : ${args.input.motivation}</p>
                                    <p>Interested event topics :</p>
                                    <ul>
                                        ${args.input.events.map((topic) => `<li>${topic.title}</li>`).join('')}
                                    </ul>
                                    <p>Other topics : ${args.input.otherTopics}</p>
                                </div>
                            `,
                                host: process.env.FRONTEND_HOST,
                                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                imageTitle: 'Welcome aboard',
                                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                            },
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any);

                        return admin;
                    })
                );

                return 'Request sent successfully!';
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                console.log(error);
                throw new Error(error);
            }
        },
    },
};

const resolversComposition = {
    'Query.joinUs': [recaptchaGuard],
};

export default composeResolvers(resolver, resolversComposition);
