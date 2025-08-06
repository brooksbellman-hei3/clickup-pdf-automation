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
  const filePath = path.join('/tmp', `chart-${index}-${title.replace(/\s+/g, '_')}.png`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

module.exports = { generatePieChart };
