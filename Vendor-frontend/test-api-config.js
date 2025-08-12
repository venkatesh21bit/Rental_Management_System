import { API_URL } from '../utils/auth_fn';

console.log('🔍 Current API URL configuration:');
console.log('API_URL:', API_URL);
console.log('Environment:', process.env.NODE_ENV);
console.log('Custom API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Mock API Enabled:', process.env.NEXT_PUBLIC_MOCK_API);

// Test API connectivity
async function testAPIConnectivity() {
  try {
    console.log('\n🧪 Testing API connectivity...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_URL}/health/`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ API is reachable at:', API_URL);
      const data = await response.text();
      console.log('📝 Response:', data);
    } else {
      console.log('⚠️ API responded with status:', response.status);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏰ API request timed out');
    } else {
      console.log('❌ API not reachable:', error.message);
    }
    console.log('🔄 Will fallback to mock API if enabled');
  }
}

testAPIConnectivity();
