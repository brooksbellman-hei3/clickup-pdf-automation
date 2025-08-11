const { generateCompleteDashboardCharts, calculateDashboardStats, generateNumberCardStats } = require('./generateDashboardCharts');

// Complete test data with ALL 9 required fields
const completeTestTasks = [
  {
    name: "Game 1 - Lakers vs Warriors",
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
            { id: 3, name: "S3: Moderate", orderindex: 3 }
          ]
        }
      },
      { 
        name: "Scrubbed Delivery", 
        type: "drop_down",
        value: 1,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "S5: Good", orderindex: 1 },
            { id: 2, name: "S4: Minor Issues (I)", orderindex: 2 },
            { id: 3, name: "S3: Moderate", orderindex: 3 }
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
            { id: 2, name: "S4: Minor Issues (I)", orderindex: 2 }
          ]
        }
      },
      { 
        name: "Operations P-Status ", 
        type: "drop_down",
        value: 1,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "P5: Good", orderindex: 1 },
            { id: 2, name: "P4: Minor", orderindex: 2 },
            { id: 3, name: "P3: Moderate", orderindex: 3 }
          ]
        }
      },
      { 
        name: "Software P-Status ", 
        type: "drop_down",
        value: 2,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "P5: Good", orderindex: 1 },
            { id: 2, name: "P4: Minor", orderindex: 2 },
            { id: 3, name: "P3: Moderate", orderindex: 3 }
          ]
        }
      },
      { 
        name: "Hardware P-Status", 
        type: "drop_down",
        value: 1,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "P5: Good", orderindex: 1 },
            { id: 2, name: "P4: Minor", orderindex: 2 },
            { id: 3, name: "P3: Moderate", orderindex: 3 }
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
            { id: 2, name: "Missed: ≤ 30 MIN", orderindex: 2 }
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
        value: 2,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "S5: Good", orderindex: 1 },
            { id: 2, name: "S4: Minor Issues (I)", orderindex: 2 }
          ]
        }
      },
      { 
        name: "Scrubbed Delivery", 
        type: "drop_down",
        value: 2,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "S5: Good", orderindex: 1 },
            { id: 2, name: "S4: Minor Issues (I)", orderindex: 2 }
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
            { id: 2, name: "S4: Minor Issues (I)", orderindex: 2 }
          ]
        }
      },
      { 
        name: "Operations P-Status ", 
        type: "drop_down",
        value: 2,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "P5: Good", orderindex: 1 },
            { id: 2, name: "P4: Minor", orderindex: 2 },
            { id: 3, name: "P3: Moderate", orderindex: 3 }
          ]
        }
      },
      { 
        name: "Software P-Status ", 
        type: "drop_down",
        value: 1,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "P5: Good", orderindex: 1 },
            { id: 2, name: "P4: Minor", orderindex: 2 },
            { id: 3, name: "P3: Moderate", orderindex: 3 }
          ]
        }
      },
      { 
        name: "Hardware P-Status", 
        type: "drop_down",
        value: 2,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "P5: Good", orderindex: 1 },
            { id: 2, name: "P4: Minor", orderindex: 2 },
            { id: 3, name: "P3: Moderate", orderindex: 3 }
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
            { id: 2, name: "Missed: ≤ 30 MIN", orderindex: 2 }
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
  }
];

async function testCompleteData() {
  console.log('🧪 Testing complete data with all 9 fields...\n');
  
  try {
    // Test 1: Stats calculation
    console.log('📊 Test 1: Stats calculation...');
    const stats = calculateDashboardStats(completeTestTasks);
    console.log('✅ Stats result:', stats);
    
    // Test 2: Complete dashboard generation
    console.log('\n📊 Test 2: Complete dashboard generation...');
    const result = await generateCompleteDashboardCharts(completeTestTasks, "2024-01-01");
    console.log(`✅ Generated ${result.charts.length} charts`);
    
    // Test 3: Check chart distribution
    console.log('\n📊 Test 3: Analyzing chart distribution...');
    const allTimeCharts = result.charts.filter(chart => !chart.title.includes('(2024-01-01)'));
    const specificDateCharts = result.charts.filter(chart => chart.title.includes('(2024-01-01)'));
    
    console.log(`   All-time charts: ${allTimeCharts.length}`);
    allTimeCharts.forEach((chart, index) => {
      console.log(`     ${index + 1}. ${chart.title}`);
    });
    
    console.log(`   Specific date charts: ${specificDateCharts.length}`);
    specificDateCharts.forEach((chart, index) => {
      console.log(`     ${index + 1}. ${chart.title}`);
    });
    
    // Test 4: Verify expected charts
    console.log('\n📊 Test 4: Verifying expected charts...');
    const expectedCharts = [
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
    
    const allTimeTitles = allTimeCharts.map(chart => chart.title);
    const missingCharts = expectedCharts.filter(expected => 
      !allTimeTitles.some(title => title.includes(expected))
    );
    
    if (missingCharts.length === 0) {
      console.log('✅ All expected charts are present');
    } else {
      console.log('❌ Missing charts:', missingCharts);
    }
    
    // Test 5: Check chart types
    console.log('\n📊 Test 5: Checking chart types...');
    const pieCharts = allTimeCharts.filter(chart => 
      !['NBA SLA Delivery Time', 'Scrub SLA ', 'Resend'].some(field => 
        chart.title.includes(field)
      )
    );
    const numberCharts = allTimeCharts.filter(chart => 
      ['NBA SLA Delivery Time', 'Scrub SLA ', 'Resend'].some(field => 
        chart.title.includes(field)
      )
    );
    
    console.log(`   Pie charts: ${pieCharts.length} (expected 6)`);
    pieCharts.forEach(chart => console.log(`     - ${chart.title}`));
    
    console.log(`   Number count charts: ${numberCharts.length} (expected 3)`);
    numberCharts.forEach(chart => console.log(`     - ${chart.title}`));
    
    console.log('\n🎯 Complete data test finished!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Total charts generated: ${result.charts.length}`);
    console.log(`   ✅ All-time charts: ${allTimeCharts.length}/9`);
    console.log(`   ✅ Specific date charts: ${specificDateCharts.length}/9`);
    console.log(`   ✅ Pie charts: ${pieCharts.length}/6`);
    console.log(`   ✅ Number count charts: ${numberCharts.length}/3`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCompleteData().catch(console.error);
}

module.exports = { testCompleteData };
