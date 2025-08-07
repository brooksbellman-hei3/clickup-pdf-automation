#!/bin/bash

# Exit on any error
set -e

# Install required packages
apt-get update
apt-get install -y \
  fonts-dejavu-core \
  fonts-dejavu-extra \
  libnss3 \
  libx11-dev \
  libxkbcommon-dev \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpangocairo-1.0-0 \
  libpangoft2-1.0-0 \
  libgtk-3-0 \
  libxss1 \
  libxshmfence1 \
  --no-install-recommends
