// statusManager.js
const { ActivityType } = require("discord.js");

// Her botun adıyla eşleşecek şekilde durum ve aktivite listesi
const botStatusList = {
  "İ N F A Z   I": {
    status: "dnd",
    activity: { name: "Zenhor <3", type: ActivityType.Watching }
  },
  "İ N F A Z   II": {
    status: "dnd",
    activity: { name: "Zenhor <3", type: ActivityType.Listening }
  },
  "İ N F A Z   III": {
    status: "dnd",
    activity: { name: "Zenhor <3", type: ActivityType.Playing }
  },
  "İ N F A Z   IV": {
    status: "dnd",
    activity: { name: "Zenhor <3", type: ActivityType.Competing }
  }
};

/**
 * Her botun ready eventinde çağırılacak fonksiyon.
 * @param {import('discord.js').Client} client - Discord.js Client nesnesi
 */
function setBotStatus(client) {
  const botName = client.user.username;
  const config = botStatusList[botName];

  if (!config) {
    console.warn(`⚠️ ${botName} için durum ayarı bulunamadı. botStatusList'e eklemeyi unutma.`);
    return;
  }

  client.user.setPresence({
    status: config.status,
    activities: [config.activity]
  });

  console.log(`🌐 ${botName} durumu ayarlandı: ${config.activity.name} (${config.status})`);
}

module.exports = { setBotStatus };