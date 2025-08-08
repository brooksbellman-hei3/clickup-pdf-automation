// Test chart generation logic without dependencies
const mockTasks = [
  {
    id: "86b66239q",
    name: "MIA|07/05/2025",
    custom_fields: [
      { name: "Operations P-Status  (drop down)", value: "P4 - Minor (I)", value_text: "P4 - Minor (I)" },
      { name: "Software P-Status  (drop down)", value: "P1 - Critical ", value_text: "P1 - Critical " },
      { name: "Hardware P-Status (drop down)", value: "P1 - Critical (I)", value_text: "P1 - Critical (I)" },
      { name: "NBA SLA Delivery Time (drop down)", value: "Missed: 1 HOUR+", value_text: "Missed: 1 HOUR+" },
      { name: "Scrub SLA  (drop down)", value: "NBA | No | > 30 Mins Post Game", value_text: "NBA | No | > 30 Mins Post Game" },
      { name: "Resend (drop down)", value: "No", value_text: "No" },
      { name: "Live Tracking Delivery (drop down)", value: "S1: Critical (I)", value_text: "S1: Critical (I)" },
      { name: "Scrubbed Delivery (drop down)", value: "S1: Critical (I)", value_text: "S1: Critical (I)" },
      { name: "Replay Delivery (drop down)", value: "S1: Critical (I)", value_text: "S1: Critical (I)" }
    ]
  },
  {
    id: "86b5qbzjg",
    name: "GSW|07/08/2025",
    custom_fields: [
      { name: "Operations P-Status  (drop down)", value: "P5 - Good", value_text: "P5 - Good" },
      { name: "Software P-Status  (drop down)", value: "P5 - Good", value_text: "P5 - Good" },
      { name: "Hardware P-Status (drop down)", value: "P4 - Minor (I)", value_text: "P4 - Minor (I)" },
      { name: "NBA SLA Delivery Time (drop down)", value: "Hit SLA", value_text: "Hit SLA" },
      { name: "Scrub SLA  (drop down)", value: "NBA | Yes | < 30 Mins Post Game", value_text: "NBA | Yes | < 30 Mins Post Game" },
      { name: "Resend (drop down)", value: "No", value_text: "No" },
      { name: "Live Tracking Delivery (drop down)", value: "S4: Minor Issues (I)", value_text: "S4: Minor Issues (I)" },
      { name: "Scrubbed Delivery (drop down)", value: "S5: Good", value_text: "S5: Good" },
      { name: "Replay Delivery (drop down)", value: "S5: Good", value_text: "S5: Good" }
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

// Mock chart generation function to test the logic
function generateExecutiveFieldChart(tasks, fieldName, title, index) {
  console.log(`🔍 Generating chart for field: "${fieldName}"`);
  
  const counts = {};
  let processedTasks = 0;

  console.log(`🔍 Processing ${tasks.length} tasks for field "${fieldName}"`);

  for (const task of tasks) {
    if (!task.custom_fields) continue;
    
    // Try to find the field with flexible name matching
    let field = findFieldByName(task.custom_fields, fieldName);
    
    if (!field) {
      console.log(`❌ Field "${fieldName}" not found in custom_fields for task: ${task.name}`);
      continue;
    }

    let value = getFieldValue(field);

    if (value && value !== 'null' && value !== 'undefined') {
      counts[value] = (counts[value] || 0) + 1;
      processedTasks++;
    }
  }

  console.log(`📊 Chart data for "${fieldName}":`, counts);
  console.log(`📊 Processed ${processedTasks} tasks`);

  if (processedTasks === 0 || Object.keys(counts).length === 0) {
    console.warn(`⚠️ No valid data found for "${fieldName}"`);
    return null;
  }

  // Return mock chart data
  return {
    title: title,
    data: counts,
    labels: Object.keys(counts),
    values: Object.values(counts)
  };
}

function testChartGeneration() {
  console.log('🔍 Testing chart generation logic...\n');
  
  // Test each executive field
  EXECUTIVE_FIELDS.forEach(fieldName => {
    console.log(`\n📋 Testing field: "${fieldName}"`);
    
    // Check if it should be a number card
    const isNumberCard = NUMBER_CARD_FIELDS.includes(fieldName);
    console.log(`  📊 Number Card Field: ${isNumberCard ? 'Yes' : 'No'}`);
    
    if (!isNumberCard) {
      // Generate chart for non-number card fields
      const chart = generateExecutiveFieldChart(mockTasks, fieldName, `${fieldName} Chart`, 0);
      
      if (chart) {
        console.log(`  ✅ Chart generated successfully`);
        console.log(`  📊 Labels: ${chart.labels.join(', ')}`);
        console.log(`  📊 Values: ${chart.values.join(', ')}`);
      } else {
        console.log(`  ❌ Chart generation failed`);
      }
    } else {
      console.log(`  📊 Skipping chart generation (will be number card)`);
    }
  });
  
  // Test field finding specifically
  console.log('\n🔍 Testing field finding with real field names:');
  EXECUTIVE_FIELDS.forEach(fieldName => {
    const foundInTask1 = findFieldByName(mockTasks[0].custom_fields, fieldName);
    const foundInTask2 = findFieldByName(mockTasks[1].custom_fields, fieldName);
    
    if (foundInTask1) {
      const value = getFieldValue(foundInTask1);
      console.log(`  ✅ "${fieldName}": Found as "${foundInTask1.name}" = "${value}"`);
    } else {
      console.log(`  ❌ "${fieldName}": Not found in Task 1`);
    }
    
    if (foundInTask2) {
      const value = getFieldValue(foundInTask2);
      console.log(`  ✅ "${fieldName}": Found as "${foundInTask2.name}" = "${value}"`);
    } else {
      console.log(`  ❌ "${fieldName}": Not found in Task 2`);
    }
  });
}

// Run the test
testChartGeneration();
