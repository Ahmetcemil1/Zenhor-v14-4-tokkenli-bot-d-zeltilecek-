const { AuditLogEvent } = require("discord.js");
const { isWhitelisted, logAction, dropPermissions } = require("../sharedClient");
const { saveDetailedLog } = require("../utils/detailedLog");
const { logSecurityEvent } = require("../utils/securityLogger");

module.exports = client => {

  // ✅ Üye atma koruması
  client.on("guildMemberRemove", async member => {
    const logs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 }).catch(() => {});
    const entry = logs?.entries.first();
    if (!entry || entry.executor?.bot || isWhitelisted(entry.executor.id)) return;
    if (entry.target.id !== member.id) return;

    await logAction(client, `👢 **${entry.executor.tag}**, izinsiz olarak **${member.user.tag}** kullanıcısını attı.`, entry.executor.id);
    await dropPermissions(entry.executor);

    saveDetailedLog(entry.executor.tag, "Üye Atma", { target: member.user.tag });
    await logSecurityEvent(client, "MEMBER_KICK", entry.executor, member, { target: member.user.tag });
  });

  // ✅ Ban atma koruması
  client.on("guildBanAdd", async ban => {
    const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(() => {});
    const entry = logs?.entries.first();
    if (!entry || entry.executor?.bot || isWhitelisted(entry.executor.id)) return;
    if (entry.target.id !== ban.user.id) return;

    await ban.guild.members.unban(ban.user.id).catch(() => {});
    await logAction(client, `⛔ **${entry.executor.tag}**, izinsiz olarak **${ban.user.tag}** kullanıcısını banladı. Ban kaldırıldı.`, entry.executor.id);
    await dropPermissions(entry.executor);

    saveDetailedLog(entry.executor.tag, "Ban Atma", { target: ban.user.tag });
    await logSecurityEvent(client, "BAN_ADD", entry.executor, ban.user, { target: ban.user.tag });
  });

  // ✅ Ban kaldırma koruması
  client.on("guildBanRemove", async ban => {
    const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 }).catch(() => {});
    const entry = logs?.entries.first();
    if (!entry || entry.executor?.bot || isWhitelisted(entry.executor.id)) return;
    if (entry.target.id !== ban.user.id) return;

    await ban.guild.members.ban(ban.user.id, {
      reason: "İzinsiz ban kaldırma, sistem tarafından tekrar banlandı."
    }).catch(() => {});
    
    await logAction(client, `🚫 **${entry.executor.tag}**, izinsiz olarak **${ban.user.tag}** kullanıcısının banını kaldırdı. Ban geri atıldı.`, entry.executor.id);
    await dropPermissions(entry.executor);

    saveDetailedLog(entry.executor.tag, "Ban Kaldırma", { target: ban.user.tag });
    await logSecurityEvent(client, "BAN_REMOVE", entry.executor, ban.user, { target: ban.user.tag });
  });

  // ✅ Rol verilme veya alınma koruması
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));
    if (addedRoles.size === 0 && removedRoles.size === 0) return;

    const logs = await oldMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 1 }).catch(() => {});
    const entry = logs?.entries.first();
    if (!entry || entry.executor?.bot || isWhitelisted(entry.executor.id)) return;
    if (entry.target.id !== newMember.id) return;

    const roleChanges = [];

    for (const role of addedRoles.values()) {
      await newMember.roles.remove(role.id).catch(() => {});
      roleChanges.push(`➕ \`${role.name}\``);
    }

    for (const role of removedRoles.values()) {
      await newMember.roles.add(role.id).catch(() => {});
      roleChanges.push(`➖ \`${role.name}\``);
    }

    if (roleChanges.length > 0) {
      await logAction(client, `🎭 **${entry.executor.tag}**, izinsiz olarak **${newMember.user.tag}** kullanıcısının rollerini değiştirdi:\n${roleChanges.join("\n")}`, entry.executor.id);
      await dropPermissions(entry.executor);

      saveDetailedLog(entry.executor.tag, "Rol Değişikliği", {
        target: newMember.user.tag,
        changes: roleChanges
      });

      await logSecurityEvent(client, "MEMBER_ROLE_UPDATE", entry.executor, newMember, {
        target: newMember.user.tag,
        changes: roleChanges
      });
    }
  });

  // ✅ Sunucuya kullanıcı eklendiğinde (davet)
  client.on("guildMemberAdd", async member => {
    const logs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 1 }).catch(() => {});
    const entry = logs?.entries.first();
    if (!entry || entry.executor?.bot || isWhitelisted(entry.executor.id)) return;

    await logAction(client, `🟢 **${entry.executor.tag}**, izinsiz olarak **${member.user.tag}** adlı kullanıcıyı davet etti.`, entry.executor.id);
    await dropPermissions(entry.executor);

    saveDetailedLog(entry.executor.tag, "Kullanıcı Ekleme", { addedUser: member.user.tag });
    await logSecurityEvent(client, "MEMBER_ADD", entry.executor, member, { addedUser: member.user.tag });
  });

};
