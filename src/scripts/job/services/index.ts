import { Between } from 'typeorm';
import { Job } from '../../../database/entities';
import AppDataSource from '../../../database';
import transporter from '../../../helpers/mailer';
import path from 'path';

const sendJobEmail = async (job: Job) => {
    await transporter.sendMail({
        from: 'Talenteed.io ' + process.env.MAILUSER,
        to: job.company.user.email,
        subject: 'Job expiration',
        template: 'index',
        context: {
            title: `Hi ${job.company.user.name}`,
            message: `The job ${job.title} will expire after 3 days.`,
            host: process.env.FRONTEND_HOST,
            imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
            imageTitle: 'Job expiration',
            backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
};

export const checkJobExpiration = async () => {
    const jobRepository = AppDataSource.getRepository(Job);

    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    threeDaysLater.setHours(0, 0, 0, 0);

    const nextDay = new Date(threeDaysLater);
    nextDay.setDate(nextDay.getDate() + 1);

    const expiringJobs = await jobRepository.find({
        where: {
            expirationDate: Between(threeDaysLater, nextDay),
        },
        relations: ['company.user'],
    });

    for (const job of expiringJobs) {
        await sendJobEmail(job);
    }
};
