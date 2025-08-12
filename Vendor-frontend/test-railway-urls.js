const fetch = require('node-fetch');

const possibleUrls = [
  'https://rentalmanagementsystem-production.up.railway.app',
  'https://rental-management-system-production.up.railway.app', 
  'https://rentalmanagementsystem.up.railway.app',
  'https://rental-management-system.up.railway.app',
  'https://rentalmanagementsystem-production.railway.app',
  'https://rental-management-system-production.railway.app'
];

async function testUrls() {
  console.log('🔍 Testing possible Railway deployment URLs...\n');
  
  for (const baseUrl of possibleUrls) {
    try {
      console.log(`Testing: ${baseUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(baseUrl, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`✅ ${baseUrl} - Status: ${response.status}`);
      
      // If we find a working URL, test the API endpoints
      if (response.status < 400) {
        console.log(`\n🧪 Testing API endpoints on working URL...`);
        
        const apiTests = [
          `${baseUrl}/api/`,
          `${baseUrl}/api/auth/`,
          `${baseUrl}/api/auth/login/`,
          `${baseUrl}/api/auth/register/`
        ];
        
        for (const apiUrl of apiTests) {
          try {
            const apiResponse = await fetch(apiUrl, { method: 'HEAD', signal: controller.signal });
            console.log(`  ${apiUrl} - Status: ${apiResponse.status}`);
          } catch (err) {
            console.log(`  ${apiUrl} - Error: ${err.message}`);
          }
        }
        
        return baseUrl; // Return the working URL
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏰ ${baseUrl} - Timeout`);
      } else {
        console.log(`❌ ${baseUrl} - Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n❌ No working Railway URLs found');
  return null;
}

testUrls().then(workingUrl => {
  if (workingUrl) {
    console.log(`\n✅ Found working Railway URL: ${workingUrl}`);
    console.log(`📝 Update your API_URL to: ${workingUrl}/api`);
  } else {
    console.log('\n💡 Recommendations:');
    console.log('1. Check if your Railway deployment is active');
    console.log('2. Verify the correct Railway app name');
    console.log('3. Consider using a local backend for development');
  }
});
