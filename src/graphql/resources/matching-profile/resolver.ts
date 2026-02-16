import { MatchingProfile, MatchingProfileStatus } from '../../../database/entities/MatchingProfile';
import { CompanyMatch } from '../../../database/entities/CompanyMatch';
import { CompanyAppointment, AppointmentStatus } from '../../../database/entities/CompanyAppointment';
import { Company } from '../../../database/entities/Company';
import { Category, MODEL } from '../../../database/entities/Category';
import { Skill } from '../../../database/entities/Skill';
import { User } from '../../../database/entities/User';
import { Media } from '../../../database/entities/Media';
import { Job } from '../../../database/entities/Job';
import { STATUS } from '../../../database/entities/Status';
import { createGraphQLError } from 'graphql-yoga';
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '../../../helpers/error-constants';
import { matchProfileWithCompany } from '../../../helpers/ai/profile-company-matcher';
import { extractCVText } from '../../../helpers/ai/cv-matcher';
import { In } from 'typeorm';

const relations = ['user', 'cv', 'currentSector'];

export default {
    Query: {
        // Récupérer tous les profils de matching de l'utilisateur
        getMyMatchingProfiles: async (_: any, __: any, context: any): Promise<MatchingProfile[]> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            return await MatchingProfile.find({
                where: { userId: user.id },
                relations,
                order: { createdAt: 'DESC' },
            });
        },

        // Récupérer un profil de matching spécifique
        getMatchingProfile: async (_: any, args: { id: string }, context: any): Promise<MatchingProfile> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            const profile = await MatchingProfile.findOne({
                where: { id: args.id, userId: user.id },
                relations,
            });

            if (!profile) {
                throw createGraphQLError('Matching profile not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
            }

            return profile;
        },

        // Récupérer les entreprises matchées pour un profil
        getMatchedCompanies: async (_: any, args: { matchingProfileId: string }, context: any): Promise<any[]> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            // Vérifier que le profil appartient à l'utilisateur
            const profile = await MatchingProfile.findOne({
                where: { id: args.matchingProfileId, userId: user.id },
            });

            if (!profile) {
                throw createGraphQLError('Matching profile not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
            }

            const matches = await CompanyMatch.find({
                where: { matchingProfileId: args.matchingProfileId },
                relations: ['company', 'company.logo', 'company.category', 'company.contact'],
                order: { matchScore: 'DESC' },
            });

            return matches;
        },

        // Récupérer les rendez-vous d'un profil
        getProfileAppointments: async (_: any, args: { matchingProfileId: string }, context: any): Promise<CompanyAppointment[]> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            const profile = await MatchingProfile.findOne({
                where: { id: args.matchingProfileId, userId: user.id },
            });

            if (!profile) {
                throw createGraphQLError('Matching profile not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
            }

            return await CompanyAppointment.find({
                where: { matchingProfileId: args.matchingProfileId },
                relations: ['company', 'company.logo', 'company.contact'],
                order: { appointmentDate: 'ASC', appointmentTime: 'ASC' },
            });
        },

        // Récupérer les secteurs disponibles (catégories de type COMPANY)
        getAvailableSectors: async (): Promise<Category[]> => {
            return await Category.find({
                where: { 
                    model: MODEL.COMPANY,
                    status: STATUS.PUBLIC 
                },
                order: { name: 'ASC' },
            });
        },

        // Récupérer les compétences disponibles
        getAvailableSkills: async (): Promise<Skill[]> => {
            return await Skill.find({
                where: { status: STATUS.PUBLIC },
                order: { name: 'ASC' },
            });
        },

        // Récupérer tous les rendez-vous (pour l'admin)
        getAllAppointments: async (_: any, __: any, context: any): Promise<CompanyAppointment[]> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            // Vérifier que l'utilisateur est admin
            // TODO: Ajouter une vérification de rôle appropriée
            
            return await CompanyAppointment.find({
                relations: ['company', 'company.logo', 'company.contact', 'user', 'matchingProfile'],
                order: { createdAt: 'DESC' },
            });
        },

        // Récupérer un rendez-vous par ID
        getAppointmentById: async (_: any, args: { id: string }, context: any): Promise<CompanyAppointment | null> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            return await CompanyAppointment.findOne({
                where: { id: args.id },
                relations: ['company', 'company.logo', 'company.contact', 'user', 'matchingProfile'],
            });
        },

        // Récupérer les rendez-vous de l'entreprise connectée
        getMyCompanyAppointments: async (_: any, __: any, context: any): Promise<CompanyAppointment[]> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            console.log('[getMyCompanyAppointments] User ID:', user.id);

            // Charger l'utilisateur avec sa company
            const userWithCompany = await User.findOne({
                where: { id: user.id },
                relations: ['company'],
            });

            console.log('[getMyCompanyAppointments] User has company:', !!userWithCompany?.company);

            // Vérifier que l'utilisateur a une entreprise
            if (!userWithCompany || !userWithCompany.company) {
                throw createGraphQLError('User is not associated with a company', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
            }

            console.log('[getMyCompanyAppointments] Company ID:', userWithCompany.company.id);

            const appointments = await CompanyAppointment.find({
                where: { companyId: userWithCompany.company.id },
                relations: ['company', 'company.logo', 'company.contact', 'user', 'matchingProfile'],
                order: { createdAt: 'DESC' },
            });

            console.log('[getMyCompanyAppointments] Found appointments:', appointments.length);
            if (appointments.length > 0) {
                console.log('[getMyCompanyAppointments] First appointment status:', appointments[0].status);
                console.log('[getMyCompanyAppointments] First appointment createdAt:', appointments[0].createdAt);
            }

            return appointments;
        },
    },

    Mutation: {
        // Créer ou mettre à jour un profil de matching (Étape 1)
        saveMatchingProfile: async (_: any, args: { input: any }, context: any): Promise<MatchingProfile> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            const { id, title, cvId, interests, skills, currentSectorId, targetSectorIds } = args.input;

            let profile: MatchingProfile;

            if (id) {
                // Mise à jour
                const existingProfile = await MatchingProfile.findOne({ where: { id, userId: user.id } });
                if (!existingProfile) {
                    throw createGraphQLError('Matching profile not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }
                profile = existingProfile;
            } else {
                // Création
                profile = new MatchingProfile();
                profile.userId = user.id;
            }

            profile.title = title;
            profile.interests = interests || [];
            profile.skills = skills || [];
            profile.targetSectorIds = targetSectorIds || [];

            if (cvId) {
                const cv = await Media.findOne({ where: { id: cvId } });
                if (!cv) {
                    throw createGraphQLError('CV not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }
                profile.cv = cv;

                // Extraire le texte du CV
                try {
                    const cvPath = cv.fileUrl.replace(process.env.BACKEND_HOST || '', './public');
                    profile.cvText = await extractCVText(cvPath);
                } catch (error) {
                    console.error('Error extracting CV text:', error);
                    profile.cvText = '';
                }
            }

            if (currentSectorId) {
                const sector = await Category.findOne({ where: { id: currentSectorId } });
                if (sector) {
                    profile.currentSector = sector;
                }
            }

            await profile.save();

            const savedProfile = await MatchingProfile.findOne({
                where: { id: profile.id },
                relations,
            });

            if (!savedProfile) {
                throw createGraphQLError('Failed to save profile', { extensions: { statusCode: 500 } });
            }

            return savedProfile;
        },

        // Lancer le matching avec les entreprises (Étape 2)
        matchProfileWithCompanies: async (_: any, args: { matchingProfileId: string }, context: any): Promise<any> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            const profile = await MatchingProfile.findOne({
                where: { id: args.matchingProfileId, userId: user.id },
                relations: ['cv', 'currentSector'],
            });

            if (!profile) {
                throw createGraphQLError('Matching profile not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
            }

            // Construire le texte du profil à partir des compétences et intérêts si pas de CV
            let profileText = profile.cvText || '';
            if (!profileText && (profile.skills?.length || profile.interests?.length)) {
                profileText = `Titre: ${profile.title}\n`;
                if (profile.skills?.length) {
                    profileText += `Compétences: ${profile.skills.join(', ')}\n`;
                }
                if (profile.interests?.length) {
                    profileText += `Centres d'intérêt: ${profile.interests.join(', ')}\n`;
                }
            }

            if (!profileText) {
                throw createGraphQLError('Profil incomplet. Veuillez ajouter un CV ou renseigner vos compétences et centres d\'intérêt.', { 
                    extensions: { statusCode: 400, statusText: BAD_REQUEST } 
                });
            }

            // Récupérer les entreprises des secteurs ciblés
            let companies: Company[] = [];
            
            if (profile.targetSectorIds && profile.targetSectorIds.length > 0) {
                // Rechercher les catégories qui correspondent aux secteurs ciblés (recherche par nom)
                const categories = await Category.find();
                const matchingCategoryIds = categories
                    .filter(cat => profile.targetSectorIds.some(sector => 
                        cat.name.toLowerCase().includes(sector.toLowerCase()) || 
                        sector.toLowerCase().includes(cat.name.toLowerCase())
                    ))
                    .map(cat => cat.id);

                if (matchingCategoryIds.length > 0) {
                    companies = await Company.find({
                        where: {
                            category: {
                                id: In(matchingCategoryIds),
                            },
                            status: 'public' as any,
                        },
                        relations: ['category', 'logo', 'contact', 'contact.address', 'jobs'],
                        take: 50,
                    });
                }
                
                // Si aucune entreprise trouvée avec les secteurs spécifiques, prendre toutes les entreprises
                if (companies.length === 0) {
                    console.log('No companies found for specified sectors, fetching all public companies');
                    companies = await Company.find({
                        where: { status: 'public' as any },
                        relations: ['category', 'logo', 'contact', 'contact.address', 'jobs'],
                        take: 50,
                    });
                }
            } else {
                // Si pas de secteur spécifié, prendre toutes les entreprises publiques
                companies = await Company.find({
                    where: { status: 'public' as any },
                    relations: ['category', 'logo', 'contact', 'contact.address', 'jobs'],
                    take: 50,
                });
            }

            if (companies.length === 0) {
                throw createGraphQLError('Aucune entreprise publique disponible pour le moment.', { 
                    extensions: { statusCode: 404, statusText: NOT_FOUND } 
                });
            }

            const matches: CompanyMatch[] = [];

            // Matcher avec chaque entreprise
            for (const company of companies) {
                try {
                    // Vérifier si un match existe déjà
                    let match = await CompanyMatch.findOne({
                        where: {
                            matchingProfileId: profile.id,
                            companyId: company.id,
                        },
                    });

                    // Construire la description de l'entreprise
                    const companyDescription = company.contact?.address?.city || company.company_name;
                    const companySector = company.category?.name || 'Non spécifié';
                    const companyJobs = company.jobs?.filter((j: Job) => j.status === 'public').map((j: Job) => j.title) || [];

                    // Appeler le service de matching
                    const matchResult = await matchProfileWithCompany({
                        profileText,
                        profileTitle: profile.title,
                        profileSkills: profile.skills || [],
                        profileInterests: profile.interests || [],
                        targetSectors: profile.targetSectorIds || [],
                        companyName: company.company_name,
                        companyDescription,
                        companySector,
                        companyJobs,
                    });

                    if (!match) {
                        match = new CompanyMatch();
                        match.matchingProfileId = profile.id;
                        match.companyId = company.id;
                    }

                    match.matchScore = matchResult.overall_match_percentage;
                    match.matchDetails = matchResult;

                    await match.save();
                    matches.push(match);
                } catch (error) {
                    console.error(`Error matching with company ${company.id}:`, error);
                    // Continuer avec les autres entreprises
                }
            }

            // Mettre à jour le statut du profil
            profile.status = MatchingProfileStatus.ACTIVE;
            await profile.save();

            return {
                success: true,
                matchCount: matches.length,
                message: `${matches.length} entreprises matchées avec succès`,
            };
        },

        // Sélectionner/désélectionner une entreprise
        toggleCompanySelection: async (_: any, args: { matchId: string; isSelected: boolean }, context: any): Promise<CompanyMatch> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            const match = await CompanyMatch.findOne({
                where: { id: args.matchId },
                relations: ['matchingProfile'],
            });

            if (!match) {
                throw createGraphQLError('Match not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
            }

            // Vérifier que le profil appartient à l'utilisateur
            if (match.matchingProfile.userId !== user.id) {
                throw createGraphQLError('Forbidden', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
            }

            match.isSelected = args.isSelected;
            await match.save();

            return match;
        },

        // Créer un rendez-vous avec une entreprise (Étape 3)
        createCompanyAppointment: async (_: any, args: { input: any }, context: any): Promise<CompanyAppointment> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            const { matchingProfileId, companyId, appointmentDate, appointmentTime, timezone, message } = args.input;

            // Vérifier que le profil appartient à l'utilisateur
            const profile = await MatchingProfile.findOne({
                where: { id: matchingProfileId, userId: user.id },
                relations: ['user'],
            });

            if (!profile) {
                throw createGraphQLError('Matching profile not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
            }

            // Vérifier que l'entreprise existe
            const company = await Company.findOne({ 
                where: { id: companyId },
                relations: ['contact']
            });
            if (!company) {
                throw createGraphQLError('Company not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
            }

            // Créer le rendez-vous
            const appointment = new CompanyAppointment();
            appointment.matchingProfileId = matchingProfileId;
            appointment.companyId = companyId;
            appointment.userId = user.id;
            appointment.appointmentDate = new Date(appointmentDate);
            appointment.appointmentTime = appointmentTime;
            appointment.timezone = timezone || 'Europe/Paris';
            appointment.message = message || '';
            appointment.status = AppointmentStatus.PENDING;

            await appointment.save();

            const savedAppointment = await CompanyAppointment.findOne({
                where: { id: appointment.id },
                relations: ['company', 'company.logo', 'company.contact', 'user'],
            });

            if (!savedAppointment) {
                throw createGraphQLError('Failed to save appointment', { extensions: { statusCode: 500 } });
            }

            // Envoyer les notifications par email
            try {
                const { sendAppointmentNotification } = await import('../../../helpers/mailer/send-appointment-notification');
                
                await sendAppointmentNotification({
                    candidateName: `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email,
                    candidateEmail: user.email,
                    companyName: company.company_name,
                    companyEmail: company.contact?.email || process.env.ADMIN_EMAIL || 'admin@talenteed.io',
                    adminEmail: process.env.ADMIN_EMAIL || 'admin@talenteed.io',
                    appointmentDate: appointmentDate,
                    appointmentTime: appointmentTime,
                    timezone: timezone || 'Europe/Paris',
                    message: message,
                    appointmentId: savedAppointment.id,
                });
            } catch (error) {
                console.error('Error sending appointment notification:', error);
                // Ne pas faire échouer la création si l'email échoue
            }

            return savedAppointment;
        },

        // Annuler un rendez-vous
        cancelAppointment: async (_: any, args: { appointmentId: string }, context: any): Promise<CompanyAppointment> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            const appointment = await CompanyAppointment.findOne({
                where: { id: args.appointmentId, userId: user.id },
            });

            if (!appointment) {
                throw createGraphQLError('Appointment not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
            }

            appointment.status = AppointmentStatus.CANCELLED;
            await appointment.save();

            const updatedAppointment = await CompanyAppointment.findOne({
                where: { id: appointment.id },
                relations: ['company', 'company.logo', 'company.contact'],
            });

            if (!updatedAppointment) {
                throw createGraphQLError('Failed to update appointment', { extensions: { statusCode: 500 } });
            }

            return updatedAppointment;
        },

        // Mettre à jour le statut d'un rendez-vous (pour l'admin/entreprise)
        updateAppointmentStatus: async (_: any, args: { appointmentId: string; status: string; companyNotes?: string; rejectionReason?: string }, context: any): Promise<CompanyAppointment> => {
            const user = context.req?.session?.user as User;
            if (!user) {
                throw createGraphQLError('Unauthorized', { extensions: { statusCode: 401 } });
            }

            const appointment = await CompanyAppointment.findOne({
                where: { id: args.appointmentId },
                relations: ['company', 'company.logo', 'company.contact', 'user'],
            });

            if (!appointment) {
                throw createGraphQLError('Appointment not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
            }

            // Valider le statut
            const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];
            if (!validStatuses.includes(args.status.toLowerCase())) {
                throw createGraphQLError('Invalid status', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
            }

            const oldStatus = appointment.status;
            console.log(`[updateAppointmentStatus] Old status: "${oldStatus}", New status: "${args.status}"`);
            
            // Normaliser le nouveau statut en minuscules pour correspondre à l'enum
            const normalizedStatus = args.status.toLowerCase();
            appointment.status = normalizedStatus as AppointmentStatus;
            
            if (args.companyNotes) {
                appointment.companyNotes = args.companyNotes;
            }

            if (args.rejectionReason) {
                appointment.rejectionReason = args.rejectionReason;
            }

            await appointment.save();

            // Envoyer les notifications par email si le statut change vers confirmé ou rejeté
            const wasPending = oldStatus === AppointmentStatus.PENDING;
            const isConfirmedOrRejected = 
                appointment.status === AppointmentStatus.CONFIRMED || 
                appointment.status === AppointmentStatus.REJECTED;
            
            console.log(`[updateAppointmentStatus] Was pending: ${wasPending}, Is confirmed/rejected: ${isConfirmedOrRejected}`);
            console.log(`[updateAppointmentStatus] Comparing: "${appointment.status}" with CONFIRMED="${AppointmentStatus.CONFIRMED}" and REJECTED="${AppointmentStatus.REJECTED}"`);
            
            if (wasPending && isConfirmedOrRejected) {
                try {
                    const { sendAppointmentStatusNotification } = await import('../../../helpers/mailer/send-appointment-status-notification');
                    
                    const appointmentDate = new Date(appointment.appointmentDate);
                    const formattedDate = appointmentDate.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });

                    // Envoyer l'email au candidat
                    await sendAppointmentStatusNotification({
                        candidateName: `${appointment.user.firstname || ''} ${appointment.user.lastname || ''}`.trim() || appointment.user.email,
                        candidateEmail: appointment.user.email,
                        companyName: appointment.company.company_name,
                        companyEmail: appointment.company.contact?.email,
                        appointmentDate: formattedDate,
                        appointmentTime: appointment.appointmentTime,
                        timezone: appointment.timezone,
                        status: appointment.status === AppointmentStatus.CONFIRMED ? 'confirmed' : 'rejected',
                        companyNotes: appointment.companyNotes,
                        rejectionReason: appointment.rejectionReason,
                    });

                    console.log(`✅ Appointment status notification sent to ${appointment.user.email}`);

                    // Envoyer une notification à l'admin
                    const adminEmail = process.env.ADMIN_EMAIL || 'admin@talenteed.io';
                    const statusText = appointment.status === AppointmentStatus.CONFIRMED ? 'confirmé' : 'rejeté';
                    const statusColor = appointment.status === AppointmentStatus.CONFIRMED ? '#28a745' : '#dc3545';
                    
                    const adminSubject = `Entretien ${statusText} - ${appointment.company.company_name} / ${appointment.user.firstname || ''} ${appointment.user.lastname || ''}`;
                    const adminHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: ${statusColor};">Entretien ${statusText}</h2>
                            <p>L'entreprise <strong>${appointment.company.company_name}</strong> a ${statusText} l'entretien avec le candidat.</p>
                            
                            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColor};">
                                <h3 style="margin-top: 0;">Détails</h3>
                                <p><strong>Candidat:</strong> ${appointment.user.firstname || ''} ${appointment.user.lastname || ''} (${appointment.user.email})</p>
                                <p><strong>Entreprise:</strong> ${appointment.company.company_name}</p>
                                <p><strong>Date:</strong> ${formattedDate}</p>
                                <p><strong>Heure:</strong> ${appointment.appointmentTime} (${appointment.timezone})</p>
                                ${appointment.companyNotes ? `<p><strong>Notes:</strong><br/>${appointment.companyNotes}</p>` : ''}
                                ${appointment.rejectionReason ? `<p><strong>Raison du rejet:</strong><br/>${appointment.rejectionReason}</p>` : ''}
                            </div>
                        </div>
                    `;

                    const transporter = (await import('../../../helpers/mailer')).default;
                    await transporter.sendMail({
                        from: process.env.MAILUSER,
                        to: adminEmail,
                        subject: adminSubject,
                        html: adminHtml,
                    });

                    console.log(`✅ Admin notification sent to ${adminEmail}`);
                } catch (error) {
                    console.error('Error sending appointment status notification:', error);
                    // Ne pas faire échouer la mise à jour si l'email échoue
                }
            }

            const updatedAppointment = await CompanyAppointment.findOne({
                where: { id: appointment.id },
                relations: ['company', 'company.logo', 'company.contact', 'user'],
            });

            if (!updatedAppointment) {
                throw createGraphQLError('Failed to update appointment', { extensions: { statusCode: 500 } });
            }

            return updatedAppointment;
        },
    },
};
