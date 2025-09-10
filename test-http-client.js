// test-http-client.js
const axios = require('axios');

async function testHttpClient() {
  try {
    console.log('🧪 Testing HTTP Client configuration...');
    
    // Test with Bearer token
    const axiosInstance = axios.create({
      baseURL: 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzU3NDEwODk3LCJleHAiOjE3NjAwMDI4OTd9.YA0FBHeKEUbbbU9T_pG3mpTJnqkayNjgQs9zKpdWxY8'
      }
    });

    // Test API call (giả sử có endpoint /auth/profile)
    console.log('📡 Making test request to /auth/profile...');
    
    const response = await axiosInstance.get('/auth/profile');
    console.log('✅ Success:', response.status, response.statusText);
    console.log('📦 Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP Error:', error.response.status, error.response.statusText);
      console.log('📦 Error data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('❌ Network Error:', error.message);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testHttpClient();
