import { spawn } from 'child_process';
import path from 'path';

export interface CompanyMatchInput {
    profileText: string; // CV + compétences + intérêts
    profileTitle: string;
    profileSkills: string[];
    profileInterests: string[];
    targetSectors: string[];
    companyName: string;
    companyDescription: string;
    companySector: string;
    companyJobs?: string[]; // Titres des jobs actifs de l'entreprise
}

export interface CompanyMatchResult {
    overall_match_percentage: number;
    criteria_scores: Array<{
        criterion: string;
        score: number;
        explanation: string;
    }>;
    strengths: string[];
    gaps: string[];
    recommendation: string;
}

/**
 * Match un profil candidat avec une entreprise
 * Analyse le profil complet du candidat (CV, compétences, intérêts) 
 * contre toutes les informations de l'entreprise (description, secteur, jobs publiés)
 */
export async function matchProfileWithCompany(input: CompanyMatchInput): Promise<CompanyMatchResult> {
    return new Promise((resolve, reject) => {
        // Utiliser le script Python existant avec des paramètres adaptés
        const pythonScript = path.join(__dirname, '../../../ai-service/cv_job_matcher.py');
        
        // Construire une description complète de l'entreprise incluant TOUS les jobs
        let virtualJobDescription = `
Entreprise: ${input.companyName}
Secteur: ${input.companySector}
Description: ${input.companyDescription}
        `.trim();
        
        // Ajouter tous les jobs disponibles avec leurs détails
        if (input.companyJobs && input.companyJobs.length > 0) {
            virtualJobDescription += `\n\nPOSTES DISPONIBLES DANS L'ENTREPRISE:\n`;
            input.companyJobs.forEach((job, index) => {
                virtualJobDescription += `\n${index + 1}. ${job}`;
            });
        } else {
            virtualJobDescription += `\n\nAucun poste publié actuellement.`;
        }
        
        // Ajouter les secteurs ciblés par le candidat pour contexte
        if (input.targetSectors && input.targetSectors.length > 0) {
            virtualJobDescription += `\n\nSecteurs recherchés par le candidat: ${input.targetSectors.join(', ')}`;
        }
        
        const args = [
            pythonScript,
            '--cv', input.profileText,
            '--job-title', input.profileTitle,
            '--job-description', virtualJobDescription,
        ];
        
        // Ajouter les compétences du candidat
        if (input.profileSkills && input.profileSkills.length > 0) {
            args.push('--job-skills', input.profileSkills.join(','));
        }
        
        console.log(`[AI Matching] Starting match for: ${input.companyName}`);
        console.log(`[AI Matching] Jobs count: ${input.companyJobs?.length || 0}`);
        
        const pythonProcess = spawn('python3', args);
        
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`[AI Matching] Python script error for ${input.companyName}:`, stderr);
                reject(new Error(`Python script failed with code ${code}: ${stderr}`));
                return;
            }
            
            try {
                const result: CompanyMatchResult = JSON.parse(stdout);
                console.log(`[AI Matching] Success for ${input.companyName}: ${result.overall_match_percentage}%`);
                resolve(result);
            } catch (error) {
                console.error(`[AI Matching] Failed to parse output for ${input.companyName}:`, stdout);
                reject(new Error(`Failed to parse AI response: ${error}`));
            }
        });
        
        pythonProcess.on('error', (error) => {
            console.error(`[AI Matching] Failed to start Python process for ${input.companyName}:`, error);
            reject(new Error(`Failed to start AI service: ${error.message}`));
        });
    });
}
