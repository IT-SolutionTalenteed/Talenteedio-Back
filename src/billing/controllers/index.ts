import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe, stripeConfig } from '../../config/stripe';
import { User } from '../../database/entities/User';

/**
 * Liste tous les plans disponibles depuis Stripe
 */
export const listPlans = async (req: Request, res: Response) => {
    try {
        console.log('Fetching plans from Stripe...');
        console.log('Allowed Price IDs:', stripeConfig.allowedPriceIds);
        
        const prices = await stripe.prices.list({
            active: true,
            limit: 50,
            expand: ['data.product'],
        });

        console.log(`Found ${prices.data.length} prices from Stripe`);

        const allowedPriceIds = stripeConfig.allowedPriceIds;

        const plans = prices.data
            .filter((price: Stripe.Price) => {
                const isEligible = price.type === 'recurring' && price.active && price.product;
                if (!isEligible) return false;

                // Si une whitelist est fournie, ne retourner que ces prix
                if (allowedPriceIds.length > 0) {
                    const isAllowed = allowedPriceIds.includes(price.id);
                    console.log(`Price ${price.id}: ${isAllowed ? 'ALLOWED' : 'FILTERED OUT'}`);
                    return isAllowed;
                }
                return true;
            })
            .map((price: Stripe.Price) => {
                const product = price.product as Stripe.Product;
                return {
                    price_id: price.id,
                    currency: price.currency.toUpperCase(),
                    unit_amount: price.unit_amount,
                    interval: price.recurring?.interval || null,
                    interval_count: price.recurring?.interval_count || 1,
                    trial_period_days: price.recurring?.trial_period_days || null,
                    product: {
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        images: product.images || [],
                        metadata: product.metadata || {},
                    },
                };
            });

        console.log(`Returning ${plans.length} plans to client`);
        res.status(200).json({ plans });
    } catch (error: any) {
        console.error('Error listing plans:', error);
        console.error('Error details:', {
            message: error.message,
            type: error.type,
            code: error.code,
            statusCode: error.statusCode,
        });
        res.status(500).json({
            message: 'Failed to list plans',
            error: error.message,
        });
    }
};

/**
 * Crée une session de checkout Stripe pour un abonnement
 */
export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const { price_id, success_url, cancel_url, email } = req.body;

        console.log('Creating checkout session with:', { price_id, success_url, cancel_url, email, hasUser: !!(req as any).user });

        if (!price_id || !success_url || !cancel_url) {
            console.log('Validation failed:', { price_id, success_url, cancel_url });
            return res.status(422).json({
                message: 'Validation error',
                errors: {
                    price_id: !price_id ? 'Price ID is required' : undefined,
                    success_url: !success_url ? 'Success URL is required' : undefined,
                    cancel_url: !cancel_url ? 'Cancel URL is required' : undefined,
                },
            });
        }

        const user = (req as any).user as User | undefined;

        // Si l'utilisateur n'est pas authentifié, on doit avoir un email
        if (!user && !email) {
            console.log('No user and no email provided');
            return res.status(422).json({
                message: 'Validation error',
                errors: {
                    email: 'Email is required when not authenticated',
                },
            });
        }

        let customerId: string | null | undefined;
        let userEmail: string;
        let userName: string;
        let userId: string | undefined;

        if (user) {
            // Utilisateur authentifié
            userEmail = user.email;
            userName = `${user.firstname} ${user.lastname}`;
            userId = user.id.toString();
            customerId = user.stripeCustomerId;

            // Créer ou récupérer le customer Stripe
            if (!customerId) {
                const customer = await stripe.customers.create({
                    email: userEmail,
                    name: userName,
                    metadata: {
                        user_id: userId,
                    },
                });
                customerId = customer.id;

                // Sauvegarder le customer ID
                user.stripeCustomerId = customerId || null;
                await user.save();
            }
        } else {
            // Utilisateur non authentifié (onboarding)
            userEmail = email;
            userName = email;

            // Chercher si un utilisateur existe avec cet email
            const existingUser = await User.findOne({ where: { email: userEmail } });
            if (existingUser) {
                userId = existingUser.id.toString();
                customerId = existingUser.stripeCustomerId;

                if (!customerId) {
                    const customer = await stripe.customers.create({
                        email: userEmail,
                        name: `${existingUser.firstname} ${existingUser.lastname}`,
                        metadata: {
                            user_id: userId || '',
                        },
                    });
                    customerId = customer.id;
                    existingUser.stripeCustomerId = customerId || null;
                    await existingUser.save();
                }
            }
        }

        // Créer la session de checkout
        const sessionConfig: any = {
            mode: 'subscription',
            line_items: [
                {
                    price: price_id,
                    quantity: 1,
                },
            ],
            success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancel_url,
            allow_promotion_codes: true,
            metadata: {
                email: userEmail,
                ...(userId ? { user_id: userId } : {}),
            },
        };

        if (customerId) {
            sessionConfig.customer = customerId;
            if (userId) {
                sessionConfig.client_reference_id = userId;
            }
        } else {
            sessionConfig.customer_email = userEmail;
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        console.log('Checkout session created successfully:', { sessionId: session.id, url: session.url });

        res.status(200).json({
            id: session.id,
            url: session.url,
        });
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({
            message: 'Failed to create checkout session',
            error: error.message,
        });
    }
};

