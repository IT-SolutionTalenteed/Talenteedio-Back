import { User, Company, Contact, Address, Role, CompanyPlan } from '../../../database/entities';
import { STATUS } from '../../../database/entities/Status';
import transporter from '../../../helpers/mailer';
import path from 'path';

interface CompanyRegistrationInput {
  companyName: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  website?: string;
  description?: string;
  planId: string;
}

export default {
  Mutation: {
    registerCompany: async (_: any, { input }: { input: CompanyRegistrationInput }) => {
      try {
        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ where: { email: input.email } });
        if (existingUser) {
          return {
            success: false,
            message: 'Un compte avec cet email existe déjà.',
          };
        }

        // Vérifier si le plan existe
        const plan = await CompanyPlan.findOne({ where: { id: input.planId } });
        if (!plan) {
          return {
            success: false,
            message: 'Le plan sélectionné n\'existe pas.',
          };
        }

        // Créer l'adresse
        const address = new Address();
        address.line = input.address;
        address.city = input.city;
        address.postalCode = input.postalCode;
        address.country = input.country;
        await address.save();

        // Créer le contact
        const contact = new Contact();
        contact.phoneNumber = input.phone;
        contact.address = address;
        await contact.save();

        // Créer l'utilisateur avec mot de passe par défaut
        const user = new User();
        user.email = input.email;
        user.password = 'bonjour'; // Mot de passe par défaut
        user.firstname = input.firstName;
        user.lastname = input.lastName;
        await user.save();

        // Récupérer le rôle company
        const companyRole = await Role.findOne({ where: { name: 'company' } });
        if (!companyRole) {
          throw new Error('Le rôle company n\'existe pas');
        }

        // Créer la company avec status PENDING
        const company = new Company();
        company.company_name = input.companyName;
        company.contact = contact;
        company.user = user;
        company.role = companyRole;
        company.status = STATUS.PENDING;
        await company.save();

        // Envoyer un email à l'admin
        try {
          await transporter.sendMail({
            from: 'Talenteed.io ' + process.env.MAILUSER,
            to: process.env.ADMIN_EMAIL || 'admin@talenteed.com',
            subject: 'Nouvelle demande d\'inscription entreprise',
            template: 'index',
            context: {
              title: 'Nouvelle demande d\'inscription entreprise',
              message: `
                <p>Une nouvelle entreprise souhaite s'inscrire sur la plateforme.</p>
                
                <h3>Informations de l'entreprise :</h3>
                <ul>
                  <li><strong>Nom de l'entreprise :</strong> ${input.companyName}</li>
                  <li><strong>Plan choisi :</strong> ${plan.title}</li>
                  <li><strong>Site web :</strong> ${input.website || 'Non renseigné'}</li>
                  ${input.description ? `<li><strong>Description :</strong> ${input.description}</li>` : ''}
                </ul>
                
                <h3>Personne de contact :</h3>
                <ul>
                  <li><strong>Nom :</strong> ${input.firstName} ${input.lastName}</li>
                  <li><strong>Email :</strong> ${input.email}</li>
                  <li><strong>Téléphone :</strong> ${input.phone}</li>
                </ul>
                
                <h3>Adresse :</h3>
                <p>${input.address}<br>${input.postalCode} ${input.city}<br>${input.country}</p>
                
                <p><strong>Veuillez valider cette demande dans l'interface d'administration.</strong></p>
              `,
              host: process.env.FRONTEND_HOST,
              imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
              imageTitle: 'Nouvelle inscription',
              backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
            },
          } as any);
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email à l\'admin:', emailError);
          // On continue même si l'email échoue
        }

        // Envoyer un email de confirmation à l'entreprise
        try {
          await transporter.sendMail({
            from: 'Talenteed.io ' + process.env.MAILUSER,
            to: input.email,
            subject: 'Demande d\'inscription reçue - Talenteed',
            template: 'index',
            context: {
              title: `Bonjour ${input.firstName} ${input.lastName}`,
              message: `
                <p>Nous avons bien reçu votre demande d'inscription pour <strong>${input.companyName}</strong>.</p>
                
                <p>Votre demande est en cours de traitement par notre équipe. Vous recevrez un email de confirmation une fois votre compte validé.</p>
                
                <h3>Récapitulatif de votre demande :</h3>
                <ul>
                  <li><strong>Plan choisi :</strong> ${plan.title}</li>
                  <li><strong>Prix :</strong> ${plan.price}€ / ${plan.billingPeriod === 'month' ? 'mois' : 'an'}</li>
                </ul>
                
                <p>Une fois votre compte activé, vous pourrez vous connecter avec :</p>
                <ul>
                  <li><strong>Email :</strong> ${input.email}</li>
                  <li><strong>Mot de passe temporaire :</strong> bonjour</li>
                </ul>
                
                <p><em>Nous vous recommandons de changer ce mot de passe dès votre première connexion.</em></p>
                
                <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                
                <p>Cordialement,<br>L'équipe Talenteed</p>
              `,
              host: process.env.FRONTEND_HOST,
              imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
              imageTitle: 'Demande reçue',
              backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
            },
          } as any);
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
        }

        return {
          success: true,
          message: 'Votre demande d\'inscription a été envoyée avec succès.',
          companyId: company.id,
        };
      } catch (error) {
        console.error('Erreur lors de l\'inscription de l\'entreprise:', error);
        return {
          success: false,
          message: 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.',
        };
      }
    },
  },
};
