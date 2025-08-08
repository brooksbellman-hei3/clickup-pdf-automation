const { fetchExecutiveDashboardData } = require('./fetchData');
const { generateExecutiveDashboardCharts, calculateDashboardStats } = require('./generateDashboardCharts');

async function debugScrubSLA() {
  console.log('🔍 Debugging Scrub SLA and top stats...');
  
  try {
    // Fetch data
    const tasks = await fetchExecutiveDashboardData();
    console.log(`📊 Fetched ${tasks.length} tasks`);
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found');
      return;
    }
    
    // Check Scrub SLA field specifically
    console.log('\n📋 Analyzing Scrub SLA field:');
    const scrubSLAField = tasks[0]?.custom_fields?.find(f => 
      f.name === 'Scrub SLA' || f.name.toLowerCase() === 'scrub sla'
    );
    
    if (scrubSLAField) {
      console.log(`✅ Found Scrub SLA field: ${scrubSLAField.name}`);
      console.log(`   Type: ${scrubSLAField.type}`);
      console.log(`   Value: ${JSON.stringify(scrubSLAField.value)}`);
      console.log(`   Value Text: ${scrubSLAField.value_text}`);
    } else {
      console.log('❌ Scrub SLA field not found in first task');
      
      // List all field names to see what's available
      console.log('\n📋 Available field names:');
      tasks[0].custom_fields?.forEach((field, index) => {
        console.log(`  ${index}: "${field.name}"`);
      });
    }
    
    // Check all tasks for Scrub SLA field
    const tasksWithScrubSLA = tasks.filter(task => {
      return task.custom_fields?.some(f => 
        f.name === 'Scrub SLA' || f.name.toLowerCase() === 'scrub sla'
      );
    });
    
    console.log(`\n📊 Found ${tasksWithScrubSLA.length} tasks with Scrub SLA field`);
    
    if (tasksWithScrubSLA.length > 0) {
      console.log('Sample Scrub SLA values:');
      tasksWithScrubSLA.slice(0, 5).forEach(task => {
        const field = task.custom_fields.find(f => 
          f.name === 'Scrub SLA' || f.name.toLowerCase() === 'scrub sla'
        );
        console.log(`  "${task.name}": ${JSON.stringify(field.value)} (text: ${field.value_text})`);
      });
    }
    
    // Test generating charts specifically for Scrub SLA
    console.log('\n📊 Testing Scrub SLA chart generation:');
    try {
      const charts = await generateExecutiveDashboardCharts(tasks);
      const scrubSLAChart = charts.find(c => c && c.title && c.title.includes('Scrub SLA'));
      
      if (scrubSLAChart) {
        console.log(`✅ Scrub SLA chart generated`);
        console.log(`   Title: ${scrubSLAChart.title}`);
        console.log(`   Buffer size: ${scrubSLAChart.buffer ? scrubSLAChart.buffer.length : 'N/A'} bytes`);
      } else {
        console.log('❌ Scrub SLA chart not found in generated charts');
        console.log('Available chart titles:');
        charts.forEach((chart, index) => {
          if (chart && chart.title) {
            console.log(`  ${index}: ${chart.title}`);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error generating charts:', error.message);
    }
    
    // Test stats calculation
    console.log('\n📊 Testing stats calculation:');
    const stats = calculateDashboardStats(tasks);
    console.log('Calculated stats:', stats);
    
    // Detailed analysis of the fields used in stats
    console.log('\n🔍 Detailed field analysis for stats:');
    
    const statsFields = [
      'Live Tracking Delivery',
      'Replay Delivery',
      'NBA SLA Delivery Time',
      'Resend'
    ];
    
    statsFields.forEach(fieldName => {
      console.log(`\n📋 "${fieldName}":`);
      
      const fieldData = tasks.map(task => {
        const field = task.custom_fields?.find(f => 
          f.name === fieldName || f.name.toLowerCase() === fieldName.toLowerCase()
        );
        return {
          taskName: task.name,
          value: field?.value,
          valueText: field?.value_text,
          type: field?.type
        };
      }).filter(item => item.value !== undefined || item.valueText);
      
      console.log(`  Found ${fieldData.length} tasks with this field`);
      
      // Show first 3 values
      fieldData.slice(0, 3).forEach(item => {
        console.log(`    "${item.taskName}": value=${JSON.stringify(item.value)}, valueText="${item.valueText}", type=${item.type}`);
      });
      
      // Count values that should count as "delivered" or "hit"
      if (fieldName === 'Live Tracking Delivery' || fieldName === 'Replay Delivery') {
        const deliveredCount = fieldData.filter(item => {
          const valueStr = String(item.valueText || item.value).toLowerCase();
          return valueStr === 's5: good' || 
                 valueStr === 's4: minor issues (i)' || 
                 valueStr === 's4: minor issues (e)' ||
                 valueStr === 's5 - good' || 
                 valueStr === 's4 - minor issues (i)' || 
                 valueStr === 's4 - minor issues (e)';
        }).length;
        
        console.log(`  Delivered count: ${deliveredCount}/${fieldData.length}`);
      } else if (fieldName === 'NBA SLA Delivery Time') {
        const hitCount = fieldData.filter(item => {
          const valueStr = String(item.valueText || item.value).toLowerCase();
          return valueStr === 'hit sla';
        }).length;
        
        console.log(`  Hit SLA count: ${hitCount}/${fieldData.length}`);
      } else if (fieldName === 'Resend') {
        const yesCount = fieldData.filter(item => {
          const valueStr = String(item.valueText || item.value).toLowerCase();
          return valueStr === 'yes';
        }).length;
        
        console.log(`  Yes count: ${yesCount}/${fieldData.length}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugScrubSLA();
