const { Client, GatewayIntentBits, ChannelType } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../../config");

const channelsData = JSON.parse(fs.readFileSync(path.join(__dirname, "../../backups/channels.json"), "utf-8"));
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) return console.error("❌ Sunucu bulunamadı.");

  const categories = new Map();
  for (const ch of channelsData.filter(c => c.type === ChannelType.GuildCategory)) {
    const cat = await guild.channels.create({
      name: ch.name,
      type: ChannelType.GuildCategory,
      position: ch.position
    });
    categories.set(ch.name, cat.id);
  }

  for (const ch of channelsData.filter(c => c.type !== ChannelType.GuildCategory)) {
    await guild.channels.create({
      name: ch.name,
      type: ch.type,
      parent: ch.parent ? categories.get(ch.parent) : null,
      position: ch.position,
      topic: ch.topic || undefined,
      nsfw: ch.nsfw,
      rateLimitPerUser: ch.rateLimitPerUser || 0
    }).catch(err => console.error(`❌ Kanal oluşturulamadı (${ch.name}):`, err));
  }

  console.log("🎉 Tüm kanallar geri yüklendi!");
  process.exit();
});

client.login(config.bots[0].token);