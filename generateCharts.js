const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require("fs");
const path = require("path");
const sharp = require('sharp');

// Register Chart.js components properly - compatible with different versions
try {
  const Chart = require('chart.js');
  // Try the newer Chart.js v3+ approach first
  if (Chart.Chart && Chart.registerables) {
    Chart.Chart.register(...Chart.registerables);
  } else if (Chart.register && Chart.registerables) {
    Chart.register(...Chart.registerables);
  }
  // For older versions, Chart.js auto-registers components
} catch (error) {
  console.log('📊 Using Chart.js auto-registration (older version)');
}

async function generatePieChart(title, labels, data, colors, index = 0) {
  console.log(`\n🎨 Generating pie chart: "${title}"`);
  console.log(`📊 Input data:`, { labels, data, colors });

  if (!data || data.length === 0 || !labels || labels.length === 0) {
    console.error(`❌ Invalid data for chart: ${title}`);
    return null;
  }

  const width = 800;
  const height = 600;

  // Create ChartJS canvas with proper configuration
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
    width, 
    height,
    backgroundColour: '#ffffff', // Ensure white background
    chartCallback: (ChartJS) => {
      // Register any additional plugins here if needed
      try {
        if (ChartJS.defaults && ChartJS.defaults.font) {
          ChartJS.defaults.font.family = 'Arial, sans-serif';
          ChartJS.defaults.font.size = 12;
        } else if (ChartJS.defaults && ChartJS.defaults.global) {
          // Older Chart.js versions
          ChartJS.defaults.global.defaultFontFamily = 'Arial, sans-serif';
          ChartJS.defaults.global.defaultFontSize = 12;
        }
      } catch (err) {
        console.log('⚠️ Could not set Chart.js defaults:', err.message);
      }
    }
  });

  // Ensure all colors are proper hex format
  const hexColors = colors.map(color => {
    if (!color) return '#999999';
    
    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
      return color;
    }
    
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
    
    // Handle named colors
    const colorMap = {
      'red': '#FF0000',
      'green': '#00FF00',
      'blue': '#0000FF',
      'orange': '#FFA500',
      'yellow': '#FFFF00',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'black': '#000000',
      'gray': '#808080',
      'grey': '#808080',
      'white': '#FFFFFF'
    };
    
    return colorMap[color.toLowerCase()] || '#999999';
  });

  const configuration = {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: hexColors,
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBackgroundColor: hexColors.map(color => {
          // Slightly darken on hover
          const hex = color.replace('#', '');
          const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 20);
          const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 20);
          const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 20);
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        })
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false, // Disable animations for server-side rendering
      layout: {
        padding: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 150
        }
      },
      plugins: {
        title: {
          display: true,
          text: title,
          font: { 
            size: 24,
            weight: 'bold',
            family: 'Arial, sans-serif'
          },
          color: '#000000',
          padding: {
            top: 20,
            bottom: 30
          }
        },
        legend: {
          display: true,
          position: "right",
          labels: {
            font: { 
              size: 14,
              family: 'Arial, sans-serif'
            },
            color: '#000000',
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const meta = chart.getDatasetMeta(0);
                  const style = meta.controller.getStyle(i);
                  return {
                    text: `${label} (${data.datasets[0].data[i]})`,
                    fillStyle: style.backgroundColor,
                    strokeStyle: style.borderColor,
                    lineWidth: style.borderWidth,
                    pointStyle: 'circle',
                    hidden: isNaN(data.datasets[0].data[i]) || meta.data[i].hidden,
                    index: i
                  };
                });
              }
              return [];
            }
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
    },
    plugins: [{
      id: 'background',
      beforeDraw: (chart) => {
        try {
          const ctx = chart.canvas.getContext('2d');
          ctx.save();
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, chart.canvas.width, chart.canvas.height);
          ctx.restore();
        } catch (err) {
          console.log('⚠️ Background plugin error:', err.message);
        }
      }
    }]
  };

  try {
    console.log(`🎨 Rendering chart with HEX colors:`, hexColors);
    console.log(`📊 Data points:`, data);
    console.log(`🏷️ Labels:`, labels);

    // Generate the chart buffer
    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    console.log(`📊 Chart buffer size: ${buffer.length} bytes`);

    if (buffer.length === 0) {
      console.error(`❌ Chart buffer is empty!`);
      return null;
    }

    // Verify buffer contains valid image data
    const bufferStart = buffer.slice(0, 8);
    const isPNG = bufferStart[0] === 0x89 && bufferStart[1] === 0x50 && bufferStart[2] === 0x4E && bufferStart[3] === 0x47;
    
    if (!isPNG) {
      console.error(`❌ Generated buffer is not a valid PNG image`);
      console.log(`Buffer start:`, Array.from(bufferStart).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      return null;
    }

    const filename = `chart_${index}_${Date.now()}.jpg`;
    const outputPath = path.join(__dirname, filename);

    // Convert PNG to JPEG using Sharp with higher quality
    const jpegBuffer = await sharp(buffer)
      .jpeg({ 
        quality: 95,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();

    fs.writeFileSync(outputPath, jpegBuffer);
    
    // Verify the file was written correctly
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`✅ Chart saved: ${outputPath} (${stats.size} bytes)`);
      console.log(`🎨 HEX Colors used: ${hexColors.join(', ')}`);
      
      // Additional verification - try to read the file back
      const testBuffer = fs.readFileSync(outputPath);
      if (testBuffer.length === 0) {
        console.error(`❌ Saved file is empty: ${outputPath}`);
        return null;
      } else {
        console.log(`✅ File verification passed - ${testBuffer.length} bytes written`);
      }
    } else {
      console.error(`❌ Failed to save chart file: ${outputPath}`);
      return null;
    }
    
    return outputPath;
  } catch (error) {
    console.error(`❌ Error generating chart:`, error.message);
    console.error(error.stack);
    
    // Try to provide more specific error information
    if (error.message.includes('Canvas')) {
      console.error(`💡 Canvas-related error - this might be a ChartJS configuration issue`);
    }
    if (error.message.includes('render')) {
      console.error(`💡 Rendering error - check data format and chart configuration`);
    }
    
    return null;
  }
}

