const { testClickUpConnection } = require('./fetchData');

async function runDiagnostics() {
  console.log('🔍 Running service diagnostics...\n');
  
  // Check 1: Environment Variables
  console.log('📋 Environment Variables Check:');
  const requiredVars = [
    'CLICKUP_API_TOKEN',
    'CLICKUP_LIST_ID', 
    'EMAIL_USER',
    'EMAIL_PASS',
    'TO_EMAIL'
  ];
  
  let envIssues = 0;
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`❌ Missing: ${varName}`);
      envIssues++;
    } else {
      console.log(`✅ Found: ${varName}`);
    }
  });
  
  if (envIssues > 0) {
    console.log(`\n⚠️  ${envIssues} environment variables missing!`);
  } else {
    console.log('\n✅ All required environment variables present');
  }
  
  // Check 2: ClickUp Connection
  console.log('\n🔗 ClickUp API Connection Test:');
  try {
    const clickupStatus = await testClickUpConnection();
    if (clickupStatus.success) {
      console.log('✅ ClickUp connection successful');
    } else {
      console.log('❌ ClickUp connection failed:', clickupStatus.error);
    }
  } catch (error) {
    console.log('❌ ClickUp connection error:', error.message);
  }
  
  // Check 3: Memory Usage
  console.log('\n💾 Memory Usage:');
  const memUsage = process.memoryUsage();
  console.log(`Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);
  console.log(`Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`);
  console.log(`RSS: ${Math.round(memUsage.rss / 1024 / 1024)} MB`);
  
  // Check 4: Process Info
  console.log('\n⚙️  Process Info:');
  console.log(`Node Version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  console.log(`PID: ${process.pid}`);
  console.log(`Uptime: ${Math.round(process.uptime())} seconds`);
  
  // Check 5: Port Availability
  console.log('\n🌐 Port Check:');
  const PORT = process.env.PORT || 10000;
  console.log(`Port: ${PORT}`);
  
  // Check 6: File System
  console.log('\n📁 File System Check:');
  const fs = require('fs');
  const requiredFiles = [
    'package.json',
    'server.js',
    'fetchData.js',
    'generateDashboardCharts.js',
    'sendDashboardEmail.js',
    'dashboard.html'
  ];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ Missing: ${file}`);
    }
  });
  
  console.log('\n🎯 Diagnostic Complete!');
  console.log('\n💡 Common 503 Error Solutions:');
  console.log('1. Check Render.com logs for specific error messages');
  console.log('2. Verify all environment variables are set in Render');
  console.log('3. Ensure ClickUp API token is valid');
  console.log('4. Check if service is restarting due to memory limits');
  console.log('5. Try manual deploy in Render dashboard');
}

// Run diagnostics if this file is executed directly
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { runDiagnostics };
