# Use Node.js 20 Alpine as base image (better for Canvas)
FROM node:20-alpine

# Install dependencies needed for canvas and chart generation
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    python3 \
    make \
    g++ \
    pkgconfig \
    fontconfig \
    ttf-dejavu

# Set environment variables for Canvas
ENV PANGOCAIRO_BACKEND=fontconfig
ENV FONTCONFIG_PATH=/etc/fonts

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit

# Copy all application files
COPY *.js ./
COPY .env* ./

# Create temp directory for PDFs and charts
RUN mkdir -p /tmp && chmod 777 /tmp
RUN mkdir -p /usr/src/app/charts && chmod 777 /usr/src/app/charts

# Create logs directory
RUN mkdir -p logs && chmod 777 logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Expose port
EXPOSE 10000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Run the application
CMD ["node", "index.js"]
