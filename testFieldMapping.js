const fs = require('fs');
const path = require('path');

// Mock data based on the CSV structure
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

// Executive dashboard field configuration from generateDashboardCharts.js
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

function findFieldByName(fields, targetName) {
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

function analyzeFieldMapping() {
  console.log('🔍 Analyzing field mapping issues...\n');
  
  // Test field finding for each executive field
  EXECUTIVE_FIELDS.forEach(fieldName => {
    console.log(`📋 Testing field: "${fieldName}"`);
    
    const foundInTask1 = findFieldByName(mockTasks[0].custom_fields, fieldName);
    const foundInTask2 = findFieldByName(mockTasks[1].custom_fields, fieldName);
    
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
    
    // Check if it's a number card field
    const isNumberCard = NUMBER_CARD_FIELDS.includes(fieldName);
    console.log(`  📊 Number Card Field: ${isNumberCard ? 'Yes' : 'No'}`);
    
    console.log('');
  });
  
  // Test specific Scrub SLA issues
  console.log('🔍 Special analysis for Scrub SLA:');
  const scrubSLAVariations = [
    'Scrub SLA ',
    'Scrub SLA',
    'Scrubbed SLA',
    'Scrub SLA Delivery'
  ];
  
  scrubSLAVariations.forEach(variation => {
    const found = findFieldByName(mockTasks[0].custom_fields, variation);
    console.log(`  "${variation}": ${found ? `Found as "${found.name}"` : 'Not found'}`);
  });
  
  console.log('\n📊 Available field names in first task:');
  mockTasks[0].custom_fields.forEach((field, index) => {
    console.log(`  ${index}: "${field.name}"`);
  });
}

function testMetricCalculations() {
  console.log('\n📊 Testing metric calculations...\n');
  
  // Test SLA calculations
  const slaField = findFieldByName(mockTasks[0].custom_fields, 'NBA SLA Delivery Time');
  const scrubSLAField = findFieldByName(mockTasks[0].custom_fields, 'Scrub SLA ');
  
  console.log('SLA Metrics:');
  console.log(`  NBA SLA: ${slaField ? slaField.value_text : 'Not found'}`);
  console.log(`  Scrub SLA: ${scrubSLAField ? scrubSLAField.value_text : 'Not found'}`);
  
  // Test priority calculations
  const priorityFields = ['Operations P-Status ', 'Software P-Status ', 'Hardware P-Status'];
  priorityFields.forEach(fieldName => {
    const field = findFieldByName(mockTasks[0].custom_fields, fieldName);
    console.log(`  ${fieldName}: ${field ? field.value_text : 'Not found'}`);
  });
  
  // Test delivery calculations
  const deliveryFields = ['Live Tracking Delivery', 'Scrubbed Delivery', 'Replay Delivery'];
  deliveryFields.forEach(fieldName => {
    const field = findFieldByName(mockTasks[0].custom_fields, fieldName);
    console.log(`  ${fieldName}: ${field ? field.value_text : 'Not found'}`);
  });
}

// Run the analysis
analyzeFieldMapping();
testMetricCalculations();
