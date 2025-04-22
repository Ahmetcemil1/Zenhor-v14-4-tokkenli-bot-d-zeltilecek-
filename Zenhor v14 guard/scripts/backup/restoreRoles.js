// scripts/backup/restoreRoles.js
const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../../config");

const rolesPath = path.join(__dirname, "../../backups/roles.json");
if (!fs.existsSync(rolesPath)) {
  console.log("❌ roles.json bulunamadı.");
  process.exit(1);
}

const rolesData = JSON.parse(fs.readFileSync(rolesPath, "utf-8"));
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once("ready", async () => {
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) return console.log("❌ Sunucu bulunamadı.");

  for (const role of rolesData) {
    try {
      const permissions = BigInt(role.permissions || "0");

      await guild.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        permissions: new PermissionsBitField(permissions),
        mentionable: role.mentionable
      });

      console.log(`✅ Rol geri yüklendi: ${role.name}`);
    } catch (err) {
      console.error(`❌ ${role.name} rolü oluşturulamadı:`, err.message);
    }
  }

  console.log(`\n✅ ${rolesData.length} rol başarıyla geri yüklendi.`);
  process.exit();
});

client.login(config.bots[0].token);