const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require("fs");
const path = require("path");
const sharp = require('sharp');
const { registerFont } = require('canvas');

registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', {
  family: 'DejaVu Sans'
});

async function generatePieChart(title, labels, data, colors, index = 0) {
  try {
    console.log(`\n🎨 Generating pie chart: "${title}"`);
    console.log(`📊 Input data:`, { labels, data, colors });

    if (!data || data.length === 0 || !labels || labels.length === 0) {
      console.error(`❌ Invalid data for chart: ${title}`);
      return null;
    }

    const width = 800;
    const height = 600;

    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width,
      height,
      chartCallback: (ChartJS) => {
        ChartJS.register({
          id: 'whiteBackground',
          beforeDraw: (chart) => {
            const ctx = chart.ctx;
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
          }
        });
      }
    });

    const hexColors = colors.map(color => {
      if (!color) return '#999999';

      if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
        return color;
      }

      if (color.startsWith('rgba')) {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const r = parseInt(match[1]);
          const g = parseInt(match[2]);
          const b = parseInt(match[3]);
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
      }

      const colorMap = {
        'red': '#FF0000',
        'green': '#00FF00',
        'blue': '#0000FF',
        'orange': '#FFA500',
        'yellow': '#FFFF00',
        'purple': '#800080',
        'pink': '#FFC0CB',
        'black': '#000000',
        'gray': '#808080',
        'grey': '#808080',
        'white': '#FFFFFF'
      };

      return colorMap[color.toLowerCase()] || '#999999';
    });

    const configuration = {
      type: "pie",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: hexColors,
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        layout: { padding: 40 },
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
              font: { size: 12 },
              color: '#000000',
              padding: 10,
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => ({
                    text: `${label}: ${data.datasets[0].data[i]}`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: '#ffffff',
                    lineWidth: 2,
                    pointStyle: 'rect',
                    hidden: false,
                    index: i
                  }));
                }
                return [];
              }
            }
          }
        }
      },
      plugins: [{
        id: 'whiteBackground',
        beforeDraw: (chart) => {
          const { ctx } = chart;
          ctx.save();
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        }
      }]
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);

    const filePath = path.join(__dirname, `chart_${index}_${Date.now()}.png`);
    await sharp(buffer)
      .flatten({ background: '#ffffff' }) // Ensures non-transparent background
      .toFile(filePath);

    console.log(`✅ Chart saved: ${filePath}`);
    return filePath;

  } catch (error) {
    console.error(`❌ Error generating chart: ${error.message}`);
    return null;
  }
}

// Test function to generate a simple chart without data processing
async function generateTestChart() {
  console.log("🧪 Generating test chart...");
  const testData = {
    title: "Simple Test Chart",
    labels: ["Test A", "Test B", "Test C"],
    data: [30, 20, 50],
    colors: ["#FF6384", "#36A2EB", "#FFCE56"]
  };
  return await generatePieChart(testData.title, testData.labels, testData.data, testData.colors, 999);
}

// Custom pie chart from a field with known fixed labels/colors
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

    if (field.type === 'drop_down' && field.type_config && field.type_config.options) {
      if (Array.isArray(field.type_config.options)) {
        const option = field.type_config.options[field.value];
        value = option ? option.name : null;
      } else if (typeof field.type_config.options === 'object') {
        const option = field.type_config.options[field.value];
        value = option ? option.name : null;
      }
    } else if (field.value_text && field.value_text.trim()) {
      value = field.value_text.trim();
    } else if (typeof field.value === 'string' && field.value.trim()) {
      value = field.value.trim();
    } else if (typeof field.value === 'object' && field.value && field.value.name) {
      value = field.value.name;
    } else if (field.value !== null && field.value !== undefined && field.value !== '') {
      value = String(field.value).trim();
    }

    if (value && value !== 'null' && value !== 'undefined') {
      counts[value] = (counts[value] || 0) + 1;
      processedTasks++;
      console.log(`[DEBUG] Found value: "${value}"`);
    }
  }

  if (processedTasks === 0) {
    console.warn(`⚠️ No valid data found for "${fieldName}"`);
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

// Analyze custom field structure (debug helper)
function analyzeFieldStructure(tasks, fieldName) {
  console.log(`\n🔍 ANALYZING FIELD STRUCTURE for "${fieldName}"`);
  if (!tasks || tasks.length === 0) {
    console.log(`❌ No tasks to analyze`);
    return;
  }

  for (let i = 0; i < Math.min(5, tasks.length); i++) {
    const task = tasks[i];
    console.log(`\n📋 Task ${i + 1}: "${task.name.substring(0, 30)}..."`);

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
