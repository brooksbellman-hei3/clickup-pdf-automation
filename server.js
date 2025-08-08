const express = require('express');
const fs = require('fs');
const path = require('path');
const sendReport = require('./sendEmail');
const { generateTestChart } = require('./generateCharts');
const { testClickUpConnection } = require('./fetchData');
const { fetchExecutiveDashboardData, filterTasksByDateRange } = require('./fetchData');
const { generateExecutiveDashboardCharts, generateCompleteDashboardCharts } = require('./generateDashboardCharts');
const { sendDashboardEmail } = require('./sendDashboardEmail');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());

// Root endpoint with service info
app.get('/', (req, res) => {
  try {
    res.json({
      service: 'ClickUp PDF Reporter & Executive Dashboard',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        debug: '/debug',
        charts: '/charts-list',
        sendReport: '/send-report',
        dashboard: '/dashboard',
        dashboardAPI: '/api/dashboard/all-time',
        sendDashboardEmail: '/send-dashboard-email'
      }
    });
  } catch (error) {
    console.error('❌ Root endpoint failed:', error);
    res.status(500).json({
      service: 'ClickUp PDF Reporter & Executive Dashboard',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'ClickUp PDF Reporter & Executive Dashboard'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      service: 'ClickUp PDF Reporter & Executive Dashboard'
    });
  }
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

// NEW: Debug stats endpoint
app.get('/debug-stats', async (req, res) => {
  try {
    console.log('🔍 Debug stats endpoint called');
    
    const tasks = await fetchExecutiveDashboardData();
    console.log(`📊 Fetched ${tasks.length} tasks for debug`);
    
    if (tasks.length === 0) {
      return res.json({
        success: false,
        error: 'No tasks found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Analyze first task structure
    const firstTask = tasks[0];
    const taskStructure = {
      task_name: firstTask.name,
      custom_fields: firstTask.custom_fields?.map(field => ({
        name: field.name,
        value: field.value,
        value_text: field.value_text,
        type: field.type
      })) || []
    };
    
    // Calculate stats
    const { calculateDashboardStats } = require('./generateDashboardCharts');
    const stats = calculateDashboardStats(tasks);
    
    // Debug specific fields
    const fieldAnalysis = {
      liveTracking: tasks.map(task => {
        const field = task.custom_fields?.find(f => 
          f.name === 'Live Tracking Delivery' || f.name === 'live tracking delivery'
        );
        return {
          task: task.name,
          value: field?.value,
          value_text: field?.value_text,
          field_name: field?.name
        };
      }).filter(item => item.value || item.value_text).slice(0, 5),
      
      replay: tasks.map(task => {
        const field = task.custom_fields?.find(f => 
          f.name === 'Replay Delivery' || f.name === 'replay delivery'
        );
        return {
          task: task.name,
          value: field?.value,
          value_text: field?.value_text,
          field_name: field?.name
        };
      }).filter(item => item.value || item.value_text).slice(0, 5),
      
      sla: tasks.map(task => {
        const field = task.custom_fields?.find(f => 
          f.name === 'NBA SLA Delivery Time' || f.name === 'nba sla delivery time'
        );
        return {
          task: task.name,
          value: field?.value,
          value_text: field?.value_text,
          field_name: field?.name
        };
      }).filter(item => item.value || item.value_text).slice(0, 5),
      
      resend: tasks.map(task => {
        const field = task.custom_fields?.find(f => 
          f.name === 'Resend' || f.name === 'resend'
        );
        return {
          task: task.name,
          value: field?.value,
          value_text: field?.value_text,
          field_name: field?.name
        };
      }).filter(item => item.value || item.value_text).slice(0, 5)
    };
    
    res.json({
      success: true,
      total_tasks: tasks.length,
      stats: stats,
      task_structure: taskStructure,
      field_analysis: fieldAnalysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Debug stats failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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

// Dashboard endpoint
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API endpoint for all-time dashboard charts (Row 1 only)
app.get('/api/dashboard/all-time', async (req, res) => {
  try {
    console.log('📊 Generating all-time executive dashboard charts...');
    
    const tasks = await fetchExecutiveDashboardData();
    if (tasks.length === 0) {
      return res.json({
        success: false,
        error: 'No tasks found',
        charts: [],
        stats: { totalTasks: 0, processedTasks: 0, successRate: 0, lastUpdated: new Date().toISOString() }
      });
    }
    
    const charts = await generateExecutiveDashboardCharts(tasks);
    
    // Calculate stats
    const totalTasks = tasks.length;
    const processedTasks = tasks.filter(task => task.custom_fields && task.custom_fields.length > 0).length;
    const successRate = totalTasks > 0 ? Math.round((processedTasks / totalTasks) * 100) : 0;
    
    res.json({
      success: true,
      charts: charts,
      stats: {
        totalTasks,
        processedTasks,
        successRate,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating all-time dashboard charts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// NEW: API endpoint for complete dashboard (18 charts - both rows)
app.get('/api/dashboard/complete', async (req, res) => {
  try {
    const { specificDate } = req.query;
    console.log('📊 Generating complete executive dashboard (18 charts)...');
    
    const tasks = await fetchExecutiveDashboardData();
    if (tasks.length === 0) {
      return res.json({
        success: false,
        error: 'No tasks found',
        charts: [],
        stats: { totalTasks: 0, processedTasks: 0, successRate: 0, lastUpdated: new Date().toISOString() }
      });
    }
    
    const result = await generateCompleteDashboardCharts(tasks, specificDate);
    
    res.json({
      success: true,
      charts: result.charts,
      specificDate: specificDate,
      stats: result.stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error generating complete dashboard charts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API endpoint for date-range dashboard charts
app.post('/api/dashboard/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }
    
    console.log(`📊 Generating date-range executive dashboard charts: ${startDate} to ${endDate}`);
    
    const allTasks = await fetchExecutiveDashboardData();
    if (allTasks.length === 0) {
      return res.json({
        success: false,
        error: 'No tasks found',
        charts: [],
        stats: { totalTasks: 0, processedTasks: 0, successRate: 0, lastUpdated: new Date().toISOString() }
      });
    }
    
    const filteredTasks = filterTasksByDateRange(allTasks, startDate, endDate);
    const charts = await generateExecutiveDashboardCharts(filteredTasks, { start: startDate, end: endDate });
    
    // Calculate stats
    const totalTasks = allTasks.length;
    const processedTasks = filteredTasks.length;
    const successRate = totalTasks > 0 ? Math.round((processedTasks / totalTasks) * 100) : 0;
    
    res.json({
      success: true,
      charts: charts,
      stats: {
        totalTasks,
        processedTasks,
        successRate,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating date-range dashboard charts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// NEW: Send dashboard email endpoint
app.post('/send-dashboard-email', async (req, res) => {
  try {
    console.log('📧 Dashboard email generation requested');
    
    const dashboardUrl = process.env.DASHBOARD_URL || 'https://gleaguereporttest.onrender.com/dashboard';
    
    res.json({
      success: true,
      message: 'Dashboard email generation started...',
      timestamp: new Date().toISOString()
    });
    
    // Send the dashboard email asynchronously
    setImmediate(async () => {
      try {
        await sendDashboardEmail(dashboardUrl);
        console.log('✅ Dashboard email completed successfully');
      } catch (error) {
        console.error('❌ Dashboard email failed:', error);
      }
    });
    
  } catch (error) {
    console.error('❌ Dashboard email request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Send dashboard email endpoint (GET for easy browser testing)
app.get('/send-dashboard-email', async (req, res) => {
  try {
    console.log('📧 Dashboard email generation requested via GET');
    
    const dashboardUrl = process.env.DASHBOARD_URL || 'https://gleaguereporttest.onrender.com/dashboard';
    
    res.json({
      success: true,
      message: 'Dashboard email generation started...',
      timestamp: new Date().toISOString()
    });
    
    // Send the dashboard email asynchronously
    setImmediate(async () => {
      try {
        await sendDashboardEmail(dashboardUrl);
        console.log('✅ Dashboard email completed successfully');
      } catch (error) {
        console.error('❌ Dashboard email failed:', error);
      }
    });
    
  } catch (error) {
    console.error('❌ Dashboard email request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Send dashboard email with specific date
app.get('/send-dashboard-email/:date', async (req, res) => {
  try {
    const specificDate = req.params.date;
    console.log(`📧 Dashboard email generation requested for date: ${specificDate}`);
    
    const dashboardUrl = process.env.DASHBOARD_URL || 'https://gleaguereporttest.onrender.com/dashboard';
    
    res.json({
      success: true,
      message: `Dashboard email generation started for ${specificDate}...`,
      timestamp: new Date().toISOString()
    });
    
    // Send the dashboard email asynchronously
    setImmediate(async () => {
      try {
        await sendDashboardEmail(dashboardUrl, { start: specificDate, end: specificDate });
        console.log('✅ Dashboard email completed successfully');
      } catch (error) {
        console.error('❌ Dashboard email failed:', error);
      }
    });
    
  } catch (error) {
    console.error('❌ Dashboard email request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint with instructions
app.get('/', (req, res) => {
  res.json({
    service: 'ClickUp PDF Reporter & Executive Dashboard',
    version: '2.0.0',
    endpoints: {
      dashboard: '/dashboard (Executive Dashboard)',
      health: '/health',
      debug: '/debug',
      charts: '/charts-list',
      testImage: '/generate-test-image',
      sendReport: {
        GET: '/send-report (for browser testing)',
        POST: '/send-report (for programmatic access)'
      },
      sendDashboardEmail: {
        GET: '/send-dashboard-email (for browser testing)',
        POST: '/send-dashboard-email (for programmatic access)'
      },
      api: {
        allTime: '/api/dashboard/all-time (GET)',
        dateRange: '/api/dashboard/date-range (POST)'
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