/**
 * Crée une session pour le portail client Stripe
 */
export const createPortalSession = async (req: Request, res: Response) => {
    try {
        const { return_url } = req.body;

        if (!return_url) {
            return res.status(422).json({
                message: 'Validation error',
                errors: { return_url: 'Return URL is required' },
            });
        }

        const user = (req as any).user as User;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let customerId = user.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: `${user.firstname} ${user.lastname}`,
                metadata: {
                    user_id: user.id.toString(),
                },
            });
            customerId = customer.id;

            user.stripeCustomerId = customerId;
            await user.save();
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: return_url,
        });

        res.status(200).json({
            url: session.url,
        });
    } catch (error: any) {
        console.error('Error creating portal session:', error);
        res.status(500).json({
            message: 'Failed to create portal session',
            error: error.message,
        });
    }
};

/**
 * Gère les webhooks Stripe
 */
export const handleWebhook = async (req: Request, res: Response) => {
    console.log('🔔 Webhook received!');
    console.log('Headers:', req.headers);
    console.log('Body type:', typeof req.body);
    console.log('Body length:', req.body?.length || 'N/A');
    
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
        console.log('❌ No signature provided');
        return res.status(400).json({ message: 'No signature provided' });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            stripeConfig.webhookSecret,
            300 // Tolérance de 5 minutes pour le développement
        );
        console.log('✅ Webhook signature verified');
        console.log('Event type:', event.type);
        console.log('Event ID:', event.id);
    } catch (err: any) {
        console.error('❌ Webhook signature verification failed:', err.message);
        
        // En développement, si c'est juste un problème de timestamp, on continue quand même
        if (process.env.NODE_ENV === 'development' && err.message.includes('Timestamp outside')) {
            console.log('🔧 Mode développement: Ignorer l\'erreur de timestamp et traiter le webhook');
            try {
                // Parser le body manuellement pour récupérer l'événement
                event = JSON.parse(req.body.toString());
                console.log('✅ Webhook traité en mode développement');
                console.log('Event type:', event.type);
                console.log('Event ID:', event.id);
            } catch (parseErr) {
                console.error('❌ Impossible de parser le webhook:', parseErr);
                return res.status(400).json({ message: `Webhook Error: ${err.message}` });
            }
        } else {
            return res.status(400).json({ message: `Webhook Error: ${err.message}` });
        }
    }

    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.status(200).json({ received: true });
    } catch (error: any) {
        console.error('Error handling webhook:', error);
        res.status(500).json({ message: 'Webhook handler failed', error: error.message });
    }
};



