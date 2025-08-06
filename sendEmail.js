const nodemailer = require('nodemailer');
const fs = require('fs');

const { fetchClickUpTasks, testClickUpConnection } = require('./fetchData');
const { generatePieChart } = require('./generateCharts');
const createPDF = require('./createPDF');
function findFieldNameByKeyword(fieldNames, keyword) {
  const normalize = str =>
    str.toLowerCase().replace(/[\s\-–—]+/g, ' ').trim(); // normalize spaces & dashes

  const normalizedKeyword = normalize(keyword);

  const matched = fieldNames.find(name =>
    normalize(name).includes(normalizedKeyword)
  );

  if (!matched) {
    console.warn(`⚠️ Could not match field for keyword "${keyword}"`);
  }

  return matched;
}

async function sendReport() {
  console.log("📊 Starting report generation...");

  const connectionOk = await testClickUpConnection();
  if (!connectionOk) {
    throw new Error("ClickUp API connection failed");
  }

  const tasks = await fetchClickUpTasks();
  if (tasks.length === 0) {
    console.log("⚠️ No tasks found - skipping report");
    return;
  }

  console.log(`📋 Processing ${tasks.length} tasks...`);

  const chartPaths = await generateAllCharts(tasks);
  if (chartPaths.length === 0) {
    console.log("⚠️ No charts generated - skipping report");
    return;
  }

  const pdfPath = await createPDF(chartPaths);
  await emailReport(pdfPath, tasks.length);

  if (fs.existsSync(pdfPath)) {
    fs.unlinkSync(pdfPath);
    console.log("🧹 Cleaned up temporary PDF file");
  }

  chartPaths.forEach(p => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
}

async function generateAllCharts(tasks) {
  const charts = [];

  // 🔍 Extract all unique custom field names
  const uniqueFields = new Set();
  tasks.forEach(task => {
    task.custom_fields?.forEach(f => uniqueFields.add(f.name));
  });

  const fieldNames = [...uniqueFields];
  console.log("\n🧩 Detected custom fields:", fieldNames);

  // 🧠 Dynamically resolve actual field names
  const viewerFieldName = findFieldNameByKeyword(fieldNames, "viewer status at tip-off wnba");
  const tabletFieldName = findFieldNameByKeyword(fieldNames, "overall tablet");

  console.log("🔍 Matched field name for viewer status:", viewerFieldName);
  console.log("🔍 Matched field name for tablet status:", tabletFieldName);

  // 📊 Generate charts with resolved names (if found)
  if (viewerFieldName) {
    const viewerChart = await generateFixedColorCustomFieldChart(
      tasks,
      viewerFieldName,
      'Viewer Status at Tip-Off (WNBA)',
      0
    );
    if (viewerChart) charts.push(viewerChart);
  }

  if (tabletFieldName) {
    const tabletChart = await generateFixedColorCustomFieldChart(
      tasks,
      tabletFieldName,
      'Overall Tablet Status',
      1
    );
    if (tabletChart) charts.push(tabletChart);
  }

  return charts;
}

async function generateFixedColorCustomFieldChart(tasks, fieldName, chartTitle, index) {
  const counts = {};
  const labelColorMap = {
    'Green': '#28a745',
    'Orange': '#fd7e14',
    'Red': '#dc3545',
    'Black': '#000000'
  };

  let totalIncluded = 0;

  tasks.forEach((task, i) => {
    const field = task.custom_fields?.find(f => f.name === fieldName);
    if (!field || field.value == null) return; // ✅ use return inside forEach

    let value;

    // 🧠 Resolve label from dropdown field
    if (field.type === 'drop_down' && Array.isArray(field.type_config?.options)) {
      const option = field.type_config.options[field.value];
      value = option?.name?.trim();
    } else if (typeof field.value === 'string') {
      value = field.value.trim();
    }

    if (!value) return; // skip if still invalid

    // ✅ Debug logs
    if (i < 5) {
      console.log(`[DEBUG] Task ${i + 1} - ${fieldName}:`, value);
      console.log(`[DEBUG:RAW] Field object for "${fieldName}":`, field);
    }

    if (!labelColorMap[value]) return; // skip unsupported values

    counts[value] = (counts[value] || 0) + 1;
    totalIncluded++;
  });

  const labels = Object.keys(counts);
  const data = labels.map(label => counts[label]);
  const colors = labels.map(label => labelColorMap[label]);

  console.log(`📊 Chart: ${chartTitle}`);
  console.log(`Included ${totalIncluded} tasks`);
  console.log('Labels:', labels);
  console.log('Data:', data);
  console.log('Colors:', colors);

  if (labels.length === 0) {
    console.warn(`⚠️ No valid data found for "${fieldName}"`);
    return null;
  }

  return await generatePieChart(chartTitle, labels, data, colors, index);
}

function parseClickUpColor(colorName) {
  const map = {
    'green': '#00FF00',
    'orange': '#FFA500',
    'red': '#FF0000',
    'black': '#000000',
    'gray': '#808080',
    'blue': '#0000FF'
  };
  return map[colorName?.toLowerCase()] || '#999999';
}

async function emailReport(pdfPath, taskCount) {
  console.log("📧 Sending email...");

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

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.EMAIL_TO,
    subject: `📊 Daily ClickUp Report - ${currentDate}`,
    html: `
      <h2>📊 Daily ClickUp Report</h2>
      <p><strong>Date:</strong> ${currentDate}</p>
      <p><strong>Total Tasks Processed:</strong> ${taskCount}</p>
      <p>Please find your detailed task analysis report attached.</p>
      <br>
      <p><em>This report was generated automatically from your ClickUp workspace.</em></p>
    `,
    attachments: [{
      filename: `clickup_report_${new Date().toISOString().split('T')[0]}.pdf`,
      path: pdfPath
    }],
  });

  console.log("✅ Email sent successfully");
}

module.exports = sendReport;
