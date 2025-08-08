require("dotenv").config();
const { fetchExecutiveDashboardData } = require('./fetchData');
const { generateExecutiveDashboardCharts } = require('./generateDashboardCharts');
const { sendDashboardEmail } = require('./sendDashboardEmail');

async function testDashboard() {
  console.log("🧪 Testing Executive Dashboard functionality...");
  
  try {
    // Test 1: Fetch executive dashboard data
    console.log("\n📊 Test 1: Fetching executive dashboard data...");
    const tasks = await fetchExecutiveDashboardData();
    console.log(`✅ Fetched ${tasks.length} tasks from executive dashboard list`);
    
    if (tasks.length === 0) {
      console.log("⚠️ No tasks found - this might be expected for a new list");
    } else {
      // Test 2: Generate charts
      console.log("\n🎨 Test 2: Generating executive dashboard charts...");
      const charts = await generateExecutiveDashboardCharts(tasks);
      console.log(`✅ Generated ${charts.length} charts`);
      
      // Test 3: Test dashboard email (optional)
      if (process.env.TEST_DASHBOARD_EMAIL === 'true') {
        console.log("\n📧 Test 3: Testing dashboard email...");
        const dashboardUrl = process.env.DASHBOARD_URL || 'https://gleaguereporttest.onrender.com/dashboard';
        await sendDashboardEmail(dashboardUrl);
        console.log("✅ Dashboard email test completed");
      } else {
        console.log("\n📧 Test 3: Skipped (set TEST_DASHBOARD_EMAIL=true to test)");
      }
    }
    
    console.log("\n✅ All dashboard tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Dashboard test failed:", error);
    console.error(error.stack);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDashboard();
}

module.exports = { testDashboard };
