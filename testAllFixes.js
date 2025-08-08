const { fetchExecutiveDashboardData } = require('./fetchData');
const { generateCompleteDashboardCharts, calculateDashboardStats } = require('./generateDashboardCharts');

async function testAllFixes() {
  console.log('🔍 Testing all dashboard fixes...');
  
  try {
    // Fetch data
    const tasks = await fetchExecutiveDashboardData();
    console.log(`📊 Fetched ${tasks.length} tasks`);
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found');
      return;
    }
    
    // Test 1: Stats calculation
    console.log('\n📊 Test 1: Dashboard Stats Calculation');
    const stats = calculateDashboardStats(tasks);
    console.log('Calculated stats:', stats);
    
    // Test 2: Complete dashboard generation
    console.log('\n📊 Test 2: Complete Dashboard Generation');
    const result = await generateCompleteDashboardCharts(tasks);
    
    console.log(`✅ Complete dashboard generated`);
    console.log(`   Charts count: ${result.charts ? result.charts.length : 'N/A'}`);
    console.log(`   Stats:`, result.stats);
    
    // Test 3: Check for number card charts
    console.log('\n📊 Test 3: Number Card Charts');
    const numberCardFields = ['NBA SLA Delivery Time', 'Scrub SLA', 'Resend'];
    
    numberCardFields.forEach(fieldName => {
      const chart = result.charts?.find(c => 
        c && c.title && c.title.includes(fieldName)
      );
      
      if (chart) {
        console.log(`✅ ${fieldName} chart found`);
        console.log(`   Title: ${chart.title}`);
        console.log(`   Buffer size: ${chart.buffer ? chart.buffer.length : 'N/A'} bytes`);
      } else {
        console.log(`❌ ${fieldName} chart missing`);
      }
    });
    
    // Test 4: Check field availability
    console.log('\n📊 Test 4: Field Availability');
    const firstTask = tasks[0];
    if (firstTask.custom_fields) {
      const fieldNames = firstTask.custom_fields.map(f => f.name);
      console.log('Available fields:');
      fieldNames.forEach((name, index) => {
        console.log(`  ${index}: "${name}"`);
      });
      
      // Check for specific fields
      numberCardFields.forEach(fieldName => {
        const found = fieldNames.some(name => 
          name.toLowerCase().includes(fieldName.toLowerCase())
        );
        console.log(`  ${fieldName}: ${found ? '✅ Found' : '❌ Not found'}`);
      });
    }
    
    // Test 5: Test with yesterday's date
    console.log('\n📊 Test 5: Yesterday\'s Stats');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const yesterdayStats = calculateDashboardStats(tasks, yesterdayStr);
    console.log(`Yesterday (${yesterdayStr}) stats:`, yesterdayStats);
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAllFixes();
