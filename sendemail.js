const nodemailer = require('nodemailer');
const { fetchClickUpTasks, testClickUpConnection } = require('./fetchData');
const { generatePieChart, generateLineChart } = require('./generateCharts');
const createPDF = require('./createPDF');
const fs = require('fs');

async function sendReport() {
  console.log("📊 Starting report generation...");
  
  // Test API connection first
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

  // Generate multiple charts based on task data
  const charts = await generateAllCharts(tasks);
  
  if (charts.length === 0) {
    console.log("⚠️ No charts generated - skipping report");
    return;
  }

  const pdfPath = await createPDF(charts);
  await emailReport(pdfPath, tasks.length);
  
  // Cleanup temp file
  if (fs.existsSync(pdfPath)) {
    fs.unlinkSync(pdfPath);
    console.log("🧹 Cleaned up temporary PDF file");
  }
}

async function generateAllCharts(tasks) {
  const charts = [];
  
  try {
    // Chart 1: Task Status Distribution
    const statusChart = await generateStatusChart(tasks);
    if (statusChart) charts.push(statusChart);

    // Chart 2: Priority Distribution
    const priorityChart = await generatePriorityChart(tasks);
    if (priorityChart) charts.push(priorityChart);

    // Chart 3: Assignee Distribution
    const assigneeChart = await generateAssigneeChart(tasks);
    if (assigneeChart) charts.push(assigneeChart);

    // Chart 4: Task Creation Trend (last 30 days)
    const trendChart = await generateCreationTrendChart(tasks);
    if (trendChart) charts.push(trendChart);

    console.log(`📈 Generated ${charts.length} charts`);
    
  } catch (error) {
    console.error("❌ Error generating charts:", error.message);
  }
  
  return charts;
}

async function generateStatusChart(tasks) {
  const statusCounts = {};
  
  tasks.forEach(task => {
    const status = task.status?.status || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);
  const colors = generateColors(labels.length);

  if (labels.length === 0) return null;

  return await generatePieChart('Task Status Distribution', labels, data, colors);
}

async function generatePriorityChart(tasks) {
  const priorityCounts = {};
  
  tasks.forEach(task => {
    const priority = task.priority?.priority || 'No Priority';
    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
  });

  const labels = Object.keys(priorityCounts);
  const data = Object.values(priorityCounts);
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];

  if (labels.length === 0) return null;

  return await generatePieChart('Task Priority Distribution', labels, data, colors);
}

async function generateAssigneeChart(tasks) {
  const assigneeCounts = {};
  
  tasks.forEach(task => {
    const assignees = task.assignees || [];
    if (assignees.length === 0) {
      assigneeCounts['Unassigned'] = (assigneeCounts['Unassigned'] || 0) + 1;
    } else {
      assignees.forEach(assignee => {
        const name = assignee.username || assignee.email || 'Unknown';
        assigneeCounts[name] = (assigneeCounts[name] || 0) + 1;
      });
    }
  });

  const labels = Object.keys(assigneeCounts);
  const data = Object.values(assigneeCounts);
  const colors = generateColors(labels.length);

  if (labels.length === 0) return null;

  return await generatePieChart('Task Assignment Distribution', labels, data, colors);
}

async function generateCreationTrendChart(tasks) {
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

  return await generateLineChart('Task Creation Trend (30 days)', sortedDates, data);
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

async function emailReport(pdfPath, taskCoun