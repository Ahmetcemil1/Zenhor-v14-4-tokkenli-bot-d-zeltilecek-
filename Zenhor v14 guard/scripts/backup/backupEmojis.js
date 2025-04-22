// scripts/backup/backupEmojis.js
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../../config");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers],
});

client.once("ready", async () => {
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) {
    console.error("❌ Sunucu bulunamadı.");
    process.exit(1);
  }

  const emojis = guild.emojis.cache.map(e => ({
    name: e.name,
    id: e.id,
    url: e.url
  }));

  const backupPath = path.join(__dirname, "../../backups");
  if (!fs.existsSync(backupPath)) fs.mkdirSync(backupPath);

  fs.writeFileSync(
    path.join(backupPath, "emojis.json"),
    JSON.stringify(emojis, null, 2),
    "utf8"
  );

  console.log(`✅ ${emojis.length} emoji yedeklendi.`);
  process.exit();
});

client.login(config.bots[0].token);