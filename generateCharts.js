const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require("fs");
const path = require("path");
const sharp = require('sharp');

async function generatePieChart(title, labels, data, colors, index = 0) {
  console.log(`\n🎨 Generating pie chart: "${title}"`);
  console.log(`📊 Input data:`, { labels, data, colors });

  const width = 800;
  const height = 600;

  const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
    width, 
    height,
    backgroundColour: 'white', // Ensure white background
    type: 'image/png',
    plugins: {
      modern: ['chartjs-plugin-datalabels'] // Add data labels plugin if needed
    }
  });

  // Ensure all colors are proper hex format
  const hexColors = colors.map(color => {
    if (color.startsWith('#') && color.length === 7) return color;
    if (color.startsWith('rgba')) {
      // Convert RGBA to hex
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
        backgroundColor: hexColors,
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false, // Disable animations for server-side rendering
      layout: {
        padding: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20
        }
      },
      plugins: {
        title: {
          display: true,
          text: title,
          font: { 
            size: 20,
            weight: 'bold'
          },
          color: '#000000',
          padding: {
            top: 10,
            bottom: 30
          }
        },
        legend: {
          display: true,
          position: "right",
          labels: {
            font: { size: 14 },
            color: '#000000',
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          enabled: false // Disable tooltips for static image
        }
      },
      elements: {
        arc: {
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      }
    }
  };

  try {
    console.log(`🎨 Rendering chart with HEX colors:`, hexColors);

    // Generate the chart buffer
    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration, 'image/png');
    console.log(`📊 Chart buffer size: ${buffer.length} bytes`);

    if (buffer.length === 0) {
      console.error(`❌ Chart buffer is empty!`);
      return null;
    }

    const filename = `chart_${index}_${Date.now()}.png`;
    const outputPath = path.join(__dirname, filename);

    // Write the buffer to file
    const jpegBuffer = await sharp(buffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    const filename = `chart_${index}_${Date.now()}.jpg`; // note: .jpg extension
    const outputPath = path.join(__dirname, filename);

    fs.writeFileSync(outputPath, jpegBuffer);


    
    // Verify the file was written correctly
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`✅ Chart saved: ${outputPath} (${stats.size} bytes)`);
      console.log(`🎨 HEX Colors used: ${hexColors.join(', ')}`);
      
      // Additional verification - try to read the file back
      const testBuffer = fs.readFileSync(outputPath);
      if (testBuffer.length !== buffer.length) {
        console.warn(`⚠️ File size mismatch: written=${buffer.length}, read=${testBuffer.length}`);
      } else {
        console.log(`✅ File verification passed`);
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
    'Black: Non-Delivery': '#6c757d', // Different shade for non-delivery
    'Gray': '#6c757d',
    'gray': '#6c757d',
    'GRAY': '#6c757d',
    'Grey': '#6c757d',
    'grey': '#6c757d',
    'GREY': '#6c757d',
    'Blue': '#007bff',
    'blue': '#007bff',
    'BLUE': '#007bff',
    'Yellow': '#ffc107',
    'yellow': '#ffc107',
    'YELLOW': '#ffc107',
    'Purple': '#6f42c1',
    'purple': '#6f42c1',
    'PURPLE': '#6f42c1',
    'Pink': '#e83e8c',
    'pink': '#e83e8c',
    'PINK': '#e83e8c'
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