/**
 * Gère la création/mise à jour d'un abonnement
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const user = await User.findOne({ where: { stripeCustomerId: customerId } });

    if (!user) {
        console.error(`User not found for customer ${customerId}`);
        return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    const tier = stripeConfig.priceIdToTier[priceId] || 'free';

    user.stripeSubscriptionId = subscription.id;
    user.stripePriceId = priceId;
    user.subscriptionStatus = subscription.status as any;

    // Mettre à jour la permission de la company si c'est une company
    if (user.company) {
        const companyPermission = user.company.permission;
        if (companyPermission) {
            companyPermission.title = tier;
            await companyPermission.save();
        }
    }

    await user.save();

    console.log(`Subscription updated for user ${user.id}: ${tier} (${subscription.status})`);
}

/**
 * Gère la suppression d'un abonnement
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const user = await User.findOne({ where: { stripeCustomerId: customerId } });

    if (!user) {
        console.error(`User not found for customer ${customerId}`);
        return;
    }

    user.stripeSubscriptionId = null;
    user.stripePriceId = null;
    user.subscriptionStatus = 'canceled';

    // Rétrograder vers le plan gratuit
    if (user.company) {
        const companyPermission = user.company.permission;
        if (companyPermission) {
            companyPermission.title = 'free';
            await companyPermission.save();
        }
    }

    await user.save();

    console.log(`Subscription deleted for user ${user.id}`);
}

/**
 * Gère le succès d'un paiement
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    const user = await User.findOne({ where: { stripeCustomerId: customerId } });

    if (!user) {
        console.error(`User not found for customer ${customerId}`);
        return;
    }

    console.log(`Payment succeeded for user ${user.id}: ${invoice.amount_paid / 100} ${invoice.currency}`);
}

/**
 * Gère l'échec d'un paiement
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    const user = await User.findOne({ where: { stripeCustomerId: customerId } });

    if (!user) {
        console.error(`User not found for customer ${customerId}`);
        return;
    }

    user.subscriptionStatus = 'past_due';
    await user.save();

    console.log(`Payment failed for user ${user.id}`);
}

/**
 * Gère la complétion d'une session de checkout (pour les paiements one-time comme le coaching)
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    console.log('Checkout session completed:', session.id);

    // Vérifier si c'est une réservation de coaching avec le nouveau système
    const bookingId = session.metadata?.bookingId;
    const isCoachingBooking = session.metadata?.type === 'coaching';
    
    if (bookingId && isCoachingBooking) {
        try {
            // 🔍 VÉRIFIER LE STATUT DU PAIEMENT STRIPE AVANT TOUT
            console.log('🔍 Vérification du statut du paiement Stripe...');
            
            // Récupérer les détails de la session Stripe pour vérifier le paiement
            const stripeSession = await stripe.checkout.sessions.retrieve(session.id);
            
            if (stripeSession.payment_status !== 'paid') {
                console.log(`❌ Paiement non confirmé. Statut: ${stripeSession.payment_status}`);
                return; // Ne pas envoyer d'emails si le paiement n'est pas confirmé
            }
            
            console.log('✅ Paiement Stripe confirmé, procédure de confirmation...');
            
            // Importer le service de booking
            const { BookingService } = await import('../../graphql/resources/booking/service');
            const { Booking } = await import('../../database/entities/Booking');
            const { Wallet } = await import('../../database/entities/Wallet');
            const { WalletTransaction } = await import('../../database/entities/WalletTransaction');
            const { Consultant } = await import('../../database/entities/Consultant');
            const { Pricing } = await import('../../database/entities/Pricing');
            
            const AppDataSource = (await import('../../database')).default;
            const bookingService = new BookingService(
                AppDataSource.getRepository(Booking),
                AppDataSource.getRepository(Wallet),
                AppDataSource.getRepository(WalletTransaction),
                AppDataSource.getRepository(Consultant),
                AppDataSource.getRepository(Pricing),
            );

            // Confirmer le paiement de la réservation
            await bookingService.confirmBookingPayment(bookingId, session.payment_intent as string);

            console.log(`Coaching booking ${bookingId} confirmed and wallet updated`);

            // Récupérer les détails de la réservation pour l'email
            const bookingRepo = AppDataSource.getRepository(Booking);
            const booking = await bookingRepo.findOne({
                where: { id: bookingId },
                relations: ['consultant', 'pricing'],
            });

            if (booking) {
                // Récupérer l'email du consultant
                let consultantEmail: string | undefined;
                try {
                    // Pour les consultants statiques, utiliser des emails de test
                    if (booking.consultantId === 'guy') {
                        consultantEmail = 'guy@consultant.test';
                    } else if (booking.consultantId === 'kerian') {
                        consultantEmail = 'kerian@consultant.test';
                    } else {
                        // Pour les consultants dynamiques, récupérer depuis la base
                        const { Consultant } = await import('../../database/entities/Consultant');
                        const { User } = await import('../../database/entities/User');
                        const AppDataSource = (await import('../../database')).default;
                        
                        const consultantRepo = AppDataSource.getRepository(Consultant);
                        const consultant = await consultantRepo.findOne({
                            where: { id: booking.consultantId },
                            relations: ['user'],
                        });
                        
                        if (consultant?.user) {
                            consultantEmail = consultant.user.email;
                        }
                    }
                } catch (error) {
                    console.error('Error fetching consultant email:', error);
                }

                // Envoyer les emails de confirmation
                try {
                    console.log('📧 Tentative d\'envoi d\'email:');
                    console.log('   - Client:', booking.clientEmail);
                    console.log('   - Consultant:', consultantEmail);
                    console.log('   - Booking ID:', booking.id);
                    
                    const { sendCoachingConfirmation } = await import('../../helpers/mailer/send-coaching-confirmation');
                    
                    await sendCoachingConfirmation({
                        name: booking.clientName,
                        email: booking.clientEmail,
                        consultant: session.metadata?.consultantId || 'Consultant',
                        consultantEmail: consultantEmail,
                        serviceName: booking.serviceTitle,
                        date: booking.bookingDate instanceof Date ? booking.bookingDate.toISOString().split('T')[0] : String(booking.bookingDate).split('T')[0],
                        time: booking.bookingTime,
                        frequency: booking.frequency,
                        amount: Number(booking.amount),
                        timezone: booking.timezone,
                        bookingId: booking.id,
                    });

                    console.log(`✅ Confirmation emails sent to client and consultant`);
                } catch (emailError) {
                    console.error('Error sending confirmation emails:', emailError);
                    // Ne pas faire échouer le webhook si l'email échoue
                }
            }
        } catch (error) {
            console.error('Error handling coaching booking confirmation:', error);
        }
    }
    
    // Gérer l'ancien système pour la compatibilité
    const oldBookingId = session.metadata?.booking_id;
    if (oldBookingId && !isCoachingBooking) {
        try {
            const { CoachingBooking } = await import('../../database/entities/CoachingBooking');
            const booking = await CoachingBooking.findOne({ where: { id: parseInt(oldBookingId) } });

            if (booking) {
                booking.status = 'paid';
                booking.stripePaymentIntentId = session.payment_intent as string;
                await booking.save();

                console.log(`Legacy coaching booking ${oldBookingId} marked as paid`);
            }
        } catch (error) {
            console.error('Error handling legacy booking:', error);
        }
    }
}

/**
 * Crée une session de checkout Stripe pour le coaching emploi
 */
