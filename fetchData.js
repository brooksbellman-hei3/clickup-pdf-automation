const axios = require("axios");

async function fetchClickUpTasks() {
  const listId = process.env.CLICKUP_LIST_ID;
  const token = process.env.CLICKUP_API_TOKEN;

  if (!listId || !token) {
    console.error("❌ Missing ClickUp configuration: LIST_ID or API_TOKEN");
    return [];
  }

  const url = `https://api.clickup.com/api/v2/list/${listId}/task?archived=false`;
  const headers = { Authorization: token };
  let tasks = [];

  try {
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${url}&page=${page}`, { headers });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ClickUp API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      tasks = tasks.concat(data.tasks);
      hasMore = !data.last_page;
      page++;
    }

    // ✅ Filter tasks by Event Date custom field (milliseconds since epoch)
    // After accumulating all tasks in `tasks`
const start = new Date('2025-04-01').getTime();
const end = new Date('2025-07-31').getTime();

const filtered = tasks.filter(task => {
  const eventField = task.custom_fields?.find(f => f.name === "Event Date");
  const timestamp = parseInt(eventField?.value);
  return timestamp && timestamp >= start && timestamp <= end;
});



    console.log(`✅ Fetched ${tasks.length} tasks`);
    console.log(`📎 Filtered down to ${filtered.length} tasks based on Event Date`);
    return filtered;

  } catch (error) {
    console.error("❌ Failed to fetch tasks:", error.message);
    return [];
  }
}

async function testClickUpConnection() {
  const listId = process.env.CLICKUP_LIST_ID;
  const token = process.env.CLICKUP_API_TOKEN;

  if (!listId || !token) {
    console.error("❌ Missing ClickUp configuration for test");
    return;
  }

  try {
    const headers = {
      Authorization: token,
    };
    const url = `https://api.clickup.com/api/v2/list/${listId}/task?archived=false`;

    const response = await axios.get(url, { headers });

    console.log(`✅ API connection successful. User: ${response.data?.user?.username || "Unknown"}`);
    console.log(`🔗 Fetching tasks from list: ${listId}`);
    console.log(`✅ Fetched ${response.data.tasks?.length || 0} tasks`);
    console.log("🛠 Full task payload:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ ClickUp API test failed:", error.message);
  }
}

module.exports = {
  fetchClickUpTasks,
  testClickUpConnection,
};
