const axios = require("axios");
const { diagnoseClickUpStructure } = require('./diagnostic');

async function fetchClickUpTasks(specificListId = null, specificFolderId = null, skipDateFilter = false) {
  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  const listId = specificListId || process.env.CLICKUP_LIST_ID;
  const folderId = specificFolderId;

  if (!teamId || !token) {
    console.error("❌ Missing ClickUp configuration: TEAM_ID or API_TOKEN");
    return [];  
  }

  const headers = { 
    'Authorization': token,
    'Content-Type': 'application/json'
  };

  try {
    let searchDescription = '';
    let url = '';
    
    if (folderId) {
      // Search by folder - this will get tasks from all lists in the folder
      url = `https://api.clickup.com/api/v2/folder/${folderId}/task`;
      searchDescription = `folder: ${folderId}`;
    } else if (listId) {
      // Search by specific list - use the direct list endpoint
      url = `https://api.clickup.com/api/v2/list/${listId}/task`;
      searchDescription = `list: ${listId}`;
    } else {
      console.error("❌ Need either listId or folderId to search");
      return [];
    }
    
    console.log(`🔗 Fetching tasks from ${searchDescription}`);
    console.log(`📍 Using URL: ${url}`);
    
    const allTasks = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore) {
      try {
        console.log(`📡 Fetching page ${page}... (${allTasks.length} tasks so far)`);
        
        // Use consistent parameters for list endpoint
        const params = {
          archived: false,          // Start with false to get active tasks first
          include_closed: true,     // Include closed tasks
          subtasks: true,          // Include subtasks
          include_markdown_description: false,
          page: page,
          order_by: 'created',
          reverse: false
        };
        
        // If using list endpoint, don't include list_ids parameter
        // If using team endpoint, include list_ids parameter
        
        console.log(`🔧 Using params:`, JSON.stringify(params, null, 2));
        
        const response = await axios.get(url, {
            headers,
            params,
            timeout: 60000,  // Increase timeout
        });

        const data = response.data;
        const batch = data.tasks || [];

        console.log(`📄 Retrieved ${batch.length} tasks on page ${page}`);
        
        if (batch.length === 0) {
          console.log(`📋 No more tasks found on page ${page}`);
          hasMore = false;
          break;
        }
        
        allTasks.push(...batch);
        
        // ClickUp typically returns up to 100 tasks per page
        // If we get less than 100, we're likely at the end
        if (batch.length < 100) {
          console.log(`📋 Got ${batch.length} tasks (less than 100), likely at end`);
          hasMore = false;
        } else {
          page++;
        }
        
        // Add a small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error.message);
        
        // If it's a rate limit error, wait and retry
        if (error.response?.status === 429) {
          console.log("⏳ Rate limited, waiting 10 seconds...");
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue; // Retry the same page
        }
        
        // For other errors, log but continue if we have some tasks
        if (error.response?.status) {
          console.error(`HTTP ${error.response.status}: ${error.response.data?.err || 'Unknown error'}`);
        }
        
        // If we have some tasks, continue; otherwise break
        if (allTasks.length > 0) {
          console.log(`⚠️ Error on page ${page}, but continuing with ${allTasks.length} tasks found so far`);
          break;
        } else {
          throw error; // Re-throw if we have no tasks yet
        }
      }
    }

    console.log(`✅ Total fetched: ${allTasks.length} tasks`);

    // Now try to get archived tasks if we're still missing a lot
    if (allTasks.length < 1000) { // Adjust this threshold as needed
      console.log(`\n🗄️ Fetching archived tasks to get more data...`);
      try {
        const archivedTasks = await fetchArchivedTasks(url, headers);
        allTasks.push(...archivedTasks);
        console.log(`✅ Total after including archived: ${allTasks.length} tasks`);
      } catch (archiveError) {
        console.log(`⚠️ Could not fetch archived tasks: ${archiveError.message}`);
      }
    }

    // Run diagnostic if we got very few tasks
    if (allTasks.length <= 100) {
      console.log('\n🔍 Running diagnostic to find more tasks...');
      await diagnoseClickUpStructure();
    }

    // 🔍 DEBUG: Show custom field analysis
    console.log("\n🔍 ANALYZING CUSTOM FIELDS:");
    analyzeCustomFields(allTasks.slice(0, 5)); // Analyze first 5 tasks

    // Apply date filtering only if requested and not skipped
    if (!skipDateFilter) {
      console.log("\n🎯 APPLYING DATE FILTERS...");
      return applyDateFilters(allTasks);
    } else {
      console.log("\n⏭️ Skipping date filters, returning all tasks");
      return allTasks;
    }

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

// Helper function to fetch archived tasks
async function fetchArchivedTasks(baseUrl, headers) {
  console.log("🗄️ Fetching archived tasks...");
  const archivedTasks = [];
  let page = 0;
  let hasMore = true;
  
  while (hasMore && page < 10) { // Limit archived pages to prevent infinite loops
    try {
      const params = {
        archived: true,
        include_closed: true,
        subtasks: true,
        page: page,
        order_by: 'created',
        reverse: false
      };
      
      const response = await axios.get(baseUrl, {
        headers,
        params,
        timeout: 60000,
      });

      const batch = response.data.tasks || [];
      console.log(`📦 Retrieved ${batch.length} archived tasks on page ${page}`);
      
      if (batch.length === 0) {
        hasMore = false;
      } else {
        archivedTasks.push(...batch);
        if (batch.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.log(`⚠️ Error fetching archived page ${page}: ${error.message}`);
      break;
    }
  }
  
  return archivedTasks;
}

// Helper function to analyze custom fields
function analyzeCustomFields(tasks) {
  const fieldAnalysis = {};
  
  tasks.forEach((task, index) => {
    console.log(`\n📋 Task ${index + 1}: "${task.name.substring(0, 50)}..."`);
    
    if (task.custom_fields && task.custom_fields.length > 0) {
      task.custom_fields.forEach(field => {
        if (!fieldAnalysis[field.name]) {
          fieldAnalysis[field.name] = {
            type: field.type,
            hasValue: 0,
            noValue: 0,
            sampleValues: []
          };
        }
        
        if (field.value !== undefined && field.value !== null && field.value !== '') {
          fieldAnalysis[field.name].hasValue++;
          if (fieldAnalysis[field.name].sampleValues.length < 3) {
            fieldAnalysis[field.name].sampleValues.push(field.value);
          }
        } else {
          fieldAnalysis[field.name].noValue++;
        }
      });
    }
  });

  // Show analysis for date-related fields
  console.log("\n📊 DATE FIELD ANALYSIS:");
  Object.keys(fieldAnalysis).forEach(fieldName => {
    if (fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('time')) {
      const analysis = fieldAnalysis[fieldName];
      console.log(`   📅 "${fieldName}": ${analysis.hasValue} with values, ${analysis.noValue} without`);
      if (analysis.sampleValues.length > 0) {
        console.log(`      Sample values: ${analysis.sampleValues.join(', ')}`);
      }
    }
  });
}

// Helper function to apply date filters
function applyDateFilters(allTasks) {
  console.log(`🔍 Applying date filters to ${allTasks.length} tasks...`);
  
  // Define date range (April 1 - July 31, 2025)
  const start = Date.UTC(2025, 3, 1); // April 1, 2025
  const end = Date.UTC(2025, 6, 31, 23, 59, 59); // July 31, 2025
  
  console.log(`📅 Date range: ${new Date(start).toUTCString()} to ${new Date(end).toUTCString()}`);
  
  // Try multiple date field options
  const dateFields = ['End of Game Time', 'Event Date', 'date_created', 'date_updated'];
  
  let bestField = null;
  let bestFieldTasks = [];
  
  dateFields.forEach(fieldName => {
    console.log(`\n🔍 Trying field: "${fieldName}"`);
    
    const filteredTasks = allTasks.filter(task => {
      let timestamp = null;
      
      if (fieldName === 'date_created' || fieldName === 'date_updated') {
        // Built-in ClickUp fields
        timestamp = parseInt(task[fieldName]);
      } else {
        // Custom fields
        const field = task.custom_fields?.find(f => f.name === fieldName);
        if (!field || !field.value) return false;
        
        const raw = field.value?.date || field.value;
        timestamp = typeof raw === 'string' ? parseInt(raw) : raw;
      }
      
      if (!timestamp || isNaN(timestamp)) return false;
      
      // Ensure timestamp is in milliseconds
      if (timestamp < 1000000000000) timestamp *= 1000;
      
      return timestamp >= start && timestamp <= end;
    });
    
    console.log(`   Found ${filteredTasks.length} tasks in date range for "${fieldName}"`);
    
    if (filteredTasks.length > bestFieldTasks.length) {
      bestField = fieldName;
      bestFieldTasks = filteredTasks;
    }
  });
  
  if (bestField) {
    console.log(`\n✅ Best field: "${bestField}" with ${bestFieldTasks.length} tasks`);
    return bestFieldTasks;
  } else {
    console.log(`\n⚠️ No tasks found in date range. Showing sample dates from all tasks:`);
    
    // Show sample dates to help debug
    allTasks.slice(0, 10).forEach((task, i) => {
      const eventDateField = task.custom_fields?.find(f => f.name === 'Event Date');
      const endGameField = task.custom_fields?.find(f => f.name === 'End of Game Time');
      
      console.log(`   Task ${i+1}: "${task.name.substring(0, 30)}..."`);
      console.log(`      Created: ${new Date(parseInt(task.date_created)).toDateString()}`);
      if (eventDateField?.value) {
        const ts = parseInt(eventDateField.value) * (eventDateField.value < 1000000000000 ? 1000 : 1);
        console.log(`      Event Date: ${new Date(ts).toDateString()}`);
      }
      if (endGameField?.value) {
        const ts = parseInt(endGameField.value) * (endGameField.value < 1000000000000 ? 1000 : 1);
        console.log(`      End Game: ${new Date(ts).toDateString()}`);
      }
    });
    
    return [];
  }
}

// Function to fetch ALL tasks without any filters (for testing)
async function fetchAllTasksNoFilter(specificListId = null) {
  console.log("🌍 FETCHING ALL TASKS WITH NO FILTERS...");
  return await fetchClickUpTasks(specificListId, null, true); // skipDateFilter = true
}

// Function to fetch tasks from multiple lists or folders
async function fetchTasksFromMultipleSources(sources) {
  const allTasks = [];
  
  for (const source of sources) {
    console.log(`\n🎯 Fetching from ${source.type}: ${source.name} (ID: ${source.id})`);
    
    let tasks = [];
    if (source.type === 'list') {
      tasks = await fetchClickUpTasks(source.id, null);
    } else if (source.type === 'folder') {
      tasks = await fetchClickUpTasks(null, source.id);
    }
    
    console.log(`📊 Found ${tasks.length} tasks in ${source.name}`);
    allTasks.push(...tasks);
  }
  
  console.log(`\n✅ Total tasks from all sources: ${allTasks.length}`);
  return allTasks;
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

// Alternative function to fetch ALL tasks from team (if list approach fails)
async function fetchAllClickUpTasksFromTeam() {
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
    let hasMore = true;
    
    while (hasMore && page < 50) { // Safety limit
      try {
        console.log(`📡 Fetching team page ${page}... (${allTasks.length} tasks so far)`);
        
        // Use team endpoint to get ALL tasks
        const url = `https://api.clickup.com/api/v2/team/${teamId}/task`;
        
        const params = {
          archived: false,
          include_closed: true,
          subtasks: true,
          page: page,
          order_by: 'created',
          reverse: true
        };
        
        const response = await axios.get(url, {
          headers,
          params,
          timeout: 60000
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
        if (batch.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
        
        // Add a small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`❌ Error fetching team page ${page}:`, error.message);
        
        if (error.response?.status === 429) {
          console.log("⏳ Rate limited, waiting 10 seconds...");
          await new Promise(resolve => setTimeout(resolve, 10000));
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

module.exports = { 
  fetchClickUpTasks, 
  fetchAllTasksNoFilter,
  fetchAllClickUpTasksFromTeam,
  fetchTasksFromMultipleSources,
  testClickUpConnection 
};
