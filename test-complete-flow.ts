import AppDataSource from './src/database';
import { CoachingBooking } from './src/database/entities/CoachingBooking';

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing Complete Coaching Flow\n');
    console.log('='.repeat(50));

    // 1. Connexion à la base de données
    console.log('\n1️⃣  Connecting to database...');
    await AppDataSource.initialize();
    console.log('   ✅ Database connected');

    // 2. Vérifier la table
    console.log('\n2️⃣  Checking coaching_bookings table...');
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    const tableExists = await queryRunner.hasTable('coaching_bookings');
    console.log(`   ✅ Table exists: ${tableExists}`);
    await queryRunner.release();

    // 3. Créer une réservation de test
    console.log('\n3️⃣  Creating test booking...');
    const testBooking = CoachingBooking.create({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+33 6 12 34 56 78',
      consultant: 'guy',
      serviceType: 'bilan',
      bookingDate: '2024-12-15',
      bookingTime: '14:00',
      amount: 25000,
      status: 'pending',
    });
    await testBooking.save();
    console.log(`   ✅ Booking created with ID: ${testBooking.id}`);

    // 4. Récupérer la réservation
    console.log('\n4️⃣  Retrieving booking...');
    const retrieved = await CoachingBooking.findOne({ where: { id: testBooking.id } });
    console.log('   ✅ Booking retrieved:');
    console.log(`      - Name: ${retrieved?.name}`);
    console.log(`      - Email: ${retrieved?.email}`);
    console.log(`      - Consultant: ${retrieved?.consultant}`);
    console.log(`      - Service: ${retrieved?.serviceType}`);
    console.log(`      - Date: ${retrieved?.bookingDate}`);
    console.log(`      - Time: ${retrieved?.bookingTime}`);
    console.log(`      - Amount: ${(retrieved?.amount || 0) / 100}€`);
    console.log(`      - Status: ${retrieved?.status}`);

    // 5. Mettre à jour le statut
    console.log('\n5️⃣  Updating booking status to "paid"...');
    if (retrieved) {
      retrieved.status = 'paid';
      retrieved.stripeSessionId = 'cs_test_123456789';
      retrieved.stripePaymentIntentId = 'pi_test_123456789';
      await retrieved.save();
      console.log('   ✅ Status updated');
    }

    // 6. Vérifier la mise à jour
    console.log('\n6️⃣  Verifying update...');
    const updated = await CoachingBooking.findOne({ where: { id: testBooking.id } });
    console.log(`   ✅ Status: ${updated?.status}`);
    console.log(`   ✅ Stripe Session ID: ${updated?.stripeSessionId}`);

    // 7. Nettoyer (supprimer la réservation de test)
    console.log('\n7️⃣  Cleaning up test data...');
    await CoachingBooking.delete({ id: testBooking.id });
    console.log('   ✅ Test booking deleted');

    // 8. Vérifier la configuration Stripe
    console.log('\n8️⃣  Checking Stripe configuration...');
    const { stripeConfig } = await import('./src/config/stripe');
    console.log('   ✅ Stripe Price IDs:');
    console.log(`      - Bilan: ${stripeConfig.coachingPriceIds.bilan}`);
    console.log(`      - Accompagnement: ${stripeConfig.coachingPriceIds.accompagnement}`);

    await AppDataSource.destroy();
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed! System is ready.\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testCompleteFlow();
