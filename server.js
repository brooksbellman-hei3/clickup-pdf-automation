const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware for JSON parsing
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'clickup-pdf-reporter-web',
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '📊 ClickUp PDF Reporter Web Service',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health - Health check',
      'GET /charts-list - List generated charts',
      'GET /charts/:filename - View specific chart',
      'GET /generate-test-image - Generate test image',
      'POST /trigger-report - Manually trigger report generation',
      'GET /debug - Debug information'
    ]
  });
});

// Debug endpoint to check environment and modules
app.get('/debug', async (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      TIMEZONE: process.env.TIMEZONE,
      SEND_HOUR: process.env.SEND_HOUR
    },
    modules: {},
    directories: {},
    files_in_root: []
  };

  // Check module availability
  const modulesToCheck = ['sharp', 'chartjs-node-canvas', 'axios', 'nodemailer', 'node-cron'];
  
  for (const moduleName of modulesToCheck) {
    try {
      const module = require(moduleName);
      debugInfo.modules[moduleName] = '✅ Available';
    } catch (error) {
      debugInfo.modules[moduleName] = `❌ Error: ${error.message}`;
    }
  }

  // Check directories
  try {
    debugInfo.directories.current = __dirname;
    debugInfo.directories.temp_exists = fs.existsSync('/tmp');
    debugInfo.directories.logs_exists = fs.existsSync(path.join(__dirname, 'logs'));
    
    // List files in current directory
    debugInfo.files_in_root = fs.readdirSync(__dirname).filter(f => 
      f.endsWith('.png') || f.endsWith('.js') || f === 'package.json'
    );
  } catch (error) {
    debugInfo.directories.error = error.message;
  }

  res.json(debugInfo);
});

// Manual report trigger endpoint
app.post('/trigger-report', async (req, res) => {
  console.log('🚀 Manual report trigger requested');
  
  try {
    // Try to load and run the report function
    const sendReport = require('./sendEmail');
    
    res.json({
      message: '🔄 Report generation started',
      timestamp: new Date().toISOString(),
      note: 'Check logs for progress. Charts should appear at /charts-list when complete.'
    });

    // Run the report asynchronously
    sendReport().then(() => {
      console.log('✅ Manual report completed successfully');
    }).catch((error) => {
      console.error('❌ Manual report failed:', error);
    });

  } catch (error) {
    console.error('❌ Failed to trigger report:', error);
    res.status(500).json({
      error: 'Failed to trigger report',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route to generate and serve a test image
app.get('/generate-test-image', async (req, res) => {
  console.log('🧪 Test image generation requested');
  
  try {
    // Try to generate a test chart using our chart generation module
    const { generateTestChart } = require('./generateCharts');
    
    const testChart = await generateTestChart();
    
    if (testChart && testChart.base64Chart) {
      const buffer = Buffer.from(testChart.base64Chart, 'base64');
      
      res.set('Content-Type', 'image/png');
      res.set('Content-Length', buffer.length);
      res.send(buffer);
      
      console.log(`✅ Test chart generated and served: ${testChart.filename}`);
    } else {
      throw new Error('Test chart generation returned no data');
    }
    
  } catch (chartError) {
    console.error('Chart generation failed, trying Canvas fallback:', chartError);
    
    try {
      // Try Canvas fallback
      const { createCanvas } = require('canvas');
      const canvas = createCanvas(400, 400);
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#28a745';
      ctx.fillRect(0, 0, 400, 400);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Canvas Test', 200, 180);
      ctx.fillText('✅ Working!', 200, 220);

      const buffer = canvas.toBuffer('image/png');
      
      // Save test file
      const testPath = path.join(__dirname, 'test-canvas.png');
      fs.writeFileSync(testPath, buffer);

      res.set('Content-Type', 'image/png');
      res.send(buffer);
      
      console.log('✅ Canvas fallback test successful');
      
    } catch (canvasError) {
      console.error('Canvas also failed, trying Sharp fallback:', canvasError);
      
      try {
        // Sharp SVG fallback
        const sharp = require('sharp');
        
        const svg = `
          <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#17a2b8"/>
            <text x="50%" y="45%" text-anchor="middle" fill="white" font-size="30" font-family="Arial">Sharp Test</text>
            <text x="50%" y="55%" text-anchor="middle" fill="white" font-size="30" font-family="Arial">✅ Working!</text>
          </svg>
        `;
        
        const buffer = await sharp(Buffer.from(svg))
          .png()
          .toBuffer();
          
        // Save test file
        const testPath = path.join(__dirname, 'test-sharp.png');
        fs.writeFileSync(testPath, buffer);
        
        res.set('Content-Type', 'image/png');
        res.send(buffer);
        
        console.log('✅ Sharp fallback test successful');
        
      } catch (sharpError) {
        console.error('All image generation methods failed:', sharpError);
        res.status(500).json({ 
          error: 'All image generation methods failed',
          chart_error: chartError.message,
          canvas_error: canvasError.message,
          sharp_error: sharpError.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
});

// Serve static files from the current directory
app.use('/charts', express.static(__dirname));

// Route to list all PNG chart files
app.get('/charts-list', (req, res) => {
  try {
    const files = fs.readdirSync(__dirname);
    
    // Filter PNG files that look like charts
    const chartFiles = files.filter(f => 
      (f.startsWith('chart_') || f.startsWith('test-')) && f.endsWith('.png')
    );

    // Create response with file info
    const fileInfo = chartFiles.map(filename => {
      const filePath = path.join(__dirname, filename);
      try {
        const stats = fs.statSync(filePath);
        return {
          filename,
          url: `/charts/${filename}`,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      } catch (statError) {
        return {
          filename,
          url: `/charts/${filename}`,
          error: 'Could not read file stats'
        };
      }
    });

    console.log(`📊 Charts list requested - found ${chartFiles.length} files`);

    res.json({
      message: 'Available chart files',
      count: chartFiles.length,
      files: fileInfo,
      all_files: files.slice(0, 20), // Show first 20 files for debugging
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error reading chart files:', error);
    res.status(500).json({ 
      error: 'Error reading files', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found', 
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 ClickUp PDF Reporter Web Service listening on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Charts list: http://localhost:${PORT}/charts-list`);
    console.log(`🧪 Test image: http://localhost:${PORT}/generate-test-image`);
    console.log(`🔧 Debug info: http://localhost:${PORT}/debug`);
    console.log(`⚡ Manual trigger: POST http://localhost:${PORT}/trigger-report`);
  });
}

module.exports = app;
