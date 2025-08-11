const { fetchExecutiveDashboardData } = require('./fetchData');
const { generateCompleteDashboardCharts, calculateDashboardStats, generateNumberCardStats, findFieldByName, getFieldValue } = require('./generateDashboardCharts');

async function debugRealData() {
  console.log('🔍 Debugging real data issues...\n');
  
  try {
    // Fetch real data
    console.log('📊 Fetching real executive dashboard data...');
    const tasks = await fetchExecutiveDashboardData();
    console.log(`✅ Fetched ${tasks.length} tasks`);
    
    if (tasks.length === 0) {
      console.log('❌ No tasks found - cannot debug');
      return;
    }
    
    // Debug first few tasks to understand field structure
    console.log('\n🔍 Analyzing field structure...');
    const sampleTask = tasks[0];
    console.log(`📋 Sample task: "${sampleTask.name}"`);
    console.log(`📊 Custom fields count: ${sampleTask.custom_fields?.length || 0}`);
    
    if (sampleTask.custom_fields) {
      sampleTask.custom_fields.forEach((field, index) => {
        console.log(`\n   Field ${index + 1}: "${field.name}"`);
        console.log(`   Type: ${field.type}`);
        console.log(`   Value: ${JSON.stringify(field.value)}`);
        console.log(`   Value_text: ${JSON.stringify(field.value_text)}`);
        console.log(`   Type_config: ${JSON.stringify(field.type_config)}`);
        
        // Test our field finding and value extraction
        const extractedValue = getFieldValue(field);
        console.log(`   Extracted value: ${extractedValue}`);
      });
    }
    
    // Test field finding for specific fields
    console.log('\n🔍 Testing field finding for specific fields...');
    const testFields = ['Live Tracking Delivery', 'Replay Delivery', 'NBA SLA Delivery Time', 'Scrub SLA ', 'Resend'];
    
    testFields.forEach(fieldName => {
      const field = findFieldByName(sampleTask.custom_fields, fieldName);
      if (field) {
        console.log(`✅ Found "${fieldName}": ${field.name}`);
        const value = getFieldValue(field);
        console.log(`   Value: ${value}`);
      } else {
        console.log(`❌ Not found: "${fieldName}"`);
      }
    });
    
    // Test stats calculation
    console.log('\n📊 Testing stats calculation...');
    const stats = calculateDashboardStats(tasks);
    console.log('Stats result:', stats);
    
    // Test number card stats
    console.log('\n📊 Testing number card stats...');
    const numberCardStats = generateNumberCardStats(tasks);
    console.log('Number card stats:', numberCardStats);
    
    // Test complete dashboard generation
    console.log('\n📊 Testing complete dashboard generation...');
    const result = await generateCompleteDashboardCharts(tasks);
    console.log(`Generated ${result.charts.length} charts`);
    
    // Analyze chart titles and content
    console.log('\n📊 Analyzing generated charts...');
    result.charts.forEach((chart, index) => {
      console.log(`\nChart ${index + 1}: ${chart.title}`);
      
      if (chart.svg) {
        // Look for color information
        const hasColors = chart.svg.includes('fill="#') && !chart.svg.includes('fill="white"');
        console.log(`   Has colors: ${hasColors}`);
        
        // Look for label information
        if (chart.svg.includes('class="legend-text"')) {
          const labelMatch = chart.svg.match(/class="legend-text">([^<]+)</g);
          if (labelMatch) {
            const labels = labelMatch.map(match => match.replace('class="legend-text">', '').replace('<', ''));
            console.log(`   Labels: ${labels.join(', ')}`);
          }
        }
      }
    });
    
    // Check for Scrub SLA specifically
    console.log('\n🔍 Checking for Scrub SLA chart specifically...');
    const scrubSLACharts = result.charts.filter(chart => 
      chart.title.includes('Scrub SLA') || 
      chart.title.includes('Scrubbed SLA')
    );
    console.log(`Found ${scrubSLACharts.length} Scrub SLA charts`);
    scrubSLACharts.forEach(chart => {
      console.log(`   - ${chart.title}`);
    });
    
    console.log('\n🎯 Debug complete!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
  }
}

// Run the debug if this file is executed directly
if (require.main === module) {
  debugRealData().catch(console.error);
}

module.exports = { debugRealData };
