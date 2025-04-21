import fs from 'fs';
import path from 'path';

import { generateConsent } from '../generatePdf';

const generate = async () => {
    try {
        const dataUri = await generateConsent();

        const buffer = Buffer.from(dataUri.substring(dataUri.indexOf('base64')) + 7, 'base64');

        await fs.promises.writeFile(path.join(__dirname, '..', '..', '..', 'public', 'assets', 'talent_consent.pdf'), buffer, { flag: 'w' });
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

generate();
