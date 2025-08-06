const PDFDocument = require('pdfkit');
const fs = require('fs');

async function createPDF(chartPaths) {
  console.log(`📄 Creating PDF with ${chartPaths.length} charts...`);
  console.log(`📄 Chart paths:`, chartPaths);

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
    console.log(`📊 Processing chart ${i + 1}: ${chartPath}`);
    
    if (!fs.existsSync(chartPath)) {
      console.warn(`⚠️ Chart file missing: ${chartPath}`);
      continue;
    }

    // Check file size to ensure it's not empty
    const stats = fs.statSync(chartPath);
    console.log(`📊 Chart file size: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      console.warn(`⚠️ Chart file is empty: ${chartPath}`);
      continue;
    }

    doc.addPage();

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const chartWidth = 500;
    const chartHeight = 400;

    const x = (pageWidth - chartWidth) / 2;
    const y = (pageHeight - chartHeight) / 2;

    try {
      console.log(`📊 Adding chart to PDF: ${chartPath}`);
      console.log(`📊 Position: x=${x}, y=${y}, width=${chartWidth}, height=${chartHeight}`);
      
      // Try reading the image first to ensure it's valid
      const imageBuffer = fs.readFileSync(chartPath);
      console.log(`📊 Image buffer size: ${imageBuffer.length} bytes`);
      
      // Add the image using the buffer instead of file path (sometimes more reliable)
      doc.image(imageBuffer, x, y, {
        width: chartWidth,
        height: chartHeight,
        fit: [chartWidth, chartHeight], // Ensure it fits properly
        align: 'center',
        valign: 'center'
      });
      
      console.log(`✅ Chart ${i + 1} added successfully`);
    } catch (error) {
      console.error(`❌ Error adding chart ${i + 1} to PDF:`, error.message);
      console.error(`❌ Error stack:`, error.stack);
      
      // Add error text to PDF instead
      doc.fontSize(16).text(`Error loading chart: ${error.message}`, x, y);
      doc.fontSize(12).text(`Chart path: ${chartPath}`, x, y + 30);
      
      // Also try to add some debug info
      try {
        const stats = fs.statSync(chartPath);
        doc.text(`File exists: yes, Size: ${stats.size} bytes`, x, y + 50);
      } catch (statError) {
        doc.text(`File exists: no - ${statError.message}`, x, y + 50);
      }
    }
  }

  // If no charts were added, add a message
  if (chartPaths.length === 0) {
    doc.addPage();
    doc.fontSize(16).text('No charts were generated for this report.', { align: 'center' });
  }

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      console.log(`✅ PDF created successfully: ${outputPath}`);
      // Check final PDF size
      if (fs.existsSync(outputPath)) {
        const pdfStats = fs.statSync(outputPath);
        console.log(`📄 Final PDF size: ${pdfStats.size} bytes`);
      }
      resolve(outputPath);
    });
    doc.on('error', (error) => {
      console.error(`❌ PDF creation error:`, error);
      reject(error);
    });
  });
}

module.exports = createPDF;
