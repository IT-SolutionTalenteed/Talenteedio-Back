const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function seedCompanyPlans() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'talenteedio'
    });

    try {
        // Check if plans already exist
        const [existing] = await connection.execute('SELECT COUNT(*) as count FROM company_plan');
        
        if (existing[0].count > 0) {
            console.log('Company plans already exist, skipping seed...');
            return;
        }

        const plans = [
            {
                id: uuidv4(),
                title: 'Starter',
                description: 'Perfect for small businesses getting started',
                features: 'Post up to 5 job offers per month,Access to talent database,Basic recruitment tools,Email support',
                maxArticles: 2,
                maxEvents: 1,
                maxJobs: 5,
                price: 99.00,
                billingPeriod: 'month',
                displayOrder: 1,
                isPopular: 0,
                isActive: 1
            },
            {
                id: uuidv4(),
                title: 'Professional',
                description: 'For growing companies with hiring needs',
                features: 'Post up to 20 job offers per month,Full access to talent database,Advanced recruitment tools,Priority email support,Analytics dashboard',
                maxArticles: 10,
                maxEvents: 5,
                maxJobs: 20,
                price: 299.00,
                billingPeriod: 'month',
                displayOrder: 2,
                isPopular: 1,
                isActive: 1
            },
            {
                id: uuidv4(),
                title: 'Enterprise',
                description: 'Unlimited access for large organizations',
                features: 'Unlimited job postings,Full access to talent database,Premium recruitment tools,Dedicated account manager,Advanced analytics,Custom integrations',
                maxArticles: -1,
                maxEvents: -1,
                maxJobs: -1,
                price: 999.00,
                billingPeriod: 'month',
                displayOrder: 3,
                isPopular: 0,
                isActive: 1
            }
        ];

        for (const plan of plans) {
            await connection.execute(
                `INSERT INTO company_plan (id, title, description, features, maxArticles, maxEvents, maxJobs, price, billingPeriod, displayOrder, isPopular, isActive) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    plan.id,
                    plan.title,
                    plan.description,
                    plan.features,
                    plan.maxArticles,
                    plan.maxEvents,
                    plan.maxJobs,
                    plan.price,
                    plan.billingPeriod,
                    plan.displayOrder,
                    plan.isPopular,
                    plan.isActive
                ]
            );
            console.log(`✓ Created plan: ${plan.title}`);
        }

        console.log('\n✓ Company plans seeded successfully!');
    } catch (error) {
        console.error('Error seeding company plans:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

seedCompanyPlans()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
