const { REST, Routes } = require("discord.js");
const config = require("./config");

(async () => {
  for (const bot of config.bots) {
    const rest = new REST({ version: "10" }).setToken(bot.token);

    try {
      console.log(`🧹 ${bot.name} global komutları siliniyor...`);
      await rest.put(Routes.applicationCommands(bot.clientId), { body: [] });
      console.log(`✅ ${bot.name} global komutları temizlendi.`);
    } catch (err) {
      console.error(`❌ ${bot.name} silinirken hata:`, err);
    }
  }
})();