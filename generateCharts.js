const path = require("path");
const sharp = require("sharp");

// Try to load ChartJSNodeCanvas, fall back to Sharp-only if it fails
let ChartJSNodeCanvas;
try {
  ChartJSNodeCanvas = require("chartjs-node-canvas").ChartJSNodeCanvas;
  console.log("✅ ChartJSNodeCanvas loaded successfully");
} catch (error) {
  console.warn("⚠️ ChartJSNodeCanvas failed to load, using Sharp fallback:", error.message);
  ChartJSNodeCanvas = null;
}

async function generatePieChart(title, labels, data, colors, index = 0) {
  const width = 800;
  const height = 600;

  console.log(`🎨 Creating chart: ${title}`);
  console.log(`   Labels: ${labels.join(', ')}`);
  console.log(`   Data: ${data.join(', ')}`);

  // Try ChartJS first, fall back to Sharp if it fails
  if (ChartJSNodeCanvas) {
    try {
      return await generateChartJSChart(title, labels, data, colors, index, width, height);
    } catch (error) {
      console.warn(`⚠️ ChartJS failed for "${title}", falling back to Sharp:`, error.message);
    }
  }
  
  // Fallback to Sharp-based chart
  return await generateSharpChart(title, labels, data, colors, index, width, height);
}

async function generateChartJSChart(title, labels, data, colors, index, width, height) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: "white",
    devicePixelRatio: 1,
    chartCallback: (ChartJS) => {
      // Configure defaults for better compatibility
      ChartJS.defaults.font = ChartJS.defaults.font || {};
      ChartJS.defaults.font.family = 'Arial, sans-serif';
      ChartJS.defaults.font.size = 14;
    }
  });

  const configuration = {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 20, weight: 'bold' },
          color: '#000000',
          padding: 20
        },
        legend: {
          display: true,
          position: "right",
          labels: {
            font: { size: 14 },
            color: "#000000",
            usePointStyle: true,
            padding: 15
          },
        },
      },
      layout: {
        padding: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20
        }
      }
    },
  };

  console.log(`   Rendering ChartJS buffer...`);
  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration, "image/png");
  
  if (!buffer || buffer.length === 0) {
    throw new Error("ChartJS buffer is empty");
  }
  
  console.log(`   ChartJS buffer size: ${buffer.length} bytes`);
  return await processChartBuffer(buffer, title, index);
}

