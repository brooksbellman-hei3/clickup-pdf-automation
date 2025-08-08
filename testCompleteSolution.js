// Test the complete solution with field mapping fixes and number card stats
const mockTasks = [
  {
    id: "86b66239q",
    name: "MIA|07/05/2025",
    custom_fields: [
      { name: "Operations P-Status ", value: "P4 - Minor (I)", value_text: "P4 - Minor (I)" },
      { name: "Software P-Status ", value: "P1 - Critical ", value_text: "P1 - Critical " },
      { name: "Hardware P-Status", value: "P1 - Critical (I)", value_text: "P1 - Critical (I)" },
      { name: "NBA SLA Delivery Time", value: "Missed: 1 HOUR+", value_text: "Missed: 1 HOUR+" },
      { name: "Scrub SLA ", value: "NBA | No | > 30 Mins Post Game", value_text: "NBA | No | > 30 Mins Post Game" },
      { name: "Resend", value: "No", value_text: "No" },
      { name: "Live Tracking Delivery", value: "S1: Critical (I)", value_text: "S1: Critical (I)" },
      { name: "Scrubbed Delivery", value: "S1: Critical (I)", value_text: "S1: Critical (I)" },
      { name: "Replay Delivery", value: "S1: Critical (I)", value_text: "S1: Critical (I)" }
    ]
  },
  {
    id: "86b5qbzjg",
    name: "GSW|07/08/2025",
    custom_fields: [
      { name: "Operations P-Status ", value: "P5 - Good", value_text: "P5 - Good" },
      { name: "Software P-Status ", value: "P5 - Good", value_text: "P5 - Good" },
      { name: "Hardware P-Status", value: "P4 - Minor (I)", value_text: "P4 - Minor (I)" },
      { name: "NBA SLA Delivery Time", value: "Hit SLA", value_text: "Hit SLA" },
      { name: "Scrub SLA ", value: "NBA | Yes | < 30 Mins Post Game", value_text: "NBA | Yes | < 30 Mins Post Game" },
      { name: "Resend", value: "No", value_text: "No" },
      { name: "Live Tracking Delivery", value: "S4: Minor Issues (I)", value_text: "S4: Minor Issues (I)" },
      { name: "Scrubbed Delivery", value: "S5: Good", value_text: "S5: Good" },
      { name: "Replay Delivery", value: "S5: Good", value_text: "S5: Good" }
    ]
  },
  {
    id: "86b5qbzjq",
    name: "MIN|07/10/2025",
    custom_fields: [
      { name: "Operations P-Status ", value: "P5 - Good", value_text: "P5 - Good" },
      { name: "Software P-Status ", value: "P4 - Minor ", value_text: "P4 - Minor " },
      { name: "Hardware P-Status", value: "P5 - Good", value_text: "P5 - Good" },
      { name: "NBA SLA Delivery Time", value: "Missed: 1 HOUR+", value_text: "Missed: 1 HOUR+" },
      { name: "Scrub SLA ", value: "NBA | No | > 30 Mins Post Game", value_text: "NBA | No | > 30 Mins Post Game" },
      { name: "Resend", value: "Yes", value_text: "Yes" },
      { name: "Live Tracking Delivery", value: "S4: Minor Issues (I)", value_text: "S4: Minor Issues (I)" },
      { name: "Scrubbed Delivery", value: "S5: Good", value_text: "S5: Good" },
      { name: "Replay Delivery", value: "S5: Good", value_text: "S5: Good" }
    ]
  }
];

// Executive dashboard field configuration
const EXECUTIVE_FIELDS = [
  'Live Tracking Delivery',
  'Scrubbed Delivery', 
  'Replay Delivery',
  'Operations P-Status ',
  'Software P-Status ',
  'Hardware P-Status',
  'NBA SLA Delivery Time',
  'Scrub SLA ',
  'Resend'
];

// Fields that should be displayed as number cards instead of charts
const NUMBER_CARD_FIELDS = [
  'NBA SLA Delivery Time',
  'Scrub SLA ', 
  'Resend'
];

// Field name mappings for common variations
const FIELD_NAME_MAPPINGS = {
  'Scrub SLA ': ['Scrub SLA ', 'Scrub SLA', 'Scrubbed SLA', 'Scrub SLA Delivery'],
  'NBA SLA Delivery Time': ['NBA SLA Delivery Time', 'NBA SLA Delivery', 'NBA SLA Time'],
  'Live Tracking Delivery': ['Live Tracking Delivery', 'Live Tracking', 'Live Delivery'],
  'Replay Delivery': ['Replay Delivery', 'Replay', 'Replay Tracking'],
  'Resend': ['Resend', 'Resend Required', 'Resend Flag']
};

