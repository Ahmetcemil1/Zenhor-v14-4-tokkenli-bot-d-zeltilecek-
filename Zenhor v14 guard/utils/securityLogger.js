const fs = require("fs");
const path = require("path");

function logSecurityEvent(client, type, targetUser, executorUser, details = {}) {
  const logPath = path.join(__dirname, "../logs/securityEvents.json");

  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    bot: client.user?.tag,
    target: targetUser?.tag,
    executor: executorUser?.tag,
    details,
  };

  try {
    const data = fs.existsSync(logPath)
      ? JSON.parse(fs.readFileSync(logPath))
      : [];

    data.push(logEntry);
    fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("🚨 Güvenlik log dosyasına yazılamadı:", err);
  }
}

module.exports = { logSecurityEvent };