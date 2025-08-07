const nodemailer = require('nodemailer');
const fs = require('fs');

const { fetchClickUpTasks, testClickUpConnection } = require('./fetchData');
const { generatePieChart, generateFixedColorCustomFieldChart, analyzeFieldStructure, generateTestChart } = require('./generateCharts');

function findFieldNameByKeyword(fieldNames, keyword) {
  const normalize = str =>
    str.toLowerCase().replace(/[\s\-–—]+/g, ' ').trim();

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

  // First, test chart generation with simple data
  console.log("\n🧪 Testing basic chart generation...");
  const testChart = await generateTestChart();
  if (!testChart) {
    console.error("❌ Basic chart generation failed - aborting");
    return;
  }
  console.log("✅ Basic chart generation works!");

  const connectionOk = await testClickUpConnection();
  if (!connectionOk) {
    throw new Error("ClickUp API connection failed");
  }

  const tasks = await fetchClickUpTasks();
  if (tasks.length === 0) {
    console.log("⚠️ No tasks found - sending test chart only");
    await emailReport([testChart], 0);
    // Clean up
    if (fs.existsSync(testChart)) fs.unlinkSync(testChart);
    return;
  }

  console.log(`📋 Processing ${tasks.length} tasks...`);

  const chartPaths = await generateAllCharts(tasks);
  
  // If no data charts were generated, include the test chart
  if (chartPaths.length === 0) {
    console.log("⚠️ No data charts generated - including test chart");
    chartPaths.push(testChart);
  } else {
    // Clean up test chart since we have real data
    if (fs.existsSync(testChart)) fs.unlinkSync(testChart);
  }

  await emailReport(chartPaths, tasks.length);

  // Clean up all chart files
  chartPaths.forEach(p => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
}

async function generateAllCharts(tasks) {
  const charts = [];

  // Extract all unique custom field names
  const uniqueFields = new Set();
  tasks.forEach(task => {
    task.custom_fields?.forEach(f => uniqueFields.add(f.name));
  });

  const fieldNames = [...uniqueFields];
  console.log("\n🧩 Detected custom fields:", fieldNames);

  // Dynamically resolve actual field names
  const viewerFieldName = findFieldNameByKeyword(fieldNames, "viewer status at tip-off wnba");
  const tabletFieldName = findFieldNameByKeyword(fieldNames, "overall tablet");

  console.log("🔍 Matched field name for viewer status:", viewerFieldName);
  console.log("🔍 Matched field name for tablet status:", tabletFieldName);

  // Add debugging analysis for the fields we're going to chart
  if (viewerFieldName) {
    analyzeFieldStructure(tasks, viewerFieldName);
  }
  if (tabletFieldName) {
    analyzeFieldStructure(tasks, tabletFieldName);
  }

  // Generate charts with resolved names (if found)
  if (viewerFieldName) {
    console.log(`\n🎨 Generating viewer status chart...`);
    const viewerChart = await generateFixedColorCustomFieldChart(
      tasks,
      viewerFieldName,
      'Viewer Status at Tip-Off (WNBA)',
      0
    );
    if (viewerChart) {
      console.log(`✅ Viewer chart generated: ${viewerChart}`);
      charts.push(viewerChart);
    } else {
      console.error(`❌ Failed to generate viewer chart`);
    }
  }

  if (tabletFieldName) {
    console.log(`\n🎨 Generating tablet status chart...`);
    const tabletChart = await generateFixedColorCustomFieldChart(
      tasks,
      tabletFieldName,
      'Overall Tablet Status',
      1
    );
    if (tabletChart) {
      console.log(`✅ Tablet chart generated: ${tabletChart}`);
      charts.push(tabletChart);
    } else {
      console.error(`❌ Failed to generate tablet chart`);
    }
  }

  console.log(`\n📈 Total charts generated: ${charts.length}`);
  return charts;
}

async function emailReport(attachments, taskCount) {
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
      <p><strong>Charts Generated:</strong> ${attachments.length}</p>
      <p>Your charts are attached as image files (.jpg).</p>
      <br>
      <p><em>This report was generated automatically from your ClickUp workspace.</em></p>
    `,
    attachments: attachments.map((path, index) => ({
    filename: `chart_${index + 1}.png`,
    path: path,
    contentType: 'image/png'
}))

    }))
  });

  console.log("✅ Email sent successfully");
}

module.exports = sendReport;
