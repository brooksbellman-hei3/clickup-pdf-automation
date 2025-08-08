const { fetchExecutiveDashboardData } = require('./fetchData');
const { generateCompleteDashboardCharts, calculateDashboardStats } = require('./generateDashboardCharts');

async function testDashboardFixes() {
  console.log('🧪 Testing dashboard fixes...\n');
  
  try {
    // Test 1: Fetch data
    console.log('📊 Test 1: Fetching executive dashboard data...');
    const tasks = await fetchExecutiveDashboardData();
    console.log(`✅ Fetched ${tasks.length} tasks`);
    
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
    
    // Test 3: Test with yesterday's date
    console.log('\n📊 Test 3: Testing with yesterday\'s date...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const statsWithDate = calculateDashboardStats(tasks, yesterdayStr);
    console.log('✅ Last night\'s stats:');
    console.log(`   Last Night Games: ${statsWithDate.lastNightGames}`);
    console.log(`   Last Night SLAs Hit: ${statsWithDate.lastNightSLAsHit}`);
    console.log(`   Last Night SLAs Missed: ${statsWithDate.lastNightSLAsMissed}`);
    console.log(`   Last Night Resends: ${statsWithDate.lastNightResends}`);
    
    // Test 4: Generate complete dashboard
    console.log('\n📊 Test 4: Generating complete dashboard...');
    const result = await generateCompleteDashboardCharts(tasks, yesterdayStr);
    console.log(`✅ Generated ${result.charts.length} charts`);
    console.log('✅ Final stats:');
    console.log(`   Total Games: ${result.stats.totalGames}`);
    console.log(`   Live Tracking Delivery: ${result.stats.liveTrackingDelivery}%`);
    console.log(`   Replay Delivery: ${result.stats.replayDelivery}%`);
    console.log(`   SLA Hit Percentage: ${result.stats.slaHitPercentage}%`);
    console.log(`   Resend Percentage: ${result.stats.resendPercentage}%`);
    console.log(`   Last Night Games: ${result.stats.lastNightGames}`);
    
    console.log('\n🎯 Dashboard fixes test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDashboardFixes().catch(console.error);
}

module.exports = { testDashboardFixes };
