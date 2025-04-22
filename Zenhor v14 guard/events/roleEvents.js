const fs = require("fs");
const path = require("path");
const { isWhitelisted, logAction, dropPermissions, hasDangerousPerms } = require("../sharedClient");
const { saveDetailedLog } = require("../utils/detailedLog");
const { logSecurityEvent } = require("../utils/securityLogger");

const backupPath = path.join(__dirname, "..", "backups", "roles.json");

const getBackups = () => {
  try {
    if (fs.existsSync(backupPath)) {
      const data = fs.readFileSync(backupPath, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("[Yedek Okuma Hatası - Roller]", err);
  }
  return [];
};

module.exports = (client) => {
  client.on("roleDelete", async role => {
    if (global.restoring) return;

    const logs = await role.guild.fetchAuditLogs({ type: 30, limit: 1 }).catch(() => {});
    const entry = logs?.entries.first();
    if (!entry || entry.executor.bot || isWhitelisted(entry.executor.id)) return;

    const backups = getBackups();
    const backup = backups.find(r => r.name === role.name);

    if (backup) {
      await role.guild.roles.create({
        name: backup.name,
        color: backup.color,
        hoist: backup.hoist,
        permissions: BigInt(backup.permissions),
        position: backup.position
      }).catch(() => {});
    }

    await logAction(client, `🚨 **${entry.executor.tag}** adlı kullanıcı, **"${role.name}"** rolünü sildi. Otomatik olarak yedekten geri yüklendi.`, entry.executor.id);
    await dropPermissions(entry.executor);

    saveDetailedLog(entry.executor.tag, "Rol Silme", {
      role: role.name,
      restored: !!backup
    });

    await logSecurityEvent(client, "ROLE_DELETE", entry.executor, role, {
      role: role.name,
      restored: !!backup
    });
  });

  client.on("roleUpdate", async (oldRole, newRole) => {
    if (global.restoring) return;

    const logs = await newRole.guild.fetchAuditLogs({ type: 31, limit: 1 }).catch(() => {});
    const entry = logs?.entries.first();
    if (!entry || entry.executor.bot || isWhitelisted(entry.executor.id)) return;

    const backups = getBackups();
    const backup = backups.find(r => r.id === oldRole.id || r.name === oldRole.name);
    const changes = [];

    const dangerousPerms = ["Administrator", "ManageRoles", "ManageChannels", "BanMembers", "KickMembers"];

    for (const perm of dangerousPerms) {
      if (!oldRole.permissions.has(perm) && newRole.permissions.has(perm)) {
        changes.push(`🛑 **${perm}** izni eklendi!`);
      }
    }

    if (oldRole.name !== newRole.name)
      changes.push(`📛 İsim: \`${oldRole.name}\` → \`${newRole.name}\``);
    if (oldRole.color !== newRole.color)
      changes.push(`🎨 Renk: \`${oldRole.color}\` → \`${newRole.color}\``);
    if (oldRole.hoist !== newRole.hoist)
      changes.push(`📌 Ayrı gösterme: \`${oldRole.hoist}\` → \`${newRole.hoist}\``);
    if (oldRole.mentionable !== newRole.mentionable)
      changes.push(`🔔 Etiketlenebilir: \`${oldRole.mentionable}\` → \`${newRole.mentionable}\``);

    if (changes.length > 0) {
      const restoreData = backup ? {
        name: backup.name,
        color: backup.color,
        hoist: backup.hoist,
        mentionable: backup.mentionable,
        permissions: BigInt(backup.permissions)
      } : {
        name: oldRole.name,
        color: oldRole.color,
        hoist: oldRole.hoist,
        mentionable: oldRole.mentionable,
        permissions: oldRole.permissions
      };

      await newRole.edit(restoreData).catch(() => {});

      await logAction(client, `⚠️ **${entry.executor.tag}**, **${oldRole.name}** rolünde değişiklik yaptı ve geri alındı:\n\n${changes.join("\n")}`, entry.executor.id);
      await dropPermissions(entry.executor);

      saveDetailedLog(entry.executor.tag, "Rol Güncelleme", {
        role: oldRole.name,
        changes
      });

      await logSecurityEvent(client, "ROLE_UPDATE", entry.executor, newRole, {
        role: oldRole.name,
        changes
      });
    }
  });

  client.on("roleCreate", async role => {
    if (global.restoring) return;

    const logs = await role.guild.fetchAuditLogs({ type: 30, limit: 1 }).catch(() => {});
    const entry = logs?.entries.first();
    if (!entry || entry.executor.bot || isWhitelisted(entry.executor.id)) return;

    const backups = getBackups();
    const isKnownRole = backups.some(r => r.id === role.id || r.name === role.name);

    if (hasDangerousPerms(role)) {
      await role.delete().catch(() => {});
      await logAction(client, `⚠️ **${entry.executor.tag}**, tehlikeli bir rol oluşturdu (**"${role.name}"**) ve silindi.`, entry.executor.id);
      await dropPermissions(entry.executor);

      saveDetailedLog(entry.executor.tag, "Tehlikeli Rol Oluşturma", { role: role.name });
      await logSecurityEvent(client, "ROLE_CREATE_DANGEROUS", entry.executor, role, {
        role: role.name
      });

    } else if (!isKnownRole) {
      await role.delete().catch(() => {});
      await logAction(client, `⛔ **${entry.executor.tag}**, izinsiz olarak **"${role.name}"** rolünü oluşturdu. Rol silindi.`, entry.executor.id);
      await dropPermissions(entry.executor);

      saveDetailedLog(entry.executor.tag, "İzinsiz Rol Oluşturma", { role: role.name });
      await logSecurityEvent(client, "ROLE_CREATE_UNKNOWN", entry.executor, role, {
        role: role.name
      });

    } else {
      await logAction(client, `✅ **${entry.executor.tag}**, yedeklerde bulunan bir rol olan **"${role.name}"** rolünü oluşturdu.`, entry.executor.id);
      saveDetailedLog(entry.executor.tag, "Yedekten Rol Oluşturma", { role: role.name });
      await logSecurityEvent(client, "ROLE_CREATE_KNOWN", entry.executor, role, {
        role: role.name
      });
    }
  });
};
