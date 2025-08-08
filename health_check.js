const axios = require('axios');

async function healthCheck() {
  const baseUrl = process.env.DASHBOARD_URL || 'https://gleaguereporttest.onrender.com';
  
  console.log('🏥 Running health checks...\n');
  
  const endpoints = [
    { name: 'Root', path: '/' },
    { name: 'Health', path: '/health' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Debug', path: '/debug' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing ${endpoint.name} endpoint...`);
      const response = await axios.get(`${baseUrl}${endpoint.path}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'HealthCheck/1.0'
        }
      });
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint.name}: OK (${response.status})`);
        if (response.data && response.data.timestamp) {
          console.log(`   Last updated: ${response.data.timestamp}`);
        }
      } else {
        console.log(`⚠️  ${endpoint.name}: Unexpected status ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${endpoint.name}: Connection refused (service may be down)`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`❌ ${endpoint.name}: DNS resolution failed`);
      } else if (error.response) {
        console.log(`❌ ${endpoint.name}: HTTP ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`❌ ${endpoint.name}: ${error.message}`);
      }
    }
    console.log('');
  }
  
  console.log('🎯 Health check complete!');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('\n💡 For local testing, try:');
    console.log('   npm run dev');
    console.log('   curl http://localhost:10000/health');
  }
}

// Run health check if this file is executed directly
if (require.main === module) {
  healthCheck().catch(console.error);
}

module.exports = { healthCheck };
