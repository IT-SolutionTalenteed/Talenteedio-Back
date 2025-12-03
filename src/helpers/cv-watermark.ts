import { PDFDocument, rgb, degrees } from 'pdf-lib';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export interface WatermarkOptions {
    text?: string;
    opacity?: number;
    fontSize?: number;
    color?: { r: number; g: number; b: number };
}

export class CVWatermarkService {
    /**
     * Ajoute un filigrane sur un PDF
     * @param pdfUrl URL du PDF original
     * @param options Options de personnalisation du filigrane
     * @returns Buffer du PDF avec filigrane
     */
    static async addWatermark(pdfUrl: string, options: WatermarkOptions = {}): Promise<Buffer> {
        try {
            // Options par défaut
            const watermarkText = options.text || `Transmis par SolutionTalentIT - ${new Date().toLocaleDateString('fr-FR')} - Confidentiel`;
            const opacity = options.opacity || 0.3;
            const fontSize = options.fontSize || 40;
            const color = options.color || { r: 0.7, g: 0.7, b: 0.7 };

            // Télécharger le PDF
            let pdfBytes: Buffer;
            
            if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
                const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
                pdfBytes = Buffer.from(response.data);
            } else {
                // Si c'est un chemin local
                pdfBytes = await fs.readFile(pdfUrl);
            }

            // Charger le PDF
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pages = pdfDoc.getPages();

            // Ajouter le filigrane sur chaque page
            for (const page of pages) {
                const { width, height } = page.getSize();
                
                // Calculer la position pour centrer le texte en diagonal
                const textWidth = watermarkText.length * (fontSize * 0.5);
                const x = width / 2;
                const y = height / 2;

                // Dessiner le texte en diagonal
                page.drawText(watermarkText, {
                    x: x - textWidth / 2,
                    y: y,
                    size: fontSize,
                    color: rgb(color.r, color.g, color.b),
                    opacity: opacity,
                    rotate: degrees(-45),
                });
            }

            // Sauvegarder le PDF modifié
            const modifiedPdfBytes = await pdfDoc.save();
            return Buffer.from(modifiedPdfBytes);
        } catch (error) {
            console.error('Error adding watermark to PDF:', error);
            throw new Error('Failed to add watermark to PDF');
        }
    }

    /**
     * Sauvegarde un PDF avec filigrane dans le système de fichiers
     * @param pdfUrl URL du PDF original
     * @param outputPath Chemin de sortie
     * @param options Options de personnalisation
     * @returns Chemin du fichier sauvegardé
     */
    static async addWatermarkAndSave(pdfUrl: string, outputPath: string, options: WatermarkOptions = {}): Promise<string> {
        const watermarkedPdf = await this.addWatermark(pdfUrl, options);
        
        // Créer le dossier si nécessaire
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });
        
        // Sauvegarder le fichier
        await fs.writeFile(outputPath, watermarkedPdf);
        
        return outputPath;
    }
}
