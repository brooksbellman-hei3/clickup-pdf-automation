const express = require('express');
const { createCanvas } = require('canvas');
const path = require('path');
const fs = require('fs');

const app = express();

// Route to generate and serve a red 400x400 PNG image, also saves to disk as test.png
app.get('/generate-image', (req, res) => {
  const canvas = createCanvas(400, 400);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 400, 400);

  const buffer = canvas.toBuffer('image/png');

  // Save the generated image file on the server
  fs.writeFileSync(path.join(__dirname, 'test.png'), buffer);

  res.set('Content-Type', 'image/png');
  res.send(buffer);
});

// Serve static files from the current directory, accessible under /charts URL path
app.use('/charts', express.static(__dirname));

// Route to list all PNG chart files starting with "chart_" and link to view them
app.get('/charts-list', (req, res) => {
  fs.readdir(__dirname, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading files');
    }

    // Filter only PNG files with names starting with "chart_"
    const chartFiles = files.filter(f => f.startsWith('chart_') && f.endsWith('.png'));

    // Create clickable links for each chart file
    const links = chartFiles.map(f => `<li><a href="/charts/${f}" target="_blank">${f}</a></li>`).join('\n');

    // Send a simple HTML page listing the charts
    res.send(`
      <h1>Saved Chart Files</h1>
      <ul>
        ${links}
      </ul>
    `);
  });
});

// EXPORT the app but DO NOT start the server here
module.exports = app;
