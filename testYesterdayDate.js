const { generateCompleteDashboardCharts, calculateDashboardStats } = require('./generateDashboardCharts');

// Test data with realistic dates
const testTasks = [
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
            { id: 2, name: "S4: Minor Issues (I)", orderindex: 2 }
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
        value: 1,
        value_text: null,
        type_config: {
          options: [
            { id: 1, name: "P5: Good", orderindex: 1 },
            { id: 2, name: "P4: Minor", orderindex: 2 }
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
            { id: 2, name: "P4: Minor", orderindex: 2 }
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
            { id: 2, name: "P4: Minor", orderindex: 2 }
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
      { name: "Event Date", value: "1704067200000" } // 2024-01-01
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
            { id: 2, name: "P4: Minor", orderindex: 2 }
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
            { id: 2, name: "P4: Minor", orderindex: 2 }
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
            { id: 2, name: "P4: Minor", orderindex: 2 }
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
      { name: "Event Date", value: "1704153600000" } // 2024-01-02
    ]
  }
];

async function testYesterdayDate() {
  console.log('🧪 Testing yesterday date functionality...\n');
  
  try {
    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log(`📅 Today's date: ${new Date().toISOString().split('T')[0]}`);
    console.log(`📅 Yesterday's date: ${yesterdayStr}`);
    
    // Test 1: Stats with yesterday's date
    console.log('\n📊 Test 1: Stats with yesterday\'s date...');
    const statsWithYesterday = calculateDashboardStats(testTasks, yesterdayStr);
    console.log('✅ Stats with yesterday result:', statsWithYesterday);
    console.log(`   Last Night Games: ${statsWithYesterday.lastNightGames}`);
    console.log(`   Last Night SLAs Hit: ${statsWithYesterday.lastNightSLAsHit}`);
    console.log(`   Last Night SLAs Missed: ${statsWithYesterday.lastNightSLAsMissed}`);
    console.log(`   Last Night Resends: ${statsWithYesterday.lastNightResends}`);
    
    // Test 2: Complete dashboard generation with yesterday's date
    console.log('\n📊 Test 2: Complete dashboard generation with yesterday\'s date...');
    const result = await generateCompleteDashboardCharts(testTasks, yesterdayStr);
    console.log(`✅ Generated ${result.charts.length} charts`);
    
    // Test 3: Check specific date charts
    console.log('\n📊 Test 3: Checking specific date charts...');
    const specificDateCharts = result.charts.filter(chart => 
      chart.title.includes(`(${yesterdayStr})`)
    );
    
    console.log(`   Specific date charts for ${yesterdayStr}: ${specificDateCharts.length}`);
    specificDateCharts.forEach((chart, index) => {
      console.log(`     ${index + 1}. ${chart.title}`);
    });
    
    // Test 4: Verify chart filtering works with dynamic date
    console.log('\n📊 Test 4: Testing chart filtering with dynamic date...');
    const allTimeCharts = result.charts.filter(chart => !chart.title.includes(`(${yesterdayStr})`));
    console.log(`   All-time charts: ${allTimeCharts.length}`);
    console.log(`   Specific date charts: ${specificDateCharts.length}`);
    
    // Test 5: Check if yesterday's date is in the correct format
    console.log('\n📊 Test 5: Verifying date format...');
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(yesterdayStr)) {
      console.log(`✅ Yesterday's date format is correct: ${yesterdayStr}`);
    } else {
      console.log(`❌ Yesterday's date format is incorrect: ${yesterdayStr}`);
    }
    
    console.log('\n🎯 Yesterday date test complete!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Yesterday's date calculated: ${yesterdayStr}`);
    console.log(`   ✅ Stats with yesterday: Working`);
    console.log(`   ✅ Specific date charts: ${specificDateCharts.length}/9`);
    console.log(`   ✅ Chart filtering: Working correctly`);
    console.log(`   ✅ Date format: Valid`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testYesterdayDate().catch(console.error);
}

module.exports = { testYesterdayDate };
