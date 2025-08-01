# ClickUp PDF Automation 📊

Automated daily reporting system that fetches task data from ClickUp, generates insightful charts, creates PDF reports, and emails them to specified recipients.

## Features ✨

- **📋 ClickUp Integration**: Fetches tasks from specified ClickUp lists
- **📊 Multiple Chart Types**: Status distribution, priority analysis, assignee workload, creation trends
- **📄 PDF Generation**: Professional PDF reports with multiple charts
- **📧 Email Delivery**: Automated email delivery with HTML formatting
- **⏰ Flexible Scheduling**: Daily reports at customizable times
- **🐳 Multi-Platform Deployment**: Supports both Render.com and local Docker/Corretto
- **🔍 Enhanced Error Handling**: Comprehensive logging and error recovery
- **🧪 Testing Tools**: Built-in test functionality for debugging

## Quick Start 🚀

### Prerequisites

- Node.js 18+
- ClickUp API token
- Gmail account with App Password (for email delivery)

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd clickup-pdf-automation
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Test the Setup

```bash
npm run test
```

## Deployment Options 🌐

### Option 1: Render.com (Cloud) ☁️

Perfect for production use with automatic scaling and 24/7 availability.

#### Steps:

1. **Prepare Repository**
   ```bash
   npm run deploy:render
   ```

2. **GitHub Setup**
   - Push your code to GitHub
   - Ensure `render.yaml` is in your repository

3. **Render Configuration**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Create new **Worker Service**
   - Connect your GitHub repository
   - Set environment variables in Render dashboard

4. **Environment Variables in Render**
   ```
   CLICKUP_API_TOKEN=pk_your_token_here
   CLICKUP_LIST_ID=your_list_id
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your_app_password
   EMAIL_TO=recipient@company.com
   TIMEZONE=America/New_York
   SEND_HOUR=9
   ```

5. **Deploy**
   - Click "Deploy" in Render dashboard
   - Monitor logs for successful startup

### Option 2: Local Docker with Amazon Corretto 🐳

Ideal for on-premises deployment or local development.

#### Prerequisites:
- Docker and Docker Compose installed
- Amazon Corretto environment (handled by Docker)

#### Steps:

1. **Quick Deploy**
   ```bash
   npm run deploy:local
   ```

2. **Manual Deployment**
   ```bash
   # Build the image
   docker build -t clickup-pdf-reporter .
   
   # Run with docker-compose
   docker-compose up -d
   ```

3. **Management Commands**
   ```bash
   # View logs
   docker-compose logs -f
   
   # Stop service
   docker-compose down
   
   # Restart service
   docker-compose restart
   
   # Check status
   docker-compose ps
   ```

## Configuration Guide ⚙️

### ClickUp API Setup

1. **Get API Token**
   - Go to [ClickUp Settings > Apps](https://app.clickup.com/settings/apps)
   - Generate new API token
   - Copy the token starting with `pk_`

2. **Find List ID**
   - Open your ClickUp list in browser
   - Look at URL: `https://app.clickup.com/space/[ID]/list/[LIST_ID]`
   - Use the LIST_ID number

### Gmail SMTP Setup

1. **Enable 2FA** (if not already enabled)
2. **Generate App Password**
   - Go to [Google Account Settings](https://myaccount.google.com/apppasswords)
   - Generate app password for "Mail"
   - Use this password in `SMTP_PASS`

### Scheduling Configuration

```bash
# Time zone (see: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
TIMEZONE=America/New_York

# Hour to send report (24-hour format)
SEND_HOUR=9  # 9 AM
```

## Troubleshooting 🔧

### Common Issues

#### 401 Authentication Error

**Problem**: `❌ Error fetching ClickUp tasks: Status: 401`

**Solutions**:
1. **Verify API Token Format**
   - Must start with `pk_`
   - No extra spaces or quotes
   
2. **Check Token Permissions**
   - Token must have access to the specific list
   - Try accessing list in ClickUp web interface with same account

3. **Test API Connection**
   ```bash
   npm run test
   ```

#### Email Delivery Issues

**Problem**: Email not sending or authentication errors

**Solutions**:
1. **Use App Password** (not regular Gmail password)
2. **Check SMTP Settings**:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```
3. **Verify Gmail Account** has 2FA enabled

#### Docker Issues

**Problem**: Container fails to start

**Solutions**:
1. **Check Docker Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **View Container Logs**
   ```bash
   docker-compose logs clickup-reporter
   ```

3. **Rebuild Image**
   ```bash
   docker-compose down
   docker build -t clickup-pdf-reporter . --no-cache
   docker-compose up -d
   ```

### Debug Mode

Enable detailed logging by running test mode:

```bash
npm run test
```

This will:
- Test ClickUp API connection
- Validate environment variables
- Generate a sample report
- Attempt email delivery

## Chart Types Generated 📈

The system generates four types of charts:

1. **Task Status Distribution** - Pie chart showing task completion status
2. **Priority Analysis** - Distribution of task priorities
3. **Assignee Workload** - Tasks assigned to each team member
4. **Creation Trend** - Line chart showing task creation over last 30 days

## File Structure 📁

```
clickup-pdf-automation/
├── scheduler.js           # Main scheduling logic
├── sendEmail.js          # Report generation and email sending
├── fetchData.js          # ClickUp API integration
├── generateCharts.js     # Chart generation utilities
├── createPDF.js          # PDF compilation
├── package.json          # Dependencies and scripts
├── Dockerfile           # Amazon Corretto container config
├── docker-compose.yml   # Local deployment config
├── render.yaml          # Render.com deployment config
├── deploy.sh           # Deployment automation script
├── .env.example        # Environment variable template
└── README.md           # This file
```

## Environment Variables Reference 📋

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CLICKUP_API_TOKEN` | ClickUp API token | `pk_123...` | ✅ |
| `CLICKUP_LIST_ID` | ClickUp list ID | `141714` | ✅ |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` | ✅ |
| `SMTP_PORT` | SMTP server port | `587` | ✅ |
| `SMTP_USER` | Email username | `user@gmail.com` | ✅ |
| `SMTP_PASS` | Email password/app password | `app_password` | ✅ |
| `EMAIL_TO` | Report recipient(s) | `team@company.com` | ✅ |
| `TIMEZONE` | Timezone for scheduling | `America/New_York` | ❌ |
| `SEND_HOUR` | Hour to send reports (24h) | `9` | ❌ |

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License 📄

MIT License - see LICENSE file for details.

## Support 🆘

If you encounter issues:

1. Check the troubleshooting section above
2. Run `npm run test` for diagnostic information
3. Check container/application logs
4. Create an issue with:
   - Error messages
   - Environment details
   - Steps to reproduce

## Roadmap 🗺️

- [ ] Web dashboard for report viewing
- [ ] Multiple ClickUp workspace support
- [ ] Custom chart configurations
- [ ] Slack integration
- [ ] Advanced filtering options
- [ ] Historical report storage