export const createCoachingCheckoutSession = async (req: Request, res: Response) => {
    try {
        const {
            contact,
            consultant,
            service,
            date,
            time,
            timezone,
            frequency,
            amount,
            pricingId,
            serviceDetails,
            success_url,
            cancel_url,
        } = req.body;

        console.log('Creating coaching checkout session:', {
            contact,
            consultant,
            service,
            date,
            time,
            timezone,
            amount,
            pricingId,
        });

        // Validation
        if (!contact?.name || !contact?.email || !contact?.phone) {
            return res.status(422).json({
                message: 'Validation error',
                errors: {
                    contact: 'Contact information (name, email, phone) is required',
                },
            });
        }

        if (!consultant || !service || !date || !time || !amount || !timezone) {
            return res.status(422).json({
                message: 'Validation error',
                errors: {
                    consultant: !consultant ? 'Consultant is required' : undefined,
                    service: !service ? 'Service type is required' : undefined,
                    date: !date ? 'Booking date is required' : undefined,
                    time: !time ? 'Booking time is required' : undefined,
                    timezone: !timezone ? 'Timezone is required' : undefined,
                    amount: !amount ? 'Amount is required' : undefined,
                },
            });
        }

        // Importer le service de booking
        const { BookingService } = await import('../../graphql/resources/booking/service');
        const { Booking } = await import('../../database/entities/Booking');
        const { Wallet } = await import('../../database/entities/Wallet');
        const { WalletTransaction } = await import('../../database/entities/WalletTransaction');
        const { Consultant } = await import('../../database/entities/Consultant');
        const { Pricing } = await import('../../database/entities/Pricing');
        
        // Créer une instance du service de booking
        const AppDataSource = (await import('../../database')).default;
        const bookingService = new BookingService(
            AppDataSource.getRepository(Booking),
            AppDataSource.getRepository(Wallet),
            AppDataSource.getRepository(WalletTransaction),
            AppDataSource.getRepository(Consultant),
            AppDataSource.getRepository(Pricing),
        );

        // Créer la réservation en base de données avec le nouveau système
        const booking = await bookingService.createBooking({
            clientName: contact.name,
            clientEmail: contact.email,
            clientPhone: contact.phone,
            consultantId: consultant,
            pricingId: pricingId,
            serviceTitle: service,
            serviceDescription: serviceDetails?.description,
            bookingDate: date,
            bookingTime: time,
            timezone: timezone,
            amount: amount / 100, // Convertir de centimes en euros
            frequency: frequency,
            metadata: {
                serviceDetails,
                originalAmount: amount,
            },
        });

        // Créer la session de checkout Stripe avec un prix dynamique
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: service,
                            description: `Réservation avec ${consultant}\nDate: ${new Date(date).toLocaleDateString('fr-FR')}\nHeure: ${time} (${timezone})${serviceDetails?.duration ? `\nDurée: ${serviceDetails.duration}` : ''}${frequency ? `\nFréquence: ${frequency}` : ''}`,
                            metadata: {
                                consultant: consultant,
                                bookingId: booking.id,
                                date: date,
                                time: time,
                                timezone: timezone,
                            },
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            customer_email: contact.email,
            success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
            cancel_url: cancel_url,
            metadata: {
                type: 'coaching',
                bookingId: booking.id,
                consultantId: consultant,
                clientName: contact.name,
                clientPhone: contact.phone,
                bookingDate: date,
                bookingTime: time,
                timezone: timezone,
            },
            payment_intent_data: {
                metadata: {
                    bookingId: booking.id,
                    consultantId: consultant,
                },
            },
        });

        // Mettre à jour la réservation avec l'ID de session Stripe
        const bookingRepo = AppDataSource.getRepository(Booking);
        await bookingRepo.update(booking.id, { stripeSessionId: session.id });

        console.log('Coaching checkout session created:', {
            sessionId: session.id,
            bookingId: booking.id,
        });

        // ⏳ Les emails seront envoyés UNIQUEMENT après confirmation du paiement par Stripe webhook
        try {
            console.log('� SAuto-confirming payment and sending emails...');
            
            // 1. Confirmer automatiquement le paiement (simulation du webhook)
            // SUPPRIMÉ : Pas de confirmation automatique du paiement ni d'envoi d'emails
            
            console.log('💡 Session créée. Les emails seront envoyés après confirmation du paiement Stripe.');
            
        } catch (error) {
            console.error('❌ Error in auto-confirmation:', error);
            // Ne pas faire échouer la création de session si l'email échoue
        }

        res.status(200).json({
            id: session.id,
            url: session.url,
        });
    } catch (error: any) {
        console.error('Error creating coaching checkout session:', error);
        res.status(500).json({
            message: 'Failed to create coaching checkout session',
            error: error.message,
        });
    }
};

