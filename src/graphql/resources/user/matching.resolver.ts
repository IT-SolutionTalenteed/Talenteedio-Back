import { Arg, Mutation, Resolver } from 'type-graphql';
import { Company } from '../../../database/entities/Company';
import { Job } from '../../../database/entities/Job';
import { User } from '../../../database/entities/User';
import { matchProfileWithCompany } from '../../../helpers/ai/profile-company-matcher';
import { matchCVWithJob, extractCVText } from '../../../helpers/ai/cv-matcher';
import { In } from 'typeorm';

interface CompanyMatchScore {
    companyId: string;
    companyName: string;
    companyLogo: string | null;
    companyDescription: string;
    companySector: string;
    matchPercentage: number;
    strengths: string[];
    gaps: string[];
    recommendation: string;
    matchingJobs: JobMatchScore[];
}

interface JobMatchScore {
    jobId: string;
    jobTitle: string;
    matchPercentage: number;
    strengths: string[];
    gaps: string[];
}

@Resolver()
export class MatchingResolver {
    /**
     * Matcher un profil utilisateur avec toutes les companies et leurs jobs
     * Retourne les companies triées par score de matching
     */
    @Mutation(() => String)
    async matchTalentWithCompanies(
        @Arg('userId') userId: string,
        @Arg('cvText', { nullable: true }) cvText?: string
    ): Promise<string> {
        try {
            // 1. Récupérer l'utilisateur avec ses préférences
            const user = await User.findOne({
                where: { id: userId },
                relations: ['values', 'cv']
            });

            if (!user) {
                throw new Error('User not found');
            }

            // 2. Extraire le texte du CV si disponible
            let extractedCvText = cvText || '';
            if (!extractedCvText && user.cv) {
                try {
                    // Construire le chemin du fichier CV
                    const cvPath = `./public/uploads/${user.cv}`;
                    extractedCvText = await extractCVText(cvPath);
                } catch (error) {
                    console.error('Error extracting CV text:', error);
                }
            }

            // 3. Construire le profil du talent
            const profileText = `
${extractedCvText}

Compétences: ${user.competences || 'Non spécifié'}
Langues: ${user.languages || 'Non spécifié'}
Formation: ${user.formations || 'Non spécifié'}
Intérêts: ${user.interests || 'Non spécifié'}
Expérience: ${user.yearsOfExperience || 0} ans
            `.trim();

            const profileSkills = user.competences ? user.competences.split(',').map(s => s.trim()) : [];
            const profileInterests = user.interests ? user.interests.split(',').map(s => s.trim()) : [];
            const targetSectors = user.desiredSector ? user.desiredSector.split(',').map(s => s.trim()) : [];

            // 4. Récupérer toutes les companies actives avec leurs jobs
            const companies = await Company.find({
                where: { status: 'public' as any },
                relations: ['logo', 'jobs', 'jobs.skills', 'category']
            });

            if (companies.length === 0) {
                return JSON.stringify({ matches: [], message: 'No companies found' });
            }

            // 5. Matcher avec chaque company
            const companyMatches: CompanyMatchScore[] = [];

            for (const company of companies) {
                try {
                    // Récupérer les jobs actifs de la company
                    const activeJobs = company.jobs?.filter(job => job.status === 'public') || [];
                    const jobTitles = activeJobs.map(job => job.title);

                    // Matcher le profil avec la company
                    const companyMatch = await matchProfileWithCompany({
                        profileText,
                        profileTitle: user.desiredPosition || 'Talent',
                        profileSkills,
                        profileInterests,
                        targetSectors,
                        companyName: company.company_name,
                        companyDescription: company.description || company.about || '',
                        companySector: company.sector || company.industry || company.category?.name || '',
                        companyJobs: jobTitles
                    });

                    // Matcher avec chaque job de la company
                    const jobMatches: JobMatchScore[] = [];
                    for (const job of activeJobs) {
                        try {
                            const jobMatch = await matchCVWithJob({
                                cvText: extractedCvText,
                                jobTitle: job.title,
                                jobDescription: job.content,
                                jobSkills: job.skills?.map(s => s.name) || [],
                                experienceRequired: job.experience || 0
                            });

                            jobMatches.push({
                                jobId: job.id,
                                jobTitle: job.title,
                                matchPercentage: jobMatch.overall_match_percentage,
                                strengths: jobMatch.strengths,
                                gaps: jobMatch.gaps
                            });
                        } catch (error) {
                            console.error(`Error matching job ${job.id}:`, error);
                        }
                    }

                    // Calculer le score moyen si des jobs matchent
                    const avgJobScore = jobMatches.length > 0
                        ? jobMatches.reduce((sum, j) => sum + j.matchPercentage, 0) / jobMatches.length
                        : 0;

                    // Score final = moyenne pondérée (70% company, 30% jobs)
                    const finalScore = companyMatch.overall_match_percentage * 0.7 + avgJobScore * 0.3;

                    companyMatches.push({
                        companyId: company.id,
                        companyName: company.company_name,
                        companyLogo: company.logo?.url || null,
                        companyDescription: company.description || company.about || '',
                        companySector: company.sector || company.industry || '',
                        matchPercentage: Math.round(finalScore),
                        strengths: companyMatch.strengths,
                        gaps: companyMatch.gaps,
                        recommendation: companyMatch.recommendation,
                        matchingJobs: jobMatches.sort((a, b) => b.matchPercentage - a.matchPercentage)
                    });
                } catch (error) {
                    console.error(`Error matching company ${company.id}:`, error);
                }
            }

            // 6. Trier par score décroissant et retourner le top 10
            const sortedMatches = companyMatches
                .sort((a, b) => b.matchPercentage - a.matchPercentage)
                .slice(0, 10);

            return JSON.stringify({
                matches: sortedMatches,
                totalCompaniesAnalyzed: companies.length,
                message: 'Matching completed successfully'
            });
        } catch (error) {
            console.error('Error in matchTalentWithCompanies:', error);
            throw new Error(`Matching failed: ${error.message}`);
        }
    }
}
