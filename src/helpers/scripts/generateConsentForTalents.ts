import { generateConsentForTalent } from '../generatePdf';

import { Talent, Media, STATUS } from '../../database/entities';
import AppDataSource from '../../database';

const generate = async () => {
    try {
        await AppDataSource.initialize();

        const talents = await Talent.find({ relations: ['user'] });

        for (const talent of talents) {
            const { fileUrl, fileName, fileType }: { fileUrl: string; fileName: string; fileType: string } = await generateConsentForTalent(talent, talent.user);

            const consent = Media.create({
                fileUrl,
                fileName,
                fileType,
            });
            await consent.save();

            talent.consent = consent;
            talent.status = STATUS.PUBLIC;

            await Talent.save(talent);
        }
    } catch (error) {
        console.log(error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
};

generate();
