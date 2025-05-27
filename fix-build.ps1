# Comprehensive build fix script for GradeBook
Write-Host "Starting comprehensive build fix..." -ForegroundColor Cyan

# Set location to project root
Set-Location -Path $PSScriptRoot

# Fix 1: Install required dependencies
Write-Host "Installing required dependencies..." -ForegroundColor Cyan
Set-Location -Path .\frontend
npm install --save-dev cross-env
npm install --save date-fns
npm install --save @mui/x-date-pickers
npm install --save recharts

# Fix 2: Update package.json scripts
Write-Host "Updating package.json scripts..." -ForegroundColor Cyan
$packageJson = Get-Content -Path .\package.json -Raw | ConvertFrom-Json
$packageJson.scripts.build = "cross-env GENERATE_SOURCEMAP=false CI=false react-scripts build"
$packageJson.scripts.'build:win' = "cross-env GENERATE_SOURCEMAP=false CI=false react-scripts build"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path .\package.json

# Fix 3: Update .env file
Write-Host "Creating .env file..." -ForegroundColor Cyan
"SKIP_PREFLIGHT_CHECK=true`nCI=false" | Out-File -FilePath .\.env -Encoding utf8 -Force

# Fix 4: Clean build directory and node_modules (optional)
Write-Host "Cleaning up..." -ForegroundColor Cyan
if (Test-Path -Path .\build) {
    Remove-Item -Path .\build -Recurse -Force
}

# Fix 5: Run build with extra flags
Write-Host "Building project..." -ForegroundColor Cyan
npm run build

Write-Host "Build fix process completed!" -ForegroundColor Green
Set-Location -Path $PSScriptRoot
