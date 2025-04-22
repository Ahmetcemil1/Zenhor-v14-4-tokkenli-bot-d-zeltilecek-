const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../../config");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) return console.error("❌ Sunucu bulunamadı.");

  const channels = guild.channels.cache
    .sort((a, b) => a.position - b.position)
    .map(c => ({
      name: c.name,
      type: c.type,
      parent: c.parent?.name || null,
      position: c.position,
      topic: c.topic || null,
      nsfw: c.nsfw || false,
      rateLimitPerUser: c.rateLimitPerUser || 0
    }));

  const dir = path.join(__dirname, "../../backups");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  fs.writeFileSync(path.join(dir, "channels.json"), JSON.stringify(channels, null, 2));
  console.log(`✅ ${channels.length} kanal yedeklendi.`);
  process.exit();
});

client.login(config.bots[0].token);