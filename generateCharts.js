const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

async function generatePieChart(title, labels, data, colors, index) {
  const width = 800;
  const height = 600;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const config = {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: 'right',
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
