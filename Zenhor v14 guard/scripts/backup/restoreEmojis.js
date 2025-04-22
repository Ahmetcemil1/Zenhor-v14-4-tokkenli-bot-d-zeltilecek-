const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../../config");

const emojisData = JSON.parse(fs.readFileSync(path.join(__dirname, "../../backups/emojis.json"), "utf-8"));
const client = new Client({ intents: [GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) return console.error("❌ Sunucu bulunamadı.");

  for (const emoji of emojisData) {
    await guild.emojis.create({
      name: emoji.name,
      attachment: emoji.url
    }).catch(err => console.error(`❌ Emoji oluşturulamadı (${emoji.name}):`, err));
  }

  console.log(`✅ ${emojisData.length} emoji geri yüklendi.`);
  process.exit();
});

client.login(config.bots[0].token);