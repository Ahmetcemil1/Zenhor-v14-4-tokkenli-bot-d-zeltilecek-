const fs = require("fs").promises;
const path = require("path");

async function backupGuild(guild) {
  if (!guild) return;

  const backupPath = path.join(__dirname, "..", "backups", guild.id);

  try {
    await fs.mkdir(backupPath, { recursive: true });
  } catch (err) {
    console.error("❌ [Yedekleme] backups klasörü oluşturulamadı:", err);
    return;
  }

  // Kanallar
  try {
    const channels = guild.channels.cache.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      parent: c.parentId,
      position: c.rawPosition
    }));
    await fs.writeFile(path.join(backupPath, "channels.json"), JSON.stringify(channels, null, 2));
  } catch (err) {
    console.error("❌ [Yedekleme Hatası] Kanallar:", err);
  }

  // Roller
  try {
    const roles = guild.roles.cache
      .filter(r => r.name !== "@everyone")
      .map(r => ({
        id: r.id,
        name: r.name,
        color: r.color,
        hoist: r.hoist,
        permissions: r.permissions.bitfield.toString(),
        position: r.position
      }));
    await fs.writeFile(path.join(backupPath, "roles.json"), JSON.stringify(roles, null, 2));
  } catch (err) {
    console.error("❌ [Yedekleme Hatası] Roller:", err);
  }

  // Emojiler
  try {
    const emojis = guild.emojis.cache.map(e => ({
      id: e.id,
      name: e.name,
      url: e.url
    }));
    await fs.writeFile(path.join(backupPath, "emojis.json"), JSON.stringify(emojis, null, 2));
  } catch (err) {
    console.error("❌ [Yedekleme Hatası] Emojiler:", err);
  }

  // Üye Rolleri
  try {
    const members = await guild.members.fetch();
    const memberRoles = {};

    members.forEach(member => {
      const roles = member.roles.cache
        .filter(r => r.name !== "@everyone")
        .map(r => r.id);
      if (roles.length > 0) {
        memberRoles[member.id] = roles;
      }
    });

    await fs.writeFile(path.join(backupPath, "memberRoles.json"), JSON.stringify(memberRoles, null, 2));
  } catch (err) {
    console.error("❌ [Yedekleme Hatası] Üye roller:", err);
  }

  // Meta
  try {
    const meta = {
      guildName: guild.name,
      backupDate: new Date().toISOString(),
      createdBy: "BackupSystem"
    };
    await fs.writeFile(path.join(backupPath, "meta.json"), JSON.stringify(meta, null, 2));
  } catch (err) {
    console.error("❌ [Yedekleme Hatası] Meta yazılamadı:", err);
  }

  console.log(`✅ [Yedekleme] ${guild.name} sunucusu başarıyla yedeklendi.`);
}

async function restoreBackup(guild) {
  const backupPath = path.join(__dirname, "..", "backups", guild.id);

  try {
    await fs.access(backupPath);
  } catch {
    throw new Error("❌ [Geri Yükleme] Yedek klasörü bulunamadı.");
  }

  // Tüm kanalları sil
  try {
    await guild.channels.fetch();
    for (const ch of guild.channels.cache.values()) {
      await ch.delete().catch(() => {});
    }
  } catch (err) {
    console.error("❌ [Geri Yükleme] Kanallar silinemedi:", err);
  }

  // Tüm rolleri sil
  try {
    for (const role of guild.roles.cache.values()) {
      if (role.name !== "@everyone") {
        await role.delete().catch(() => {});
      }
    }
  } catch (err) {
    console.error("❌ [Geri Yükleme] Roller silinemedi:", err);
  }

  // Tüm emojileri sil
  try {
    for (const emoji of guild.emojis.cache.values()) {
      await emoji.delete().catch(() => {});
    }
  } catch (err) {
    console.error("❌ [Geri Yükleme] Emojiler silinemedi:", err);
  }

  const roleMap = new Map();

  // Roller
  try {
    const roles = JSON.parse(await fs.readFile(path.join(backupPath, "roles.json")));
    for (const r of roles.sort((a, b) => a.position - b.position)) {
      const newRole = await guild.roles.create({
        name: r.name,
        color: r.color,
        hoist: r.hoist,
        permissions: BigInt(r.permissions)
      });
      roleMap.set(r.id, newRole.id);
    }
  } catch (err) {
    console.error("❌ [Geri Yükleme] Roller yüklenemedi:", err);
  }

  // Kanallar
  try {
    const channels = JSON.parse(await fs.readFile(path.join(backupPath, "channels.json")));
    for (const ch of channels.sort((a, b) => a.position - b.position)) {
      await guild.channels.create({
        name: ch.name,
        type: ch.type,
        parent: ch.parent,
        position: ch.position
      }).catch(() => {});
    }
  } catch (err) {
    console.error("❌ [Geri Yükleme] Kanallar yüklenemedi:", err);
  }

  // Emojiler
  try {
    const emojis = JSON.parse(await fs.readFile(path.join(backupPath, "emojis.json")));
    for (const emoji of emojis) {
      await guild.emojis.create({ name: emoji.name, attachment: emoji.url }).catch(() => {});
    }
  } catch (err) {
    console.error("❌ [Geri Yükleme] Emojiler yüklenemedi:", err);
  }

  // Üyelere Roller
  try {
    const members = await guild.members.fetch();
    const memberRoles = JSON.parse(await fs.readFile(path.join(backupPath, "memberRoles.json")));

    for (const [id, roles] of Object.entries(memberRoles)) {
      const member = members.get(id);
      if (!member) continue;

      const newRoleIds = roles.map(r => roleMap.get(r)).filter(Boolean);
      if (newRoleIds.length > 0) {
        await member.roles.set(newRoleIds).catch(() => {});
      }
    }
  } catch (err) {
    console.error("❌ [Geri Yükleme] Üye rolleri atanamadı:", err);
  }

  console.log(`♻️ [Geri Yükleme] ${guild.name} sunucusu geri yüklendi.`);
}

// Otomatik günlük yedekleme
function startDailyBackupScheduler(guild) {
  if (!guild) return;

  setInterval(() => {
    backupGuild(guild);
  }, 24 * 60 * 60 * 1000); // 24 saat

  console.log(`🕒 [Yedekleme] Günlük otomatik yedekleme başlatıldı: ${guild.name}`);
}

module.exports = {
  backupGuild,
  restoreBackup,
  startDailyBackupScheduler
};
