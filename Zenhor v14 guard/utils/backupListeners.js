const backupSystem = require('./backupSystem');

module.exports = (client) => {
  client.on("channelCreate", channel => {
    if (!channel.guild) return;
    backupGuild(channel.guild);
  });

  client.on("channelDelete", channel => {
    if (!channel.guild) return;
    backupGuild(channel.guild);
  });

  client.on("channelUpdate", (oldChannel, newChannel) => {
    if (!newChannel.guild) return;
    if (oldChannel.name !== newChannel.name || oldChannel.parentId !== newChannel.parentId)
      backupGuild(newChannel.guild);
  });

  client.on("roleCreate", role => {
    if (!role.guild) return;
    backupGuild(role.guild);
  });

  client.on("roleDelete", role => {
    if (!role.guild) return;
    backupGuild(role.guild);
  });

  client.on("roleUpdate", (oldRole, newRole) => {
    if (!newRole.guild) return;
    if (
      oldRole.name !== newRole.name ||
      oldRole.permissions.bitfield !== newRole.permissions.bitfield
    ) {
      backupGuild(newRole.guild);
    }
  });

  client.on("emojiCreate", emoji => {
    if (!emoji.guild) return;
    backupGuild(emoji.guild);
  });

  client.on("emojiDelete", emoji => {
    if (!emoji.guild) return;
    backupGuild(emoji.guild);
  });

  client.on("emojiUpdate", (oldEmoji, newEmoji) => {
    if (!newEmoji.guild) return;
    if (oldEmoji.name !== newEmoji.name) {
      backupGuild(newEmoji.guild);
    }
  });
};