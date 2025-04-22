const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../../config");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) return console.error("❌ Sunucu bulunamadı.");

  const roles = guild.roles.cache.map(role => ({
    id: role.id,
    name: role.name,
    color: role.color,
    hoist: role.hoist,
    position: role.position,
    permissions: role.permissions.bitfield.toString(), // BigInt -> string
    mentionable: role.mentionable
  }));

  const dir = path.join(__dirname, "../../backups");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  fs.writeFileSync(path.join(dir, "roles.json"), JSON.stringify(roles, null, 2));
  console.log(`✅ ${roles.length} rol yedeklendi.`);
  process.exit();
});

client.login(config.bots[0].token);