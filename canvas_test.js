const express = require('express');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const filePath = path.join(__dirname, 'test.png');

async function generateImage() {
  const canvas = createCanvas(400, 400);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 400, 400);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);

  console.log('✅ test.png generated');
}

app.get('/test-image', (req, res) => {
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Image not found, generate it first.');
  }
});

app.get('/generate-image', async (req, res) => {
  await generateImage();
  res.send('Image generated! You can now access /test-image');
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  // Optionally generate image on start:
  generateImage();
});
