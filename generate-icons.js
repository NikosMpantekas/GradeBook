const fs = require('fs');
const { createCanvas } = require('canvas');

// Function to generate a simple icon
function generateIcon(size, backgroundColor = '#3f51b5', textColor = 'white', text = 'G') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);
  
  // Draw text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${Math.floor(size * 0.6)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);
  
  return canvas.toBuffer('image/png');
}

// Create the frontend/public directory if it doesn't exist
const publicDir = './frontend/public';
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate the icons
const icons = [
  { name: 'logo192.png', size: 192 },
  { name: 'logo512.png', size: 512 },
  { name: 'favicon.ico', size: 64 }
];

icons.forEach(icon => {
  const buffer = generateIcon(icon.size);
  fs.writeFileSync(`${publicDir}/${icon.name}`, buffer);
  console.log(`Created ${icon.name}`);
});

console.log('Icon generation complete!');
