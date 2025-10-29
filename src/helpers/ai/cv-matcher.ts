import { spawn } from 'child_process';
import path from 'path';

export interface MatchCriteria {
    criterion: string;
    score: number;
    explanation: string;
}

export interface MatchResult {
    overall_match_percentage: number;
    criteria_scores: MatchCriteria[];
    strengths: string[];
    gaps: string[];
    recommendation: string;
}

export interface CVMatchInput {
    cvText: string;
    jobTitle: string;
    jobDescription: string;
    jobRequirements?: string;
    jobSkills?: string[];
    experienceRequired?: number;
}

/**
 * Call Python AI service to match CV with job posting
 * @param input - CV and job details
 * @returns Promise with match result including percentage
 */
export async function matchCVWithJob(input: CVMatchInput): Promise<MatchResult> {
    return new Promise((resolve, reject) => {
        // Point to the ai-service directory
        const pythonScript = path.join(__dirname, '../../../ai-service/cv_job_matcher.py');
        
        const args = [
            pythonScript,
            '--cv', input.cvText,
            '--job-title', input.jobTitle,
            '--job-description', input.jobDescription,
        ];
        
        if (input.jobRequirements) {
            args.push('--job-requirements', input.jobRequirements);
        }
        
        if (input.jobSkills && input.jobSkills.length > 0) {
            args.push('--job-skills', input.jobSkills.join(','));
        }
        
        if (input.experienceRequired !== undefined) {
            args.push('--experience', input.experienceRequired.toString());
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
                const result: MatchResult = JSON.parse(stdout);
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

/**
 * Extract text content from CV file URL
 * This is a placeholder - you'll need to implement actual CV text extraction
 * based on your file storage system (e.g., PDF parsing, DOCX parsing, etc.)
 */
export async function extractCVText(cvFileUrl: string): Promise<string> {
    // TODO: Implement actual CV text extraction
    // For now, return a placeholder
    // You might want to use libraries like:
    // - pdf-parse for PDF files
    // - mammoth for DOCX files
    // - Or call an external service
    
    throw new Error('CV text extraction not yet implemented. Please implement extractCVText() function.');
}
