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
 * Utilise le même système que le matching CV/Job mais adapté pour profil/entreprise
 */
export async function matchProfileWithCompany(input: CompanyMatchInput): Promise<CompanyMatchResult> {
    return new Promise((resolve, reject) => {
        // Utiliser le script Python existant avec des paramètres adaptés
        const pythonScript = path.join(__dirname, '../../../ai-service/cv_job_matcher.py');
        
        // Construire une "description de job" virtuelle basée sur l'entreprise
        const virtualJobDescription = `
Entreprise: ${input.companyName}
Secteur: ${input.companySector}
Description: ${input.companyDescription}
${input.companyJobs && input.companyJobs.length > 0 ? `Postes disponibles: ${input.companyJobs.join(', ')}` : ''}
        `.trim();
        
        const args = [
            pythonScript,
            '--cv', input.profileText,
            '--job-title', input.profileTitle,
            '--job-description', virtualJobDescription,
        ];
        
        if (input.profileSkills && input.profileSkills.length > 0) {
            args.push('--job-skills', input.profileSkills.join(','));
        }
        
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
                console.error('Python script error:', stderr);
                reject(new Error(`Python script failed with code ${code}: ${stderr}`));
                return;
            }
            
            try {
                const result: CompanyMatchResult = JSON.parse(stdout);
                resolve(result);
            } catch (error) {
                console.error('Failed to parse Python output:', stdout);
                reject(new Error(`Failed to parse AI response: ${error}`));
            }
        });
        
        pythonProcess.on('error', (error) => {
            console.error('Failed to start Python process:', error);
            reject(new Error(`Failed to start AI service: ${error.message}`));
        });
    });
}
