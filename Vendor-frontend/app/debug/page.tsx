'use client';

import { useState } from 'react';
import { API_URL, fetchWithAuth } from '@/utils/auth_fn';

export default function DebugPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAuth = () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    setResult(`
Access Token: ${token ? 'Present (' + token.substring(0, 20) + '...)' : 'Missing'}
Refresh Token: ${refreshToken ? 'Present (' + refreshToken.substring(0, 20) + '...)' : 'Missing'}
API URL: ${API_URL}
    `.trim());
  };

  const testAPI = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/catalog/products/`);
      const data = await response.json();
      
      setResult(`
Status: ${response.status}
OK: ${response.ok}
Data: ${JSON.stringify(data, null, 2)}
      `.trim());
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const testPublicAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/catalog/products/`);
      const data = await response.json();
      
      setResult(`
Public API Test:
Status: ${response.status}
OK: ${response.ok}
Data: ${JSON.stringify(data, null, 2)}
      `.trim());
    } catch (error) {
      setResult(`Public API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const clearStorage = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setResult('Local storage cleared');
  };

  return (
    <div className="container mx-auto p-8 bg-black text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Debug Authentication & API</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testAuth}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mr-4"
        >
          Check Auth Status
        </button>
        
        <button 
          onClick={testAPI}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mr-4"
        >
          {loading ? 'Testing...' : 'Test Authenticated API'}
        </button>

        <button 
          onClick={testPublicAPI}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded mr-4"
        >
          {loading ? 'Testing...' : 'Test Public API'}
        </button>
        
        <button 
          onClick={clearStorage}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Clear Storage
        </button>
      </div>

      <div className="bg-gray-900 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Result:</h3>
        <pre className="whitespace-pre-wrap text-sm">{result}</pre>
      </div>
    </div>
  );
}
