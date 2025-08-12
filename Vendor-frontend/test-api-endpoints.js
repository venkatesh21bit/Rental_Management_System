// Test API endpoint detection
const RAILWAY_URLS = [
  "https://rentalmanagementsystem-production.up.railway.app/api",
  "https://rental-management-system-production.up.railway.app/api", 
  "https://rentalmanagement-production.up.railway.app/api",
  "https://odoo-finals-backend-production.up.railway.app/api"
];

async function testApiEndpoints() {
  console.log('🧪 Testing API endpoints for availability...\n');
  
  for (const url of RAILWAY_URLS) {
    try {
      console.log(`🔄 Testing: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const healthResponse = await fetch(`${url}/health/`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (healthResponse.ok) {
        console.log(`✅ Health check passed: ${url}`);
        
        // Test auth endpoint
        try {
          const authResponse = await fetch(`${url}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'test' })
          });
          
          console.log(`✅ Auth endpoint responds: ${url}/auth/login/ (Status: ${authResponse.status})`);
          console.log(`🎯 WORKING API URL FOUND: ${url}\n`);
          return url;
        } catch (authError) {
          console.log(`⚠️  Auth endpoint error: ${authError.message}`);
        }
      } else {
        console.log(`❌ Health check failed: ${url} (Status: ${healthResponse.status})`);
      }
    } catch (error) {
      console.log(`❌ Connection failed: ${url} - ${error.message}`);
    }
    console.log('');
  }
  
  console.log('❌ No working Railway URLs found');
  return null;
}

testApiEndpoints().then(workingUrl => {
  if (workingUrl) {
    console.log(`\n🎉 Use this URL in your frontend: ${workingUrl}`);
  } else {
    console.log('\n⚠️  Consider using mock API or check Railway deployment status');
  }
});
