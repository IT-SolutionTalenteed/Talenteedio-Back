/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import jsdom from 'jsdom';
import htmlToPdfmake from 'html-to-pdfmake';
import { CV, LM, Talent, User, Value } from '../database/entities';
import { mkdirp } from 'mkdirp';

dotenv.config();

const { JSDOM } = jsdom;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { window } = new JSDOM('');

// Load the font files
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const getImageBase64 = (path: string) => {
    return fs.readFileSync(path, { encoding: 'base64' });
};

const setHeaderAndFooter = () => {
    // Read the image file from disk and convert to base64
    const headerImageBase64 = getImageBase64(path.join(__dirname, '..', '..', 'public', 'assets', 'img', 'PDFHeader.png'));
    const footerImageBase64 = getImageBase64(path.join(__dirname, '..', '..', 'public', 'assets', 'img', 'PDFFooter.png'));

    return {
        pageMargins: [40, 80, 40, 40],
        defaultStyle: {
            fontSize: 9,
        },
        header: function (currentPage: any, pageCount: any, pageSize: { width: any }) {
            return {
                stack: [
                    { image: `data:image/jpeg;base64,${headerImageBase64}`, width: pageSize.width }, // Image in the header
                ],
            };
        },
        footer: function (currentPage: any, pageCount: any, pageSize: { width: any }) {
            return {
                stack: [
                    { image: `data:image/jpeg;base64,${footerImageBase64}`, width: pageSize.width }, // Image in the header
                ],
            };
        },
    };
};

const getData = (data: any) => {
    return data
        ? [
              {
                  ul: data.map((e: any) => {
                      return { text: e.text ?? e.name ?? e.title };
                  }),
              },
          ]
        : [];
};

const getExperiences = (experiences: any) => {
    return experiences?.length
        ? experiences.map((experience: any) => {
              const description = htmlToPdfmake(experience.description, window);

              return [
                  { text: `${experience.start || '-'} to ${experience.end || '-'} : ${experience.title ?? ''}`, style: { bold: true }, margin: [0, 0, 0, 10] },
                  description ?? '', //
              ];
          })
        : [];
};

export const generateCVtoPdf = async (cv: CV) => {
    return new Promise((res: (value: string) => void) => {
        const docDefinition = {
            ...setHeaderAndFooter(),
            content: [
                { text: cv.title, style: 'h1' },
                { text: cv.description, style: 'description' },
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595 - 80, y2: 5 }] }, //
                { text: 'Experiences', style: 'h2' },
                ...getExperiences(cv.experiences),
                { text: 'Diplomas', style: 'h2' },
                ...getData(cv.diplomas),
                { text: 'Skills', style: 'h2' },
                ...getData(cv.skills),
                { text: 'Values', style: 'h2' },
                ...getData(cv.talent.values),
                { text: 'Languages', style: 'h2' },
                ...getData(cv.languages),
            ],
            styles: {
                h1: {
                    fontSize: 20,
                    alignment: 'center',
                    color: '#1ba1f4',
                    bold: true,
                },
                description: {
                    alignment: 'center',
                    margin: [0, 0, 0, 10],
                },
                h2: {
                    fontSize: 14,
                    color: '#1ba1f4',
                    bold: true,
                    margin: [0, 10],
                },
            },
        };

        const pdfDocGenerator = pdfMake.createPdf(docDefinition as any);

        // Convert the PDF to a base64 string
        pdfDocGenerator.getBase64((dataUri: string) => {
            res(dataUri);
        });
    });
};

export const generateLMtoPdf = async (lm: LM) => {
    return new Promise((res: (value: string) => void) => {
        const text = htmlToPdfmake(lm.content, window);

        const docDefinition = {
            ...setHeaderAndFooter(),
            content: [text],
        };

        const pdfDocGenerator = pdfMake.createPdf(docDefinition as any);

        // Convert the PDF to a base64 string
        pdfDocGenerator.getBase64((dataUri: string) => {
            res(dataUri);
        });
    });
};

