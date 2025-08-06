const nodemailer = require('nodemailer');
const fs = require('fs');

// Import fetch + chart modules
let fetchClickUpTasks, testClickUpConnection;
let generatePieChart, generateLineChart;

try {
  const fetchModule = require('./fetchData');
  fetchClickUpTasks = fetchModule.fetchClickUpTasks;
  testClickUpConnection = fetchModule.testClickUpConnection;
  console.log('✅ Successfully imported fetchData.js');
} catch (error) {
  console.error('❌ Could not import fetch module:', error.message);
  process.exit(1);
}

try {
  const chartModule = require('./generateCharts');
  generatePieChart = chartModule.generatePieChart;
  generateLineChart = chartModule.generateLineChart;
  console.log('✅ Successfully imported generateCharts.js');
} catch (error) {
  console.error('❌ Could not import chart module:', error.message);
  process.exit(1);
}

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

  // Cleanup temporary files
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

  try {
    const statusChart = await generateStatusChart(tasks, 0);
    if (statusChart) charts.push(statusChart);

    const priorityChart = await generatePriorityChart(tasks, 1);
    if (priorityChart) charts.push(priorityChart);

    const assigneeChart = await generateAssigneeChart(tasks, 2);
    if (assigneeChart) charts.push(assigneeChart);

    const trendChart = await generateCreationTrendChart(tasks, 3);
    if (trendChart) charts.push(trendChart);

    console.log(`📈 Generated ${charts.length} charts`);
  } catch (error) {
    console.error("❌ Error generating charts:", error.message);
  }

  return charts;
}

async function generateStatusChart(tasks, index) {
  const counts = {};
  tasks.forEach(task => {
    const status = task.status?.status || 'Unknown';
    counts[status] = (counts[status] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const colors = generateColors(labels.length);

  if (labels.length === 0) return null;
  return await generatePieChart('Task Status Distribution', labels, data, colors, index);
}

async function generatePriorityChart(tasks, index) {
  const counts = {};
  tasks.forEach(task => {
    const priority = task.priority?.priority || 'No Priority';
    counts[priority] = (counts[priority] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];

  if (labels.length === 0) return null;
  return await generatePieChart('Task Priority Distribution', labels, data, colors, index);
}

async function generateAssigneeChart(tasks, index) {
  const counts = {};
  tasks.forEach(task => {
    const assignees = task.assignees || [];
    if (assignees.length === 0) {
      counts['Unassigned'] = (counts['Unassigned'] || 0) + 1;
    } else {
      assignees.forEach(assignee => {
        const name = assignee.username || assignee.email || 'Unknown';
        counts[name] = (counts[name] || 0) + 1;
      });
    }
  });

  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const colors = generateColors(labels.length);

  if (labels.length === 0) return null;
  return await generatePieChart('Task Assignment Distribution', labels, data, colors, index);
}

async function generateCreationTrendChart(tasks, index) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyCounts = {};
  tasks.forEach(task => {
    const createdDate = new Date(parseInt(task.date_created));
    if (createdDate >= thirtyDaysAgo) {
      const dateKey = createdDate.toISOString().split('T')[0];
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
    }
  });

  const sortedDates = Object.keys(dailyCounts).sort();
  const data = sortedDates.map(date => dailyCounts[date]);

  if (sortedDates.length === 0) return null;
  return await generateLineChart('Task Creation Trend (30 days)', sortedDates, data, index);
}

function generateColors(count) {
  const baseColors = [
    '#36a2eb', '#ff6384', '#4bc0c0', '#ff9f40', '#9966ff',
    '#ffcd56', '#ff6384', '#36a2eb', '#4bc0c0', '#ff9f40'
  ];
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
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
