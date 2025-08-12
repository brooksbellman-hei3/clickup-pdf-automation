const path = require("path");

// Chart generation without external dependencies
console.log("📊 Using SVG-only chart generation (no external dependencies)");

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
// Note: These are still generated as charts but displayed as number cards in the header
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
  
  // Try type_config for dropdown values FIRST (before converting to string)
  if (field.type_config && field.type_config.options) {
    const options = field.type_config.options;
    if (field.value !== null && field.value !== undefined) {
      // Find the option that matches the value
      const option = options.find(opt => 
        opt.id === field.value || 
        opt.orderindex === field.value ||
        String(opt.id) === String(field.value) ||
        String(opt.orderindex) === String(field.value)
      );
      if (option && option.name) {
        return option.name;
      }
    }
  }
  
  // Try value property
  if (field.value !== null && field.value !== undefined && field.value !== '') {
    if (typeof field.value === 'string') {
      return field.value.trim();
    } else if (typeof field.value === 'object' && field.value.name) {
      return field.value.name;
    } else if (typeof field.value === 'object' && field.value.label) {
      return field.value.label;
    } else if (typeof field.value === 'object' && field.value.value) {
      return field.value.value;
    } else {
      return String(field.value).trim();
    }
  }
  
  return null;
}

// Color scheme for executive dashboard
const EXECUTIVE_COLOR_SCHEME = {
  // Priority levels (S1-S5, P1-P5) - including all variations
  'S1': '#000000', 's1': '#000000', 'P1': '#000000', 'p1': '#000000',
  'S1: Critical (I)': '#000000', 's1: critical (i)': '#000000',
  'S1: Critical (E)': '#000000', 's1: critical (e)': '#000000',
  'P1: Critical (I)': '#000000', 'p1: critical (i)': '#000000',
  'P1: Critical (E)': '#000000', 'p1: critical (e)': '#000000',
  'P1 - Critical ': '#000000', 'p1 - critical ': '#000000',
  'P1 - Critical (I)': '#000000', 'p1 - critical (i)': '#000000',
  'P1 - Critical (E)': '#000000', 'p1 - critical (e)': '#000000',
  'P1 - Critical': '#000000', 'p1 - critical': '#000000',
  'P1: Critical': '#000000', 'p1: critical': '#000000',
  
  'S2': '#dc3545', 's2': '#dc3545', 'P2': '#dc3545', 'p2': '#dc3545',
  'S2: Critical (I)': '#dc3545', 's2: critical (i)': '#dc3545',
  'S2: Critical (E)': '#dc3545', 's2: critical (e)': '#dc3545',
  'S2: Major Issues (I)': '#dc3545', 's2: major issues (i)': '#dc3545',
  'S2: Major Issues (E)': '#dc3545', 's2: major issues (e)': '#dc3545',
  'P2: Critical (I)': '#dc3545', 'p2: critical (i)': '#dc3545',
  'P2: Critical (E)': '#dc3545', 'p2: critical (e)': '#dc3545',
  'P2: Major (I)': '#dc3545', 'p2: major (i)': '#dc3545',
  'P2: Major (E)': '#dc3545', 'p2: major (e)': '#dc3545',
  'P2 - Major ': '#dc3545', 'p2 - major ': '#dc3545',
  'P2 - Major (I)': '#dc3545', 'p2 - major (i)': '#dc3545',
  'P2 - Major (E)': '#dc3545', 'p2 - major (e)': '#dc3545',
  'P2 - Major': '#dc3545', 'p2 - major': '#dc3545',
  'P2: Major': '#dc3545', 'p2: major': '#dc3545',
  
  'S3': '#fd7e14', 's3': '#fd7e14', 'P3': '#fd7e14', 'p3': '#fd7e14',
  'P3: Moderate (E)': '#fd7e14', 'p3: moderate (e)': '#fd7e14',
  'P3: Moderate (I)': '#fd7e14', 'p3: moderate (i)': '#fd7e14',
  'P3- Moderate (E)': '#fd7e14', 'p3- moderate (e)': '#fd7e14',
  'P3 - Moderate (E)': '#fd7e14', 'p3 - moderate (e)': '#fd7e14',
  'P3 - Moderate': '#fd7e14', 'p3 - moderate': '#fd7e14',
  'P3: Moderate': '#fd7e14', 'p3: moderate': '#fd7e14',
  
  'S4': '#ffc107', 's4': '#ffc107', 'P4': '#ffc107', 'p4': '#ffc107',
  'S4: Minor Issues (I)': '#ffc107', 's4: minor issues (i)': '#ffc107',
  'S4: Minor Issues (E)': '#ffc107', 's4: minor issues (e)': '#ffc107',
  'P4: Minor (I)': '#ffc107', 'p4: minor (i)': '#ffc107',
  'P4: Minor (E)': '#ffc107', 'p4: minor (e)': '#ffc107',
  'P4 - Minor (I)': '#ffc107', 'p4 - minor (i)': '#ffc107',
  'P4 - Minor (E)': '#ffc107', 'p4 - minor (e)': '#ffc107',
  'P4 - Minor ': '#ffc107', 'p4 - minor ': '#ffc107',
  'P4 - Minor': '#ffc107', 'p4 - minor': '#ffc107',
  'P4: Minor': '#ffc107', 'p4: minor': '#ffc107',
  
  'S5': '#28a745', 's5': '#28a745', 'P5': '#28a745', 'p5': '#28a745',
  'S5: Good': '#28a745', 's5: good': '#28a745',
  'P5: Good': '#28a745', 'p5: good': '#28a745',
  'P5 - Good': '#28a745', 'p5 - good': '#28a745',
  'P5: Good': '#28a745', 'p5: good': '#28a745',
  
  // SLA Status - including all variations
  'Hit SLA': '#28a745', 'hit sla': '#28a745', 'HIT SLA': '#28a745',
  'Missed: 1 Hour +': '#dc3545', 'missed: 1 hour +': '#dc3545', 'MISSED: 1 HOUR +': '#dc3545',
  'Missed: 1 HOUR+': '#dc3545', 'missed: 1 hour+': '#dc3545', 'MISSED: 1 HOUR+': '#dc3545',
  'Missed: ≤ 1Hour': '#dc3545', 'missed: ≤ 1hour': '#dc3545', 'MISSED: ≤ 1HOUR': '#dc3545',
  'Missed: ≤ 1HOUR': '#dc3545', 'missed: ≤ 1hour': '#dc3545', 'MISSED: ≤ 1HOUR': '#dc3545',
  'Missed: ≤ 15 MIN': '#ffc107', 'missed: ≤ 15 min': '#ffc107', 'MISSED: ≤ 15 MIN': '#ffc107',
  'Missed: ≤15 MIN': '#ffc107', 'missed: ≤15 min': '#ffc107', 'MISSED: ≤15 MIN': '#ffc107',
  'Missed: ≤15 MIN ': '#ffc107', 'missed: ≤15 min ': '#ffc107', 'MISSED: ≤15 MIN ': '#ffc107',
  'Missed: ≤ 30 MIN': '#fd7e14', 'missed: ≤ 30 min': '#fd7e14', 'MISSED: ≤ 30 MIN': '#fd7e14',
  'Missed: ≤30 MIN': '#fd7e14', 'missed: ≤30 min': '#fd7e14', 'MISSED: ≤30 MIN': '#fd7e14',
  'Missed: ≤30 MIN ': '#fd7e14', 'missed: ≤30 min ': '#fd7e14', 'MISSED: ≤30 MIN ': '#fd7e14',
  
  // NBA Post Game
  'NBA | Yes | < 30 Mins Post Game': '#28a745',
  'nba | yes | < 30 mins post game': '#28a745',
  'NBA | No | > 30 Mins Post Game': '#dc3545',
  'nba | no | > 30 mins post game': '#dc3545',
  
  // Legacy colors for backward compatibility
  'Green': '#28a745', 'green': '#28a745', 'GREEN': '#28a745',
  'Yellow': '#ffc107', 'yellow': '#ffc107', 'YELLOW': '#ffc107',
  'Red': '#dc3545', 'red': '#dc3545', 'RED': '#dc3545',
  'Orange': '#fd7e14', 'orange': '#fd7e14', 'ORANGE': '#fd7e14',
  'Black': '#000000', 'black': '#000000', 'BLACK': '#000000',
  
  // Success/Positive colors
  'Success': '#28a745', 'success': '#28a745',
  'Complete': '#28a745', 'complete': '#28a745',
  'Delivered': '#28a745', 'delivered': '#28a745',
  'On Time': '#28a745', 'on time': '#28a745',
  
  // Warning/Medium colors
  'Warning': '#ffc107', 'warning': '#ffc107',
  'Pending': '#ffc107', 'pending': '#ffc107',
  'In Progress': '#ffc107', 'in progress': '#ffc107',
  'Late': '#ffc107', 'late': '#ffc107',
  'Partial': '#ffc107', 'partial': '#ffc107',
  
  // Error/Critical colors
  'Error': '#dc3545', 'error': '#dc3545',
  'Failed': '#dc3545', 'failed': '#dc3545',
  'Critical': '#dc3545', 'critical': '#dc3545',
  'Overdue': '#dc3545', 'overdue': '#dc3545',
  
  // Neutral colors
  'Gray': '#6c757d', 'gray': '#6c757d', 'GRAY': '#6c757d',
  'Grey': '#6c757d', 'grey': '#6c757d', 'GREY': '#6c757d',
  'N/A': '#6c757d', 'n/a': '#6c757d', 'NA': '#6c757d',
  'No Data': '#6c757d', 'Empty': '#6c757d',
  'Unknown': '#6c757d', 'unknown': '#6c757d',
  
  // Info colors
  'Blue': '#007bff', 'blue': '#007bff', 'BLUE': '#007bff',
  'Info': '#007bff', 'info': '#007bff',
  'Processing': '#007bff', 'processing': '#007bff',
  'In Queue': '#007bff', 'in queue': '#007bff',
  
  // Default fallback
  'default': '#6c757d'
};