export const generateConsent = async (name?: string, date?: string) => {
    return new Promise((res: (value: string) => void) => {
        const docDefinition = {
            ...setHeaderAndFooter(),
            content: [
                { text: 'Consentement concernant le traitement des données personnelles', style: 'h1' },
                {
                    text: `
                        La protection de vos données personnelles est une priorité pour Solution Talenteed. Afin que Solution Talenteed puisse traiter vos données personnelles et les détails de votre salaire et que nous puissions proposer votre profil et transférer vos données personnelles à nos clients/clients potentiels et partenaires dans le cadre de votre recherche d’emploi, nous avons besoin de votre consentement.

                        Donnez-nous également votre consentement afin d’être tenu au courant de nos formations, de nos conseils d’emploi et de nos études sur le marché du travail. De cette façon vous ne raterez aucune opportunité.

                        Merci de lire attentivement les quatre paragraphes ci-dessous, de cocher la ou les case(s) qui vous convie(nne)nt et de nous transmettre ce formulaire signé :

                        O* Je donne ma permission à Solution Talenteed pour le traitement de mes données personnelles pour une mission de recherche d’emploi, en leur donnant ainsi, le droit de proposer et transférer mes données personnelles à leurs clients et partenaires ; pour l’évaluation (y compris automatisée) des profils et des compétences professionnelles, pour l’évaluation de mon développement individuel et de mes plans de carrière. 
                        
                        O* J'accepte que Solution Talenteed puisse traiter mon casier judiciaire, conformément aux dispositions légales, dans le cas d’une base légale.

                        O* Je donne ma permission d’utiliser mes coordonnées pour des bulletins d'information et des campagnes marketing (p.ex. des concours, des événements de Solution Talenteed, des études de marché, la communication interactive et des études envoyées par email, sms, app et mms ou tout autre support.

                        O* Je donne la permission à Solution Talenteed d'utiliser mes coordonnées pour me proposer des formations additionnelles.

                        Si je désire plus d’informations sur le traitement de mes données personnelles ou l’exécution de mes droits individuels, je peux contacter Solution Talenteed.
                    `,
                    style: 'text',
                },
                { text: `Date           :    ${date ? date : ''}`, style: 'date' },
                { text: `Signature  :    ${name ? name : ''}`, style: 'signature' },
            ],
            styles: {
                h1: {
                    fontSize: 18,
                    alignment: 'center',
                    color: '#1ba1f4',
                    bold: true,
                    margin: [0, 0, 0, 20],
                },
                text: {
                    fontSize: 12,
                    margin: [0, 0, 0, 30],
                },
                date: {
                    fontSize: 12,
                    margin: [0, 0, 0, 15],
                },
                signature: {
                    fontSize: 12,
                },
            },
        };

        const pdfDocGenerator = pdfMake.createPdf(docDefinition as any);

        // Convert the PDF to a base64 string
        pdfDocGenerator.getBase64((dataUri: string) => {
            res(dataUri);
        });
    });
};

export const generateConsentForTalent = async (talent: Talent, user: User) => {
    const dataUri = await generateConsent(user.name, new Date().toLocaleDateString('en-FR'));

    const buffer = Buffer.from(dataUri.substring(dataUri.indexOf('base64')) + 7, 'base64');

    const directoryPath = path.join(__dirname, '..', '..', 'public', 'uploads');

    mkdirp.sync(directoryPath);

    await fs.promises.writeFile(path.join(__dirname, '..', '..', 'public', 'uploads', `${talent.id}-consent.pdf`), buffer, { flag: 'w' });

    const fileUrl = new URL(path.join(process.env.HOST as string, 'public', 'uploads', `${talent.id}-consent.pdf`)).toString();

    return {
        fileUrl,
        fileName: `${user.name}-consent`,
        fileType: 'application/pdf',
    };
};
