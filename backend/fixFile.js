const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'controllers', 'userController.js');
let content = fs.readFileSync(filePath, 'utf8');

// Ensure the file ends with a proper module.exports and a single newline
// First, find the module.exports section
const moduleExportsRegex = /module\.exports\s*=\s*{[\s\S]*?};/;
const moduleExportsMatch = content.match(moduleExportsRegex);

if (moduleExportsMatch) {
  // Extract everything before the module.exports section
  const contentBeforeExports = content.slice(0, moduleExportsMatch.index);
  
  // Clean up the module.exports section
  const cleanedExports = `module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  updateProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  createAdminAccount,
  createUserByAdmin,
  directDatabaseFix,
  getStudents,
  getStudentsBySubject,
  getUsersByRole,
};
`;

  // Combine everything
  const newContent = contentBeforeExports + cleanedExports;
  
  // Write back to the file
  fs.writeFileSync(filePath, newContent);
  console.log('File structure fixed successfully!');
} else {
  console.error('Could not find module.exports section in the file.');
}
