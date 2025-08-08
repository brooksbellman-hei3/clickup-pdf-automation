// Mock the chart generation functions to test the logic
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

function testNumberCardLogic() {
  console.log('🔍 Testing number card generation logic...\n');
  
  // Test each executive field
  EXECUTIVE_FIELDS.forEach(fieldName => {
    console.log(`📋 Testing field: "${fieldName}"`);
    
    // Check if it should be a number card
    const isNumberCard = NUMBER_CARD_FIELDS.includes(fieldName);
    console.log(`  📊 Should be number card: ${isNumberCard ? 'Yes' : 'No'}`);
    
    // Test field finding
    const foundInTask1 = mockTasks[0].custom_fields.find(f => f.name === fieldName);
    const foundInTask2 = mockTasks[1].custom_fields.find(f => f.name === fieldName);
    
    if (foundInTask1) {
      console.log(`  ✅ Found in Task 1: "${foundInTask1.name}" = "${foundInTask1.value_text}"`);
    } else {
      console.log(`  ❌ Not found in Task 1`);
    }
    
    if (foundInTask2) {
      console.log(`  ✅ Found in Task 2: "${foundInTask2.name}" = "${foundInTask2.value_text}"`);
    } else {
      console.log(`  ❌ Not found in Task 2`);
    }
    
    console.log('');
  });
  
  // Test the specific logic from generateExecutiveFieldChart
  console.log('🔍 Testing generateExecutiveFieldChart logic...\n');
  
  EXECUTIVE_FIELDS.forEach(fieldName => {
    console.log(`📋 Processing field: "${fieldName}"`);
    
    // Check if this field should be a number count chart
    const isNumberCountField = NUMBER_CARD_FIELDS.includes(fieldName);
    console.log(`  📊 isNumberCountField: ${isNumberCountField}`);
    
    if (isNumberCountField) {
      console.log(`  📊 Would call generateNumberCountChart for "${fieldName}"`);
    } else {
      console.log(`  📊 Would call generatePieChart for "${fieldName}"`);
    }
    
    console.log('');
  });
}

function testMetricCalculations() {
  console.log('📊 Testing metric calculations...\n');
  
  // Test SLA calculations
  const slaField = mockTasks[0].custom_fields.find(f => f.name === 'NBA SLA Delivery Time');
  const scrubSLAField = mockTasks[0].custom_fields.find(f => f.name === 'Scrub SLA ');
  
  console.log('SLA Metrics:');
  console.log(`  NBA SLA: ${slaField ? slaField.value_text : 'Not found'}`);
  console.log(`  Scrub SLA: ${scrubSLAField ? scrubSLAField.value_text : 'Not found'}`);
  
  // Test what the stats calculation would do
  let totalSLAs = 0;
  let hitSLAs = 0;
  
  mockTasks.forEach(task => {
    const field = task.custom_fields?.find(f => 
      f.name === 'NBA SLA Delivery Time' || f.name === 'nba sla delivery time'
    );
    if (field) {
      totalSLAs++;
      const value = field.value || field.value?.value || field.value_text || '';
      const valueStr = String(value).toLowerCase();
      if (valueStr === 'hit sla') {
        hitSLAs++;
      }
    }
  });
  
  const slaHitPercentage = totalSLAs > 0 ? Math.round((hitSLAs / totalSLAs) * 100) : 0;
  console.log(`  SLA Hit Percentage: ${hitSLAs}/${totalSLAs} = ${slaHitPercentage}%`);
  
  // Test resend calculation
  const resendValues = mockTasks.map(task => {
    const field = task.custom_fields?.find(f => 
      f.name === 'Resend' || f.name === 'resend'
    );
    return field?.value || field?.value?.value || field?.value_text || 'No';
  });
  
  const resendCount = resendValues.filter(v => {
    const valueStr = String(v).toLowerCase();
    return valueStr === 'yes';
  }).length;
  
  const resendPercentage = resendValues.length > 0 ? Math.round((resendCount / resendValues.length) * 100) : 0;
  console.log(`  Resend Percentage: ${resendCount}/${resendValues.length} = ${resendPercentage}%`);
}

// Run the tests
testNumberCardLogic();
testMetricCalculations();
