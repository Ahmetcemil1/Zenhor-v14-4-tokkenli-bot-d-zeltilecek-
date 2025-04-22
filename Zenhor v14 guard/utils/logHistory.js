const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const logFolder = path.join(__dirname, "..", "logs");
const historyFile = path.join(logFolder, "history.json");
const securityLogFolder = path.join(logFolder, "security");

// 📁 Gerekli klasörleri oluştur
for (const dir of [logFolder, securityLogFolder]) {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      console.error(`❌ ${dir} klasörü oluşturulamadı:`, err);
    }
  }
}

// 📄 history.json dosyası oluştur
if (!fs.existsSync(historyFile)) {
  try {
    fs.writeFileSync(historyFile, JSON.stringify([]), "utf8");
  } catch (err) {
    console.error("🛑 Log dosyası oluşturulamadı:", err);
  }
}

/**
 * Son 10 logu saklar (kısa geçmiş listesi)
 * @param {string} message
 */
function addLog(message) {
  try {
    const logs = getLogs();
    logs.unshift({ message, timestamp: new Date().toISOString() });
    fs.writeFileSync(historyFile, JSON.stringify(logs.slice(0, 10), null, 2), "utf8");
  } catch (err) {
    console.error("addLog hatası:", err);
  }
}

/**
 * Kısa geçmiş loglarını alır
 * @returns {Array}
 */
function getLogs() {
  try {
    if (!fs.existsSync(historyFile)) return [];
    return JSON.parse(fs.readFileSync(historyFile, "utf8"));
  } catch (err) {
    console.error("getLogs hatası:", err);
    return [];
  }
}

/**
 * Güvenlik olaylarını detaylı kaydeder ve loglar
 * @param {Client} client
 * @param {string} eventType
 * @param {User} executor
 * @param {GuildChannel|GuildMember|Role|User} target
 * @param {Object} details
 * @returns {Object} logData
 */
function saveSecurityLog(client, eventType, executor, target, details = {}) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    eventType,
    executorId: executor?.id,
    executorTag: executor?.tag,
    targetId: target?.id,
    targetName: target?.name || target?.tag || target?.id,
    details
  };

  // JSON dosyasına yaz
  const filename = path.join(securityLogFolder, `${timestamp.slice(0, 10)}.json`);
  let existingLogs = [];

  if (fs.existsSync(filename)) {
    try {
      existingLogs = JSON.parse(fs.readFileSync(filename, "utf8"));
    } catch (e) {
      existingLogs = [];
    }
  }

  existingLogs.push(logData);
  fs.writeFileSync(filename, JSON.stringify(existingLogs, null, 2));

  // Kanal logu
  if (client.config?.systems?.logToChannel) {
    const logChannelName = client.config?.logChannelName;
    const logChannel = client.channels.cache.find(ch => ch.name === logChannelName);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle(`🚨 Güvenlik Olayı: ${eventType}`)
        .addFields(
          { name: "İşleyen", value: `${executor?.tag || "Bilinmiyor"} (${executor?.id || "?"})` },
          { name: "Hedef", value: `${target?.name || target?.tag || target?.id || "?"}` },
          { name: "Detaylar", value: Object.entries(details).map(([k, v]) => `• **${k}**: ${v}`).join("\n") || "Yok" }
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  }

  // DM bildirimi
  if (client.config?.systems?.logToUserDM && executor?.send) {
    executor.send({
      content: `🔐 Bir güvenlik olayı algılandı: **${eventType}**`,
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setTitle("🔍 Detaylar")
          .addFields(
            { name: "Hedef", value: target?.name || target?.tag || target?.id || "?" },
            { name: "Açıklama", value: Object.entries(details).map(([k, v]) => `• **${k}**: ${v}`).join("\n") || "Yok" }
          )
          .setTimestamp()
      ]
    }).catch(() => {});
  }

  return logData;
}

module.exports = {
  addLog,
  getLogs,
  saveSecurityLog
};