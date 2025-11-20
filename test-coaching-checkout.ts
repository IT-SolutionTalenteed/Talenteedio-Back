import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4000';

async function testCoachingCheckout() {
  try {
    console.log('Testing coaching checkout endpoint...\n');

    const testData = {
      contact: {
        name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        phone: '+33 6 12 34 56 78',
      },
      consultant: 'guy',
      service: 'bilan',
      date: '2024-12-15',
      time: '14:00',
      amount: 25000, // 250€
      success_url: `${API_URL}/coaching-emploi/success`,
      cancel_url: `${API_URL}/coaching-emploi/services/guy`,
    };

    console.log('Request data:', JSON.stringify(testData, null, 2));

    const response = await axios.post(
      `${API_URL}/billing/coaching-checkout`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\n✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\nCheckout URL:', response.data.url);
  } catch (error: any) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testCoachingCheckout();
