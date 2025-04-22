// utils/detailedLog.js
const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "..", "logs", "security");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

function saveDetailedLog(executor, action, details) {
  const timestamp = new Date().toISOString();
  const filename = path.join(logsDir, `${timestamp.slice(0, 10)}.json`); // günlük dosya

  const logEntry = {
    timestamp,
    executor,
    action,
    details
  };

  let existingLogs = [];
  if (fs.existsSync(filename)) {
    try {
      existingLogs = JSON.parse(fs.readFileSync(filename, "utf8"));
    } catch (e) {
      existingLogs = [];
    }
  }

  existingLogs.push(logEntry);
  fs.writeFileSync(filename, JSON.stringify(existingLogs, null, 2));
  return logEntry;
}

module.exports = { saveDetailedLog };