// NEW: Function to generate number card stats for dashboard header
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

// Modified function to generate charts including number card fields
async function generateExecutiveDashboardCharts(tasks, dateRange = null, specificDate = null) {
  console.log(`🎨 Generating executive dashboard charts for ${tasks.length} tasks`);
  if (dateRange) {
    console.log(`📅 Date range: ${dateRange.start} to ${dateRange.end}`);
  }
  if (specificDate) {
    console.log(`📅 Specific date filter: ${specificDate}`);
  }
  
  const charts = [];
  
  // Generate charts for each executive field (including number card fields)
  for (let i = 0; i < EXECUTIVE_FIELDS.length; i++) {
    const fieldName = EXECUTIVE_FIELDS[i];
    
    console.log(`📊 Processing chart field: ${fieldName}`);
    
    let chartTitle = fieldName;
    
    if (specificDate) {
      chartTitle = `${fieldName} (${specificDate})`;
    } else if (dateRange) {
      chartTitle = `${fieldName} (${dateRange.start} to ${dateRange.end})`;
    }
    
    console.log(`\n📊 Generating chart ${i + 1}/${EXECUTIVE_FIELDS.length}: ${fieldName}`);
    
    try {
      const chart = await generateExecutiveFieldChart(tasks, fieldName, chartTitle, i);
      if (chart) {
        charts.push(chart);
        console.log(`✅ Chart generated: ${chart.filePath}`);
      } else {
        console.warn(`⚠️ Failed to generate chart for ${fieldName}`);
      }
    } catch (error) {
      console.error(`❌ Error generating chart for ${fieldName}:`, error.message);
    }
  }
  
  console.log(`\n📈 Total executive charts generated: ${charts.length}`);
  return charts;
}

