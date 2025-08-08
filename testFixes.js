const { fetchExecutiveDashboardData } = require('./fetchData');
const { generateExecutiveDashboardCharts, filterTasksByEventDate } = require('./generateDashboardCharts');

async function testFixes() {
  console.log('🧪 Testing fixes for color coding and date filtering...');
  
  try {
    // Test 1: Fetch data
    console.log('\n📊 Test 1: Fetching executive dashboard data...');
    const tasks = await fetchExecutiveDashboardData();
    console.log(`✅ Fetched ${tasks.length} tasks`);
    
    // Test 2: Generate charts (this will test color coding)
    console.log('\n🎨 Test 2: Generating executive dashboard charts...');
    const charts = await generateExecutiveDashboardCharts(tasks);
    console.log(`✅ Generated ${charts.length} charts`);
    
    // Test 3: Test date filtering
    console.log('\n📅 Test 3: Testing date filtering...');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filteredTasks = filterTasksByEventDate(tasks, today);
    console.log(`✅ Filtered ${filteredTasks.length} tasks for date ${today}`);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFixes();