// Custom pie chart from a field with known fixed labels/colors
async function generateFixedColorCustomFieldChart(tasks, fieldName, title, index) {
  console.log(`\n🎨 Generating chart for field: "${fieldName}"`);
  
  if (!tasks || tasks.length === 0) {
    console.warn(`⚠️ No tasks provided for chart generation`);
    return null;
  }
  
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

  console.log(`🔍 Processing ${tasks.length} tasks...`);

  // First pass: collect all unique values
  for (const task of tasks) {
    if (!task.custom_fields) {
      console.log(`⚠️ Task "${task.name}" has no custom_fields`);
      continue;
    }

    const field = task.custom_fields.find(f => f.name && f.name.trim() === fieldName.trim());
    if (!field) {
      console.log(`⚠️ Field "${fieldName}" not found in task "${task.name}"`);
      continue;
    }

    let value = null;

    // Handle different field types more robustly
    if (field.type === 'drop_down' && field.type_config && field.type_config.options) {
      // Handle dropdown fields
      if (Array.isArray(field.type_config.options)) {
        const option = field.type_config.options[field.value];
        value = option ? option.name : null;
      } else if (typeof field.type_config.options === 'object') {
        const option = field.type_config.options[field.value];
        value = option ? option.name : null;
      }
    } else if (field.value_text && field.value_text.trim()) {
      // Sometimes ClickUp stores the display text separately
      value = field.value_text.trim();
    } else if (typeof field.value === 'string' && field.value.trim()) {
      value = field.value.trim();
    } else if (typeof field.value === 'object' && field.value && field.value.name) {
      value = field.value.name;
    } else if (field.value !== null && field.value !== undefined && field.value !== '') {
      // Convert any other value to string
      value = String(field.value).trim();
    }

    if (value && value !== 'null' && value !== 'undefined') {
      foundValues.add(value);
      
      if (!counts[value]) {
        counts[value] = 0;
      }
      counts[value]++;
      
      console.log(`[DEBUG] Task "${task.name.substring(0, 30)}..." - ${fieldName}: "${value}"`);
    } else {
      console.log(`[DEBUG] Task "${task.name.substring(0, 30)}..." - ${fieldName}: NO VALUE (raw: ${JSON.stringify(field.value)})`);
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

  if (data.length === 0 || labels.length === 0) {
    console.warn(`⚠️ No valid data found for "${fieldName}"`);
    console.log(`📋 Processed ${tasks.length} tasks but found no values`);
    return null;
  }

  console.log(`📈 Chart data summary:`);
  console.log(`   Labels: ${labels.join(', ')}`);
  console.log(`   Data: ${data.join(', ')}`);
  console.log(`   Colors: ${colors.join(', ')}`);
  console.log(`   Total data points: ${data.reduce((a, b) => a + b, 0)}`);

  return await generatePieChart(title, labels, data, colors, index);
}

// Enhanced debugging function to analyze field structure
function analyzeFieldStructure(tasks, fieldName) {
  console.log(`\n🔍 ANALYZING FIELD STRUCTURE for "${fieldName}"`);
  
  if (!tasks || tasks.length === 0) {
    console.log(`❌ No tasks to analyze`);
    return;
  }
  
  for (let i = 0; i < Math.min(5, tasks.length); i++) {
    const task = tasks[i];
    const field = task.custom_fields?.find(f => f.name && f.name.trim() === fieldName.trim());
    
    console.log(`\n📋 Task ${i + 1}: "${task.name.substring(0, 30)}..."`);
    
    if (!task.custom_fields) {
      console.log(`   ❌ No custom_fields array`);
      continue;
    }
    
    if (!field) {
      console.log(`   ❌ Field "${fieldName}" not found`);
      console.log(`   📝 Available fields: ${task.custom_fields.map(f => f.name).join(', ')}`);
      continue;
    }
    
    console.log(`   📄 Field type: ${field.type}`);
    console.log(`   📄 Field value: ${JSON.stringify(field.value)}`);
    console.log(`   📄 Field value_text: ${field.value_text || 'N/A'}`);
    
    if (field.type_config) {
      console.log(`   📄 Type config keys: ${Object.keys(field.type_config).join(', ')}`);
      if (field.type_config.options) {
        console.log(`   📄 Available options: ${JSON.stringify(field.type_config.options, null, 2)}`);
      }
    }
  }
}

module.exports = {
  generatePieChart,
  generateFixedColorCustomFieldChart,
  analyzeFieldStructure
};
