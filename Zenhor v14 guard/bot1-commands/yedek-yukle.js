const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const { backupGuild, restoreBackup } = require("../utils/backupSystem");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yedek-yukle")
    .setDescription("♻️ Mevcut yedeği geri yükler (roller, kanallar, emojiler, üyelerin rolleri)."),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // 🔒 Yetki kontrolü
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.editReply("❌ Bu komutu kullanmak için `Yönetici (Administrator)` iznine sahip olmalısınız.");
    }

    const guild = interaction.guild;

    try {
      await interaction.editReply("📦 Önce mevcut yapı yedekleniyor...");
      await backupGuild(guild);

      await interaction.editReply("♻️ Yedek geri yükleniyor, lütfen bekleyin...");
      await restoreBackup(guild);

      await interaction.editReply("✅ Yedek başarıyla geri yüklendi.");
    } catch (err) {
      console.error("❌ Geri yükleme sırasında hata:", err);
      await interaction.editReply("❌ Geri yükleme sırasında bir hata oluştu.");
    }
  }
};
