const nodemailer = require('nodemailer');
const { fetchExecutiveDashboardData } = require('./fetchData');
const { generateCompleteDashboardCharts, calculateDashboardStats, generateNumberCardStats, extractOperationalNotes } = require('./generateDashboardCharts');

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

  // Fetch latest data and generate complete dashboard
  const tasks = await fetchExecutiveDashboardData();
  const totalTasks = tasks.length;
  
  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Generate complete dashboard data with yesterday's date
  const dashboardData = await generateCompleteDashboardCharts(tasks, yesterdayStr);
  const stats = calculateDashboardStats(tasks, yesterdayStr);
  const numberCardStats = generateNumberCardStats(tasks);
  
  // Extract notes for yesterday only
  const operationalNotes = extractOperationalNotes(tasks, yesterdayStr);

  // Generate dashboard HTML
  const dashboardHtml = generateDashboardEmailHtml(dashboardData, stats, numberCardStats, operationalNotes, currentDate);

  const dateRangeText = dateRange 
    ? ` (${dateRange.start} to ${dateRange.end})`
    : '';

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 1200px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 2.5rem; font-weight: 700;">🏀 Executive Dashboard Report</h1>
        <p style="margin: 10px 0 0 0; font-size: 1.2rem; opacity: 0.9;">Hawkeye Innovations - NBA Operations Analytics</p>
        <p style="margin: 5px 0 0 0; font-size: 1rem; opacity: 0.8;">${currentDate}${dateRangeText}</p>
      </div>

      ${dashboardHtml}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1.1rem; transition: background 0.3s ease;">
          🚀 Access Interactive Dashboard
        </a>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 0.9rem;">
        <p><em>This dashboard is powered by Hawkeye Innovations.</em></p>
        <p>For technical support, contact your system administrator.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.EMAIL_TO,
    subject: `🏀 Executive Dashboard Report - ${currentDate}${dateRangeText}`,
    html: emailHtml
  });

  console.log("✅ Executive dashboard email sent successfully");
}

// Function to generate dashboard HTML for email
function generateDashboardEmailHtml(dashboardData, stats, numberCardStats, operationalNotes, currentDate) {
  // Generate number cards HTML with last night's information
  const numberCardsHtml = generateNumberCardsHtml(stats, numberCardStats);
  
  // Generate specific date charts HTML (for yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Filter specific date charts from the main charts array
  const specificDateCharts = dashboardData.charts.filter(chart => 
    chart.title && chart.title.includes(`(${yesterdayStr})`)
  );
  const specificDateChartsHtml = specificDateCharts.length > 0 
    ? generateChartsHtml(specificDateCharts, `Yesterday's Performance (${yesterdayStr})`)
    : `<div style="text-align: center; padding: 40px; color: #7f8c8d; font-style: italic;">No charts available for yesterday's performance (${yesterdayStr})</div>`;
  
  // Generate operational notes HTML for yesterday only
  const operationalNotesHtml = generateOperationalNotesHtml(operationalNotes);

  return `
    <!-- Number Cards Section -->
    <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
      <h2 style="color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
        📊 Key Performance Metrics
      </h2>
      ${numberCardsHtml}
    </div>

    <!-- Specific Date Charts Section -->
    <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
      <h2 style="color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
        📅 Yesterday's Performance (${yesterdayStr})
      </h2>
      ${specificDateChartsHtml}
    </div>

    <!-- Operational Notes Section -->
    ${operationalNotes.length > 0 ? `
      <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          📝 Operational Notes (${yesterdayStr})
        </h2>
        ${operationalNotesHtml}
      </div>
    ` : ''}
  `;
}

// Function to generate number cards HTML
function generateNumberCardsHtml(stats, numberCardStats) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const cards = [
    { title: 'Total Games', value: stats.totalGames || 0, icon: '🏀' },
    { title: 'Live Tracking Delivery', value: `${stats.liveTrackingDelivery || 0}%`, icon: '📡' },
    { title: 'Replay Delivery', value: `${stats.replayDelivery || 0}%`, icon: '🎬' },
    { title: 'SLA Hit Rate', value: `${stats.slaHitPercentage || 0}%`, icon: '⏱️' },
    { title: 'Resend Rate', value: `${stats.resendPercentage || 0}%`, icon: '🔄' },
    { title: `Last Night Games (${yesterdayStr})`, value: stats.lastNightGames || 0, icon: '🌙' },
    { title: 'Last Night SLAs Hit', value: stats.lastNightSLAsHit || 0, icon: '✅' },
    { title: 'Last Night SLAs Missed', value: stats.lastNightSLAsMissed || 0, icon: '❌' },
    { title: 'Last Night Resends', value: stats.lastNightResends || 0, icon: '🔄' }
  ];

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
      ${cards.map(card => `
        <div style="text-align: center; padding: 25px; background: #f8f9fa; border-radius: 12px; border-left: 4px solid #3498db;">
          <div style="font-size: 2.5rem; margin-bottom: 10px;">${card.icon}</div>
          <div style="font-size: 2rem; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">${card.value}</div>
          <div style="color: #7f8c8d; font-size: 0.9rem; text-transform: uppercase; font-weight: 600;">${card.title}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// Function to generate charts HTML
function generateChartsHtml(charts, sectionTitle) {
  if (!charts || charts.length === 0) {
    return `
      <div style="text-align: center; padding: 40px; color: #7f8c8d; font-style: italic;">
        No charts available for ${sectionTitle}
      </div>
    `;
  }

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 25px;">
      ${charts.map(chart => `
        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center;">
          <h4 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1rem;">${chart.title}</h4>
          <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            ${chart.svg}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Function to filter operational notes by date
function extractOperationalNotesForDate(notes, targetDate) {
  if (!notes || notes.length === 0) {
    return [];
  }
  
  // Since we're already filtering at the data level, just return the notes
  // The extractOperationalNotes function in generateDashboardCharts.js handles the date filtering
  return notes;
}

// Function to generate operational notes HTML
function generateOperationalNotesHtml(notes) {
  if (!notes || notes.length === 0) {
    return `
      <div style="text-align: center; padding: 40px; color: #7f8c8d; font-style: italic;">
        No operational notes found for this period.
      </div>
    `;
  }

  // Group notes by field type
  const groupedNotes = {};
  notes.forEach(note => {
    if (!groupedNotes[note.fieldName]) {
      groupedNotes[note.fieldName] = [];
    }
    groupedNotes[note.fieldName].push(note);
  });

  return `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      ${Object.entries(groupedNotes).map(([fieldName, fieldNotes]) => `
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef;">
            <span style="font-size: 1.2rem; margin-right: 8px;">📋</span>
            <h3 style="color: #2c3e50; margin: 0; font-size: 1.1rem;">${fieldName}</h3>
          </div>
          <div style="display: flex; flex-direction: column; gap: 15px;">
            ${fieldNotes.map(note => `
              <div style="background: white; border-radius: 6px; padding: 15px; border-left: 4px solid #3498db;">
                <div style="color: #7f8c8d; font-size: 0.9rem; margin-bottom: 8px; font-weight: 600;">${note.taskName}</div>
                <div style="color: #2c3e50; line-height: 1.6;">${note.content}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Function to send scheduled dashboard emails
async function sendScheduledDashboardEmail() {
  const dashboardUrl = process.env.DASHBOARD_URL || 'https://gleaguereporttest.onrender.com/dashboard';
  await sendDashboardEmail(dashboardUrl);
}

module.exports = { sendDashboardEmail, sendScheduledDashboardEmail };
