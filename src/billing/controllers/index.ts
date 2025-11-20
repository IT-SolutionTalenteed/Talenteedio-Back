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
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
        return res.status(400).json({ message: 'No signature provided' });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            stripeConfig.webhookSecret
        );
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
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

    // Vérifier si c'est une réservation de coaching
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
        const { CoachingBooking } = await import('../../database/entities/CoachingBooking');
        const booking = await CoachingBooking.findOne({ where: { id: parseInt(bookingId) } });

        if (booking) {
            booking.status = 'paid';
            booking.stripePaymentIntentId = session.payment_intent as string;
            await booking.save();

            console.log(`Coaching booking ${bookingId} marked as paid`);

            // Envoyer un email de confirmation au client
            try {
                const { sendCoachingConfirmation } = await import('../../helpers/mailer/send-coaching-confirmation');
                const serviceName = booking.serviceType === 'bilan' ? 'Bilan Emploi (2h)' : 'Accompagnement Emploi (2 mois)';
                
                await sendCoachingConfirmation({
                    name: booking.name,
                    email: booking.email,
                    consultant: booking.consultant.charAt(0).toUpperCase() + booking.consultant.slice(1),
                    serviceName,
                    date: booking.bookingDate,
                    time: booking.bookingTime,
                    frequency: booking.frequency,
                    amount: booking.amount,
                });

                console.log(`Confirmation email sent to ${booking.email}`);
            } catch (emailError) {
                console.error('Error sending confirmation email:', emailError);
                // Ne pas faire échouer le webhook si l'email échoue
            }
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
            frequency,
            amount,
            success_url,
            cancel_url,
        } = req.body;

        console.log('Creating coaching checkout session:', {
            contact,
            consultant,
            service,
            date,
            time,
            amount,
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

        if (!consultant || !service || !date || !time || !amount) {
            return res.status(422).json({
                message: 'Validation error',
                errors: {
                    consultant: !consultant ? 'Consultant is required' : undefined,
                    service: !service ? 'Service type is required' : undefined,
                    date: !date ? 'Booking date is required' : undefined,
                    time: !time ? 'Booking time is required' : undefined,
                    amount: !amount ? 'Amount is required' : undefined,
                },
            });
        }

        // Importer l'entité CoachingBooking
        const { CoachingBooking } = await import('../../database/entities/CoachingBooking');

        // Créer la réservation en base de données
        const booking = CoachingBooking.create({
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            consultant,
            serviceType: service,
            bookingDate: date,
            bookingTime: time,
            frequency: frequency || null,
            timezone: req.body.timezone || 'Europe/Paris', // Fuseau horaire de l'utilisateur
            amount,
            status: 'pending',
        });

        await booking.save();

        // Récupérer le price ID correspondant au service
        const priceId = service === 'bilan' 
            ? stripeConfig.coachingPriceIds.bilan 
            : stripeConfig.coachingPriceIds.accompagnement;

        console.log(`Using Stripe Price ID: ${priceId} for service: ${service}`);

        // Créer la session de checkout Stripe avec le price ID
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer_email: contact.email,
            success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancel_url,
            metadata: {
                booking_id: booking.id.toString(),
                consultant,
                service,
                date,
                time,
                customer_name: contact.name,
                customer_email: contact.email,
                customer_phone: contact.phone,
            },
        });

        // Mettre à jour la réservation avec l'ID de session
        booking.stripeSessionId = session.id;
        await booking.save();

        console.log('Coaching checkout session created:', {
            sessionId: session.id,
            bookingId: booking.id,
        });

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
