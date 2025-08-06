const PDFDocument = require('pdfkit');
const fs = require('fs');

async function createPDF(chartPaths) {
  console.log(`📄 Creating PDF with ${chartPaths.length} charts...`);
  console.log(`📄 Chart paths:`, chartPaths);

  const doc = new PDFDocument({ 
    margin: 50,
    bufferPages: true // Important: enables proper image handling
  });
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

    try {
      console.log(`📊 Adding chart to PDF: ${chartPath}`);
      
      // Read the image buffer first
      const imageBuffer = fs.readFileSync(chartPath);
      console.log(`📊 Image buffer size: ${imageBuffer.length} bytes`);
      
      // Get page dimensions
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
      
      // Calculate chart dimensions (maintain aspect ratio)
      const maxWidth = pageWidth * 0.8; // 80% of available width
      const maxHeight = pageHeight * 0.7; // 70% of available height
      
      // Center the image on the page
      const x = doc.page.margins.left + (pageWidth - maxWidth) / 2;
      const y = doc.page.margins.top + 50; // Leave some space at top
      
      console.log(`📊 Position: x=${x}, y=${y}, maxWidth=${maxWidth}, maxHeight=${maxHeight}`);
      
      // Add the image with proper options
      doc.image(imageBuffer, x, y, {
        fit: [maxWidth, maxHeight], // Fit within these dimensions
        align: 'center',
        valign: 'center'
      });
      
      console.log(`✅ Chart ${i + 1} added successfully`);
    } catch (error) {
      console.error(`❌ Error adding chart ${i + 1} to PDF:`, error.message);
      console.error(`❌ Error stack:`, error.stack);
      
      // Add error text to PDF instead
      doc.fontSize(16).text(`Error loading chart: ${error.message}`, 50, 100);
      doc.fontSize(12).text(`Chart path: ${chartPath}`, 50, 130);
      
      // Also try to add some debug info
      try {
        const stats = fs.statSync(chartPath);
        doc.text(`File exists: yes, Size: ${stats.size} bytes`, 50, 150);
      } catch (statError) {
        doc.text(`File exists: no - ${statError.message}`, 50, 150);
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
