// index.js
const path = require("path");
const config = require("./config");
const { createClient } = require("./sharedClient");


// Her botu sırayla başlat
config.bots.forEach((bot, index) => {
  const commandsFolder = `bot${index + 1}-commands`;
  console.log(`🚀 ${bot.name} botu başlatılıyor...`);
  createClient(bot, commandsFolder);
});

// 🔁 Otomatik yedekleme zamanlayıcısını başlat (sadece bir kez çalışır)
require("./scripts/backup/scheduler");