const PDFDocument = require('pdfkit');
const fs = require('fs');

async function createPDF(charts) {
  const doc = new PDFDocument({ margin: 50 });
  const outputPath = '/tmp/clickup_report.pdf';
  doc.pipe(fs.createWriteStream(outputPath));

  // Add title page
  doc.fontSize(24)
     .text('ClickUp Daily Report', { align: 'center' });
  
  doc.fontSize(12)
     .text(`Generated on: ${new Date().toLocaleDateString('en-US', {
       year: 'numeric',
       month: 'long', 
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit'
     })}`, { align: 'center' });

  // Add charts
  for (let i = 0; i < charts.length; i++) {
    doc.addPage();
    
    // Center the chart on the page
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const chartWidth = 500;
    const chartHeight = 400;
    
    const x = (pageWidth - chartWidth) / 2;
    const y = (pageHeight - chartHeight) / 2;
    
    doc.image(charts[i], x, y, {
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