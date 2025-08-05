const axios = require('axios');

async function fetchClickUpTasks() {
  const listId = process.env.CLICKUP_LIST_ID;
  const token = process.env.CLICKUP_API_TOKEN;

  if (!listId || !token) {
    console.error("❌ Missing ClickUp configuration: LIST_ID or API_TOKEN");
    return [];
  }

  const allTasks = [];
  let page = 0;
  const pageSize = 100;

  try {
    while (true) {
      const url = `https://api.clickup.com/api/v2/list/${listId}/task?page=${page}&include_subtasks=true`;

      const response = await fetch(url, {
        headers: {
          Authorization: token
        }
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch tasks: ${response.statusText}`);
        break;
      }

      const data = await response.json();
      const tasks = data.tasks || [];

      allTasks.push(...tasks);

      if (data.last_page || tasks.length < pageSize) {
        break;
      }

      page++;
    }

    // Convert and filter tasks by Event Date custom field
    const filteredTasks = allTasks.filter(task => {
      const field = task.custom_fields?.find(f => f.name === "Event Date");
      if (!field || !field.value) return false;

      try {
        const timestamp = Number(field.value);
        const eventDate = new Date(timestamp);
        const start = new Date("2025-04-01");
        const end = new Date("2025-07-31");

        return eventDate >= start && eventDate <= end;
      } catch (e) {
        console.warn(`⚠️ Could not parse Event Date for task: ${task.name}`);
        return false;
      }
    });

    console.log(`✅ Fetched ${filteredTasks.length} tasks after filtering by Event Date`);
    return filteredTasks;

  } catch (error) {
    console.error("❌ Error fetching tasks:", error.message);
    return [];
  }
}

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

// Enhanced function to test API connection
async function testClickUpConnection() {
  const token = process.env.CLICKUP_API_TOKEN;
  
  if (!token) {
    console.error("❌ No API token provided");
    return false;
  }

  try {
    // Test with user endpoint first
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

module.exports = { fetchClickUpTasks, testClickUpConnection };
