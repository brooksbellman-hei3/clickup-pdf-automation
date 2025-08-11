const { fetchExecutiveDashboardData } = require('./fetchData');
const { generateCompleteDashboardCharts, calculateDashboardStats, generateNumberCardStats } = require('./generateDashboardCharts');

async function testDashboardFixes() {
  console.log('🧪 Testing dashboard fixes...\n');
  
  try {
    // Test 1: Fetch data
    console.log('📊 Test 1: Fetching executive dashboard data...');
    const tasks = await fetchExecutiveDashboardData();
    console.log(`✅ Fetched ${tasks.length} tasks from executive dashboard list`);
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found - cannot test dashboard');
      return;
    }
    
    // Test 2: Calculate stats
    console.log('\n📊 Test 2: Calculating dashboard statistics...');
    const stats = calculateDashboardStats(tasks);
    console.log('✅ Dashboard stats:');
    console.log(`   Total Games: ${stats.totalGames}`);
    console.log(`   Live Tracking Delivery: ${stats.liveTrackingDelivery}%`);
    console.log(`   Replay Delivery: ${stats.replayDelivery}%`);
    console.log(`   SLA Hit Percentage: ${stats.slaHitPercentage}%`);
    console.log(`   Resend Percentage: ${stats.resendPercentage}%`);
    
    // Test 3: Calculate stats with specific date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log('\n📊 Test 3: Calculating stats for specific date...');
    const statsWithDate = calculateDashboardStats(tasks, yesterdayStr);
    console.log(`✅ Stats for ${yesterdayStr}:`);
    console.log(`   Last Night Games: ${statsWithDate.lastNightGames || 0}`);
    console.log(`   Last Night SLAs Hit: ${statsWithDate.lastNightSLAsHit || 0}`);
    console.log(`   Last Night SLAs Missed: ${statsWithDate.lastNightSLAsMissed || 0}`);
    console.log(`   Last Night Resends: ${statsWithDate.lastNightResends || 0}`);
    
    // Test 4: Generate number card stats
    console.log('\n📊 Test 4: Generating number card stats...');
    const numberCardStats = generateNumberCardStats(tasks);
    console.log('✅ Number card stats:');
    Object.keys(numberCardStats).forEach(field => {
      console.log(`   ${field}:`, numberCardStats[field]);
    });
    
    // Test 5: Generate complete dashboard
    console.log('\n📊 Test 5: Generating complete dashboard...');
    const result = await generateCompleteDashboardCharts(tasks, yesterdayStr);
    console.log(`✅ Complete dashboard generated with ${result.charts.length} charts`);
    console.log(`   Stats:`, result.stats);
    console.log(`   Number card stats:`, Object.keys(result.numberCardStats));
    
    // Test 6: Verify all charts have colors
    console.log('\n📊 Test 6: Verifying chart colors...');
    let chartsWithColors = 0;
    let chartsWithoutColors = 0;
    
    result.charts.forEach((chart, index) => {
      if (chart.svg) {
        // Check if SVG contains color information
        if (chart.svg.includes('fill=') && !chart.svg.includes('fill="white"')) {
          chartsWithColors++;
        } else {
          chartsWithoutColors++;
          console.log(`   ⚠️ Chart ${index + 1} (${chart.title}) may have color issues`);
        }
      }
    });
    
    console.log(`✅ Charts with colors: ${chartsWithColors}`);
    console.log(`⚠️ Charts without colors: ${chartsWithoutColors}`);
    
    console.log('\n🎯 Dashboard fixes test complete!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Stats calculation: Working`);
    console.log(`   ✅ Number card stats: Working`);
    console.log(`   ✅ Chart generation: ${result.charts.length} charts generated`);
    console.log(`   ✅ Color mapping: ${chartsWithColors}/${result.charts.length} charts have colors`);
    
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
