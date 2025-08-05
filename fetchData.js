const axios = require("axios");

async function fetchClickUpTasks() {
  const listId = process.env.CLICKUP_LIST_ID;
  const token = process.env.CLICKUP_API_TOKEN;

  if (!listId || !token) {
    console.error("❌ Missing ClickUp configuration: LIST_ID or API_TOKEN");
    return [];
  }

  const headers = {
    Authorization: token,
  };

  const url = `https://api.clickup.com/api/v2/list/${listId}/task?archived=false`;

  try {
    const response = await axios.get(url, { headers });
    const tasks = response.data.tasks || [];

    const filteredTasks = tasks.filter((task) => {
      const eventDateField = task.custom_fields?.find(
        (field) => field.name === "Event Date" && field.value
      );

      if (!eventDateField) return false;

      const timestamp = Number(eventDateField.value);
      const eventDate = new Date(timestamp);

      const start = new Date("2025-07-01");
      const end = new Date("2025-07-31");

      return eventDate >= start && eventDate <= end;
    });

    console.log(`✅ Fetched ${filteredTasks.length} tasks after filtering by Event Date`);
    return filteredTasks;
  } catch (error) {
    console.error("❌ Error fetching tasks from ClickUp:", error.message);
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