// NEW: Function to generate all-time charts (Row 1)
async function generateAllTimeCharts(tasks) {
  console.log(`📊 Generating all-time charts for ${tasks.length} tasks`);
  return await generateExecutiveDashboardCharts(tasks, null, null);
}

// NEW: Function to generate specific date charts (Row 2)
async function generateSpecificDateCharts(tasks, specificDate) {
  console.log(`📊 Generating specific date charts for ${specificDate}`);
  
  // Filter tasks by Event Date matching the specific date
  const filteredTasks = filterTasksByEventDate(tasks, specificDate);
  console.log(`📅 Found ${filteredTasks.length} tasks for date: ${specificDate}`);
  
  if (filteredTasks.length === 0) {
    console.log(`⚠️ No tasks found for date ${specificDate}, returning empty chart array`);
    return [];
  }
  
  // Log some sample task names for debugging
  console.log(`📋 Sample tasks for ${specificDate}:`, filteredTasks.slice(0, 3).map(t => t.name));
  
  const charts = await generateExecutiveDashboardCharts(filteredTasks, null, specificDate);
  console.log(`📊 Generated ${charts.length} specific date charts for ${specificDate}`);
  
  return charts;
}

// NEW: Function to filter tasks by Event Date
function filterTasksByEventDate(tasks, targetDate) {
  console.log(`🔍 Filtering tasks by Event Date: ${targetDate}`);
  
  const targetTimestamp = new Date(targetDate).getTime();
  const dayStart = new Date(targetDate).setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate).setHours(23, 59, 59, 999);
  
  console.log(`📅 Looking for tasks between: ${new Date(dayStart).toISOString()} and ${new Date(dayEnd).toISOString()}`);
  
  return tasks.filter(task => {
    if (!task.custom_fields) return false;
    
    // Try multiple possible field names for Event Date
    const eventDateField = task.custom_fields.find(f => 
      f.name === 'Event Date' || 
      f.name === 'event date' || 
      f.name === 'EVENT DATE' ||
      f.name === 'Date' ||
      f.name === 'date' ||
      f.name === 'DATE'
    );
    
    if (!eventDateField) {
      console.log(`❌ No Event Date field found for task: ${task.name}`);
      return false;
    }
    
    console.log(`📋 Task: "${task.name}" - Event Date field: ${eventDateField.name}, Value: ${JSON.stringify(eventDateField.value)}`);
    
    let taskTimestamp;
    
    // Handle different timestamp formats
    if (typeof eventDateField.value === 'number') {
      taskTimestamp = eventDateField.value < 1000000000000 ? eventDateField.value * 1000 : eventDateField.value;
    } else if (typeof eventDateField.value === 'string') {
      // Remove quotes if present and parse as number
      const cleanValue = eventDateField.value.replace(/"/g, '');
      const parsedValue = parseInt(cleanValue);
      if (!isNaN(parsedValue)) {
        taskTimestamp = parsedValue < 1000000000000 ? parsedValue * 1000 : parsedValue;
      } else {
        // Try parsing as date string
        taskTimestamp = new Date(eventDateField.value).getTime();
      }
    } else if (eventDateField.value && eventDateField.value.date) {
      taskTimestamp = eventDateField.value.date < 1000000000000 ? eventDateField.value.date * 1000 : eventDateField.value.date;
    } else if (eventDateField.value && typeof eventDateField.value === 'object') {
      // Try to extract timestamp from object
      const rawValue = eventDateField.value.value || eventDateField.value.date || eventDateField.value;
      if (typeof rawValue === 'number') {
        taskTimestamp = rawValue < 1000000000000 ? rawValue * 1000 : rawValue;
      } else if (typeof rawValue === 'string') {
        // Remove quotes if present and parse as number
        const cleanValue = rawValue.replace(/"/g, '');
        const parsedValue = parseInt(cleanValue);
        if (!isNaN(parsedValue)) {
          taskTimestamp = parsedValue < 1000000000000 ? parsedValue * 1000 : parsedValue;
        } else {
          // Try parsing as date string
          taskTimestamp = new Date(rawValue).getTime();
        }
      } else {
        console.log(`❌ Could not parse Event Date value: ${JSON.stringify(eventDateField.value)}`);
        return false;
      }
    } else {
      console.log(`❌ No valid Event Date value found: ${JSON.stringify(eventDateField.value)}`);
      return false;
    }
    
    // Validate timestamp before creating Date object
    if (isNaN(taskTimestamp) || taskTimestamp <= 0) {
      console.log(`❌ Invalid timestamp for task "${task.name}": ${taskTimestamp}`);
      return false;
    }
    
    // Convert to Date object for comparison
    const taskDate = new Date(taskTimestamp);
    
    // Validate the date object
    if (isNaN(taskDate.getTime())) {
      console.log(`❌ Invalid date for task "${task.name}": ${taskDate}`);
      return false;
    }
    
    const isInRange = taskTimestamp >= dayStart && taskTimestamp <= dayEnd;
    console.log(`📅 Task timestamp: ${taskDate.toISOString()}, In range: ${isInRange}`);
    
    return isInRange;
  });
}

// Modified complete dashboard function to include number card stats
async function generateCompleteDashboardCharts(tasks, specificDate = null) {
  console.log(`🎨 Generating complete dashboard with charts and number card stats`);
  
  const allCharts = [];
  
  // Row 1: All-time charts (excluding number card fields)
  console.log(`\n📊 Row 1: Generating all-time charts...`);
  const allTimeCharts = await generateAllTimeCharts(tasks);
  allCharts.push(...allTimeCharts);
  
  // Row 2: Specific date charts (excluding number card fields)
  if (specificDate) {
    console.log(`\n📊 Row 2: Generating specific date charts for ${specificDate}...`);
    const specificDateCharts = await generateSpecificDateCharts(tasks, specificDate);
    allCharts.push(...specificDateCharts);
  } else {
    console.log(`\n📊 Row 2: No specific date provided, skipping date-specific charts`);
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

// Calculate dashboard statistics for the new header
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
  }).filter(v => v !== null && v !== 'Unknown' && v !== 'N/A');
  
  if (liveTrackingValues.length > 0) {
    const deliveredCount = liveTrackingValues.filter(v => {
      const valueStr = String(v).toLowerCase();
      return valueStr === 's5: good' || 
             valueStr === 's4: minor issues (i)' || 
             valueStr === 's4: minor issues (e)' ||
             valueStr === 's5 - good' || 
             valueStr === 's4 - minor issues (i)' || 
             valueStr === 's4 - minor issues (e)' ||
             valueStr === 's5' ||
             valueStr === 's4' ||
             valueStr === 'p5: good' ||
             valueStr === 'p4: minor';
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
  }).filter(v => v !== null && v !== 'Unknown' && v !== 'N/A');
  
  if (replayValues.length > 0) {
    const deliveredCount = replayValues.filter(v => {
      const valueStr = String(v).toLowerCase();
      return valueStr === 's5: good' || 
             valueStr === 's4: minor issues (i)' || 
             valueStr === 's4: minor issues (e)' ||
             valueStr === 's5 - good' || 
             valueStr === 's4 - minor issues (i)' || 
             valueStr === 's4 - minor issues (e)' ||
             valueStr === 's5' ||
             valueStr === 's4' ||
             valueStr === 'p5: good' ||
             valueStr === 'p4: minor';
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
  
  // Calculate last night's stats if specific date provided
  if (specificDate) {
    const yesterdayTasks = filterTasksByEventDate(tasks, specificDate);
    stats.lastNightGames = yesterdayTasks.length;
    console.log(`📊 Last Night Games: ${stats.lastNightGames} for date ${specificDate}`);
    
    // Last night's SLA stats (only NBA SLA Delivery Time)
    let lastNightHitSLAs = 0;
    let lastNightMissedSLAs = 0;
    
    yesterdayTasks.forEach(task => {
      const field = findFieldByName(task.custom_fields, 'NBA SLA Delivery Time');
      if (field) {
        const value = getFieldValue(field);
        if (value) {
          const valueStr = String(value).toLowerCase();
          if (valueStr === 'hit sla') {
            lastNightHitSLAs++;
          } else {
            lastNightMissedSLAs++;
          }
        }
      }
    });
    
    stats.lastNightSLAsHit = lastNightHitSLAs;
    stats.lastNightSLAsMissed = lastNightMissedSLAs;
    console.log(`📊 Last Night SLAs: ${lastNightHitSLAs} hit, ${stats.lastNightSLAsMissed} missed (total: ${lastNightHitSLAs + lastNightMissedSLAs})`);
    
    // Last night's resend count
    const lastNightResendValues = yesterdayTasks.map(task => {
      const field = findFieldByName(task.custom_fields, 'Resend');
      return field ? getFieldValue(field) : null;
    }).filter(v => v !== null);
    
    const lastNightResendCount = lastNightResendValues.filter(v => {
      const valueStr = String(v).toLowerCase();
      return valueStr === 'yes';
    }).length;
    
    stats.lastNightResends = lastNightResendCount;
    console.log(`📊 Last Night Resends: ${lastNightResendCount}`);
  } else {
    console.log(`📊 No specific date provided, skipping last night's stats`);
  }
  
  console.log('📊 Dashboard stats calculated:', stats);
  return stats;
}

async function generateExecutiveFieldChart(tasks, fieldName, title, index) {
  console.log(`🔍 Processing field: "${fieldName}" for ${tasks.length} tasks`);

  if (!tasks || tasks.length === 0) {
    console.warn(`⚠️ No tasks provided for chart generation`);
    return null;
  }

  // Check if this field should be a number count chart
  const isNumberCountField = NUMBER_CARD_FIELDS.includes(fieldName);
  
  if (isNumberCountField) {
    console.log(`📊 Generating number count chart for "${fieldName}"`);
    return await generateNumberCountChart(tasks, fieldName, title, index);
  }

  const counts = {};
  let processedTasks = 0;
  let fieldNotFoundCount = 0;

  console.log(`🔍 Processing ${tasks.length} tasks for field "${fieldName}"`);

  for (const task of tasks) {
    if (!task.custom_fields) {
      console.log(`⚠️ Task "${task.name}" has no custom_fields`);
      continue;
    }
    
    // Try to find the field with flexible name matching
    let field = findFieldByName(task.custom_fields, fieldName);
    
    if (!field) {
      fieldNotFoundCount++;
      if (fieldNotFoundCount <= 3) { // Only log first 3 for brevity
        console.log(`❌ Field "${fieldName}" not found in custom_fields for task: ${task.name}`);
        console.log(`   Available fields:`, task.custom_fields.map(f => f.name));
      }
      continue;
    }

    let value = getFieldValue(field);

    if (value && value !== 'null' && value !== 'undefined') {
      counts[value] = (counts[value] || 0) + 1;
      processedTasks++;
    } else {
      console.log(`⚠️ Task "${task.name}" has empty/null value for "${fieldName}": ${value}`);
    }
  }

  console.log(`📊 Field "${fieldName}" summary:`);
  console.log(`   Total tasks: ${tasks.length}`);
  console.log(`   Field not found: ${fieldNotFoundCount}`);
  console.log(`   Processed with data: ${processedTasks}`);
  console.log(`   Final counts:`, counts);

  if (processedTasks === 0 || Object.keys(counts).length === 0) {
    console.warn(`⚠️ No valid data found for "${fieldName}"`);
    return null;
  }

  const labels = Object.keys(counts);
  const data = labels.map(l => counts[l]);
  
  // Enhanced color mapping with fallback colors
  let colors;
  if (fieldName === 'Resend') {
    colors = labels.map(label => {
      if (label.toLowerCase() === 'yes') return '#dc3545'; // Red for Yes
      if (label.toLowerCase() === 'no') return '#28a745';  // Green for No
      return EXECUTIVE_COLOR_SCHEME[label] || EXECUTIVE_COLOR_SCHEME['default'];
    });
  } else {
    colors = labels.map((label, index) => {
      // Try exact match first
      let color = EXECUTIVE_COLOR_SCHEME[label];
      if (color) return color;
      
      // Try case-insensitive match
      color = EXECUTIVE_COLOR_SCHEME[label.toLowerCase()];
      if (color) return color;
      
      // Try case-insensitive match with uppercase
      color = EXECUTIVE_COLOR_SCHEME[label.toUpperCase()];
      if (color) return color;
      
      // Use predefined color palette as fallback
      const fallbackColors = ['#28a745', '#ffc107', '#dc3545', '#fd7e14', '#007bff', '#6c757d', '#17a2b8', '#6f42c1'];
      return fallbackColors[index % fallbackColors.length];
    });
  }

  console.log(`📈 Final chart data for "${fieldName}":`);
  console.log(`   Labels: [${labels.join(', ')}]`);
  console.log(`   Data: [${data.join(', ')}]`);
  console.log(`   Colors: [${colors.join(', ')}]`);

  return await generatePieChart(title, labels, data, colors, index);
}

async function generatePieChart(title, labels, data, colors, index) {
  const width = 600;
  const height = 400;

  console.log(`🎨 Creating chart: ${title}`);
  console.log(`   Labels: ${labels.join(', ')}`);
  console.log(`   Data: ${data.join(', ')}`);

  // Use SVG-only chart generation
  return await generateSimpleSVGChart(title, labels, data, colors, index, width, height);
}







// Generate number count chart for specific fields
async function generateNumberCountChart(tasks, fieldName, title, index) {
  console.log(`🔍 Generating number count chart for "${fieldName}"`);

  const counts = {};
  let processedTasks = 0;

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

  console.log(`📊 Number count chart data for "${fieldName}":`, counts);

  if (processedTasks === 0 || Object.keys(counts).length === 0) {
    console.warn(`⚠️ No valid data found for "${fieldName}"`);
    return null;
  }

  // Create a simple text-based chart showing counts
  const width = 400;
  const height = 300;
  const padding = 20;
  
  const chartData = Object.entries(counts).map(([label, count]) => {
    let color = EXECUTIVE_COLOR_SCHEME[label] || '#666';
    
    // Special handling for Resend field - inverted Yes/No colors
    if (fieldName === 'Resend') {
      if (label.toLowerCase() === 'yes') {
        color = '#dc3545'; // Red for Yes
      } else if (label.toLowerCase() === 'no') {
        color = '#28a745'; // Green for No
      }
    }
    
    return {
      label,
      count,
      color: color
    };
  });

  // Create SVG for number count display
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>
          .title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #000; }
          .count-label { font-family: Arial, sans-serif; font-size: 14px; fill: #333; }
          .count-value { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #000; }
        </style>
      </defs>
      
      <rect width="100%" height="100%" fill="white"/>
      
      <text x="${width / 2}" y="25" text-anchor="middle" class="title">${title}</text>
      
      ${chartData.map((item, i) => `
        <rect x="${padding}" y="${60 + i * 50}" width="20" height="20" fill="${item.color}" stroke="#333" stroke-width="1"/>
        <text x="${padding + 30}" y="${75 + i * 50}" class="count-label">${item.label}:</text>
        <text x="${width - padding}" y="${75 + i * 50}" text-anchor="end" class="count-value">${item.count}</text>
      `).join('')}
    </svg>
  `;

  console.log(`   Generated SVG chart`);
  return {
    title: title,
    filePath: `chart_${index}.svg`,
    buffer: Buffer.from(svg),
    base64Chart: Buffer.from(svg).toString('base64'),
    svg: svg
  };
}

// Simple SVG chart generation as final fallback
async function generateSimpleSVGChart(title, labels, data, colors, index, width, height) {
  console.log(`   Generating simple SVG fallback chart...`);
  
  const total = data.reduce((sum, val) => sum + val, 0);
  const chartCenterX = width * 0.35;
  const chartCenterY = height * 0.5;
  const radius = Math.min(width * 0.2, height * 0.2);
  
  let currentAngle = -Math.PI / 2;
  const slices = data.map((value, i) => {
    const percentage = (value / total) * 100;
    const sliceAngle = (value / total) * 2 * Math.PI;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    
    // Handle single value case (full circle)
    let pathData;
    if (data.length === 1) {
      // Create a full circle for single value
      pathData = [
        `M ${chartCenterX} ${chartCenterY - radius}`,
        `A ${radius} ${radius} 0 1 1 ${chartCenterX} ${chartCenterY + radius}`,
        `A ${radius} ${radius} 0 1 1 ${chartCenterX} ${chartCenterY - radius}`,
        `Z`
      ].join(' ');
    } else {
      // Create pie slice for multiple values
      const startX = chartCenterX + Math.cos(startAngle) * radius;
      const startY = chartCenterY + Math.sin(startAngle) * radius;
      const endX = chartCenterX + Math.cos(endAngle) * radius;
      const endY = chartCenterY + Math.sin(endAngle) * radius;
      
      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
      
      pathData = [
        `M ${chartCenterX} ${chartCenterY}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `Z`
      ].join(' ');
    }
    
    currentAngle = endAngle;
    
    return {
      path: pathData,
      color: colors[i] || '#666',
      label: labels[i],
      value: value,
      percentage: percentage.toFixed(1)
    };
  });
  
  const legendX = width * 0.6;
  const legendStartY = height * 0.25;
  const labelHeight = 25; // Increased spacing between legend items
  
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>
          .title { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #000; }
          .legend-text { font-family: Arial, sans-serif; font-size: 12px; fill: #000; }
          .legend-value { font-family: Arial, sans-serif; font-size: 10px; fill: #666; }
        </style>
      </defs>
      
      <rect width="100%" height="100%" fill="white"/>
      
      <text x="${width / 2}" y="25" text-anchor="middle" class="title">${title}</text>
      
      ${slices.map(slice => `
        <path d="${slice.path}" fill="${slice.color}" stroke="white" stroke-width="2"/>
      `).join('')}
      
      ${slices.map((slice, i) => `
        <rect x="${legendX}" y="${legendStartY + i * labelHeight}" width="12" height="12" fill="${slice.color}"/>
        <text x="${legendX + 20}" y="${legendStartY + i * labelHeight + 9}" class="legend-text">${slice.label}</text>
        <text x="${legendX + 20}" y="${legendStartY + i * labelHeight + 22}" class="legend-value">${slice.value} (${slice.percentage}%)</text>
      `).join('')}
    </svg>
  `;
  
  console.log(`   Generated simple SVG chart`);
  
  // Convert SVG to base64 for dashboard display
  const base64Chart = Buffer.from(svg).toString('base64');
  
  return {
    title: title,
    filePath: `chart_${index}.svg`,
    buffer: Buffer.from(svg),
    base64Chart: base64Chart,
    svg: svg
  };
}

module.exports = {
  generateExecutiveDashboardCharts,
  generateAllTimeCharts,
  generateSpecificDateCharts,
  generateCompleteDashboardCharts,
  filterTasksByEventDate,
  calculateDashboardStats,
  generateNumberCardStats,
  findFieldByName,
  getFieldValue,
  EXECUTIVE_FIELDS,
  EXECUTIVE_COLOR_SCHEME
};
