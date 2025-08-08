const { fetchExecutiveDashboardData } = require('./fetchData');

async function debugFields() {
  console.log('🔍 Debugging field values...\n');
  
  try {
    // Fetch data
    const tasks = await fetchExecutiveDashboardData();
    console.log(`📊 Fetched ${tasks.length} tasks`);
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found');
      return;
    }
    
    // Analyze first few tasks
    console.log('\n📋 Analyzing first 3 tasks:');
    for (let i = 0; i < Math.min(3, tasks.length); i++) {
      const task = tasks[i];
      console.log(`\nTask ${i + 1}: "${task.name}"`);
      
      if (task.custom_fields) {
        console.log('Custom fields:');
        task.custom_fields.forEach(field => {
          console.log(`  ${field.name}: ${JSON.stringify(field.value)} (type: ${typeof field.value})`);
          if (field.value_text) {
            console.log(`    value_text: ${field.value_text}`);
          }
          if (field.type_config) {
            console.log(`    type_config: ${JSON.stringify(field.type_config)}`);
          }
        });
      } else {
        console.log('  No custom fields');
      }
    }
    
    // Analyze specific fields
    console.log('\n🎯 Analyzing specific fields:');
    const targetFields = [
      'Live Tracking Delivery',
      'Replay Delivery', 
      'NBA SLA Delivery Time',
      'Scrub SLA',
      'Resend'
    ];
    
    targetFields.forEach(fieldName => {
      console.log(`\n📊 ${fieldName}:`);
      const values = [];
      
      tasks.forEach(task => {
        if (task.custom_fields) {
          const field = task.custom_fields.find(f => 
            f.name === fieldName || f.name === fieldName.toLowerCase()
          );
          if (field) {
            const value = field.value || field.value?.value || field.value_text || 'Unknown';
            values.push(value);
            console.log(`  "${task.name}": ${JSON.stringify(value)}`);
          }
        }
      });
      
      console.log(`  Total values: ${values.length}`);
      console.log(`  Unique values: ${[...new Set(values)]}`);
      
      // Calculate what the percentage should be
      if (fieldName === 'Live Tracking Delivery' || fieldName === 'Replay Delivery') {
        const deliveredCount = values.filter(v => {
          const valueStr = String(v).toLowerCase();
          return valueStr === 's5: good' || 
                 valueStr === 's4: minor issues (i)' || 
                 valueStr === 's4: minor issues (e)' ||
                 valueStr === 's5 - good' || 
                 valueStr === 's4 - minor issues (i)' || 
                 valueStr === 's4 - minor issues (e)';
        }).length;
        console.log(`  Delivery percentage: ${deliveredCount}/${values.length} = ${Math.round((deliveredCount / values.length) * 100)}%`);
      }
      
      if (fieldName === 'NBA SLA Delivery Time') {
        const hitCount = values.filter(v => {
          const valueStr = String(v).toLowerCase();
          return valueStr === 'hit sla';
        }).length;
        console.log(`  SLA Hit percentage: ${hitCount}/${values.length} = ${Math.round((hitCount / values.length) * 100)}%`);
      }
      
      if (fieldName === 'Resend') {
        const resendCount = values.filter(v => {
          const valueStr = String(v).toLowerCase();
          return valueStr === 'yes';
        }).length;
        console.log(`  Resend percentage: ${resendCount}/${values.length} = ${Math.round((resendCount / values.length) * 100)}%`);
      }
    });
    
    // Check Event Date field
    console.log('\n📅 Analyzing Event Date field:');
    const eventDates = [];
    tasks.forEach(task => {
      if (task.custom_fields) {
        const field = task.custom_fields.find(f => 
          f.name === 'Event Date' || f.name === 'event date' || f.name === 'EVENT DATE'
        );
        if (field) {
          eventDates.push({
            task: task.name,
            value: field.value,
            value_text: field.value_text
          });
        }
      }
    });
    
    console.log(`Event Date values found: ${eventDates.length}`);
    eventDates.slice(0, 5).forEach(item => {
      console.log(`  "${item.task}": ${JSON.stringify(item.value)}`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run debug if this file is executed directly
if (require.main === module) {
  debugFields().catch(console.error);
}

module.exports = { debugFields };
