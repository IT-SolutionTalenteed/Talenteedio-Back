import path from 'path';
import fs from 'fs';
import axios from 'axios';
import * as mkdirp from 'mkdirp';

import { createSafeUrlFromTitle } from '../utils';
import { generateCVtoPdf } from '../generatePdf';

import { CV } from '../../database/entities';
import AppDataSource from '../../database';

const exportCVs = async () => {
    try {
        await AppDataSource.initialize();

        const cvs = await CV.find({ relations: ['talent', 'file', 'talent.values'] });

        const directoryPath = path.join(__dirname, '..', '..', '..', 'exports', 'cv');

        mkdirp.sync(directoryPath);

        await Promise.allSettled(
            cvs.map(async (cv) => {
                const filepath = path.join(directoryPath, createSafeUrlFromTitle(cv.title + cv.id) + '.pdf');

                if (cv.file?.fileUrl) {
                    const url = cv.file.fileUrl.replace('https://www.talenteed.io', 'http://localhost:8080');

                    const response = await axios({
                        method: 'GET',
                        url,
                        responseType: 'arraybuffer',
                    });

                    fs.writeFileSync(filepath, response.data);
                } else {
                    const pdfBase64 = await generateCVtoPdf(cv);

                    const decodedData = Buffer.from(pdfBase64, 'base64');

                    fs.writeFileSync(filepath, decodedData);
                }

                return cv;
            })
        );
    } catch (error) {
        console.log(error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
};

exportCVs();
