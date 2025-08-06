const PDFDocument = require('pdfkit');
const fs = require('fs');

async function createPDF(chartPaths) {
  const doc = new PDFDocument({ margin: 50 });
  const outputPath = '/tmp/clickup_report.pdf';
  doc.pipe(fs.createWriteStream(outputPath));

  // Title page
  doc.fontSize(24).text('ClickUp Daily Report', { align: 'center' });
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, { align: 'center' });

  // Insert charts
  for (let i = 0; i < chartPaths.length; i++) {
    const chartPath = chartPaths[i];
    if (!fs.existsSync(chartPath)) {
      console.warn(`⚠️ Chart file missing: ${chartPath}`);
      continue;
    }

    doc.addPage();

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const chartWidth = 500;
    const chartHeight = 400;

    const x = (pageWidth - chartWidth) / 2;
    const y = (pageHeight - chartHeight) / 2;

    doc.image(chartPath, x, y, {
      width: chartWidth,
      height: chartHeight
    });
  }

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(outputPath));
    doc.on('error', reject);
  });
}

module.exports = createPDF;
