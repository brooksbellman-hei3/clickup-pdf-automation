const fs = require('fs');
const path = require('path');

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

// Function to parse CSV data into task objects
function parseCSVToTasks(csvData) {
  const lines = csvData.split('\n');
  const headers = parseCSVLine(lines[0]);
  
  const tasks = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length < headers.length) continue;
    
    const task = {
      id: values[0] || `task-${i}`,
      name: values[1] || `Task ${i}`,
      custom_fields: []
    };
    
    // Map CSV columns to custom fields
    for (let j = 0; j < headers.length; j++) {
      if (j < values.length && values[j]) {
        task.custom_fields.push({
          name: headers[j],
          value: values[j],
          value_text: values[j]
        });
      }
    }
    
    tasks.push(task);
  }
  
  return tasks;
}

// Helper function to parse CSV line with proper quote handling
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
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

function testRealData() {
  console.log('🔍 Testing with real CSV data...\n');
  
  try {
    // Read the CSV file
    const csvPath = path.join(process.env.HOME, 'Downloads/2025-08-08T19_30_32.358Z HEI NA - NBA Operations - Game Day Operations NBA - Testing EOG Report.csv');
    const csvData = fs.readFileSync(csvPath, 'utf8');
    
    console.log(`📄 CSV file loaded: ${csvData.split('\n').length} lines`);
    
    // Parse CSV to tasks
    const tasks = parseCSVToTasks(csvData);
    console.log(`📊 Parsed ${tasks.length} tasks from CSV`);
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found in CSV');
      return;
    }
    
    // Show sample task structure
    console.log('\n📋 Sample task structure:');
    console.log(`  Task ID: ${tasks[0].id}`);
    console.log(`  Task Name: ${tasks[0].name}`);
    console.log(`  Custom Fields: ${tasks[0].custom_fields.length}`);
    console.log(`  Field names: ${tasks[0].custom_fields.map(f => f.name).join(', ')}`);
    
    // Test field finding for each executive field
    console.log('\n🔍 Testing field finding with real data:');
    EXECUTIVE_FIELDS.forEach(fieldName => {
      const foundInFirstTask = findFieldByName(tasks[0].custom_fields, fieldName);
      if (foundInFirstTask) {
        const value = getFieldValue(foundInFirstTask);
        console.log(`  ✅ "${fieldName}": Found as "${foundInFirstTask.name}" = "${value}"`);
      } else {
        console.log(`  ❌ "${fieldName}": Not found`);
      }
    });
    
    // Calculate real stats
    console.log('\n📊 Calculating real dashboard statistics...');
    const stats = calculateDashboardStats(tasks);
    
    // Generate number card stats
    console.log('\n📊 Generating number card stats...');
    const numberCardStats = generateNumberCardStats(tasks);
    
    // Summary
    console.log('\n📊 REAL DATA SUMMARY:');
    console.log(`  Total Games: ${stats.totalGames}`);
    console.log(`  Live Tracking Delivery: ${stats.liveTrackingDelivery}%`);
    console.log(`  Replay Delivery: ${stats.replayDelivery}%`);
    console.log(`  SLA Hit Percentage: ${stats.slaHitPercentage}%`);
    console.log(`  Resend Percentage: ${stats.resendPercentage}%`);
    
    console.log('\n📊 Number Card Stats Summary:');
    Object.keys(numberCardStats).forEach(fieldName => {
      const counts = numberCardStats[fieldName];
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      console.log(`  ${fieldName}: ${total} total entries`);
      Object.keys(counts).forEach(value => {
        console.log(`    "${value}": ${counts[value]}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error processing real data:', error);
  }
}

// Run the test
testRealData();
