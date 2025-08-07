const express = require('express');
const { createCanvas } = require('canvas');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/generate-image', (req, res) => {
  const canvas = createCanvas(400, 400);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 400, 400);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'test.png'), buffer);

  res.set('Content-Type', 'image/png');
  res.send(buffer);
});

// Serve static files (including charts)
app.use('/charts', express.static(__dirname));

// New route: list all chart PNG files with clickable links
app.get('/charts-list', (req, res) => {
  fs.readdir(__dirname, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading files');
    }

    // Filter only chart PNG files
    const chartFiles = files.filter(f => f.startsWith('chart_') && f.endsWith('.png'));

    const links = chartFiles.map(f => `<li><a href="/charts/${f}" target="_blank">${f}</a></li>`).join('\n');

    res.send(`
      <h1>Saved Chart Files</h1>
      <ul>
        ${links}
      </ul>
    `);
  });
});

app.listen(PORT, () => {
  console.log(`✅ Canvas test server running on port ${PORT}`);
});
