const nodemailer = require('nodemailer');
const { fetchExecutiveDashboardData } = require('./fetchData');
const { generateExecutiveDashboardCharts } = require('./generateDashboardCharts');

async function sendDashboardEmail(dashboardUrl, dateRange = null) {
  console.log("📧 Sending executive dashboard email...");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.verify();
    console.log("✅ Email server connection verified");
  } catch (error) {
    console.error("❌ Email server verification failed:", error.message);
    throw error;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    timeZone: process.env.TIMEZONE || 'America/New_York',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Fetch latest data for email summary
  const tasks = await fetchExecutiveDashboardData();
  const totalTasks = tasks.length;
  const processedTasks = tasks.filter(task => task.custom_fields && task.custom_fields.length > 0).length;
  const successRate = totalTasks > 0 ? Math.round((processedTasks / totalTasks) * 100) : 0;

  // Generate sample charts for email preview
  const sampleCharts = await generateExecutiveDashboardCharts(tasks.slice(0, 50), dateRange);
  const chartImagesHtml = sampleCharts.slice(0, 3).map((chart, i) => `
    <div style="margin: 20px 0; text-align: center;">
      <h4 style="color: #2c3e50; margin-bottom: 10px;">${chart.title}</h4>
      <img src="cid:chart${i}@dashboard" alt="${chart.title}" style="max-width: 400px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
    </div>
  `).join('');

  const dateRangeText = dateRange 
    ? ` (${dateRange.start} to ${dateRange.end})`
    : '';

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 2.5rem; font-weight: 700;">🏀 Overall Season Review</h1>
        <p style="margin: 10px 0 0 0; font-size: 1.2rem; opacity: 0.9;">Hawkeye Innovations - NBA Operations Analytics</p>
      </div>

      <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          📊 Executive Dashboard Update${dateRangeText}
        </h2>
        
        <!-- Key Metrics at the Top -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 30px 0;">
          <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: bold; color: #2c3e50;">${totalTasks}</div>
            <div style="color: #7f8c8d; font-size: 0.9rem; text-transform: uppercase;">Total Tasks</div>
          </div>
          <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: bold; color: #2c3e50;">${processedTasks}</div>
            <div style="color: #7f8c8d; font-size: 0.9rem; text-transform: uppercase;">Processed</div>
          </div>
          <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: bold; color: #2c3e50;">${successRate}%</div>
            <div style="color: #7f8c8d; font-size: 0.9rem; text-transform: uppercase;">Success Rate</div>
          </div>
        </div>
        
        <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
          Your executive dashboard has been updated with the latest NBA operations data. 
          Click the button below to access the full interactive dashboard with real-time metrics and analytics.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1.1rem; transition: background 0.3s ease;">
            🚀 Access Executive Dashboard
          </a>
        </div>
      </div>

      ${sampleCharts.length > 0 ? `
        <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
          <h3 style="color: #2c3e50; margin-bottom: 20px;">📈 Sample Metrics</h3>
          ${chartImagesHtml}
        </div>
      ` : ''}

      <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
        <h3 style="color: #2c3e50; margin-bottom: 15px;">🔗 Quick Links</h3>
        <ul style="color: #555; line-height: 1.8;">
          <li><strong>Live Tracking Delivery:</strong> Monitor real-time delivery status</li>
          <li><strong>Scrubbed Delivery:</strong> Track scrubbing completion rates</li>
          <li><strong>Replay Delivery:</strong> View replay system performance</li>
          <li><strong>Operations P-Status:</strong> Check operational priorities</li>
          <li><strong>Software P-Status:</strong> Monitor software performance</li>
          <li><strong>Hardware P-Status:</strong> Track hardware status</li>
          <li><strong>NBA SLA Delivery Time:</strong> SLA compliance metrics</li>
          <li><strong>Scrub SLA:</strong> Scrubbing SLA performance</li>
          <li><strong>Resend:</strong> Resend operation statistics</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 0.9rem;">
        <p><strong>Date:</strong> ${currentDate}</p>
        <p><em>This dashboard is powered by Hawkeye Innovations.</em></p>
        <p>For technical support, contact your system administrator.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.EMAIL_TO,
    subject: `🏀 Executive Dashboard Update - ${currentDate}${dateRangeText}`,
    html: emailHtml,
    attachments: sampleCharts.slice(0, 3).map((chart, i) => ({
      filename: `dashboard_chart${i + 1}.png`,
      content: Buffer.from(chart.base64Chart, 'base64'),
      cid: `chart${i}@dashboard`
    }))
  });

  console.log("✅ Executive dashboard email sent successfully");
  
  // Clean up chart files
  sampleCharts.forEach(chart => {
    if (require('fs').existsSync(chart.filePath)) {
      require('fs').unlinkSync(chart.filePath);
    }
  });
}

// Function to send scheduled dashboard emails
async function sendScheduledDashboardEmail() {
  const dashboardUrl = process.env.DASHBOARD_URL || 'https://gleaguereporttest.onrender.com/dashboard';
  await sendDashboardEmail(dashboardUrl);
}

module.exports = { sendDashboardEmail, sendScheduledDashboardEmail };
