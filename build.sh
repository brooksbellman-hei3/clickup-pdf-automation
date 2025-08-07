#!/bin/bash

# build.sh - Render build script for chart dependencies

set -e

echo "🔨 Starting Render build process..."

# Install system dependencies for Canvas and Sharp
echo "📦 Installing system dependencies..."

# Update package manager
apt-get update

# Install required packages for canvas, sharp, and fonts
apt-get install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libfontconfig1-dev \
    pkg-config \
    python3 \
    make \
    g++ \
    fonts-dejavu-core \
    fontconfig

# Set font configuration
fc-cache -f -v

# Set environment variables for canvas
export PANGOCAIRO_BACKEND=fontconfig
export FONTCONFIG_PATH=/etc/fonts

echo "✅ System dependencies installed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p /tmp/charts
mkdir -p logs
chmod 777 /tmp/charts
chmod 777 logs

echo "✅ Build script completed successfully"
