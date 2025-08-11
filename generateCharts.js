const path = require("path");

// Chart generation without external dependencies
console.log("📊 Using SVG-only chart generation (no external dependencies)");

async function generatePieChart(title, labels, data, colors, index = 0) {
  const width = 800;
  const height = 600;

  console.log(`🎨 Creating chart: ${title}`);
  console.log(`   Labels: ${labels.join(', ')}`);
  console.log(`   Data: ${data.join(', ')}`);

  // Use SVG-only chart generation
  return await generateSimpleSVGChart(title, labels, data, colors, index, width, height);
}

// Simple SVG chart generation
async function generateSimpleSVGChart(title, labels, data, colors, index, width, height) {
  console.log(`   Generating simple SVG chart for: ${title}`);
  
  const total = data.reduce((sum, val) => sum + val, 0);
  const chartCenterX = width * 0.35;
  const chartCenterY = height * 0.5;
  const radius = Math.min(width * 0.2, height * 0.2);
  
  let currentAngle = -Math.PI / 2;
  const slices = data.map((value, i) => {
    const percentage = (value / total) * 100;
    const sliceAngle = (value / total) * 2 * Math.PI;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    
    const startX = chartCenterX + Math.cos(startAngle) * radius;
    const startY = chartCenterY + Math.sin(startAngle) * radius;
    const endX = chartCenterX + Math.cos(endAngle) * radius;
    const endY = chartCenterY + Math.sin(endAngle) * radius;
    
    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    
    const pathData = [
      `M ${chartCenterX} ${chartCenterY}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `Z`
    ].join(' ');
    
    currentAngle = endAngle;
    
    return {
      path: pathData,
      color: colors[i] || '#666',
      label: labels[i],
      value: value,
      percentage: percentage.toFixed(1)
    };
  });
  
  const legendX = width * 0.6;
  const legendStartY = height * 0.25;
  const labelHeight = 20;
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .title { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #000; }
          .legend-text { font-family: Arial, sans-serif; font-size: 12px; fill: #000; }
          .legend-value { font-family: Arial, sans-serif; font-size: 10px; fill: #666; }
        </style>
      </defs>
      
      <rect width="100%" height="100%" fill="white"/>
      
      <text x="${width / 2}" y="25" text-anchor="middle" class="title">${title}</text>
      
      ${slices.map(slice => `
        <path d="${slice.path}" fill="${slice.color}" stroke="white" stroke-width="2"/>
      `).join('')}
      
      ${slices.map((slice, i) => `
        <rect x="${legendX}" y="${legendStartY + i * labelHeight}" width="12" height="12" fill="${slice.color}"/>
        <text x="${legendX + 20}" y="${legendStartY + i * labelHeight + 9}" class="legend-text">${slice.label}</text>
        <text x="${legendX + 20}" y="${legendStartY + i * labelHeight + 9 + 12}" class="legend-value">${slice.value} (${slice.percentage}%)</text>
      `).join('')}
    </svg>
  `;
  
  console.log(`   Generated simple SVG chart`);
  
  return {
    title: title,
    filePath: `chart_${index}.svg`,
    buffer: Buffer.from(svg),
    base64Chart: Buffer.from(svg).toString('base64'),
    svg: svg
  };
}





async function generateTestChart() {
  console.log("🧪 Generating test chart...");
  const testData = {
    title: "Render Test Chart",
    labels: ["Working", "Test", "Data"],
    data: [40, 30, 30],
    colors: ["#28a745", "#17a2b8", "#ffc107"]
  };
  
  try {
    return await generatePieChart(testData.title, testData.labels, testData.data, testData.colors, 999);
  } catch (error) {
    console.error("❌ Test chart generation failed:", error);
    throw error;
  }
}

async function generateFixedColorCustomFieldChart(tasks, fieldName, title, index) {
  console.log(`\n🎨 Generating chart for field: "${fieldName}"`);

  if (!tasks || tasks.length === 0) {
    console.warn(`⚠️ No tasks provided for chart generation`);
    return null;
  }

  const colorMap = {
    'Green': '#28a745', 'green': '#28a745', 'GREEN': '#28a745',
    'Orange': '#fd7e14', 'orange': '#fd7e14', 'ORANGE': '#fd7e14',
    'Red': '#dc3545', 'red': '#dc3545', 'RED': '#dc3545',
    'Black': '#343a40', 'black': '#343a40', 'BLACK': '#343a40',
    'Black: Non-Delivery': '#6c757d',
    'Gray': '#6c757d', 'gray': '#6c757d', 'GRAY': '#6c757d',
    'Grey': '#6c757d', 'grey': '#6c757d', 'GREY': '#6c757d',
    'Blue': '#007bff', 'blue': '#007bff', 'BLUE': '#007bff',
    'Yellow': '#ffc107', 'yellow': '#ffc107', 'YELLOW': '#ffc107',
    'Purple': '#6f42c1', 'purple': '#6f42c1', 'PURPLE': '#6f42c1',
    'Pink': '#e83e8c', 'pink': '#e83e8c', 'PINK': '#e83e8c',
    'N/A': '#6c757d', 'n/a': '#6c757d', 'NA': '#6c757d',
    'No Data': '#6c757d', 'Empty': '#6c757d'
  };

  const counts = {};
  let processedTasks = 0;

  console.log(`🔍 Processing ${tasks.length} tasks for field "${fieldName}"`);

  for (const task of tasks) {
    if (!task.custom_fields) continue;
    const field = task.custom_fields.find(f => f.name && f.name.trim() === fieldName.trim());
    if (!field) continue;

    let value = null;

    // Debug: Show what we're working with
    console.log(`[DEBUG] Task: "${task.name?.substring(0, 30)}..."`);
    console.log(`[DEBUG] Field type: ${field.type}`);
    console.log(`[DEBUG] Field value: ${JSON.stringify(field.value)}`);
    console.log(`[DEBUG] Field value_text: "${field.value_text}"`);

    if (field.type === 'drop_down') {
      // Handle ClickUp dropdown fields
      if (field.type_config?.options) {
        console.log(`[DEBUG] Has type_config options:`, Object.keys(field.type_config.options));
        
        // Try different ways to get the dropdown value
        if (field.value !== null && field.value !== undefined && field.value !== 0) {
          // Look up the option by ID
          const options = field.type_config.options;
          if (Array.isArray(options)) {
            const option = options.find(opt => opt.id === field.value || opt.orderindex === field.value);
            value = option?.name || null;
            console.log(`[DEBUG] Found option from array: "${value}"`);
          } else if (typeof options === 'object') {
            // Options might be an object with keys as IDs
            const optionKey = Object.keys(options).find(key => 
              options[key].id === field.value || 
              key === String(field.value) ||
              options[key].orderindex === field.value
            );
            value = optionKey ? options[optionKey].name : null;
            console.log(`[DEBUG] Found option from object: "${value}"`);
          }
        }
        
        // If we still don't have a value, check value_text
        if (!value && field.value_text && field.value_text.trim() !== '' && field.value_text !== 'N/A') {
          value = field.value_text.trim();
          console.log(`[DEBUG] Using value_text: "${value}"`);
        }
        
        // Handle the case where value is 0 - this is the key fix!
        if (!value && field.value === 0) {
          const options = field.type_config.options;
          if (Array.isArray(options) && options.length > 0) {
            // For ClickUp, value: 0 typically means the first option (orderindex: 0)
            const zeroOption = options.find(opt => opt.orderindex === 0);
            if (zeroOption) {
              value = zeroOption.name;
              console.log(`[DEBUG] ✅ Using zero-index option: "${value}"`);
            } else {
              // If no orderindex 0, try first option in array
              value = options[0].name;
              console.log(`[DEBUG] ✅ Using first option: "${value}"`);
            }
          } else {
            value = "No Data";
            console.log(`[DEBUG] No options array, using "No Data"`);
          }
        }
        
        // SPECIAL CASE: If we still don't have a value but field.value is 0 and we have options
        // This handles the specific case in your logs where value: 0 should map to "Green"
        if (!value && field.value === 0 && field.type_config?.options) {
          const options = field.type_config.options;
          if (Array.isArray(options) && options.length > 0) {
            // Find the option with orderindex 0 (which should be "Green" in your case)
            const firstOption = options.find(opt => opt.orderindex === 0) || options[0];
            value = firstOption.name;
            console.log(`[DEBUG] 🎯 SPECIAL CASE: Using orderindex 0 option: "${value}"`);
          }
        }
      } else {
        console.log(`[DEBUG] No type_config options found`);
        // Fallback to value_text or treat as empty
        if (field.value_text && field.value_text.trim() !== '' && field.value_text !== 'N/A') {
          value = field.value_text.trim();
        } else {
          value = "No Data";
        }
      }
    } else {
      // Handle other field types
      if (field.value_text?.trim()) {
        value = field.value_text.trim();
      } else if (typeof field.value === 'string' && field.value.trim()) {
        value = field.value.trim();
      } else if (typeof field.value === 'object' && field.value?.name) {
        value = field.value.name;
      } else if (field.value != null && field.value !== '' && field.value !== 0) {
        value = String(field.value).trim();
      } else {
        value = "No Data";
      }
    }

    if (value && value !== 'null' && value !== 'undefined') {
      counts[value] = (counts[value] || 0) + 1;
      processedTasks++;
      console.log(`[DEBUG] ✅ Counted value: "${value}" (total count: ${counts[value]})`);
    } else {
      console.log(`[DEBUG] ❌ No valid value found for this task`);
    }
  }

  console.log(`\n📊 Final counts for "${fieldName}":`, counts);
  console.log(`📈 Processed ${processedTasks} tasks with data`);

  if (processedTasks === 0 || Object.keys(counts).length === 0) {
    console.warn(`⚠️ No valid data found for "${fieldName}" - generating test chart`);
    return await generateTestChart();
  }

  const labels = Object.keys(counts);
  const data = labels.map(l => counts[l]);
  const colors = labels.map(label => colorMap[label] || '#6c757d');

  console.log(`📈 Final chart data:`);
  console.log(`   Labels: [${labels.join(', ')}]`);
  console.log(`   Data: [${data.join(', ')}]`);
  console.log(`   Colors: [${colors.join(', ')}]`);

  return await generatePieChart(title, labels, data, colors, index);
}

// Enhanced field structure analysis
function analyzeFieldStructure(tasks, fieldName) {
  console.log(`\n🔍 DEEP ANALYSIS for "${fieldName}"`);
  if (!tasks || tasks.length === 0) {
    console.log(`❌ No tasks to analyze`);
    return;
  }

  // Look at more tasks to get a better picture
  for (let i = 0; i < Math.min(10, tasks.length); i++) {
    const task = tasks[i];
    console.log(`\n📋 Task ${i + 1}: "${task.name?.substring(0, 40)}..."`);

    if (!task.custom_fields) {
      console.log(`   ❌ No custom_fields array`);
      continue;
    }

    const field = task.custom_fields.find(f => f.name && f.name.trim() === fieldName.trim());
    if (!field) {
      console.log(`   ❌ Field "${fieldName}" not found`);
      continue;
    }

    console.log(`   📄 Field found!`);
    console.log(`   📄 Type: ${field.type}`);
    console.log(`   📄 Value: ${JSON.stringify(field.value)}`);
    console.log(`   📄 Value text: "${field.value_text}"`);

    if (field.type_config) {
      console.log(`   📄 Type config keys: ${Object.keys(field.type_config).join(', ')}`);
      
      if (field.type_config.options) {
        console.log(`   📄 Options type: ${Array.isArray(field.type_config.options) ? 'Array' : 'Object'}`);
        
        if (Array.isArray(field.type_config.options)) {
          console.log(`   📄 Options (${field.type_config.options.length} items):`);
          field.type_config.options.slice(0, 5).forEach((opt, idx) => {
            console.log(`      [${idx}] ID: ${opt.id}, Name: "${opt.name}", Order: ${opt.orderindex}`);
          });
        } else if (typeof field.type_config.options === 'object') {
          const optKeys = Object.keys(field.type_config.options);
          console.log(`   📄 Options object keys: ${optKeys.slice(0, 5).join(', ')}`);
          optKeys.slice(0, 3).forEach(key => {
            const opt = field.type_config.options[key];
            console.log(`      "${key}": ${JSON.stringify(opt)}`);
          });
        }
      }
    }
  }
}
module.exports = {
  generatePieChart,
  generateFixedColorCustomFieldChart,
  analyzeFieldStructure,
  generateTestChart
};
