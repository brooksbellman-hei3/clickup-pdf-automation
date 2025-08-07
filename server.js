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
    service: 'clickup-pdf-reporter-web'
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
      'GET /generate-test-image - Generate test image'
    ]
  });
});

// Route to generate and serve a test red 400x400 PNG image
app.get('/generate-test-image', (req, res) => {
  try {
    // Try to use canvas if available
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 400, 400);
    
    // Add some text to verify fonts work
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Canvas Test', 200, 200);
    ctx.fillText('Fonts Working', 200, 250);

    const buffer = canvas.toBuffer('image/png');

    // Save the generated image file on the server
    const testImagePath = path.join(__dirname, 'test-canvas.png');
    fs.writeFileSync(testImagePath, buffer);

    res.set('Content-Type', 'image/png');
    res.send(buffer);
  } catch (error) {
    console.error('Canvas test failed:', error);
    
    // Fallback: generate a simple image with Sharp
    try {
      const sharp = require('sharp');
      
      const svg = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="red"/>
          <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="30" font-family="Arial">Sharp Test</text>
          <text x="50%" y="60%" text-anchor="middle" fill="white" font-size="20" font-family="Arial">Fallback Image</text>
        </svg>
      `;
      
      sharp(Buffer.from(svg))
        .png()
        .toBuffer()
        .then(buffer => {
          const testImagePath = path.join(__dirname, 'test-sharp.png');
          fs.writeFileSync(testImagePath, buffer);
          
          res.set('Content-Type', 'image/png');
          res.send(buffer);
        })
        .catch(sharpError => {
          console.error('Sharp fallback also failed:', sharpError);
          res.status(500).json({ error: 'Image generation failed', details: sharpError.message });
        });
        
    } catch (sharpError) {
      console.error('Sharp not available:', sharpError);
      res.status(500).json({ 
        error: 'Image generation not available', 
        canvas_error: error.message,
        sharp_error: sharpError.message 
      });
    }
  }
});

// Serve static files from the current directory
app.use('/charts', express.static(__dirname));

// Route to list all PNG chart files
app.get('/charts-list', (req, res) => {
  fs.readdir(__dirname, (err, files) => {
    if (err) {
      console.error('Error reading files:', err);
      return res.status(500).json({ error: 'Error reading files', details: err.message });
    }

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

    res.json({
      message: 'Available chart files',
      count: chartFiles.length,
      files: fileInfo,
      timestamp: new Date().toISOString()
    });
  });
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
  });
}

module.exports = app;
