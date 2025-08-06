const nodemailer = require('nodemailer');
const fs = require('fs');

const { fetchClickUpTasks, testClickUpConnection } = require('./fetchData');
const { generatePieChart } = require('./generateCharts');
const createPDF = require('./createPDF');

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

  const viewerChart = await generateFixedColorCustomFieldChart(
    tasks,
    'Viewer Status at Tip-Off - WNBA',
    'Viewer Status at Tip-Off (WNBA)',
    0
  );
  if (viewerChart) charts.push(viewerChart);

  const tabletChart = await generateFixedColorCustomFieldChart(
    tasks,
    'Overall Tablet Status',
    'Overall Tablet Status',
    1
  );
  if (tabletChart) charts.push(tabletChart);

  return charts;
}

async function generateFixedColorCustomFieldChart(tasks, fieldName, chartTitle, index) {
  const counts = {};
  const labelColorMap = {};
  let totalIncluded = 0;

  const refTask = tasks.find(t => t.custom_fields?.some(f => f.name === fieldName && f.type_config?.options));
  const fieldOptions = refTask?.custom_fields?.find(f => f.name === fieldName)?.type_config?.options || [];

  // Build label → color map from dropdown config
  fieldOptions.forEach(opt => {
    const label = opt.label;
    const color = parseClickUpColor(opt.color);
    if (label) labelColorMap[label] = color;
  });

  tasks.forEach(task => {
    const field = task.custom_fields?.find(f => f.name === fieldName);
    if (!field || !field.value) return;

    const selectedOption = fieldOptions.find(opt => opt.id === field.value);
    if (!selectedOption) return;

    const label = selectedOption.label;
    const color = parseClickUpColor(selectedOption.color);

    counts[label] = (counts[label] || 0) + 1;
    labelColorMap[label] = color;
    totalIncluded++;
  });

  const labels = Object.keys(counts);
  const data = labels.map(label => counts[label]);
  const colors = labels.map(label => labelColorMap[label] || '#999999');

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
