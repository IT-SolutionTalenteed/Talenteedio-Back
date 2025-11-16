import { Request, Response } from 'express';
import { stripe, stripeConfig } from '../../config/stripe';
import { User } from '../../database/entities/User';
import Stripe from 'stripe';

/**
 * Liste tous les plans disponibles depuis Stripe
 */
export const listPlans = async (req: Request, res: Response) => {
    try {
        const prices = await stripe.prices.list({
            active: true,
            limit: 50,
            expand: ['data.product'],
        });

        const allowedPriceIds = stripeConfig.allowedPriceIds;

        const plans = prices.data
            .filter((price) => {
                const isEligible = price.type === 'recurring' && price.active && price.product;
                if (!isEligible) return false;

                // Si une whitelist est fournie, ne retourner que ces prix
                if (allowedPriceIds.length > 0) {
                    return allowedPriceIds.includes(price.id);
                }
                return true;
            })
            .map((price) => {
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

        res.status(200).json({ plans });
    } catch (error: any) {
        console.error('Error listing plans:', error);
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
        const { price_id, success_url, cancel_url } = req.body;

        if (!price_id || !success_url || !cancel_url) {
            return res.status(422).json({
                message: 'Validation error',
                errors: {
                    price_id: !price_id ? 'Price ID is required' : undefined,
                    success_url: !success_url ? 'Success URL is required' : undefined,
                    cancel_url: !cancel_url ? 'Cancel URL is required' : undefined,
                },
            });
        }

        const user = (req as any).user as User;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Créer ou récupérer le customer Stripe
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

            // Sauvegarder le customer ID
            user.stripeCustomerId = customerId;
            await user.save();
        }

        // Créer la session de checkout
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [
                {
                    price: price_id,
                    quantity: 1,
                },
            ],
            success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancel_url,
            allow_promotion_codes: true,
            client_reference_id: user.id.toString(),
            metadata: {
                user_id: user.id.toString(),
                email: user.email,
            },
        });

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
