const { generateCompleteDashboardCharts, calculateDashboardStats, generateNumberCardStats, findFieldByName, getFieldValue } = require('./generateDashboardCharts');

// Realistic ClickUp data structure with dropdown IDs instead of text values
const realisticTasks = [
  {
    name: "Game 1 - Lakers vs Warriors",
    custom_fields: [
      { 
        name: "Live Tracking Delivery", 
        type: "drop_down",
        value: 1, // This is the ID, not the text
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "S5: Good", orderindex: 1 },
            { id: 2, name: "S4: Minor Issues (I)", orderindex: 2 },
            { id: 3, name: "S3: Moderate", orderindex: 3 },
            { id: 4, name: "S2: Major Issues (I)", orderindex: 4 },
            { id: 5, name: "S1: Critical (I)", orderindex: 5 }
          ]
        }
      },
      { 
        name: "Replay Delivery", 
        type: "drop_down",
        value: 2,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "S5: Good", orderindex: 1 },
            { id: 2, name: "S4: Minor Issues (I)", orderindex: 2 },
            { id: 3, name: "S3: Moderate", orderindex: 3 },
            { id: 4, name: "S2: Major Issues (I)", orderindex: 4 },
            { id: 5, name: "S1: Critical (I)", orderindex: 5 }
          ]
        }
      },
      { 
        name: "NBA SLA Delivery Time", 
        type: "drop_down",
        value: 1,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "Hit SLA", orderindex: 1 },
            { id: 2, name: "Missed: ≤ 30 MIN", orderindex: 2 },
            { id: 3, name: "Missed: 1 Hour +", orderindex: 3 }
          ]
        }
      },
      { 
        name: "Scrub SLA ", 
        type: "drop_down",
        value: 1,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "NBA | Yes | < 30 Mins Post Game", orderindex: 1 },
            { id: 2, name: "NBA | No | > 30 Mins Post Game", orderindex: 2 }
          ]
        }
      },
      { 
        name: "Resend", 
        type: "drop_down",
        value: 2,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "Yes", orderindex: 1 },
            { id: 2, name: "No", orderindex: 2 }
          ]
        }
      },
      { name: "Event Date", value: "1704067200000" }
    ]
  },
  {
    name: "Game 2 - Celtics vs Heat",
    custom_fields: [
      { 
        name: "Live Tracking Delivery", 
        type: "drop_down",
        value: 1,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "S5: Good", orderindex: 1 },
            { id: 2, name: "S4: Minor Issues (I)", orderindex: 2 },
            { id: 3, name: "S3: Moderate", orderindex: 3 },
            { id: 4, name: "S2: Major Issues (I)", orderindex: 4 },
            { id: 5, name: "S1: Critical (I)", orderindex: 5 }
          ]
        }
      },
      { 
        name: "Replay Delivery", 
        type: "drop_down",
        value: 1,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "S5: Good", orderindex: 1 },
            { id: 2, name: "S4: Minor Issues (I)", orderindex: 2 },
            { id: 3, name: "S3: Moderate", orderindex: 3 },
            { id: 4, name: "S2: Major Issues (I)", orderindex: 4 },
            { id: 5, name: "S1: Critical (I)", orderindex: 5 }
          ]
        }
      },
      { 
        name: "NBA SLA Delivery Time", 
        type: "drop_down",
        value: 1,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "Hit SLA", orderindex: 1 },
            { id: 2, name: "Missed: ≤ 30 MIN", orderindex: 2 },
            { id: 3, name: "Missed: 1 Hour +", orderindex: 3 }
          ]
        }
      },
      { 
        name: "Scrub SLA ", 
        type: "drop_down",
        value: 1,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "NBA | Yes | < 30 Mins Post Game", orderindex: 1 },
            { id: 2, name: "NBA | No | > 30 Mins Post Game", orderindex: 2 }
          ]
        }
      },
      { 
        name: "Resend", 
        type: "drop_down",
        value: 1,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "Yes", orderindex: 1 },
            { id: 2, name: "No", orderindex: 2 }
          ]
        }
      },
      { name: "Event Date", value: "1704153600000" }
    ]
  },
  {
    name: "Game 3 - Nets vs Knicks",
    custom_fields: [
      { 
        name: "Live Tracking Delivery", 
        type: "drop_down",
        value: 3,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "S5: Good", orderindex: 1 },
            { id: 2, name: "S4: Minor Issues (I)", orderindex: 2 },
            { id: 3, name: "S3: Moderate", orderindex: 3 },
            { id: 4, name: "S2: Major Issues (I)", orderindex: 4 },
            { id: 5, name: "S1: Critical (I)", orderindex: 5 }
          ]
        }
      },
      { 
        name: "Replay Delivery", 
        type: "drop_down",
        value: 2,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "S5: Good", orderindex: 1 },
            { id: 2, name: "S4: Minor Issues (I)", orderindex: 2 },
            { id: 3, name: "S3: Moderate", orderindex: 3 },
            { id: 4, name: "S2: Major Issues (I)", orderindex: 4 },
            { id: 5, name: "S1: Critical (I)", orderindex: 5 }
          ]
        }
      },
      { 
        name: "NBA SLA Delivery Time", 
        type: "drop_down",
        value: 2,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "Hit SLA", orderindex: 1 },
            { id: 2, name: "Missed: ≤ 30 MIN", orderindex: 2 },
            { id: 3, name: "Missed: 1 Hour +", orderindex: 3 }
          ]
        }
      },
      { 
        name: "Scrub SLA ", 
        type: "drop_down",
        value: 2,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "NBA | Yes | < 30 Mins Post Game", orderindex: 1 },
            { id: 2, name: "NBA | No | > 30 Mins Post Game", orderindex: 2 }
          ]
        }
      },
      { 
        name: "Resend", 
        type: "drop_down",
        value: 2,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "Yes", orderindex: 1 },
            { id: 2, name: "No", orderindex: 2 }
          ]
        }
      },
      { name: "Event Date", value: "1704153600000" }
    ]
  }
];

