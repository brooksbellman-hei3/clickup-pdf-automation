#!/bin/bash

# setup-project.sh - Script to organize the ClickUp PDF Automation project

echo "🚀 Setting up ClickUp PDF Automation project structure..."

# Create the proper file structure
echo "📁 Creating proper file structure..."

# Rename files that have .txt extensions
if [ -f "Dockerfile.txt" ]; then
    mv Dockerfile.txt Dockerfile
    echo "✅ Renamed Dockerfile.txt -> Dockerfile"
fi

if [ -f "docker_compose.txt" ]; then
    mv docker_compose.txt docker-compose.yml
    echo "✅ Renamed docker_compose.txt -> docker-compose.yml"
fi

if [ -f "env_example.sh" ]; then
    mv env_example.sh .env.example
    echo "✅ Renamed env_example.sh -> .env.example"
fi

if [ -f "deploy.txt" ]; then
    mv deploy.txt deploy.sh && chmod +x deploy.sh
    echo "✅ Renamed deploy.txt -> deploy.sh and made executable"
fi

# Fix JavaScript file naming issues
if [ -f "fetchdata.js" ] && [ ! -f "fetchData.js" ]; then
    echo "⚠️  Warning: fetchdata.js should be fetchData.js (capital D)"
    echo "   Your sendEmail.js imports './fetchData' but file is 'fetchdata.js'"
    echo "   Either rename fetchdata.js to fetchData.js or update the import"
fi

if [ -f "generatecharts.js" ] && [ ! -f "generateCharts.js" ]; then
    echo "⚠️  Warning: generatecharts.js should be generateCharts.js (capital C)"
    echo "   Your sendEmail.js imports './generateCharts' but file is 'generatecharts.js'"
    echo "   Either rename generatecharts.js to generateCharts.js or update the import"
fi

# Create necessary directories
mkdir -p logs
mkdir -p temp
echo "✅ Created logs/ and temp/ directories"

# Create .env file if it doesn't exist
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please edit .env file with your actual credentials"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ] && [ -f ".gitignore.txt" ]; then
    mv .gitignore.txt .gitignore
    echo "✅ Created .gitignore file"
fi

# Make sure package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found! This is required."
    exit 1
fi

# Check for all required JavaScript files
required_files=("scheduler.js" "sendEmail.js" "fetchData.js" "generateCharts.js" "createPDF.js")
missing_files=()

for file in "${required_files[@]}"; do
    # Check for the file with proper case
    if [ ! -f "$file" ]; then
        # Check for lowercase version
        lowercase_file=$(echo "$file" | tr '[:upper:]' '[:lower:]')
        if [ -f "$lowercase_file" ]; then
            echo "⚠️  Found $lowercase_file but expecting $file"
            echo "   Consider renaming for consistency"
        else
            missing_files+=("$file")
        fi
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo "❌ Missing required files:"
    printf '   - %s\n' "${missing_files[@]}"
    echo "   Please ensure all required files are present"
    exit 1
fi

echo ""
echo "📋 Current project structure:"
echo "├── package.json"
echo "├── Dockerfile"
echo "├── docker-compose.yml"
echo "├── .env.example"
echo "├── .env"
echo "├── .gitignore"
echo "├── deploy.sh"
echo "├── scheduler.js"
echo "├── sendEmail.js"
echo "├── fetchData.js (or fetchdata.js)"
echo "├── generateCharts.js (or generatecharts.js)"
echo "├── createPDF.js"
echo "├── logs/"
echo "└── temp/"

echo ""
echo "🎯 Next steps:"
echo "1. Edit .env file with your ClickUp and email credentials"
echo "2. Run 'npm install' to install dependencies"
echo "3. Test with 'npm run test'"
echo "4. Deploy with './deploy.sh local' or './deploy.sh render'"

echo ""
echo "✅ Project setup complete!"