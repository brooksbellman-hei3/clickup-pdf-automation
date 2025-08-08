const { fetchExecutiveDashboardData } = require('./fetchData');
const { generateExecutiveDashboardCharts } = require('./generateDashboardCharts');

async function testNumberCards() {
  console.log('🔍 Testing number count charts...');
  
  try {
    // Fetch data
    const tasks = await fetchExecutiveDashboardData();
    console.log(`📊 Fetched ${tasks.length} tasks`);
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found');
      return;
    }
    
    // Test generating charts for the number card fields
    const numberCardFields = ['NBA SLA Delivery Time', 'Scrub SLA', 'Resend'];
    
    for (const fieldName of numberCardFields) {
      console.log(`\n📊 Testing number count chart for "${fieldName}":`);
      
      try {
        const chart = await generateExecutiveDashboardCharts(tasks, null, null);
        
        // Find the chart for this field
        const fieldChart = chart.find(c => c && c.title && c.title.includes(fieldName));
        
        if (fieldChart) {
          console.log(`✅ Chart generated for "${fieldName}"`);
          console.log(`   Title: ${fieldChart.title}`);
          console.log(`   Buffer size: ${fieldChart.buffer ? fieldChart.buffer.length : 'N/A'} bytes`);
        } else {
          console.log(`❌ No chart found for "${fieldName}"`);
        }
      } catch (error) {
        console.error(`❌ Error generating chart for "${fieldName}":`, error.message);
      }
    }
    
    // Test complete dashboard generation
    console.log('\n📊 Testing complete dashboard generation:');
    try {
      const { generateCompleteDashboardCharts } = require('./generateDashboardCharts');
      const result = await generateCompleteDashboardCharts(tasks);
      
      console.log(`✅ Complete dashboard generated`);
      console.log(`   Charts count: ${result.charts ? result.charts.length : 'N/A'}`);
      console.log(`   Stats:`, result.stats);
      
      // Check for number card charts
      const numberCardCharts = result.charts?.filter(c => 
        c && c.title && (
          c.title.includes('NBA SLA Delivery Time') ||
          c.title.includes('Scrub SLA') ||
          c.title.includes('Resend')
        )
      ) || [];
      
      console.log(`   Number card charts found: ${numberCardCharts.length}`);
      numberCardCharts.forEach(chart => {
        console.log(`     - ${chart.title}`);
      });
      
    } catch (error) {
      console.error('❌ Error generating complete dashboard:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNumberCards();
