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

app.listen(PORT, () => {
  console.log(`✅ Canvas test server running on port ${PORT}`);
});
