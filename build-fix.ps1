# Build fix script for GradeBook
Set-Location -Path $PSScriptRoot\frontend
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install --save-dev cross-env

Write-Host "Updating .env file..." -ForegroundColor Cyan
"CI=false" | Out-File -FilePath .env -Encoding utf8 -Force

Write-Host "Building project..." -ForegroundColor Cyan
npm run build:win

Write-Host "Build process completed!" -ForegroundColor Green
