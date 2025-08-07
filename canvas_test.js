const { createCanvas } = require('canvas');
const fs = require('fs');

const canvas = createCanvas(400, 400);
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'red';
ctx.fillRect(0, 0, 400, 400);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('test.png', buffer);

console.log('✅ test.png generated');
