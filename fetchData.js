const axios = require('axios');

async function fetchClickUpTasks() {
  const listId = process.env.CLICKUP_LIST_ID;
  const token = process.env.CLICKUP_API_TOKEN;
  
  if (!listId || !token) {
    console.error("❌ Missing ClickUp configuration: LIST_ID or API_TOKEN");
    return [];
  }

  const url = `https://api.clickup.com/api/v2/team/10507825/task?list_ids[]=${listId}&archived=true&subtasks=true`;

  try {
    console.log(`🔗 Fetching tasks from list: ${listId}`);
    
    const response = await axios.get(url, {
      headers: { 
        'Authorization': token,  // Keep your current format if it works
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`✅ Fetched ${response.data.tasks?.length || 0} tasks`);
    console.log("🛠 Full task payload:", JSON.stringify(response.data, null, 2));
    return response.data.tasks || [];
    
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
