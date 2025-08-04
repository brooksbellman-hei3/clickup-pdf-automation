require("dotenv").config();
const cron = require("node-cron");
const sendReport = require("./sendEmail");

console.log("⏰ ClickUp Report Scheduler started...");
console.log(`🌍 Timezone: ${process.env.TIMEZONE || 'America/New_York'}`);
console.log(`📧 Email recipient: ${process.env.EMAIL_TO}`);
console.log(`📋 ClickUp List ID: ${process.env.CLICKUP_LIST_ID}`);

// Validate environment variables
function validateEnvironment() {
  const required = [
    'CLICKUP_API_TOKEN',
    'CLICKUP_LIST_ID',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_TO'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
  
  console.log("✅ All required environment variables are set");
}

// Test run function
async function testRun() {
  console.log("🧪 Running test report...");
  try {
    await sendReport();
    console.log("✅ Test report completed successfully!");
  } catch (error) {
    console.error("❌ Test report failed:", error.message);
  }
}

// Main scheduling logic
function startScheduler() {
  validateEnvironment();
  
  // Production schedule: Daily at specified hour
  const sendHour = parseInt(process.env.SEND_HOUR) || 9;
  const cronExpression = `0 ${sendHour} * * *`; // Daily at specified hour
  
  console.log(`📅 Scheduling daily reports at ${sendHour}:00`);
  
  cron.schedule(cronExpression, async () => {
    console.log(`📤 Running scheduled ClickUp report job at ${new Date().toLocaleString()}`);
    try {
      await sendReport();
      console.log("✅ Scheduled report sent successfully!");
    } catch (error) {
      console.error("❌ Scheduled report failed:", error.message);
      console.error(error.stack);
    }
  }, {
    timezone: process.env.TIMEZONE || "America/New_York"
  });
  
  // Optional: Test schedule (every 2 minutes) - uncomment for testing
  console.log("🧪 Test mode: Reports every 2 minutes");
  cron.schedule("*/2 * * * *", async () => {
     console.log("📤 Running test ClickUp report job...");
     try {
       await sendReport();
       console.log("✅ Test report sent!");
     } catch (error) {
       console.error("❌ Test report failed:", error.message);
     }
   }, {
     timezone: process.env.TIMEZONE || "America/New_York"
   });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  // Check if we should run a test
  if (process.argv.includes('--test')) {
    testRun();
  } else {
    startScheduler();
    
    // Keep the process alive
    console.log("🟢 Scheduler is running... Press Ctrl+C to stop");
    setInterval(() => {
      // Heartbeat log every hour
      console.log(`💓 Scheduler heartbeat: ${new Date().toLocaleString()}`);
    }, 60 * 60 * 1000);
  }
}

module.exports = { startScheduler, testRun };


// ✅ Add this AFTER module.exports
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Scheduler is running!'));

app.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Web service is listening`);
});
