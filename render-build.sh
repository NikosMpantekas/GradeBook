#!/bin/bash
# Build script specifically for Render deployment

echo "Installing dependencies in root"
npm install

echo "Setting up frontend build environment"
cd frontend

# Ensure CI=false is set for the build
echo "CI=false" > .env

echo "Installing frontend dependencies"
npm install

echo "Building frontend"
# Direct build command without using cross-env
CI=false npm run build

echo "Build completed successfully!"
cd ..
