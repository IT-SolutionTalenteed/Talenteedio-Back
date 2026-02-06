import { CompanyPlan } from '../entities/CompanyPlan';

export const seedCompanyPlans = async () => {
    const existingPlans = await CompanyPlan.count();
    
    if (existingPlans > 0) {
        console.log('Company plans already seeded, skipping...');
        return;
    }

    const plans = [
        {
            title: 'Starter',
            description: 'Perfect for small businesses getting started',
            features: [
                'Post up to 5 job offers per month',
                'Access to talent database',
                'Basic recruitment tools',
                'Email support',
            ],
            maxArticles: 2,
            maxEvents: 1,
            maxJobs: 5,
            price: 99.0,
            billingPeriod: 'month',
            displayOrder: 1,
            isPopular: false,
            isActive: true,
        },
        {
            title: 'Professional',
            description: 'For growing companies with hiring needs',
            features: [
                'Post up to 20 job offers per month',
                'Full access to talent database',
                'Advanced recruitment tools',
                'Priority email support',
                'Analytics dashboard',
            ],
            maxArticles: 10,
            maxEvents: 5,
            maxJobs: 20,
            price: 299.0,
            billingPeriod: 'month',
            displayOrder: 2,
            isPopular: true,
            isActive: true,
        },
        {
            title: 'Enterprise',
            description: 'Unlimited access for large organizations',
            features: [
                'Unlimited job postings',
                'Full access to talent database',
                'Premium recruitment tools',
                'Dedicated account manager',
                'Advanced analytics',
                'Custom integrations',
            ],
            maxArticles: -1, // -1 = unlimited
            maxEvents: -1,
            maxJobs: -1,
            price: 999.0,
            billingPeriod: 'month',
            displayOrder: 3,
            isPopular: false,
            isActive: true,
        },
    ];

    for (const planData of plans) {
        const plan = CompanyPlan.create(planData);
        await plan.save();
        console.log(`Created plan: ${plan.title}`);
    }

    console.log('Company plans seeded successfully!');
};
