const { fetchExecutiveDashboardData } = require('./fetchData');

async function quickTest() {
  console.log('🔍 Quick test of ClickUp data...');
  
  try {
    const tasks = await fetchExecutiveDashboardData();
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
    
    // Check for specific fields we need
    const neededFields = [
      'Live Tracking Delivery',
      'Replay Delivery', 
      'NBA SLA Delivery Time',
      'Resend',
      'Scrub SLA'
    ];
    
    console.log('\n🔍 Checking for needed fields:');
    neededFields.forEach(fieldName => {
      const found = firstTask.custom_fields?.some(f => 
        f.name.toLowerCase().includes(fieldName.toLowerCase())
      );
      console.log(`  ${fieldName}: ${found ? '✅ Found' : '❌ Not found'}`);
    });
    
    // Check all tasks for field availability
    console.log('\n📊 Field availability across all tasks:');
    const fieldCounts = {};
    
    tasks.forEach(task => {
      if (task.custom_fields) {
        task.custom_fields.forEach(field => {
          const name = field.name;
          fieldCounts[name] = (fieldCounts[name] || 0) + 1;
        });
      }
    });
    
    // Show fields that appear in most tasks
    const sortedFields = Object.entries(fieldCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    console.log('Most common fields:');
    sortedFields.forEach(([name, count]) => {
      console.log(`  "${name}": ${count}/${tasks.length} tasks`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

quickTest();
