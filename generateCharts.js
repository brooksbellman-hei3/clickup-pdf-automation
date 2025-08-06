const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// Helper: Convert hex to RGBA for reliable chart rendering
function hexToRgba(hex) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, 1)`;
}

async function generatePieChart(title, labels, data, colors, index) {
  const width = 800;
  const height = 600;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const rgbaColors = colors.map(hex => hexToRgba(hex));

  const config = {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        backgroundColor: rgbaColors,
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#000',
            font: {
              size: 14
            }
          }
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 20
          }
        }
      }
    }
  };

  return await chartJSNodeCanvas.renderToBuffer(config);
}

// Custom pie chart from a field with known fixed labels/colors
async function generateFixedColorCustomFieldChart(tasks, fieldName, title, index) {
  const colorMap = {
    'Green': '#28a745',
    'Orange': '#fd7e14',
    'Red': '#dc3545',
    'Black': '#000000'
  };

  const counts = {
    'Green': 0,
    'Orange': 0,
    'Red': 0,
    'Black': 0
  };

  for (const task of tasks) {
    const field = task.custom_fields?.find(f => f.name.trim() === fieldName.trim());
    if (!field || field.value == null) continue;

    let value;

    if (field.type === 'drop_down' && Array.isArray(field.type_config?.options)) {
      const option = field.type_config.options[field.value];
      value = option?.name?.trim();
    } else if (typeof field.value === 'string') {
      value = field.value.trim();
    }

    if (value && counts.hasOwnProperty(value)) {
      counts[value]++;
      console.log(`[DEBUG] Task ${task.name} - ${fieldName}: ${value}`);
    }
  }

  const labels = Object.keys(counts).filter(k => counts[k] > 0);
  const data = labels.map(l => counts[l]);
  const colors = labels.map(l => colorMap[l]);

  if (data.length === 0) {
    console.warn(`⚠️ No valid data found for "${fieldName}"`);
    return null;
  }

  return await generatePieChart(title, labels, data, colors, index);
}

module.exports = {
  generateFixedColorCustomFieldChart
};
