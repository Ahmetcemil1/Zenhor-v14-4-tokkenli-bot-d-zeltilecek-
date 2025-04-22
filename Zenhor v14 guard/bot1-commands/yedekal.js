const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const { backupGuild } = require("../utils/backupSystem");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yedekal")
    .setDescription("📦 Sunucunun anlık yedeğini alır."),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // 🔒 Yetki kontrolü
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.editReply("❌ Bu komutu kullanmak için `Yönetici (Administrator)` iznine sahip olmalısınız.");
    }

    try {
      await backupGuild(interaction.guild);
      await interaction.editReply("✅ Sunucu yedeği başarıyla alındı.");
    } catch (err) {
      console.error("❌ Yedek alma hatası:", err);
      await interaction.editReply("❌ Yedek alma sırasında bir hata oluştu.");
    }
  }
};
