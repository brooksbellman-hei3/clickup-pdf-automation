console.log("🚀 Starting both scheduler and server...");

require('./scheduler');

const app = require('./server');
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🌐 Web service is listening on port ${PORT}`);
});
