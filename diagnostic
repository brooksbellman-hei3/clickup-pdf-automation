const axios = require("axios");

async function diagnoseClickUpStructure() {
  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  
  if (!teamId || !token) {
    console.error("❌ Missing ClickUp configuration: TEAM_ID or API_TOKEN");
    return;
  }

  const headers = { 
    'Authorization': token,
    'Content-Type': 'application/json'
  };

  try {
    console.log("🔍 DIAGNOSING YOUR CLICKUP STRUCTURE...\n");
    
    // 1. Get team info
    console.log("1️⃣ Getting team information...");
    const teamResponse = await axios.get(`https://api.clickup.com/api/v2/team`, { headers });
    const teams = teamResponse.data.teams;
    
    console.log(`Found ${teams.length} team(s):`);
    teams.forEach(team => {
      console.log(`   - ${team.name} (ID: ${team.id})`);
    });
    
    // 2. Get spaces for the team
    console.log("\n2️⃣ Getting spaces...");
    const spacesResponse = await axios.get(`https://api.clickup.com/api/v2/team/${teamId}/space`, { headers });
    const spaces = spacesResponse.data.spaces;
    
    console.log(`Found ${spaces.length} space(s):`);
    for (const space of spaces) {
      console.log(`   - ${space.name} (ID: ${space.id})`);
      
      // 3. Get folders in each space
      console.log(`     📁 Folders in "${space.name}":`);
      try {
        const foldersResponse = await axios.get(`https://api.clickup.com/api/v2/space/${space.id}/folder`, { headers });
        const folders = foldersResponse.data.folders;
        
        if (folders.length === 0) {
          console.log("       - No folders (folderless space)");
          
          // Get lists directly in space
          const spaceListsResponse = await axios.get(`https://api.clickup.com/api/v2/space/${space.id}/list`, { headers });
          const spaceLists = spaceListsResponse.data.lists;
          
          console.log(`       📝 Lists directly in space:`);
          for (const list of spaceLists) {
            const taskCount = await getTaskCount(list.id, headers);
            console.log(`         - ${list.name} (ID: ${list.id}) - ${taskCount} tasks`);
          }
        } else {
          for (const folder of folders) {
            console.log(`       - ${folder.name} (ID: ${folder.id})`);
            
            // 4. Get lists in each folder
            const listsResponse = await axios.get(`https://api.clickup.com/api/v2/folder/${folder.id}/list`, { headers });
            const lists = listsResponse.data.lists;
            
            console.log(`         📝 Lists in "${folder.name}":`);
            for (const list of lists) {
              const taskCount = await getTaskCount(list.id, headers);
              console.log(`           - ${list.name} (ID: ${list.id}) - ${taskCount} tasks`);
            }
          }
        }
      } catch (error) {
        console.log(`       ❌ Error getting folders: ${error.message}`);
      }
    }
    
    // 5. Check if your current list ID exists and get its details
    console.log("\n3️⃣ Checking your current list...");
    const currentListId = process.env.CLICKUP_LIST_ID;
    if (currentListId) {
      try {
        const listResponse = await axios.get(`https://api.clickup.com/api/v2/list/${currentListId}`, { headers });
        const list = listResponse.data;
        const taskCount = await getTaskCount(currentListId, headers);
        
        console.log(`Current list: "${list.name}" (ID: ${currentListId})`);
        console.log(`   - Status: ${list.status}`);
        console.log(`   - Tasks: ${taskCount}`);
        console.log(`   - Space: ${list.space?.name || 'Unknown'}`);
        console.log(`   - Folder: ${list.folder?.name || 'No folder'}`);
      } catch (error) {
        console.log(`❌ Error accessing list ${currentListId}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error during diagnosis:", error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
  }
}

async function getTaskCount(listId, headers) {
  try {
    // Just get first page to see total count quickly
    const response = await axios.get(
      `https://api.clickup.com/api/v2/list/${listId}/task?include_closed=true&archived=true&limit=1`, 
      { headers, timeout: 5000 }
    );
    
    // If there's a total count in response, use it, otherwise count what we can see
    const tasks = response.data.tasks || [];
    
    // For more accurate count, let's try the team endpoint too
    const teamId = process.env.CLICKUP_TEAM_ID;
    const teamResponse = await axios.get(
      `https://api.clickup.com/api/v2/team/${teamId}/task?list_ids[]=${listId}&include_closed=true&archived=true&limit=1`,
      { headers, timeout: 5000 }
    );
    
    const teamTasks = teamResponse.data.tasks || [];
    
    return `${Math.max(tasks.length, teamTasks.length)} (sample - actual count may be higher)`;
    
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Enhanced task fetcher that tries multiple approaches
async function fetchAllClickUpTasks() {
  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  const listId = process.env.CLICKUP_LIST_ID;

  if (!teamId || !token) {
    console.error("❌ Missing ClickUp configuration");
    return [];
  }

  const headers = { 
    'Authorization': token,
    'Content-Type': 'application/json'
  };

  console.log("\n🚀 TRYING MULTIPLE APPROACHES TO FETCH TASKS...\n");

  // Approach 1: List endpoint (what you were using)
  if (listId) {
    console.log("1️⃣ Trying list endpoint...");
    try {
      const listTasks = await fetchFromListEndpoint(listId, headers);
      console.log(`   Result: ${listTasks.length} tasks\n`);
      if (listTasks.length > 0) return listTasks;
    } catch (error) {
      console.log(`   Error: ${error.message}\n`);
    }
  }

  // Approach 2: Team endpoint (often more comprehensive)
  console.log("2️⃣ Trying team endpoint...");
  try {
    const teamTasks = await fetchFromTeamEndpoint(teamId, listId, headers);
    console.log(`   Result: ${teamTasks.length} tasks\n`);
    if (teamTasks.length > 0) return teamTasks;
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Approach 3: Space endpoint (if we can find spaces)
  console.log("3️⃣ Trying space endpoints...");
  try {
    const spaceTasks = await fetchFromSpaceEndpoints(teamId, headers);
    console.log(`   Result: ${spaceTasks.length} tasks\n`);
    return spaceTasks;
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  return [];
}

async function fetchFromListEndpoint(listId, headers) {
  const response = await axios.get(
    `https://api.clickup.com/api/v2/list/${listId}/task?include_closed=true&archived=true&subtasks=true&limit=100`,
    { headers }
  );
  return response.data.tasks || [];
}

async function fetchFromTeamEndpoint(teamId, listId, headers) {
  let url = `https://api.clickup.com/api/v2/team/${teamId}/task?include_closed=true&archived=true&subtasks=true&limit=100`;
  if (listId) {
    url += `&list_ids[]=${listId}`;
  }
  
  const response = await axios.get(url, { headers });
  return response.data.tasks || [];
}

async function fetchFromSpaceEndpoints(teamId, headers) {
  const spacesResponse = await axios.get(`https://api.clickup.com/api/v2/team/${teamId}/space`, { headers });
  const spaces = spacesResponse.data.spaces;
  
  let allTasks = [];
  
  for (const space of spaces) {
    try {
      const response = await axios.get(
        `https://api.clickup.com/api/v2/space/${space.id}/task?include_closed=true&archived=true&subtasks=true&limit=100`,
        { headers }
      );
      const spaceTasks = response.data.tasks || [];
      console.log(`     Space "${space.name}": ${spaceTasks.length} tasks`);
      allTasks.push(...spaceTasks);
    } catch (error) {
      console.log(`     Space "${space.name}": Error - ${error.message}`);
    }
  }
  
  return allTasks;
}

module.exports = { 
  diagnoseClickUpStructure, 
  fetchAllClickUpTasks,
  fetchClickUpTasks: fetchAllClickUpTasks // Alias for your existing code
};
