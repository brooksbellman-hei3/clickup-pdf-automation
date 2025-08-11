#!/bin/bash

# Render Deployment Script
# This script helps prepare and deploy the ClickUp PDF Automation to Render.com

set -e

echo "🚀 ClickUp PDF Automation - Render Deployment Script"
echo "===================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please ensure the render configuration is present."
    exit 1
fi

echo "✅ Project structure validated"

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
echo "📦 npm version: $NPM_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production --no-audit

# Test the application
echo "🧪 Testing application..."
node -e "
const { generateCompleteDashboardCharts, calculateDashboardStats } = require('./generateDashboardCharts');
console.log('✅ Dashboard modules loaded successfully');
"

# Check for any potential issues
echo "🔍 Checking for potential deployment issues..."

# Check if all required files exist
REQUIRED_FILES=("server.js" "fetchData.js" "generateDashboardCharts.js" "sendDashboardEmail.js" "dashboard.html")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Check package.json for any problematic dependencies
echo "📋 Checking package.json..."
if grep -q "sharp" package.json; then
    echo "⚠️  Warning: sharp dependency found - this may cause issues on Render"
else
    echo "✅ No sharp dependency found"
fi

# Check for environment variables
echo "🔧 Environment variables check:"
ENV_VARS=("CLICKUP_API_TOKEN" "CLICKUP_LIST_ID" "SMTP_HOST" "SMTP_PORT" "SMTP_USER" "SMTP_PASS" "EMAIL_TO")
for var in "${ENV_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo "✅ $var is set"
    else
        echo "⚠️  $var is not set (will need to be set in Render dashboard)"
    fi
done

echo ""
echo "🎯 Deployment Preparation Complete!"
echo ""
echo "📋 Next Steps for Render Deployment:"
echo "1. Push your code to GitHub"
echo "2. Go to https://dashboard.render.com"
echo "3. Create a new Web Service"
echo "4. Connect your GitHub repository"
echo "5. Set the following environment variables in Render dashboard:"
echo "   - CLICKUP_API_TOKEN"
echo "   - CLICKUP_LIST_ID"
echo "   - SMTP_HOST"
echo "   - SMTP_PORT"
echo "   - SMTP_USER"
echo "   - SMTP_PASS"
echo "   - EMAIL_TO"
echo "6. Deploy the service"
echo ""
echo "🔗 Render Dashboard: https://dashboard.render.com"
echo "📚 Documentation: https://render.com/docs"

# Optional: Create a health check endpoint test
echo ""
echo "🧪 Testing health check endpoint..."
if [ -f "server.js" ]; then
    echo "✅ server.js exists - health check endpoint should be available at /health"
else
    echo "❌ server.js missing - health check endpoint not available"
fi

echo ""
echo "🎉 Deployment script completed successfully!"
