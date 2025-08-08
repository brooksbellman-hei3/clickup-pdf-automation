const axios = require('axios');
require('dotenv').config();

async function testFieldNames() {
  console.log('🔍 Testing actual field names from ClickUp API...');
  
  try {
    // Test ClickUp API connection
    const response = await axios.get(`https://api.clickup.com/api/v2/list/901411784189/task`, {
      headers: {
        'Authorization': process.env.CLICKUP_API_TOKEN,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 3 // Just get 3 tasks for testing
      }
    });
    
    const tasks = response.data.tasks;
    console.log(`📊 Fetched ${tasks.length} tasks`);
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found');
      return;
    }
    
    // Check first task's fields
    const firstTask = tasks[0];
    console.log(`\n📋 First task: "${firstTask.name}"`);
    
    if (firstTask.custom_fields) {
      console.log('Available fields:');
      firstTask.custom_fields.forEach((field, index) => {
        console.log(`  ${index}: "${field.name}" = ${JSON.stringify(field.value)} (type: ${field.type})`);
        if (field.value_text) {
          console.log(`    value_text: "${field.value_text}"`);
        }
      });
    }
    
    // Check for our specific fields
    const targetFields = [
      'Live Tracking Delivery (drop down)',
      'Replay Delivery (drop down)',
      'NBA SLA Delivery Time (drop down)',
      'Resend (drop down)',
      'Scrub SLA  (drop down)'
    ];
    
    console.log('\n🔍 Checking for target fields:');
    targetFields.forEach(fieldName => {
      const found = firstTask.custom_fields?.some(f => 
        f.name === fieldName
      );
      console.log(`  "${fieldName}": ${found ? '✅ Found' : '❌ Not found'}`);
    });
    
    // Show all field names for comparison
    console.log('\n📋 All field names in first task:');
    firstTask.custom_fields?.forEach((field, index) => {
      console.log(`  ${index}: "${field.name}"`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFieldNames();
