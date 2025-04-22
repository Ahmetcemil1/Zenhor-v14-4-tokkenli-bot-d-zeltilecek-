// utils/backupUtils.js
const fs = require("fs");
const path = require("path");

async function takeBackup(guild) {
  const backup = {
    channels: guild.channels.cache.map(c => ({ id: c.id, name: c.name, type: c.type })),
    roles: guild.roles.cache.map(r => ({ id: r.id, name: r.name, permissions: r.permissions.bitfield })),
    emojis: guild.emojis.cache.map(e => ({ id: e.id, name: e.name, animated: e.animated }))
  };

  const backupDir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

  const fileName = `backup_${guild.id}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  fs.writeFileSync(path.join(backupDir, fileName), JSON.stringify(backup, null, 2), "utf8");

  console.log(`✅ [BACKUP] ${fileName} kaydedildi.`);
}

module.exports = { takeBackup };