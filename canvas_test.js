const express = require('express');
const { createCanvas } = require('canvas');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Route to generate and return an image
app.get('/generate-image', (req, res) => {
  const canvas = createCanvas(400, 400);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 400, 400);

  const buffer = canvas.toBuffer('image/png');

  // Optional: save it to disk (useful for debugging)
  const filePath = path.join(__dirname, 'test.png');
  fs.writeFileSync(filePath, buffer);

  // Send the image directly to browser
  res.set('Content-Type', 'image/png');
  res.send(buffer);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
