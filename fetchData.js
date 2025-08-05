const axios = require("axios");
const { diagnoseClickUpStructure } = require('./diagnostic');

async function fetchClickUpTasks() {
  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  const listId = process.env.CLICKUP_LIST_ID;

  if (!teamId || !token || !listId) {
    console.error("❌ Missing ClickUp configuration: TEAM_ID, LIST_ID or API_TOKEN");
    return [];  
  }

  const headers = { 
    'Authorization': token,
    'Content-Type': 'application/json'
  };

  try {
    console.log(`🔗 Fetching tasks from list: ${listId}`);
    
    const allTasks = [];
    let page = 0;
    const perPage = 100;
    let hasMore = true;
    
    while (hasMore) {
      try {
        console.log(`📡 Fetching page ${page}... (${allTasks.length} tasks so far)`);
        
        // Use proper ClickUp API endpoint for getting tasks from a specific list
        const url = `https://api.clickup.com/api/v2/list/${listId}/task`;
        
        const response = await axios.get(url, {
          headers,
          params: {
            archived: false,
            include_closed: true,
            subtasks: true,
            page: page,
            order_by: 'created',
            reverse: true
          },
          timeout: 30000
        });

        const data = response.data;
        const batch = data.tasks || [];

        console.log(`📄 Retrieved ${batch.length} tasks on page ${page}`);
        
        if (batch.length === 0) {
          hasMore = false;
          break;
        }
        
        allTasks.push(...batch);
        
        // Check if we got fewer tasks than the page size, indicating we're at the end
        if (batch.length < perPage) {
          hasMore = false;
        } else {
          page++;
        }
        
        // Add a small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error.message);
        
        // If it's a rate limit error, wait and retry
        if (error.response?.status === 429) {
          console.log("⏳ Rate limited, waiting 5 seconds...");
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue; // Retry the same page
        }
        
        // For other errors, break the loop
        break;
      }
    }

    console.log(`✅ Total fetched: ${allTasks.length} tasks`);

    // Run diagnostic if we got very few tasks
    if (allTasks.length <= 10) {
      console.log('\n🔍 Running diagnostic to find more tasks...');
      await diagnoseClickUpStructure();
    }

    // 🔍 DEBUG: Show all custom field names in the first few tasks
    console.log("\n🔍 DEBUGGING CUSTOM FIELDS:");
    allTasks.slice(0, 3).forEach((task, index) => {
      console.log(`\n📋 Task ${index + 1}: "${task.name}"`);
      console.log(`   Custom fields (${task.custom_fields?.length || 0} total):`);
      
      if (task.custom_fields && task.custom_fields.length > 0) {
        task.custom_fields.forEach(field => {
          console.log(`   - "${field.name}": ${field.value} (type: ${field.type})`);
        });
      } else {
        console.log("   - No custom fields found");
      }
    });

    // 🔍 DEBUG: Look for all possible Event Date variations
    console.log("\n🔍 SEARCHING FOR EVENT DATE FIELDS:");
    const eventDateVariations = [];
    allTasks.forEach(task => {
      task.custom_fields?.forEach(field => {
        if (field.name.toLowerCase().includes('event') || 
            field.name.toLowerCase().includes('date')) {
          eventDateVariations.push({
            name: field.name,
            value: field.value,
            type: field.type
          });
        }
      });
    });

    // Remove duplicates and show unique field names
    const uniqueFields = [...new Map(eventDateVariations.map(item => [item.name, item])).values()];
    uniqueFields.forEach(field => {
      console.log(`   Found: "${field.name}" = ${field.value} (type: ${field.type})`);
    });

    // 🔍 Let's try different date ranges to see what we find
    console.log("\n🔍 TESTING DIFFERENT DATE RANGES:");
    
    // Try a very wide range first (all of 2024 and 2025)
    const veryStart = new Date('2024-01-01').getTime();
    const veryEnd = new Date('2025-12-31').getTime();
    
    console.log(`Wide range: ${new Date(veryStart).toDateString()} to ${new Date(veryEnd).toDateString()}`);

    const wideFilterTasks = allTasks.filter(task => {
      const eventField = task.custom_fields?.find(field => {
        const lowerName = field.name?.toLowerCase() || '';
        return lowerName.includes('event') && lowerName.includes('date');
      });

      // 🔍 Ensure field and value exist
      const rawTimestamp = eventField?.value?.date;
      if (!rawTimestamp || isNaN(rawTimestamp)) {
        return false;
      }
      let timestamp = parseInt(rawTimestamp);
      if (timestamp < 1000000000000) {
        timestamp = timestamp * 1000;
      }

      const isInWideRange = timestamp >= veryStart && timestamp <= veryEnd;

      if (isInWideRange) {
        console.log(`   ✅ Found: "${task.name}" - Date: ${new Date(timestamp).toDateString()}`);
      }

      return isInWideRange;
    });

    console.log(`📊 Wide range found: ${wideFilterTasks.length} tasks`);

    // Now try your original range
    console.log(`🎯 Your original range: 2025-04-01 to 2025-07-31`);
    console.log(`🔍 Filtering by Event Date custom field...`);

    const start = new Date('2025-04-01').getTime();
    const end = new Date('2025-07-31').getTime();

    const filteredTasks = allTasks.filter(task => {
      const field = task.custom_fields?.find(f => f.name?.toLowerCase() === 'event date');
      if (!field || !field.value) return false;

      // Handle ClickUp date format: { value: { date: "1713052800000" } }
      let raw = field.value?.date || field.value;

      // Convert to number
      let timestamp = typeof raw === 'string' ? parseInt(raw) : raw;

      // Convert seconds to ms if needed
      if (timestamp < 1000000000000) {
        timestamp *= 1000;
      }

      if (isNaN(timestamp)) return false;

      const isInRange = timestamp >= start && timestamp <= end;
      if (isInRange) {
        console.log(`✅ "${task.name}" - Date: ${new Date(timestamp).toDateString()}`);
      } else {
        console.log(`❌ "${task.name}" - Date: ${new Date(timestamp).toDateString()}`);
      }

      return isInRange;
    });

    console.log(`✅ Tasks matching filter: ${filteredTasks.length}`);

    // If no tasks found, show some suggestions
    if (filteredTasks.length === 0 && allTasks.length > 0) {
      console.log("\n💡 SUGGESTIONS:");
      console.log("1. Check if the custom field name is exactly 'Event Date'");
      console.log("2. Verify your date range (April 1 - July 31, 2025)");
      console.log("3. Check if dates are stored in a different format");
      
      // Show what dates we actually found
      if (wideFilterTasks.length > 0) {
        console.log("4. Here are the actual dates found in your tasks:");
        wideFilterTasks.slice(0, 5).forEach(task => {
          const eventField = task.custom_fields?.find(field => {
            const lowerName = field.name?.toLowerCase() || '';
            return lowerName.includes('event') && lowerName.includes('date');
          });
          if (eventField) {
            const rawTimestamp = eventField?.value?.date;
            if (!rawTimestamp || isNaN(rawTimestamp)) {
              return;
            }
            let timestamp = parseInt(rawTimestamp);
            if (timestamp < 1000000000000) {
              timestamp = timestamp * 1000;
            }

            console.log(`   - "${task.name}": ${new Date(timestamp).toDateString()}`);
          }
        });
      }
    }

    return filteredTasks;

  } catch (error) {
    console.error("❌ Error fetching ClickUp tasks:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    return [];
  }
}

// Alternative function to fetch ALL tasks from multiple lists if needed
async function fetchAllClickUpTasks() {
  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;

  if (!teamId || !token) {
    console.error("❌ Missing ClickUp configuration: TEAM_ID or API_TOKEN");
    return [];  
  }

  const headers = { 
    'Authorization': token,
    'Content-Type': 'application/json'
  };

  try {
    console.log(`🔗 Fetching ALL tasks from team: ${teamId}`);
    
    const allTasks = [];
    let page = 0;
    const perPage = 100;
    let hasMore = true;
    
    while (hasMore) {
      try {
        console.log(`📡 Fetching page ${page}... (${allTasks.length} tasks so far)`);
        
        // Use team endpoint to get ALL tasks
        const url = `https://api.clickup.com/api/v2/team/${teamId}/task`;
        
        const response = await axios.get(url, {
          headers,
          params: {
            archived: false,
            include_closed: true,
            subtasks: true,
            page: page,
            order_by: 'created',
            reverse: false
          },
          timeout: 30000
        });

        const data = response.data;
        const batch = data.tasks || [];

        console.log(`📄 Retrieved ${batch.length} tasks on page ${page}`);
        
        if (batch.length === 0) {
          hasMore = false;
          break;
        }
        
        allTasks.push(...batch);
        
        // Check if we got fewer tasks than the page size
        if (batch.length < perPage) {
          hasMore = false;
        } else {
          page++;
        }
        
        // Add a small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error.message);
        
        if (error.response?.status === 429) {
          console.log("⏳ Rate limited, waiting 5 seconds...");
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        
        break;
      }
    }

    console.log(`✅ Total fetched from entire team: ${allTasks.length} tasks`);
    return allTasks;

  } catch (error) {
    console.error("❌ Error fetching all ClickUp tasks:", error.message);
    return [];
  }
}

async function testClickUpConnection() {
  const token = process.env.CLICKUP_API_TOKEN;

  if (!token) {
    console.error("❌ No API token provided");
    return false;
  }

  try {
    const response = await axios.get('https://api.clickup.com/api/v2/user', {
      headers: { 
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log(`✅ API connection successful. User: ${response.data.user.username}`);
    return true;
    
  } catch (error) {
    console.error("❌ API connection test failed:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

module.exports = { fetchClickUpTasks, fetchAllClickUpTasks, testClickUpConnection };
