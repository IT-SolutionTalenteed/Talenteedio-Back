import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
    typescript: true,
});

export const stripeConfig = {
    publicKey: process.env.STRIPE_PUBLIC_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    allowedPriceIds: [
        process.env.STRIPE_PRICE_ID_STARTER,
        process.env.STRIPE_PRICE_ID_PRO,
        process.env.STRIPE_PRICE_ID_ENTERPRISE,
    ].filter(Boolean) as string[],
    priceIdToTier: {
        [process.env.STRIPE_PRICE_ID_STARTER || '']: 'starter',
        [process.env.STRIPE_PRICE_ID_PRO || '']: 'pro',
        [process.env.STRIPE_PRICE_ID_ENTERPRISE || '']: 'enterprise',
    } as Record<string, string>,
    // Price IDs pour le coaching emploi
    coachingPriceIds: {
        bilan: process.env.STRIPE_PRICE_ID_COACHING_BILAN || 'price_1SVKuv8RbHgy6D1mKs3OimvP',
        accompagnement: process.env.STRIPE_PRICE_ID_COACHING_ACCOMPAGNEMENT || 'price_1SVKtK8RbHgy6D1ms33RLhCE',
    },
};
