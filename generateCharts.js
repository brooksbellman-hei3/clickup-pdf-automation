const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// Helper: Convert hex to RGBA for reliable chart rendering
function hexToRgba(hex) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, 1)`;
}

const fs = require("fs");
const path = require("path");

async function generatePieChart(title, labels, data, colors, index = 0) {
  console.log(`\n🎨 Generating pie chart: "${title}"`);
  console.log(`📊 Input data:`, { labels, data, colors });

  const width = 800;
  const height = 600;

  const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
    width, 
    height,
    backgroundColour: 'white' // Ensure white background
  });

  // Use hex colors directly instead of RGBA - sometimes PDFKit has issues with RGBA
  const hexColors = colors.map(color => {
    if (color.startsWith('#')) return color;
    if (color.startsWith('rgba')) {
      // Convert back to hex if needed
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
    }
    return color;
  });

  const configuration = {
    type: "pie",
    data: {
      labels,
      datasets: [{
        label: title,
        data,
        backgroundColor: hexColors, // Use hex instead of RGBA
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false, // Changed to false for better control
      animation: false, // Disable animations for server-side rendering
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 20 },
          color: '#000000'
        },
        legend: {
          position: "right",
          labels: {
            font: { size: 14 },
            color: '#000000'
          }
        }
      }
    }
  };

  try {
    console.log(`🎨 Rendering chart with HEX colors:`, hexColors);

    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    console.log(`📊 Chart buffer size: ${buffer.length} bytes`);

    const filename = `chart_${index}_${Date.now()}.png`;
    const outputPath = path.join(__dirname, filename);

    fs.writeFileSync(outputPath, buffer);
    
    // Verify the file was written correctly
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`✅ Chart saved: ${outputPath} (${stats.size} bytes)`);
      console.log(`🎨 HEX Colors used: ${hexColors.join(', ')}`);
      
      // Additional verification - try to read the file back
      const testBuffer = fs.readFileSync(outputPath);
      if (testBuffer.length !== buffer.length) {
        console.warn(`⚠️ File size mismatch: written=${buffer.length}, read=${testBuffer.length}`);
      }
    } else {
      console.error(`❌ Failed to save chart file: ${outputPath}`);
      return null;
    }
    
    return outputPath;
  } catch (error) {
    console.error(`❌ Error generating chart:`, error.message);
    console.error(error.stack);
    return null;
  }
}

// Custom pie chart from a field with known fixed labels/colors
async function generateFixedColorCustomFieldChart(tasks, fieldName, title, index) {
  console.log(`\n🎨 Generating chart for field: "${fieldName}"`);
  
  // Enhanced color mapping with multiple variations
  const colorMap = {
    'Green': '#28a745',
    'green': '#28a745',
    'GREEN': '#28a745',
    'Orange': '#fd7e14',
    'orange': '#fd7e14',
    'ORANGE': '#fd7e14',
    'Red': '#dc3545',
    'red': '#dc3545',
    'RED': '#dc3545',
    'Black': '#343a40',
    'black': '#343a40',
    'BLACK': '#343a40',
    'Gray': '#6c757d',
    'gray': '#6c757d',
    'GRAY': '#6c757d',
    'Grey': '#6c757d',
    'grey': '#6c757d',
    'GREY': '#6c757d'
  };

  const counts = {};
  const foundValues = new Set();

  // First pass: collect all unique values
  for (const task of tasks) {
    const field = task.custom_fields?.find(f => f.name.trim() === fieldName.trim());
    if (!field || field.value == null) continue;

    let value = null;

    // Handle different field types
    if (field.type === 'drop_down' && field.type_config?.options) {
      if (Array.isArray(field.type_config.options)) {
        const option = field.type_config.options[field.value];
        value = option?.name;
      } else if (typeof field.type_config.options === 'object') {
        value = field.type_config.options[field.value]?.name;
      }
    } else if (field.value_text) {
      // Sometimes ClickUp stores the display text separately
      value = field.value_text;
    } else if (typeof field.value === 'string') {
      value = field.value;
    } else if (typeof field.value === 'object' && field.value.name) {
      value = field.value.name;
    }

    if (value) {
      const cleanValue = value.toString().trim();
      foundValues.add(cleanValue);
      
      if (!counts[cleanValue]) {
        counts[cleanValue] = 0;
      }
      counts[cleanValue]++;
      
      console.log(`[DEBUG] Task ${task.name} - ${fieldName}: ${cleanValue}`);
    }
  }

  console.log(`🔍 Found unique values:`, [...foundValues]);
  console.log(`📊 Counts:`, counts);

  // Create labels, data, and colors arrays
  const labels = Object.keys(counts).filter(k => counts[k] > 0);
  const data = labels.map(l => counts[l]);
  const colors = labels.map(label => {
    const color = colorMap[label];
    if (!color) {
      console.warn(`⚠️ No color mapping found for "${label}", using default gray`);
      return '#6c757d'; // Default gray
    }
    console.log(`🎨 Mapping "${label}" to color: ${color}`);
    return color;
  });

  if (data.length === 0) {
    console.warn(`⚠️ No valid data found for "${fieldName}"`);
    return null;
  }

  console.log(`📈 Chart data summary:`);
  console.log(`   Labels: ${labels.join(', ')}`);
  console.log(`   Data: ${data.join(', ')}`);
  console.log(`   Colors: ${colors.join(', ')}`);

  return await generatePieChart(title, labels, data, colors, index);
}

// Enhanced debugging function to analyze field structure
function analyzeFieldStructure(tasks, fieldName) {
  console.log(`\n🔍 ANALYZING FIELD STRUCTURE for "${fieldName}"`);
  
  for (let i = 0; i < Math.min(5, tasks.length); i++) {
    const task = tasks[i];
    const field = task.custom_fields?.find(f => f.name.trim() === fieldName.trim());
    
    console.log(`\n📋 Task ${i + 1}: "${task.name.substring(0, 30)}..."`);
    
    if (!field) {
      console.log(`   ❌ Field "${fieldName}" not found`);
      continue;
    }
    
    console.log(`   📄 Field type: ${field.type}`);
    console.log(`   📄 Field value: ${JSON.stringify(field.value)}`);
    console.log(`   📄 Field value_text: ${field.value_text || 'N/A'}`);
    
    if (field.type_config) {
      console.log(`   📄 Type config: ${JSON.stringify(field.type_config, null, 2)}`);
    }
  }
}

module.exports = {
  generatePieChart,
  generateFixedColorCustomFieldChart,
  analyzeFieldStructure
};