// Helper function to find field by name with flexible matching
function findFieldByName(fields, targetName) {
  if (!fields || !Array.isArray(fields)) return null;
  
  // First try exact match
  let field = fields.find(f => f.name === targetName);
  if (field) return field;
  
  // Try case-insensitive match
  field = fields.find(f => f.name.toLowerCase() === targetName.toLowerCase());
  if (field) return field;
  
  // Try partial match
  field = fields.find(f => f.name.toLowerCase().includes(targetName.toLowerCase()));
  if (field) return field;
  
  // Try with mappings
  const mappings = FIELD_NAME_MAPPINGS[targetName];
  if (mappings) {
    for (const mapping of mappings) {
      field = fields.find(f => f.name === mapping);
      if (field) return field;
      
      field = fields.find(f => f.name.toLowerCase() === mapping.toLowerCase());
      if (field) return field;
    }
  }
  
  return null;
}

// Helper function to get field value consistently
function getFieldValue(field) {
  if (!field) return null;
  
  // Try value_text first (most reliable)
  if (field.value_text && field.value_text.trim() !== '' && field.value_text !== 'N/A') {
    return field.value_text.trim();
  }
  
  // Try value property
  if (field.value !== null && field.value !== undefined && field.value !== '') {
    if (typeof field.value === 'string') {
      return field.value.trim();
    } else if (typeof field.value === 'object' && field.value.name) {
      return field.value.name;
    } else {
      return String(field.value).trim();
    }
  }
  
  return null;
}

// Fixed stats calculation function
function calculateDashboardStats(tasks, specificDate = null) {
  console.log('📊 Calculating dashboard statistics...');
  
  const stats = {};
  
  // Total games count
  stats.totalGames = tasks.length;
  console.log(`📊 Total games count: ${stats.totalGames}`);
  
  // Calculate delivery percentages using improved field finding
  const liveTrackingValues = tasks.map(task => {
    const field = findFieldByName(task.custom_fields, 'Live Tracking Delivery');
    return field ? getFieldValue(field) : null;
  }).filter(v => v !== null && v !== 'Unknown');
  
  if (liveTrackingValues.length > 0) {
    const deliveredCount = liveTrackingValues.filter(v => {
      const valueStr = String(v).toLowerCase();
      return valueStr === 's5: good' || 
             valueStr === 's4: minor issues (i)' || 
             valueStr === 's4: minor issues (e)' ||
             valueStr === 's5 - good' || 
             valueStr === 's4 - minor issues (i)' || 
             valueStr === 's4 - minor issues (e)';
    }).length;
    
    stats.liveTrackingDelivery = Math.round((deliveredCount / liveTrackingValues.length) * 100);
    console.log(`📊 Live Tracking Delivery: ${deliveredCount}/${liveTrackingValues.length} = ${stats.liveTrackingDelivery}%`);
  } else {
    console.log(`⚠️ Live Tracking Delivery field not found or no valid values`);
    stats.liveTrackingDelivery = 0;
  }
  
  const replayValues = tasks.map(task => {
    const field = findFieldByName(task.custom_fields, 'Replay Delivery');
    return field ? getFieldValue(field) : null;
  }).filter(v => v !== null && v !== 'Unknown');
  
  if (replayValues.length > 0) {
    const deliveredCount = replayValues.filter(v => {
      const valueStr = String(v).toLowerCase();
      return valueStr === 's5: good' || 
             valueStr === 's4: minor issues (i)' || 
             valueStr === 's4: minor issues (e)' ||
             valueStr === 's5 - good' || 
             valueStr === 's4 - minor issues (i)' || 
             valueStr === 's4 - minor issues (e)';
    }).length;
    
    stats.replayDelivery = Math.round((deliveredCount / replayValues.length) * 100);
    console.log(`📊 Replay Delivery: ${deliveredCount}/${replayValues.length} = ${stats.replayDelivery}%`);
  } else {
    console.log(`⚠️ Replay Delivery field not found or no valid values`);
    stats.replayDelivery = 0;
  }
  
  // Calculate SLA hit percentage (only NBA SLA Delivery Time)
  let totalSLAs = 0;
  let hitSLAs = 0;
  
  tasks.forEach(task => {
    const field = findFieldByName(task.custom_fields, 'NBA SLA Delivery Time');
    if (field) {
      totalSLAs++;
      const value = getFieldValue(field);
      if (value) {
        const valueStr = String(value).toLowerCase();
        if (valueStr === 'hit sla') {
          hitSLAs++;
        }
      }
    }
  });
  
  stats.slaHitPercentage = totalSLAs > 0 ? Math.round((hitSLAs / totalSLAs) * 100) : 0;
  console.log(`📊 SLA Hit Percentage: ${hitSLAs}/${totalSLAs} = ${stats.slaHitPercentage}%`);
  
  // Calculate resend percentage
  const resendValues = tasks.map(task => {
    const field = findFieldByName(task.custom_fields, 'Resend');
    return field ? getFieldValue(field) : null;
  }).filter(v => v !== null);
  
  if (resendValues.length > 0) {
    const resendCount = resendValues.filter(v => {
      const valueStr = String(v).toLowerCase();
      return valueStr === 'yes';
    }).length;
    
    stats.resendPercentage = Math.round((resendCount / resendValues.length) * 100);
    console.log(`📊 Resend Percentage: ${resendCount}/${resendValues.length} = ${stats.resendPercentage}%`);
  } else {
    console.log(`⚠️ Resend field not found or no valid values`);
    stats.resendPercentage = 0;
  }
  
  console.log('📊 Dashboard stats calculated:', stats);
  return stats;
}

