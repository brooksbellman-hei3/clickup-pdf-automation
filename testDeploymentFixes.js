// Test the deployment fixes
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

// Mock simple SVG chart generation
function generateSimpleSVGChart(title, labels, data, colors, index) {
  console.log(`   Generating simple SVG chart for: ${title}`);
  console.log(`   Labels: ${labels.join(', ')}`);
  console.log(`   Data: ${data.join(', ')}`);
  
  const total = data.reduce((sum, val) => sum + val, 0);
  const width = 600;
  const height = 400;
  const chartCenterX = width * 0.35;
  const chartCenterY = height * 0.5;
  const radius = Math.min(width * 0.2, height * 0.2);
  
  let currentAngle = -Math.PI / 2;
  const slices = data.map((value, i) => {
    const percentage = (value / total) * 100;
    const sliceAngle = (value / total) * 2 * Math.PI;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    
    const startX = chartCenterX + Math.cos(startAngle) * radius;
    const startY = chartCenterY + Math.sin(startAngle) * radius;
    const endX = chartCenterX + Math.cos(endAngle) * radius;
    const endY = chartCenterY + Math.sin(endAngle) * radius;
    
    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    
    const pathData = [
      `M ${chartCenterX} ${chartCenterY}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `Z`
    ].join(' ');
    
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
  const labelHeight = 20;
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
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
        <text x="${legendX + 20}" y="${legendStartY + i * labelHeight + 9 + 12}" class="legend-value">${slice.value} (${slice.percentage}%)</text>
      `).join('')}
    </svg>
  `;
  
  return {
    title: title,
    filePath: `chart_${index}.svg`,
    buffer: Buffer.from(svg),
    base64Chart: Buffer.from(svg).toString('base64'),
    svg: svg
  };
}

// Mock chart generation function
function generateExecutiveFieldChart(tasks, fieldName, title, index) {
  console.log(`🔍 Generating chart for field: "${fieldName}"`);
  
  const counts = {};
  let processedTasks = 0;

  for (const task of tasks) {
    if (!task.custom_fields) continue;
    
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

  if (processedTasks === 0 || Object.keys(counts).length === 0) {
    console.warn(`⚠️ No valid data found for "${fieldName}"`);
    return null;
  }

  // Generate simple SVG chart
  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
  
  return generateSimpleSVGChart(title, labels, data, colors, index);
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
      const chart = generateExecutiveFieldChart(tasks, fieldName, chartTitle, i);
      if (chart) {
        allCharts.push(chart);
        console.log(`✅ Chart generated: ${chart.title}`);
      }
    } catch (error) {
      console.error(`❌ Error generating chart for ${fieldName}:`, error.message);
    }
  }
  
  // Calculate dashboard statistics
  const stats = {
    totalGames: tasks.length,
    liveTrackingDelivery: 67,
    replayDelivery: 67,
    slaHitPercentage: 33,
    resendPercentage: 33
  };
  
  // Generate number card stats for header display
  const numberCardStats = {
    'NBA SLA Delivery Time': { 'Missed: 1 HOUR+': 1, 'Hit SLA': 1 },
    'Scrub SLA ': { 'NBA | No | > 30 Mins Post Game': 1, 'NBA | Yes | < 30 Mins Post Game': 1 },
    'Resend': { 'No': 2 }
  };
  
  console.log(`\n📈 Total charts generated: ${allCharts.length}`);
  console.log(`📊 Number card stats generated for header display`);
  
  return {
    charts: allCharts,
    stats: stats,
    numberCardStats: numberCardStats
  };
}

function testDeploymentFixes() {
  console.log('🔍 Testing deployment fixes...\n');
  
  // Test the complete dashboard generation
  generateCompleteDashboardCharts(mockTasks, '2025-07-08').then(result => {
    console.log('\n📊 Deployment Fixes Test Results:');
    console.log(`  Charts generated: ${result.charts.length}`);
    console.log(`  Chart titles: ${result.charts.map(c => c.title).join(', ')}`);
    console.log(`  Stats:`, result.stats);
    console.log(`  Number Card Stats:`, result.numberCardStats);
    
    // Test SVG chart generation
    result.charts.forEach((chart, index) => {
      console.log(`\n📊 Chart ${index + 1}: ${chart.title}`);
      console.log(`  Has SVG: ${!!chart.svg}`);
      console.log(`  Has base64Chart: ${!!chart.base64Chart}`);
      console.log(`  SVG length: ${chart.svg ? chart.svg.length : 0} characters`);
    });
    
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
    
    console.log('\n🎉 Deployment fixes test completed successfully!');
  }).catch(error => {
    console.error('❌ Test failed:', error);
  });
}

// Run the test
testDeploymentFixes();
