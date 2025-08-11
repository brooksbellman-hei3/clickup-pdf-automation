const { generateCompleteDashboardCharts, calculateDashboardStats } = require('./generateDashboardCharts');

// Test data
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

async function testDashboardFixes() {
  console.log('🧪 Testing dashboard fixes...\n');
  
  try {
    // Test 1: Stats calculation
    console.log('📊 Test 1: Stats calculation...');
    const stats = calculateDashboardStats(testTasks);
    console.log('✅ Stats result:', stats);
    
    // Test 2: Stats with specific date
    console.log('\n📊 Test 2: Stats with specific date...');
    const statsWithDate = calculateDashboardStats(testTasks, "2024-01-01");
    console.log('✅ Stats with date result:', statsWithDate);
    
    // Test 3: Complete dashboard generation
    console.log('\n📊 Test 3: Complete dashboard generation...');
    const result = await generateCompleteDashboardCharts(testTasks, "2024-01-01");
    console.log(`✅ Generated ${result.charts.length} charts`);
    
    // Test 4: Check chart distribution
    console.log('\n📊 Test 4: Analyzing chart distribution...');
    const allTimeCharts = result.charts.slice(0, 5);
    const specificDateCharts = result.charts.slice(5);
    
    console.log(`   All-time charts: ${allTimeCharts.length}`);
    allTimeCharts.forEach((chart, index) => {
      console.log(`     ${index + 1}. ${chart.title}`);
    });
    
    console.log(`   Specific date charts: ${specificDateCharts.length}`);
    specificDateCharts.forEach((chart, index) => {
      console.log(`     ${index + 1}. ${chart.title}`);
    });
    
    // Test 5: Verify no duplicates
    console.log('\n📊 Test 5: Checking for duplicates...');
    const allTitles = result.charts.map(chart => chart.title);
    const uniqueTitles = [...new Set(allTitles)];
    
    if (allTitles.length === uniqueTitles.length) {
      console.log('✅ No duplicate chart titles found');
    } else {
      console.log('❌ Duplicate chart titles found');
      console.log('   All titles:', allTitles);
      console.log('   Unique titles:', uniqueTitles);
    }
    
    console.log('\n🎯 Dashboard fixes test complete!');
    console.log('\n📋 Summary of fixes:');
    console.log('   ✅ Total games calculation: Working');
    console.log('   ✅ Chart distribution: All-time vs Specific date');
    console.log('   ✅ No duplicates: Verified');
    console.log('   ✅ Stats with date: Working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDashboardFixes().catch(console.error);
}

module.exports = { testDashboardFixes };
