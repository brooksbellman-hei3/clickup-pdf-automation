const axios = require("axios");

async function fetchClickUpTasks() {
  const listId = process.env.CLICKUP_LIST_ID;
  const token = process.env.CLICKUP_API_TOKEN;

  if (!listId || !token) {
    console.error("❌ Missing ClickUp configuration: LIST_ID or API_TOKEN");
    return [];
  }

  // Simple approach: get a large batch without pagination
  const url = `https://api.clickup.com/api/v2/list/${listId}/task?archived=false&limit=1000`;
  const headers = { 
    'Authorization': token,
    'Content-Type': 'application/json'
  };

  try {
    console.log(`🔗 Fetching tasks from list: ${listId}`);
    
    const response = await axios.get(url, { 
      headers,
      timeout: 15000 // 15 second timeout
    });
    
    const allTasks = response.data.tasks || [];
    console.log(`✅ Fetched ${allTasks.length} tasks`);

    // ✅ Filter tasks by Event Date custom field
    const start = new Date('2025-04-01').getTime();
    const end = new Date('2025-07-31').getTime();

    console.log(`🔍 Filtering tasks between ${new Date(start).toDateString()} and ${new Date(end).toDateString()}`);

    const filteredTasks = allTasks.filter(task => {
      // Find the Event Date custom field
      const eventField = task.custom_fields?.find(field => {
        return field.name === "Event Date" || 
               field.name?.toLowerCase() === "event date";
      });

      if (!eventField || !eventField.value) {
        return false;
      }

      // Parse the timestamp
      let timestamp = parseInt(eventField.value);
      
      // If very small number, might be in seconds - convert to milliseconds
      if (timestamp < 1000000000000) {
        timestamp = timestamp * 1000;
      }
      
      // If parsing failed, try as date string
      if (isNaN(timestamp)) {
        timestamp = new Date(eventField.value).getTime();
      }

      if (!timestamp || isNaN(timestamp)) {
        return false;
      }

      return timestamp >= start && timestamp <= end;
    });

    console.log(`📎 Filtered down to ${filteredTasks.length} tasks based on Event Date`);
    
    // Show which tasks were selected (first 5)
    if (filteredTasks.length > 0) {
      console.log("📋 Selected tasks:");
      filteredTasks.slice(0, 5).forEach(task => {
        const eventField = task.custom_fields?.find(f => 
          f.name === "Event Date" || f.name?.toLowerCase() === "event date"
        );
        const date = eventField ? new Date(parseInt(eventField.value) * (parseInt(eventField.value) < 1000000000000 ? 1000 : 1)).toDateString() : 'No date';
        console.log(`  - ${task.name} (${date})`);
      });
      if (filteredTasks.length > 5) {
        console.log(`  ... and ${filteredTasks.length - 5} more`);
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
