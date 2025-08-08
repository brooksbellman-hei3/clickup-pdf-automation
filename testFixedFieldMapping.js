// Test the fixed field mapping and metric calculations
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

function testFixedFieldMapping() {
  console.log('🔍 Testing fixed field mapping and metric calculations...\n');
  
  // Test field finding for each executive field
  EXECUTIVE_FIELDS.forEach(fieldName => {
    console.log(`📋 Testing field: "${fieldName}"`);
    
    const foundInTask1 = findFieldByName(mockTasks[0].custom_fields, fieldName);
    const foundInTask2 = findFieldByName(mockTasks[1].custom_fields, fieldName);
    const foundInTask3 = findFieldByName(mockTasks[2].custom_fields, fieldName);
    
    if (foundInTask1) {
      const value = getFieldValue(foundInTask1);
      console.log(`  ✅ Found in Task 1: "${foundInTask1.name}" = "${value}"`);
    } else {
      console.log(`  ❌ Not found in Task 1`);
    }
    
    if (foundInTask2) {
      const value = getFieldValue(foundInTask2);
      console.log(`  ✅ Found in Task 2: "${foundInTask2.name}" = "${value}"`);
    } else {
      console.log(`  ❌ Not found in Task 2`);
    }
    
    if (foundInTask3) {
      const value = getFieldValue(foundInTask3);
      console.log(`  ✅ Found in Task 3: "${foundInTask3.name}" = "${value}"`);
    } else {
      console.log(`  ❌ Not found in Task 3`);
    }
    
    // Check if it's a number card field
    const isNumberCard = NUMBER_CARD_FIELDS.includes(fieldName);
    console.log(`  📊 Number Card Field: ${isNumberCard ? 'Yes' : 'No'}`);
    
    console.log('');
  });
  
  // Test stats calculation
  console.log('📊 Testing stats calculation with fixed field mapping...\n');
  const stats = calculateDashboardStats(mockTasks);
  
  console.log('\n📊 Final Stats Summary:');
  console.log(`  Total Games: ${stats.totalGames}`);
  console.log(`  Live Tracking Delivery: ${stats.liveTrackingDelivery}%`);
  console.log(`  Replay Delivery: ${stats.replayDelivery}%`);
  console.log(`  SLA Hit Percentage: ${stats.slaHitPercentage}%`);
  console.log(`  Resend Percentage: ${stats.resendPercentage}%`);
}

// Run the test
testFixedFieldMapping();
