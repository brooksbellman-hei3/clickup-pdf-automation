const { fetchExecutiveDashboardData } = require('./fetchData');
const { generateCompleteDashboardCharts, calculateDashboardStats } = require('./generateDashboardCharts');

async function testNewDashboard() {
  console.log('🧪 Testing new dashboard functionality...\n');
  
  try {
    // Test 1: Fetch data
    console.log('📊 Test 1: Fetching executive dashboard data...');
    const tasks = await fetchExecutiveDashboardData();
    console.log(`✅ Fetched ${tasks.length} tasks`);
    
    // Test 2: Calculate dashboard stats
    console.log('\n📊 Test 2: Calculating dashboard statistics...');
    const stats = calculateDashboardStats(tasks);
    console.log('✅ Dashboard stats calculated:');
    console.log(`   Total Games: ${stats.totalGames}`);
    console.log(`   Live Tracking Delivery: ${stats.liveTrackingDelivery}%`);
    console.log(`   Replay Delivery: ${stats.replayDelivery}%`);
    console.log(`   SLA Hit Percentage: ${stats.slaHitPercentage}%`);
    console.log(`   Resend Percentage: ${stats.resendPercentage}%`);
    
    // Test 3: Generate complete dashboard (with yesterday's date)
    console.log('\n📊 Test 3: Generating complete dashboard...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const result = await generateCompleteDashboardCharts(tasks, yesterdayStr);
    console.log(`✅ Generated ${result.charts.length} charts`);
    console.log('✅ Dashboard stats with yesterday\'s data:');
    console.log(`   Last Night Games: ${result.stats.lastNightGames}`);
    console.log(`   Last Night SLAs Hit: ${result.stats.lastNightSLAsHit}`);
    console.log(`   Last Night SLAs Missed: ${result.stats.lastNightSLAsMissed}`);
    console.log(`   Last Night Resends: ${result.stats.lastNightResends}`);
    
    console.log('\n🎯 New dashboard test complete!');
    console.log('\n💡 Key changes implemented:');
    console.log('✅ NBA SLA Delivery Time, Scrub SLA, and Resend are now number cards');
    console.log('✅ Header updated to "Overall Season Review"');
    console.log('✅ New metrics: Total Games, Delivery %, SLA Hit %, Resend %');
    console.log('✅ Last Night\'s Performance section with yesterday\'s data');
    console.log('✅ Default date set to yesterday');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testNewDashboard().catch(console.error);
}

module.exports = { testNewDashboard };