/**
 * Confirme manuellement le paiement d'une réservation de coaching et envoie les emails
 * SEULEMENT si le paiement Stripe est réellement confirmé
 */
export const confirmCoachingPayment = async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;

        console.log(`🔄 Manual payment confirmation for booking: ${bookingId}`);

        // Récupérer les détails de la réservation
        const AppDataSource = (await import('../../database')).default;
        const { Booking } = await import('../../database/entities/Booking');
        const bookingRepo = AppDataSource.getRepository(Booking);
        const booking = await bookingRepo.findOne({
            where: { id: bookingId },
            relations: ['consultant', 'pricing'],
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (!booking.stripeSessionId) {
            return res.status(400).json({ message: 'No Stripe session found for this booking' });
        }

        // 🔍 VÉRIFIER LE STATUT DU PAIEMENT STRIPE
        console.log('🔍 Vérification du statut du paiement Stripe...');
        
        try {
            const stripeSession = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
            
            if (stripeSession.payment_status !== 'paid') {
                return res.status(400).json({ 
                    message: 'Payment not confirmed by Stripe',
                    stripeStatus: stripeSession.payment_status,
                    bookingId: booking.id
                });
            }
            
            console.log('✅ Paiement Stripe confirmé, procédure de confirmation...');
            
        } catch (stripeError) {
            console.error('Error checking Stripe payment status:', stripeError);
            return res.status(500).json({ message: 'Failed to verify payment with Stripe' });
        }

        // Importer le service de booking
        const { BookingService } = await import('../../graphql/resources/booking/service');
        const { Wallet } = await import('../../database/entities/Wallet');
        const { WalletTransaction } = await import('../../database/entities/WalletTransaction');
        const { Consultant } = await import('../../database/entities/Consultant');
        const { Pricing } = await import('../../database/entities/Pricing');
        
        const bookingService = new BookingService(
            AppDataSource.getRepository(Booking),
            AppDataSource.getRepository(Wallet),
            AppDataSource.getRepository(WalletTransaction),
            AppDataSource.getRepository(Consultant),
            AppDataSource.getRepository(Pricing),
        );

        // Confirmer le paiement de la réservation
        await bookingService.confirmBookingPayment(bookingId, booking.stripeSessionId);
        console.log('✅ Booking payment confirmed and wallet updated');

        // Récupérer l'email du consultant
        let consultantEmail = 'balibali@mail.com'; // Email par défaut
        let consultantName = 'Consultant Expert';
        
        try {
            const { Consultant } = await import('../../database/entities/Consultant');
            const { User } = await import('../../database/entities/User');
            
            const consultantRepo = AppDataSource.getRepository(Consultant);
            const consultantData = await consultantRepo.findOne({
                where: { id: booking.consultantId },
                relations: ['user'],
            });
            
            if (consultantData?.user) {
                consultantEmail = consultantData.user.email;
                consultantName = `${consultantData.user.firstname} ${consultantData.user.lastname}`;
            }
        } catch (error) {
            console.log('Using default consultant email');
        }

        // Envoyer les emails de confirmation
        try {
            console.log('📧 Sending confirmation emails...');
            console.log('   - Client:', booking.clientEmail);
            console.log('   - Consultant:', consultantEmail);
            console.log('   - Service:', booking.serviceTitle);
            
            const { sendCoachingConfirmation } = await import('../../helpers/mailer/send-coaching-confirmation');
            
            await sendCoachingConfirmation({
                name: booking.clientName,
                email: booking.clientEmail,
                consultant: consultantName,
                consultantEmail: consultantEmail,
                serviceName: booking.serviceTitle,
                date: String(booking.bookingDate).split('T')[0],
                time: booking.bookingTime,
                frequency: booking.frequency,
                amount: Number(booking.amount),
                timezone: booking.timezone,
                bookingId: booking.id,
            });

            console.log('✅ Confirmation emails sent successfully!');
        } catch (emailError) {
            console.error('Error sending confirmation emails:', emailError);
            // Ne pas faire échouer la confirmation si l'email échoue
        }

        res.status(200).json({
            message: 'Payment verified with Stripe and emails sent',
            bookingId: booking.id,
            status: booking.status,
            stripeVerified: true,
        });
    } catch (error: any) {
        console.error('Error confirming coaching payment:', error);
        res.status(500).json({
            message: 'Failed to confirm coaching payment',
            error: error.message,
        });
    }
};

/**
 * Simule un webhook Stripe en vérifiant le statut réel du paiement
 */
export const simulateStripeWebhook = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        console.log(`🔄 Simulating Stripe webhook for session: ${sessionId}`);

        // Récupérer les détails de la session Stripe
        const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (stripeSession.payment_status !== 'paid') {
            return res.status(400).json({ 
                message: 'Payment not confirmed by Stripe',
                stripeStatus: stripeSession.payment_status,
                sessionId: sessionId
            });
        }

        console.log('✅ Paiement Stripe confirmé, simulation du webhook...');

        // Simuler l'événement checkout.session.completed
        await handleCheckoutSessionCompleted(stripeSession as any);

        res.status(200).json({
            message: 'Webhook simulated successfully',
            sessionId: sessionId,
            paymentStatus: stripeSession.payment_status,
            bookingId: stripeSession.metadata?.bookingId,
        });
    } catch (error: any) {
        console.error('Error simulating Stripe webhook:', error);
        res.status(500).json({
            message: 'Failed to simulate webhook',
            error: error.message,
        });
    }
};
