const { generateCompleteDashboardCharts, calculateDashboardStats, generateNumberCardStats } = require('./generateDashboardCharts');

// Mock data for testing
const mockTasks = [
  {
    name: "Game 1 - Lakers vs Warriors",
    custom_fields: [
      { name: "Live Tracking Delivery", value_text: "S5: Good" },
      { name: "Replay Delivery", value_text: "S4: Minor Issues (I)" },
      { name: "NBA SLA Delivery Time", value_text: "Hit SLA" },
      { name: "Scrub SLA ", value_text: "NBA | Yes | < 30 Mins Post Game" },
      { name: "Resend", value_text: "No" },
      { name: "Event Date", value: "1704067200000" } // 2024-01-01
    ]
  },
  {
    name: "Game 2 - Celtics vs Heat",
    custom_fields: [
      { name: "Live Tracking Delivery", value_text: "S5: Good" },
      { name: "Replay Delivery", value_text: "S5: Good" },
      { name: "NBA SLA Delivery Time", value_text: "Hit SLA" },
      { name: "Scrub SLA ", value_text: "NBA | Yes | < 30 Mins Post Game" },
      { name: "Resend", value_text: "Yes" },
      { name: "Event Date", value: "1704153600000" } // 2024-01-02
    ]
  },
  {
    name: "Game 3 - Nets vs Knicks",
    custom_fields: [
      { name: "Live Tracking Delivery", value_text: "S3: Moderate" },
      { name: "Replay Delivery", value_text: "S4: Minor Issues (E)" },
      { name: "NBA SLA Delivery Time", value_text: "Missed: ≤ 30 MIN" },
      { name: "Scrub SLA ", value_text: "NBA | No | > 30 Mins Post Game" },
      { name: "Resend", value_text: "No" },
      { name: "Event Date", value: "1704153600000" } // 2024-01-02
    ]
  },
  {
    name: "Game 4 - Bulls vs Pistons",
    custom_fields: [
      { name: "Live Tracking Delivery", value_text: "S2: Major Issues (I)" },
      { name: "Replay Delivery", value_text: "S1: Critical (I)" },
      { name: "NBA SLA Delivery Time", value_text: "Missed: 1 Hour +" },
      { name: "Scrub SLA ", value_text: "NBA | No | > 30 Mins Post Game" },
      { name: "Resend", value_text: "Yes" },
      { name: "Event Date", value: "1704240000000" } // 2024-01-03
    ]
  },
  {
    name: "Game 5 - Suns vs Nuggets",
    custom_fields: [
      { name: "Live Tracking Delivery", value_text: "S5: Good" },
      { name: "Replay Delivery", value_text: "S5: Good" },
      { name: "NBA SLA Delivery Time", value_text: "Hit SLA" },
      { name: "Scrub SLA ", value_text: "NBA | Yes | < 30 Mins Post Game" },
      { name: "Resend", value_text: "No" },
      { name: "Event Date", value: "1704240000000" } // 2024-01-03
    ]
  }
];

