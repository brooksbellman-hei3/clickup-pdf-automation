# ClickUp API Configuration
# Get your API token from: https://app.clickup.com/settings/apps
CLICKUP_API_TOKEN=pk_your_actual_token_here
CLICKUP_LIST_ID=901411784189
CLICKUP_TEAM_ID=your_team_id_here

# Email Configuration (Gmail SMTP)
# For Gmail, you'll need an "App Password" instead of your regular password
# Generate one at: https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_16_char_app_password_here

# Report Recipients (comma-separated for multiple)
EMAIL_TO=brooks.bellman@hawkeyeinnovations.com

# Scheduling Configuration
TIMEZONE=America/New_York
SEND_HOUR=9

# Production Environment
NODE_ENV=production
PORT=10000

# Optional: Custom PDF output directory (for local development)
# PDF_OUTPUT_DIR=/tmp

# Optional: Logging level (error, warn, info, debug)
LOG_LEVEL=info

# Executive Dashboard Configuration
# Set to 'true' to enable automatic dashboard emails
ENABLE_DASHBOARD_EMAILS=false
# Set to 'true' to enable weekly dashboard emails (Mondays at 9 AM)
ENABLE_WEEKLY_DASHBOARD_EMAILS=false
# Dashboard URL (will be auto-detected if not set)
DASHBOARD_URL=https://gleaguereporttest.onrender.com/dashboard
