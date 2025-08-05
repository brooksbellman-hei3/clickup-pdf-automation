const axios = require("axios");

async function fetchClickUpTasks() {
  const listId = process.env.CLICKUP_LIST_ID;
  const token = process.env.CLICKUP_API_TOKEN;

  if (!listId || !token) {
    console.error("❌ Missing ClickUp configuration: LIST_ID or API_TOKEN");
    return [];
  }

  const url = `https://api.clickup.com/api/v2/list/${listId}/task`;
  const headers = { 
    'Authorization': token,
    'Content-Type': 'application/json'
  };
  let allTasks = [];

  try {
    console.log(`🔗 Fetching tasks from list: ${listId}`);
    
    let page = 0;
    let hasMore = true;

    // Fetch all tasks with pagination
    while (hasMore) {
      const paginatedUrl = `${url}?archived=false&page=${page}&limit=100`;
      
      console.log(`📄 Fetching page ${page}...`);
      
      const response = await axios.get(paginatedUrl, { 
        headers,
        timeout: 10000 
      });
      
      const tasks = response.data.tasks || [];
      allTasks = allTasks.concat(tasks);
      
      // Check if we have more pages
      hasMore = !response.data.last_page && tasks.length > 0;
      page++;
      
      console.log(`📋 Page ${page - 1}: ${tasks.length} tasks`);
    }

    console.log(`✅ Total fetched: ${allTasks.length} tasks`);

    // ✅ Filter tasks by Event Date custom field
    const start = new Date('2025-07-10').getTime();
    const end = new Date('2025-07-31').getTime();

    console.log(`🔍 Filtering tasks between ${new Date(start).toDateString()} and ${new Date(end).toDateString()}`);

    const filteredTasks = allTasks.filter(task => {
      // Find the Event Date custom field
      const eventField = task.custom_fields?.find(field => {
        // Check for exact match or case-insensitive match
        return field.name === "Event Date" || 
               field.name?.toLowerCase() === "event date";
      });

      if (!eventField) {
        console.log(`⚠️ Task "${task.name}" has no Event Date field`);
        return false;
      }

      // Parse the timestamp - handle different possible formats
      let timestamp;
      if (eventField.value) {
        // Try parsing as number first (milliseconds)
        timestamp = parseInt(eventField.value);
        
        // If that results in a very small number, it might be in seconds
        if (timestamp < 1000000000000) {
          timestamp = timestamp * 1000; // Convert seconds to milliseconds
        }
        
        // If parsing as number failed, try as date string
        if (isNaN(timestamp)) {
          timestamp = new Date(eventField.value).getTime();
        }
      }

      if (!timestamp || isNaN(timestamp)) {
        console.log(`⚠️ Task "${task.name}" has invalid Event Date: ${eventField.value}`);
        return false;
      }

      const isInRange = timestamp >= start && timestamp <= end;
      
      if (isInRange) {
        console.log(`✅ Task "${task.name}" - Event Date: ${new Date(timestamp).toDateString()}`);
      } else {
        console.log(`❌ Task "${task.name}" - Event Date: ${new Date(timestamp).toDateString()} (outside range)`);
      }

      return isInRange;
    });

    console.log(`📎 Filtered down to ${filteredTasks.length} tasks based on Event Date`);
    
    // Debug: Show a sample of custom fields structure
    if (allTasks.length > 0) {
      console.log("🔍 Sample task custom fields structure:");
      console.log(JSON.stringify(allTasks[0].custom_fields, null, 2));
    }

    return filteredTasks;

  } catch (error) {
    console.error("❌ Error fetching ClickUp tasks:");
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
      
      // Handle specific error cases
      if (error.response.status === 401) {
        console.error("🔐 Authentication failed - check your API token");
        console.error("💡 Ensure your token has proper permissions for the list");
      } else if (error.response.status === 404) {
        console.error("📋 List not found - check your LIST_ID");
      }
    } else if (error.request) {
      console.error("🌐 Network error - no response received");
    } else {
      console.error(`⚠️ Request setup error: ${error.message}`);
    }
    
    return [];
  }
}

// Enhanced function to test API connection and inspect custom fields
async function testClickUpConnection() {
  const token = process.env.CLICKUP_API_TOKEN;
  const listId = process.env.CLICKUP_LIST_ID;
  
  if (!token) {
    console.error("❌ No API token provided");
    return false;
  }

  try {
    // Test with user endpoint first
    const userResponse = await axios.get('https://api.clickup.com/api/v2/user', {
      headers: { 
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log(`✅ API connection successful. User: ${userResponse.data.user.username}`);
    
    // Test list access and get sample task
    if (listId) {
      console.log(`🔗 Testing list access: ${listId}`);
      
      const listResponse = await axios.get(`https://api.clickup.com/api/v2/list/${listId}/task?limit=1`, {
        headers: { 
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      console.log(`✅ List accessible. Found ${listResponse.data.tasks?.length || 0} tasks`);
      
      // Show custom fields structure for debugging
      if (listResponse.data.tasks && listResponse.data.tasks.length > 0) {
        const sampleTask = listResponse.data.tasks[0];
        console.log("🔍 Sample task custom fields:");
        console.log(JSON.stringify(sampleTask.custom_fields, null, 2));
        
        // Look for Event Date field specifically
        const eventField = sampleTask.custom_fields?.find(field => 
          field.name === "Event Date" || field.name?.toLowerCase() === "event date"
        );
        
        if (eventField) {
          console.log(`📅 Found Event Date field:`, eventField);
        } else {
          console.log("⚠️ No Event Date field found in sample task");
          console.log("Available fields:", sampleTask.custom_fields?.map(f => f.name));
        }
      }
    }
    
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

module.exports = { fetchClickUpTasks, testClickUpConnection };
