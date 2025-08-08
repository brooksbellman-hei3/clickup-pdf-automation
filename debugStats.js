const { fetchExecutiveDashboardData } = require('./fetchData');
const { calculateDashboardStats, filterTasksByEventDate } = require('./generateDashboardCharts');

async function debugStats() {
  console.log('🔍 Starting comprehensive stats debug...');
  
  try {
    // Fetch data
    const tasks = await fetchExecutiveDashboardData();
    console.log(`📊 Fetched ${tasks.length} tasks`);
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found');
      return;
    }
    
    // Analyze first task structure
    console.log('\n📋 First task custom fields structure:');
    const firstTask = tasks[0];
    if (firstTask.custom_fields) {
      firstTask.custom_fields.forEach((field, index) => {
        console.log(`  ${index}: ${field.name} = ${JSON.stringify(field.value)} (type: ${field.type})`);
        if (field.value_text) {
          console.log(`    value_text: ${field.value_text}`);
        }
      });
    }
    
    // Calculate stats for all tasks
    console.log('\n📊 Calculating overall stats...');
    const overallStats = calculateDashboardStats(tasks);
    console.log('Overall stats:', overallStats);
    
    // Calculate stats for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log(`\n📅 Calculating stats for yesterday (${yesterdayStr})...`);
    const yesterdayStats = calculateDashboardStats(tasks, yesterdayStr);
    console.log('Yesterday stats:', yesterdayStats);
    
    // Detailed analysis of specific fields
    console.log('\n🔍 Detailed field analysis:');
    
    const fieldsToAnalyze = [
      'Live Tracking Delivery',
      'Replay Delivery', 
      'NBA SLA Delivery Time',
      'Resend'
    ];
    
    fieldsToAnalyze.forEach(fieldName => {
      console.log(`\n📋 Analyzing "${fieldName}":`);
      
      const fieldValues = tasks.map(task => {
        const field = task.custom_fields?.find(f => 
          f.name === fieldName || f.name.toLowerCase() === fieldName.toLowerCase()
        );
        return {
          taskName: task.name,
          value: field?.value,
          valueText: field?.value_text,
          type: field?.type
        };
      }).filter(item => item.value !== undefined);
      
      console.log(`  Found ${fieldValues.length} tasks with this field`);
      
      // Show first 5 values
      fieldValues.slice(0, 5).forEach(item => {
        console.log(`    "${item.taskName}": value=${JSON.stringify(item.value)}, valueText="${item.valueText}", type=${item.type}`);
      });
      
      if (fieldValues.length > 5) {
        console.log(`    ... and ${fieldValues.length - 5} more`);
      }
      
      // Count unique values
      const uniqueValues = {};
      fieldValues.forEach(item => {
        const key = item.valueText || String(item.value);
        uniqueValues[key] = (uniqueValues[key] || 0) + 1;
      });
      
      console.log('  Unique values:');
      Object.entries(uniqueValues).forEach(([value, count]) => {
        console.log(`    "${value}": ${count}`);
      });
    });
    
    // Test date filtering
    console.log('\n📅 Testing date filtering:');
    const yesterdayTasks = filterTasksByEventDate(tasks, yesterdayStr);
    console.log(`Found ${yesterdayTasks.length} tasks for yesterday`);
    
    if (yesterdayTasks.length > 0) {
      console.log('Sample yesterday tasks:');
      yesterdayTasks.slice(0, 3).forEach(task => {
        console.log(`  - ${task.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugStats();
