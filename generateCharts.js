const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const path = require('path');

const width = 800;
const height = 600;

const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height,
  chartCallback: (ChartJS) => {
    ChartJS.defaults.font.family = 'Arial';
  }
});

async function generatePieChart(title, labels, data, colors, index = 0) {
  const configuration = {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: title,
        data,
        backgroundColor: colors,
      }],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 16
          }
        },
        legend: {
          position: 'bottom'
        }
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration, 'image/png');

  // Save to PNG for compatibility with PDFKit
  const filePath = path.join('/tmp', `chart-${index}-${title.replace(/\s+/g, '_')}.png`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function generateLineChart(title, labels, data, index = 0) {
  const configuration = {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Tasks Created',
        data,
        borderColor: '#36a2eb',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.1,
        fill: true
      }],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 16
          }
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration, 'image/png');

  const filePath = path.join('/tmp', `chart-${index}-${title.replace(/\s+/g, '_')}.png`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

module.exports = { generatePieChart, generateLineChart };
