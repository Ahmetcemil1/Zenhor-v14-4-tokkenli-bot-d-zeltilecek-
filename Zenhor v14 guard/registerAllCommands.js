const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config");

// 📁 Alt klasör destekli komut dosyası toplayıcı
const getAllCommandFiles = (dir) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let result = [];
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      result = result.concat(getAllCommandFiles(fullPath));
    } else if (file.name.endsWith(".js")) {
      result.push(fullPath);
    }
  }
  return result;
};

(async () => {
  for (const bot of config.bots) {
    const rest = new REST({ version: "10" }).setToken(bot.token);
    const commands = [];
    const seenCommandNames = new Set();

    const commandsPath = path.join(__dirname, bot.commandsFolder);
    if (!fs.existsSync(commandsPath)) {
      console.warn(`⚠️ ${bot.name}: Komut klasörü bulunamadı: ${bot.commandsFolder}`);
      continue;
    }

    const commandFiles = getAllCommandFiles(commandsPath);
    for (const file of commandFiles) {
      const command = require(file);
      const commandName = command?.data?.name;

      if (!command?.data || !command?.execute) {
        console.warn(`⚠️ ${bot.name}: Hatalı komut dosyası (data/execute eksik): ${file}`);
        continue;
      }

      if (!command?.data?.toJSON) {
        console.warn(`❌ ${bot.name} hatalı komut (toJSON eksik): ${file}`);
        continue;
      }

      if (seenCommandNames.has(commandName)) {
        console.warn(`⚠️ ${bot.name}: Komut tekrarı atlandı: ${commandName}`);
        continue;
      }

      commands.push(command.data.toJSON());
      seenCommandNames.add(commandName);
      console.log(`✅ ${bot.name} komutu yüklendi: ${commandName}`);
    }

    try {
      console.log(`🚀 ${bot.name} komutları ${bot.guildId} sunucusuna yükleniyor...`);
      await rest.put(
        Routes.applicationGuildCommands(bot.clientId, bot.guildId),
        { body: commands }
      );
      console.log(`✅ ${bot.name} komutları başarıyla yüklendi (${commands.length})`);
    } catch (err) {
      console.error(`❌ ${bot.name} komutları yüklenemedi:`, err);
    }
  }
})();
