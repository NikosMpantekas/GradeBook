const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'admin', 'ManageClasses.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix student chips display
content = content.replace(
  /label={`\${option\.firstName} \${option\.lastName}`}/g, 
  'label={`${option.firstName || ""} ${option.lastName || ""}`.trim() || option.email || "User"}'
);

// Save the fixed file
fs.writeFileSync(filePath, content, 'utf8');

console.log('ManageClasses.js has been updated with fixed chip labels');
