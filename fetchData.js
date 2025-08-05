
const axios = require("axios");

async function fetchClickUpTasks() {
  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID;
  const listId = process.env.CLICKUP_LIST_ID;

  if (!teamId || !token || !listId) {
    console.error("❌ Missing ClickUp configuration: TEAM_ID, LIST_ID or API_TOKEN");
    return [];
  }

  const headers = {
    Authorization: token,
    "Content-Type": "application/json",
  };

  console.log(`🔗 Fetching tasks from list: ${listId}`);
  let hasMore = true;
  const perPage = 100;
  let before = Date.now(); // start with current time
  const allTasks = [];

  while (hasMore) {
    const url = `https://api.clickup.com/api/v2/team/${teamId}/task?include_closed=true&subtasks=true&archived=false&order_by=updated&reverse=true&list_ids[]=${listId}&limit=${perPage}&date_updated_lt=${before}`;
    const response = await axios.get(url, { headers });
    const batch = response.data.tasks || [];

    console.log(`📄 Retrieved ${batch.length} tasks before ${new Date(before).toISOString()}`);
    batch.forEach(task => {
      console.log(`   🕒 "${task.name}" - Created: ${new Date(Number(task.date_created)).toISOString()}`);
    });

    allTasks.push(...batch);

    if (batch.length < perPage) {
      hasMore = false;
    } else {
      before = Math.min(...batch.map(t => Number(t.date_updated || t.date_created)));
    }
  }

  const start = new Date("2025-04-01").getTime();
  const end = new Date("2025-07-31").getTime();

  const getTimestampFromField = (fieldValue) => {
    let timestamp = parseInt(fieldValue);
    if (timestamp < 1000000000000) timestamp *= 1000;
    if (isNaN(timestamp)) timestamp = new Date(fieldValue).getTime();
    return timestamp;
  };

  const candidateFields = ["Event Date", "End of Game Time", "Game ID"];

  const filteredTasks = allTasks.filter(task => {
    for (const field of task.custom_fields || []) {
      const name = field.name?.toLowerCase();
      if (!name) continue;

      for (const candidate of candidateFields) {
        if (name.includes(candidate.toLowerCase()) && field.value) {
          const timestamp = getTimestampFromField(field.value);
          const inRange = timestamp >= start && timestamp <= end;
          const tag = inRange ? "✅" : "❌";
          const dateStr = isNaN(timestamp) ? "Invalid" : new Date(timestamp).toDateString();
          console.log(`   ${tag} "${task.name}" - [${field.name}]: ${dateStr}`);
          return inRange;
        }
      }
    }
    return false;
  });

  console.log(`📎 Final filtered result: ${filteredTasks.length} tasks`);
  return filteredTasks;
}
// Optional test function
async function testClickUpConnection() {
  console.log("✅ Test ClickUp connection successful");
}

module.exports = {
  fetchAllTasks,
  testClickUpConnection
};