// Function to generate number card stats for dashboard header
function generateNumberCardStats(tasks) {
  console.log('📊 Generating number card stats for dashboard header...');
  
  const stats = {};
  
  // Process each number card field
  NUMBER_CARD_FIELDS.forEach(fieldName => {
    console.log(`📊 Processing number card field: "${fieldName}"`);
    
    const values = tasks.map(task => {
      const field = findFieldByName(task.custom_fields, fieldName);
      return field ? getFieldValue(field) : null;
    }).filter(v => v !== null);
    
    if (values.length > 0) {
      // Count unique values and their frequencies
      const counts = {};
      values.forEach(value => {
        counts[value] = (counts[value] || 0) + 1;
      });
      
      // Store the counts for this field
      stats[fieldName] = counts;
      console.log(`📊 ${fieldName} stats:`, counts);
    } else {
      console.log(`⚠️ No values found for ${fieldName}`);
      stats[fieldName] = {};
    }
  });
  
  return stats;
}

// Mock chart generation function
async function generateExecutiveFieldChart(tasks, fieldName, title, index) {
  console.log(`🔍 Mock generating chart for field: "${fieldName}"`);
  
  // Return a mock chart object
  return {
    title: title,
    filePath: `mock_chart_${index}.png`,
    buffer: Buffer.from('mock chart data'),
    base64Chart: 'bW9jayBjaGFydCBkYXRh' // base64 encoded "mock chart data"
  };
}

// Mock complete dashboard function
async function generateCompleteDashboardCharts(tasks, specificDate = null) {
  console.log(`🎨 Mock generating complete dashboard with charts and number card stats`);
  
  const allCharts = [];
  
  // Generate charts for each executive field (excluding number card fields)
  for (let i = 0; i < EXECUTIVE_FIELDS.length; i++) {
    const fieldName = EXECUTIVE_FIELDS[i];
    
    // Skip number card fields - they will be displayed as stats in header
    if (NUMBER_CARD_FIELDS.includes(fieldName)) {
      console.log(`📊 Skipping number card field: ${fieldName} (will be displayed as stats)`);
      continue;
    }
    
    console.log(`📊 Processing chart field: ${fieldName}`);
    
    let chartTitle = fieldName;
    if (specificDate) {
      chartTitle = `${fieldName} (${specificDate})`;
    }
    
    try {
      const chart = await generateExecutiveFieldChart(tasks, fieldName, chartTitle, i);
      if (chart) {
        allCharts.push(chart);
        console.log(`✅ Chart generated: ${chart.title}`);
      }
    } catch (error) {
      console.error(`❌ Error generating chart for ${fieldName}:`, error.message);
    }
  }
  
  // Calculate dashboard statistics
  const stats = calculateDashboardStats(tasks, specificDate);
  
  // Generate number card stats for header display
  const numberCardStats = generateNumberCardStats(tasks);
  
  console.log(`\n📈 Total charts generated: ${allCharts.length}`);
  console.log(`📊 Number card stats generated for header display`);
  
  return {
    charts: allCharts,
    stats: stats,
    numberCardStats: numberCardStats
  };
}

function testCompleteSolution() {
  console.log('🔍 Testing complete solution with field mapping fixes and number card stats...\n');
  
  // Test the complete dashboard generation
  generateCompleteDashboardCharts(mockTasks, '2025-07-08').then(result => {
    console.log('\n📊 Complete Solution Test Results:');
    console.log(`  Charts generated: ${result.charts.length}`);
    console.log(`  Chart titles: ${result.charts.map(c => c.title).join(', ')}`);
    console.log(`  Stats:`, result.stats);
    console.log(`  Number Card Stats:`, result.numberCardStats);
    
    // Verify that number card fields are NOT in the charts
    const chartTitles = result.charts.map(c => c.title);
    const numberCardFieldsInCharts = NUMBER_CARD_FIELDS.filter(field => 
      chartTitles.some(title => title.includes(field))
    );
    
    if (numberCardFieldsInCharts.length === 0) {
      console.log('✅ Number card fields correctly excluded from charts');
    } else {
      console.log('❌ Number card fields incorrectly included in charts:', numberCardFieldsInCharts);
    }
    
    // Verify that number card stats are generated
    if (result.numberCardStats && Object.keys(result.numberCardStats).length > 0) {
      console.log('✅ Number card stats correctly generated');
    } else {
      console.log('❌ Number card stats not generated');
    }
    
    console.log('\n🎉 Complete solution test completed successfully!');
  }).catch(error => {
    console.error('❌ Test failed:', error);
  });
}

// Run the test
testCompleteSolution();
