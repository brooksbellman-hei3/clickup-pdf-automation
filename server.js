const express = require('express');
const fs = require('fs');
const path = require('path');
const sendReport = require('./sendEmail');
const { generateTestChart } = require('./generateCharts');
const { testClickUpConnection } = require('./fetchData');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ClickUp PDF Reporter'
  });
});

// Debug info endpoint
app.get('/debug', async (req, res) => {
  const env = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    TIMEZONE: process.env.TIMEZONE,
    EMAIL_TO: process.env.EMAIL_TO,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    CLICKUP_TEAM_ID: process.env.CLICKUP_TEAM_ID,
    CLICKUP_LIST_ID: process.env.CLICKUP_LIST_ID,
    HAS_API_TOKEN: !!process.env.CLICKUP_API_TOKEN,
    HAS_SMTP_PASS: !!process.env.SMTP_PASS
  };
  
  // Test ClickUp connection
  const clickupConnected = await testClickUpConnection();
  
  res.json({ 
    environment: env,
    clickup_connection: clickupConnected,
    timestamp: new Date().toISOString()
  });
});

// Charts list endpoint
app.get('/charts-list', (req, res) => {
  const files = fs.readdirSync(__dirname).filter(f => f.startsWith('chart_') && f.endsWith('.png'));
  res.json({ 
    charts: files,
    count: files.length,
    timestamp: new Date().toISOString()
  });
});

// Test image generation endpoint (keep for testing)
app.get('/generate-test-image', async (req, res) => {
  try {
    console.log('🧪 Test image generation requested');
    const chart = await generateTestChart();
    
    if (!chart || !chart.base64Chart) {
      throw new Error('Chart generation returned empty result');
    }
    
    res.json({
      success: true,
      message: 'Test chart generated successfully',
      filename: chart.filename,
      fileSize: Buffer.from(chart.base64Chart, 'base64').length,
      timestamp: new Date().toISOString()
    });
    
    // Clean up the file
    if (fs.existsSync(chart.filePath)) {
      fs.unlinkSync(chart.filePath);
    }
    
  } catch (error) {
    console.error('❌ Test image generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Send email report endpoint (GET for easy browser testing)
app.get('/send-report', async (req, res) => {
  try {
    console.log('📧 Email report generation requested via GET');
    
    res.json({
      success: true,
      message: 'Email report generation started...',
      timestamp: new Date().toISOString()
    });
    
    // Send the report asynchronously so the response is immediate
    setImmediate(async () => {
      try {
        await sendReport();
        console.log('✅ Email report completed successfully');
      } catch (error) {
        console.error('❌ Email report failed:', error);
      }
    });
    
  } catch (error) {
    console.error('❌ Email report request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Send email report endpoint (POST for programmatic access)
app.post('/send-report', async (req, res) => {
  try {
    console.log('📧 Email report generation requested via POST');
    
    // Start the report generation
    const reportPromise = sendReport();
    
    // Return immediate response
    res.json({
      success: true,
      message: 'Email report generation started...',
      timestamp: new Date().toISOString()
    });
    
    // Wait for completion in background
    try {
      await reportPromise;
      console.log('✅ Email report completed successfully');
    } catch (error) {
      console.error('❌ Email report failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Email report request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual trigger endpoint (alias for backward compatibility)
app.post('/trigger-report', async (req, res) => {
  // Redirect to the new send-report endpoint
  return app.handle({ ...req, url: '/send-report' }, res);
});

// Root endpoint with instructions
app.get('/', (req, res) => {
  res.json({
    service: 'ClickUp PDF Reporter',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      debug: '/debug',
      charts: '/charts-list',
      testImage: '/generate-test-image',
      sendReport: {
        GET: '/send-report (for browser testing)',
        POST: '/send-report (for programmatic access)'
      },
      legacy: '/trigger-report (POST only)'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Express error:', error);
  res.status(500).json({
    success: false,
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: ['/', '/health', '/debug', '/charts-list', '/generate-test-image', '/send-report'],
    timestamp: new Date().toISOString()
  });
});

// Only start server if this file is run directly (not when required by index.js)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌐 ClickUp PDF Reporter Web Service listening on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Charts list: http://localhost:${PORT}/charts-list`);
    console.log(`🧪 Test image: http://localhost:${PORT}/generate-test-image`);
    console.log(`📧 Send report: http://localhost:${PORT}/send-report`);
    console.log(`🔧 Debug info: http://localhost:${PORT}/debug`);
  });
}

module.exports = app;
