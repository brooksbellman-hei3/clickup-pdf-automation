const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 800;
const height = 600;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

async function generatePieChart(title, labels, data, colors) {
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

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

async function generateLineChart(title, labels, data) {
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

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

module.exports = { generatePieChart, generateLineChart };
