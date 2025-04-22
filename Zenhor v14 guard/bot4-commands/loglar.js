const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getLogs } = require("../utils/logHistory");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("loglar")
    .setDescription("Son 10 koruma olayını gösterir")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const logs = getLogs();
    if (!logs.length) {
      return interaction.reply({ content: "🗒️ Kayıtlı log bulunamadı.", flags: 64  });
    }
    const list = logs.map(log => `• ${new Date(log.time).toLocaleString()} → ${log.message}`).join("\n");
    interaction.reply({ content: `📜 Son 10 Olay:\n${list}`, flags: 64 });
  }
};