const fetch = require('node-fetch');

const testData = {
  username: "testuser123",
  email: "testuser123@example.com",
  first_name: "Test",
  last_name: "User",
  password: "testpass123",
  password_confirm: "testpass123",
  phone: "1234567890",
  address: "123 Test Street",
  city: "Test City",
  state: "Test State",
  postal_code: "12345",
  country: "India",
  company_name: "",
  customer_type: "individual"
};

const possibleUrls = [
  'https://rentalmanagementsystem-production.up.railway.app/api/auth/register/',
  'https://rentalmanagementsystem-production.up.railway.app/auth/register/',
  'https://rental-management-system-production.up.railway.app/api/auth/register/',
  'http://localhost:8000/api/auth/register/'
];

async function testRegisterAPI() {
  for (const url of possibleUrls) {
    try {
      console.log(`\n=== Testing URL: ${url} ===`);
      console.log('Request data:', JSON.stringify(testData, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
        timeout: 10000 // 10 second timeout
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Response body (raw):', responseText);
      
      try {
        const data = JSON.parse(responseText);
        console.log('Response JSON:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Response is not valid JSON');
      }
      
      if (response.ok || response.status < 500) {
        console.log(`✅ URL ${url} is reachable!`);
        break;
      }
      
    } catch (error) {
      console.error(`❌ Error with ${url}:`, error.message);
    }
  }
}

testRegisterAPI();
