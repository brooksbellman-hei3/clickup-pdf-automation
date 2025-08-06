const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

async function generatePieChart(title, labels, data, colors, index) {
  const width = 800;
  const height = 600;
  const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// Convert hex to rgba string (fully opaque)
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

  const rgbaColors = colors.map(hex => hexToRgba(hex)); // Convert here ✅

  const config = {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        backgroundColor: rgbaColors, // <- use rgba not hex
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