async function generateSharpChart(title, labels, data, colors, index, width, height) {
  console.log(`   Generating Sharp fallback chart...`);
  
  // Calculate total for percentages
  const total = data.reduce((sum, val) => sum + val, 0);
  
  // Create a detailed SVG chart
  const labelHeight = 25;
  const chartCenterX = width * 0.4;
  const chartCenterY = height * 0.5;
  const radius = Math.min(width * 0.25, height * 0.25);
  
  // Generate pie slices
  let currentAngle = -Math.PI / 2; // Start at top
  const slices = data.map((value, i) => {
    const percentage = (value / total) * 100;
    const sliceAngle = (value / total) * 2 * Math.PI;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    
    // Calculate arc path
    const startX = chartCenterX + Math.cos(startAngle) * radius;
    const startY = chartCenterY + Math.sin(startAngle) * radius;
    const endX = chartCenterX + Math.cos(endAngle) * radius;
    const endY = chartCenterY + Math.sin(endAngle) * radius;
    
    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    
    const pathData = [
      `M ${chartCenterX} ${chartCenterY}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `Z`
    ].join(' ');
    
    currentAngle = endAngle;
    
    return {
      path: pathData,
      color: colors[i] || '#666',
      label: labels[i],
      value: value,
      percentage: percentage.toFixed(1)
    };
  });
  
  // Create legend
  const legendX = width * 0.65;
  const legendStartY = height * 0.3;
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #000; }
          .legend-text { font-family: Arial, sans-serif; font-size: 16px; fill: #000; }
          .legend-value { font-family: Arial, sans-serif; font-size: 14px; fill: #666; }
        </style>
      </defs>
      
      <!-- White background -->
      <rect width="100%" height="100%" fill="white"/>
      
      <!-- Title -->
      <text x="${width / 2}" y="40" text-anchor="middle" class="title">${title}</text>
      
      <!-- Pie slices -->
      ${slices.map(slice => `
        <path d="${slice.path}" fill="${slice.color}" stroke="white" stroke-width="2"/>
      `).join('')}
      
      <!-- Legend -->
      ${slices.map((slice, i) => `
        <rect x="${legendX}" y="${legendStartY + i * labelHeight}" width="15" height="15" fill="${slice.color}"/>
        <text x="${legendX + 25}" y="${legendStartY + i * labelHeight + 12}" class="legend-text">${slice.label}</text>
        <text x="${legendX + 25}" y="${legendStartY + i * labelHeight + 12 + 16}" class="legend-value">${slice.value} (${slice.percentage}%)</text>
      `).join('')}
    </svg>
  `;
  
  console.log(`   Generating Sharp PNG from SVG...`);
  const buffer = await sharp(Buffer.from(svg))
    .png({
      quality: 90,
      compressionLevel: 6
    })
    .toBuffer();
    
  console.log(`   Sharp buffer size: ${buffer.length} bytes`);
  return await processChartBuffer(buffer, title, index);
}

async function processChartBuffer(buffer, title, index) {
  const timestamp = Date.now();
  const filename = `chart_${index}_${timestamp}.png`;
  const filePath = path.join(__dirname, filename);

  console.log(`   Processing final image...`);
  
  // Ensure proper PNG format and white background
  await sharp(buffer)
    .flatten({ background: "#ffffff" })
    .png({
      quality: 90,
      compressionLevel: 6,
      force: true
    })
    .toFile(filePath);

  console.log(`✅ Chart saved successfully: ${filePath}`);
  
  return {
    filePath,
    base64Chart: buffer.toString("base64"),
    filename: filename
  };
}

async function generateTestChart() {
  console.log("🧪 Generating test chart...");
  const testData = {
    title: "Render Test Chart",
    labels: ["Working", "Test", "Data"],
    data: [40, 30, 30],
    colors: ["#28a745", "#17a2b8", "#ffc107"]
  };
  
  try {
    return await generatePieChart(testData.title, testData.labels, testData.data, testData.colors, 999);
  } catch (error) {
    console.error("❌ Test chart generation failed:", error);
    throw error;
  }
}

async function generateFixedColorCustomFieldChart(tasks, fieldName, title, index) {
  console.log(`\n🎨 Generating chart for field: "${fieldName}"`);

  if (!tasks || tasks.length === 0) {
    console.warn(`⚠️ No tasks provided for chart generation`);
    return null;
  }

  const colorMap = {
    'Green': '#28a745', 'green': '#28a745', 'GREEN': '#28a745',
    'Orange': '#fd7e14', 'orange': '#fd7e14', 'ORANGE': '#fd7e14',
    'Red': '#dc3545', 'red': '#dc3545', 'RED': '#dc3545',
    'Black': '#343a40', 'black': '#343a40', 'BLACK': '#343a40',
    'Black: Non-Delivery': '#6c757d',
    'Gray': '#6c757d', 'gray': '#6c757d', 'GRAY': '#6c757d',
    'Grey': '#6c757d', 'grey': '#6c757d', 'GREY': '#6c757d',
    'Blue': '#007bff', 'blue': '#007bff', 'BLUE': '#007bff',
    'Yellow': '#ffc107', 'yellow': '#ffc107', 'YELLOW': '#ffc107',
    'Purple': '#6f42c1', 'purple': '#6f42c1', 'PURPLE': '#6f42c1',
    'Pink': '#e83e8c', 'pink': '#e83e8c', 'PINK': '#e83e8c'
  };

  const counts = {};
  let processedTasks = 0;

  for (const task of tasks) {
    if (!task.custom_fields) continue;
    const field = task.custom_fields.find(f => f.name && f.name.trim() === fieldName.trim());
    if (!field) continue;

    let value = null;

    if (field.type === 'drop_down' && field.type_config?.options) {
      const options = field.type_config.options;
      if (Array.isArray(options)) {
        const option = options.find(opt => opt.id === field.value);
        value = option?.name || null;
      } else if (typeof options === 'object') {
        value = options[field.value]?.name || null;
      }
    } else if (field.value_text?.trim()) {
      value = field.value_text.trim();
    } else if (typeof field.value === 'string' && field.value.trim()) {
      value = field.value.trim();
    } else if (typeof field.value === 'object' && field.value?.name) {
      value = field.value.name;
    } else if (field.value != null && field.value !== '') {
      value = String(field.value).trim();
    }

    if (value && value !== 'null' && value !== 'undefined') {
      counts[value] = (counts[value] || 0) + 1;
      processedTasks++;
      console.log(`[DEBUG] Found value: "${value}"`);
    }
  }

  if (processedTasks === 0) {
    console.warn(`⚠️ No valid data found for "${fieldName}" - generating test chart`);
    return await generateTestChart();
  }

  const labels = Object.keys(counts);
  const data = labels.map(l => counts[l]);
  const colors = labels.map(label => colorMap[label] || '#6c757d');

  console.log(`📈 Final chart data:`);
  console.log(`   Labels: [${labels.join(', ')}]`);
  console.log(`   Data: [${data.join(', ')}]`);
  console.log(`   Colors: [${colors.join(', ')}]`);

  return await generatePieChart(title, labels, data, colors, index);
}

function analyzeFieldStructure(tasks, fieldName) {
  console.log(`\n🔍 ANALYZING FIELD STRUCTURE for "${fieldName}"`);
  if (!tasks || tasks.length === 0) {
    console.log(`❌ No tasks to analyze`);
    return;
  }

  for (let i = 0; i < Math.min(3, tasks.length); i++) {
    const task = tasks[i];
    console.log(`\n📋 Task ${i + 1}: "${task.name?.substring(0, 30)}..."`);

    if (!task.custom_fields) {
      console.log(`   ❌ No custom_fields array`);
      continue;
    }

    console.log(`   📝 Available fields: ${task.custom_fields.map(f => f.name).join(', ')}`);

    const field = task.custom_fields.find(f => f.name && f.name.trim() === fieldName.trim());
    if (!field) {
      console.log(`   ❌ Field "${fieldName}" not found`);
      continue;
    }

    console.log(`   📄 Field found!`);
    console.log(`   📄 Type: ${field.type}`);
    console.log(`   📄 Value: ${JSON.stringify(field.value)}`);
    console.log(`   📄 Value text: ${field.value_text || 'N/A'}`);

    if (field.type_config) {
      console.log(`   📄 Has type_config with keys: ${Object.keys(field.type_config).join(', ')}`);
    }
  }
}

module.exports = {
  generatePieChart,
  generateFixedColorCustomFieldChart,
  analyzeFieldStructure,
  generateTestChart
};
