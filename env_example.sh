# ClickUp API Configuration
# Get your API token from: https://app.clickup.com/settings/apps
CLICKUP_API_TOKEN=pk_your_token_here
CLICKUP_LIST_ID=your_list_id_here

# Email Configuration (Gmail SMTP)
# For Gmail, you'll need an "App Password" instead of your regular password
# Generate one at: https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password_here

# Report Recipients (comma-separated for multiple)
EMAIL_TO=recipient@company.com

# Scheduling Configuration
TIMEZONE=America/New_York
SEND_HOUR=9

# Optional: Custom PDF output directory (for local development)
# PDF_OUTPUT_DIR=/tmp

# Optional: Logging level (error, warn, info, debug)
# LOG_LEVEL=info