async function testRealisticData() {
  console.log('🧪 Testing with realistic ClickUp data structure...\n');
  
  try {
    // Test field value extraction
    console.log('🔍 Testing field value extraction...');
    const sampleTask = realisticTasks[0];
    sampleTask.custom_fields.forEach(field => {
      console.log(`\nField: "${field.name}"`);
      console.log(`   Raw value: ${field.value}`);
      console.log(`   Extracted value: ${getFieldValue(field)}`);
    });
    
    // Test stats calculation
    console.log('\n📊 Testing stats calculation...');
    const stats = calculateDashboardStats(realisticTasks);
    console.log('Stats result:', stats);
    
    // Test number card stats
    console.log('\n📊 Testing number card stats...');
    const numberCardStats = generateNumberCardStats(realisticTasks);
    console.log('Number card stats:', numberCardStats);
    
    // Test complete dashboard generation
    console.log('\n📊 Testing complete dashboard generation...');
    const result = await generateCompleteDashboardCharts(realisticTasks);
    console.log(`Generated ${result.charts.length} charts`);
    
    // Analyze chart content
    console.log('\n📊 Analyzing generated charts...');
    result.charts.forEach((chart, index) => {
      console.log(`\nChart ${index + 1}: ${chart.title}`);
      
      if (chart.svg) {
        // Extract labels from SVG
        const labelMatches = chart.svg.match(/class="legend-text">([^<]+)</g);
        if (labelMatches) {
          const labels = labelMatches.map(match => match.replace('class="legend-text">', '').replace('<', ''));
          console.log(`   Labels: ${labels.join(', ')}`);
        }
        
        // Check for colors
        const hasColors = chart.svg.includes('fill="#') && !chart.svg.includes('fill="white"');
        console.log(`   Has colors: ${hasColors}`);
      }
    });
    
    // Check for Scrub SLA specifically
    console.log('\n🔍 Checking for Scrub SLA chart specifically...');
    const scrubSLACharts = result.charts.filter(chart => 
      chart.title.includes('Scrub SLA') || 
      chart.title.includes('Scrubbed SLA')
    );
    console.log(`Found ${scrubSLACharts.length} Scrub SLA charts`);
    scrubSLACharts.forEach(chart => {
      console.log(`   - ${chart.title}`);
    });
    
    console.log('\n🎯 Realistic data test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRealisticData().catch(console.error);
}

module.exports = { testRealisticData };
