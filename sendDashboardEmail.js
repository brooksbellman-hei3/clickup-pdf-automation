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
        <h1 style="margin: 0; font-size: 2.5rem; font-weight: 700;">🏀 NBA Operations Dashboard</h1>
        <p style="margin: 10px 0 0 0; font-size: 1.2rem; opacity: 0.9;">Hawkeye Innovations - NBA Operations Analytics</p>
        <p style="margin: 5px 0 0 0; font-size: 1rem; opacity: 0.8;">${currentDate}${dateRangeText}</p>
      </div>

      ${dashboardHtml}

      <!-- Email Client Compatibility Notice -->
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #856404; font-size: 0.9rem;">
          <strong>📧 Email Compatibility Note:</strong> If charts are not displaying, please click the "Access Interactive Dashboard" button below for the full experience.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1.1rem; transition: background 0.3s ease;">
          🚀 Access Interactive Dashboard
        </a>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 0.9rem;">
        <p><em>This dashboard is powered by Hawkeye Innovations.</em></p>
        <p>For technical support, contact your system administrator.</p>
        <p style="margin-top: 10px; font-size: 0.8rem;">
          <strong>Chart Display Issues?</strong> Some email clients may not display SVG charts. 
          Use the interactive dashboard link above for the complete experience.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.EMAIL_TO,
    subject: `🏀 NBA Operations Dashboard - ${currentDate}${dateRangeText}`,
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
  
  // Debug: Log what we're working with
  console.log(`📧 Email debugging - Yesterday's date: ${yesterdayStr}`);
  console.log(`📧 Total charts available: ${dashboardData.charts.length}`);
  console.log(`📧 All chart titles:`, dashboardData.charts.map(c => c.title));
  
  // Filter specific date charts from the main charts array
  const specificDateCharts = dashboardData.charts.filter(chart => 
    chart.title && chart.title.includes(`(${yesterdayStr})`)
  );
  
  console.log(`📧 Found ${specificDateCharts.length} charts for date ${yesterdayStr}`);
  console.log(`📧 Specific date chart titles:`, specificDateCharts.map(c => c.title));
  
  // Backup method: if no charts found, try to find any charts with dates
  let backupCharts = [];
  if (specificDateCharts.length === 0) {
    console.log(`📧 No charts found for date ${yesterdayStr}, trying backup method...`);
    
    // Look for any charts that have a date pattern
    backupCharts = dashboardData.charts.filter(chart => 
      chart.title && (chart.title.includes('(') && chart.title.includes(')'))
    );
    
    if (backupCharts.length > 0) {
      console.log(`📧 Found ${backupCharts.length} backup charts with dates`);
      console.log(`📧 Backup chart titles:`, backupCharts.map(c => c.title).slice(0, 5));
    }
  }
  
  const chartsToUse = specificDateCharts.length > 0 ? specificDateCharts : backupCharts;
  console.log(`📧 Using ${chartsToUse.length} charts for email`);
  
  // If still no charts, use ALL charts as a last resort
  let finalCharts = chartsToUse;
  if (chartsToUse.length === 0) {
    console.log(`📧 No charts found with dates, using ALL charts as fallback`);
    finalCharts = dashboardData.charts;
  }
  
  console.log(`📧 Final charts to use:`, finalCharts.map(c => c.title));
  
  const specificDateChartsHtml = finalCharts.length > 0 
    ? generateChartsHtml(finalCharts, `Yesterday's Performance (${yesterdayStr})`)
    : `<div style="text-align: center; padding: 40px; color: #7f8c8d; font-style: italic;">No charts available for yesterday's performance (${yesterdayStr})</div>`;
  
  // Add text summary of chart data for email clients that don't support SVG
  const chartSummaryHtml = finalCharts.length > 0 ? generateChartSummaryHtml(finalCharts) : '';
  
  // Generate operational notes HTML for yesterday only
  const operationalNotesHtml = generateOperationalNotesHtml(operationalNotes);

  return `
    <!-- Number Cards Section -->
    <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
      <h2 style="color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
        📊 Season Review
      </h2>
      ${numberCardsHtml}
    </div>

    <!-- Specific Date Charts Section -->
    <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
      <h2 style="color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
        📅 Specified Date Delivery Metrics (${yesterdayStr})
      </h2>
      ${specificDateChartsHtml}
    </div>

    <!-- Chart Data Summary (for email clients that don't support SVG) -->
    ${chartSummaryHtml ? `
      <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          📊 Chart Data Summary (${yesterdayStr})
        </h2>
        ${chartSummaryHtml}
      </div>
    ` : ''}

    <!-- Operational Notes Section -->
    ${operationalNotes.length > 0 ? `
      <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          📝 Issue Reporting (${yesterdayStr})
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
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
      ${cards.map(card => `
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 12px; border-left: 4px solid #3498db;">
          <div style="font-size: 2rem; margin-bottom: 8px;">${card.icon}</div>
          <div style="font-size: 1.5rem; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">${card.value}</div>
          <div style="color: #7f8c8d; font-size: 0.8rem; text-transform: uppercase; font-weight: 600; line-height: 1.2;">${card.title}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// Function to generate charts HTML with multiple fallback options
function generateChartsHtml(charts, sectionTitle) {
  console.log(`📧 generateChartsHtml called with ${charts.length} charts for "${sectionTitle}"`);
  
  if (!charts || charts.length === 0) {
    console.log(`📧 No charts provided to generateChartsHtml`);
    return `
      <div style="text-align: center; padding: 40px; color: #7f8c8d; font-style: italic;">
        No charts available for ${sectionTitle}
      </div>
    `;
  }

  console.log(`📧 Generating HTML for charts:`, charts.map(c => c.title));
  
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 25px;">
      ${charts.map((chart, index) => {
        console.log(`📧 Processing chart ${index + 1}: ${chart.title}`);
        console.log(`📧 Chart has SVG: ${!!chart.svg}`);
        console.log(`📧 SVG length: ${chart.svg ? chart.svg.length : 0}`);
        console.log(`📧 SVG preview: ${chart.svg ? chart.svg.substring(0, 100) + '...' : 'NO SVG'}`);
        
        // Multiple fallback options for better email compatibility
        let chartContent = '';
        
        if (chart.svg) {
          // Primary: Inline SVG
          chartContent = `
            <div style="text-align: center; margin-bottom: 10px;">
              ${chart.svg}
            </div>
          `;
          
          // Fallback: Base64 image if available
          if (chart.base64Chart) {
            chartContent += `
              <div style="text-align: center; margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <p style="margin: 0; font-size: 12px; color: #7f8c8d;">Alternative format:</p>
                <img src="data:image/png;base64,${chart.base64Chart}" alt="${chart.title}" style="max-width: 100%; height: auto; border-radius: 4px; margin-top: 5px;">
              </div>
            `;
          }
          
          // Fallback: Text representation
          chartContent += `
            <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-family: monospace; font-size: 11px; text-align: left;">
              <strong>Chart Data:</strong><br>
              Title: ${chart.title}<br>
              Type: ${chart.filePath ? chart.filePath.split('.').pop() : 'Unknown'}<br>
              SVG Length: ${chart.svg.length} characters<br>
              ${chart.data ? `Data: ${JSON.stringify(chart.data).substring(0, 200)}...` : 'No data available'}
            </div>
          `;
        } else if (chart.base64Chart) {
          chartContent = `
            <img src="data:image/png;base64,${chart.base64Chart}" alt="${chart.title}" style="max-width: 100%; height: auto; border-radius: 4px;">
          `;
        } else {
          chartContent = `
            <div style="color: #7f8c8d; font-style: italic; padding: 20px;">
              Chart content not available for: ${chart.title}
            </div>
          `;
        }
        
        return `
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center;">
            <h4 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1rem;">${chart.title}</h4>
            <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              ${chartContent}
            </div>
          </div>
        `;
      }).join('')}
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

// Function to generate chart data summary for email clients that don't support SVG
function generateChartSummaryHtml(charts) {
  if (!charts || charts.length === 0) {
    return '<div style="text-align: center; color: #7f8c8d; font-style: italic;">No chart data available</div>';
  }

  return `
    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px;">
      <p style="margin: 0 0 15px 0; color: #2c3e50; font-weight: 600;">
        📊 Chart Data Summary (for email clients with limited SVG support):
      </p>
      <div style="display: flex; flex-direction: column; gap: 15px;">
        ${charts.map((chart, index) => `
          <div style="background: white; border-radius: 6px; padding: 15px; border-left: 4px solid #3498db;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 1rem;">${index + 1}. ${chart.title}</h4>
            <div style="font-family: monospace; font-size: 12px; color: #555; line-height: 1.4;">
              <strong>Chart Type:</strong> ${chart.filePath ? chart.filePath.split('.').pop().toUpperCase() : 'SVG'}<br>
              <strong>Content Size:</strong> ${chart.svg ? chart.svg.length : 0} characters<br>
              ${chart.data ? `<strong>Data Points:</strong> ${Object.keys(chart.data).length}<br>` : ''}
              ${chart.data ? `<strong>Values:</strong> ${JSON.stringify(chart.data).substring(0, 150)}...` : 'No data available'}
            </div>
          </div>
        `).join('')}
      </div>
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #7f8c8d; text-align: center;">
        💡 <strong>Tip:</strong> Click "Access Interactive Dashboard" above for full chart visualization
      </p>
    </div>
  `;
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
