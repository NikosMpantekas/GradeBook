// Simple script to generate a basic icon for Android
// Run this in the browser console to generate the icon data URLs
function generateIcon(size, background = '#3f51b5', text = 'G') {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.6}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);
  
  // For maskable icons, we need some padding (80% visible safe zone)
  if (size >= 512) {
    // Generate maskable version
    const maskableCanvas = document.createElement('canvas');
    maskableCanvas.width = size;
    maskableCanvas.height = size;
    const maskCtx = maskableCanvas.getContext('2d');
    
    // Draw bigger background to account for safe zone
    maskCtx.fillStyle = background;
    maskCtx.fillRect(0, 0, size, size);
    
    // Add text with some padding
    maskCtx.fillStyle = 'white';
    maskCtx.font = `bold ${size * 0.4}px Arial, sans-serif`;
    maskCtx.textAlign = 'center';
    maskCtx.textBaseline = 'middle';
    maskCtx.fillText(text, size / 2, size / 2);
    
    console.log(`Maskable Icon ${size}x${size}:`, maskableCanvas.toDataURL());
  }
  
  // Return data URL
  return canvas.toDataURL();
}

// Generate various icon sizes
console.log('Icon 192x192:', generateIcon(192));
console.log('Icon 512x512:', generateIcon(512));

// Generate app shortcut icons
console.log('Dashboard Icon:', generateIcon(192, '#4caf50', 'D'));
console.log('Grades Icon:', generateIcon(192, '#ff9800', 'G'));
console.log('Profile Icon:', generateIcon(192, '#f44336', 'P'));

// Instructions
console.log('Instructions:');
console.log('1. Copy each data URL');
console.log('2. Create a new image from the data URL (e.g., using an online converter)');
console.log('3. Save the image and replace the placeholder files in the public directory');