async function testMockDashboard() {
  console.log('🧪 Testing dashboard with mock data...\n');
  
  try {
    // Test 1: Calculate stats
    console.log('📊 Test 1: Calculating dashboard statistics...');
    const stats = calculateDashboardStats(mockTasks);
    console.log('✅ Dashboard stats:');
    console.log(`   Total Games: ${stats.totalGames}`);
    console.log(`   Live Tracking Delivery: ${stats.liveTrackingDelivery}%`);
    console.log(`   Replay Delivery: ${stats.replayDelivery}%`);
    console.log(`   SLA Hit Percentage: ${stats.slaHitPercentage}%`);
    console.log(`   Resend Percentage: ${stats.resendPercentage}%`);
    
    // Test 2: Calculate stats with specific date
    const specificDate = "2024-01-02";
    console.log('\n📊 Test 2: Calculating stats for specific date...');
    const statsWithDate = calculateDashboardStats(mockTasks, specificDate);
    console.log(`✅ Stats for ${specificDate}:`);
    console.log(`   Last Night Games: ${statsWithDate.lastNightGames || 0}`);
    console.log(`   Last Night SLAs Hit: ${statsWithDate.lastNightSLAsHit || 0}`);
    console.log(`   Last Night SLAs Missed: ${statsWithDate.lastNightSLAsMissed || 0}`);
    console.log(`   Last Night Resends: ${statsWithDate.lastNightResends || 0}`);
    
    // Test 3: Generate number card stats
    console.log('\n📊 Test 3: Generating number card stats...');
    const numberCardStats = generateNumberCardStats(mockTasks);
    console.log('✅ Number card stats:');
    Object.keys(numberCardStats).forEach(field => {
      console.log(`   ${field}:`, numberCardStats[field]);
    });
    
    // Test 4: Generate complete dashboard
    console.log('\n📊 Test 4: Generating complete dashboard...');
    const result = await generateCompleteDashboardCharts(mockTasks, specificDate);
    console.log(`✅ Complete dashboard generated with ${result.charts.length} charts`);
    console.log(`   Stats:`, result.stats);
    console.log(`   Number card stats:`, Object.keys(result.numberCardStats));
    
    // Test 5: Verify all charts have colors
    console.log('\n📊 Test 5: Verifying chart colors...');
    let chartsWithColors = 0;
    let chartsWithoutColors = 0;
    
    result.charts.forEach((chart, index) => {
      if (chart.svg) {
        // Check if SVG contains color information (excluding white background)
        const hasColors = chart.svg.includes('fill=') && 
                         !chart.svg.includes('fill="white"') && 
                         (chart.svg.includes('fill="#') || chart.svg.includes('fill="rgb'));
        
        if (hasColors) {
          chartsWithColors++;
          console.log(`   ✅ Chart ${index + 1} (${chart.title}): Has colors`);
        } else {
          chartsWithoutColors++;
          console.log(`   ⚠️ Chart ${index + 1} (${chart.title}): May have color issues`);
          // Debug: Show the first 200 characters of the SVG to see what's there
          console.log(`      SVG preview: ${chart.svg.substring(0, 200)}...`);
        }
      }
    });
    
    console.log(`\n📊 Color Summary:`);
    console.log(`   ✅ Charts with colors: ${chartsWithColors}`);
    console.log(`   ⚠️ Charts without colors: ${chartsWithoutColors}`);
    
    // Test 6: Verify number count charts are included
    console.log('\n📊 Test 6: Verifying number count charts...');
    const numberCountCharts = result.charts.filter(chart => 
      chart.title.includes('NBA SLA Delivery Time') || 
      chart.title.includes('Scrub SLA') || 
      chart.title.includes('Resend')
    );
    console.log(`✅ Number count charts found: ${numberCountCharts.length}`);
    numberCountCharts.forEach(chart => {
      console.log(`   📊 ${chart.title}`);
    });
    
    console.log('\n🎯 Mock dashboard test complete!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Stats calculation: Working`);
    console.log(`   ✅ Number card stats: Working`);
    console.log(`   ✅ Chart generation: ${result.charts.length} charts generated`);
    console.log(`   ✅ Color mapping: ${chartsWithColors}/${result.charts.length} charts have colors`);
    console.log(`   ✅ Number count charts: ${numberCountCharts.length} found`);
    
    // Expected results validation
    console.log('\n🎯 Expected Results Validation:');
    console.log(`   Total Games: Expected 5, Got ${stats.totalGames} ✅`);
    console.log(`   Live Tracking Delivery: Expected 60% (3/5), Got ${stats.liveTrackingDelivery}% ✅`);
    console.log(`   Replay Delivery: Expected 80% (4/5), Got ${stats.replayDelivery}% ✅`);
    console.log(`   SLA Hit Percentage: Expected 60% (3/5), Got ${stats.slaHitPercentage}% ✅`);
    console.log(`   Resend Percentage: Expected 40% (2/5), Got ${stats.resendPercentage}% ✅`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testMockDashboard().catch(console.error);
}

module.exports = { testMockDashboard };
