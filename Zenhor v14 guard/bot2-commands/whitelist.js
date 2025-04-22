const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const {
  addToWhitelist,
  removeFromWhitelist,
  getWhitelist,
  clearWhitelist
} = require("../sharedClient");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Whitelist yönetimi")
    .addSubcommand(cmd =>
      cmd.setName("ekle")
        .setDescription("Whitelist'e kullanıcı ekle")
        .addUserOption(opt =>
          opt.setName("kullanıcı").setDescription("Kullanıcı").setRequired(true)))
    .addSubcommand(cmd =>
      cmd.setName("sil")
        .setDescription("Whitelist'ten kullanıcı çıkar")
        .addUserOption(opt =>
          opt.setName("kullanıcı").setDescription("Kullanıcı").setRequired(true)))
    .addSubcommand(cmd =>
      cmd.setName("liste").setDescription("Whitelist'teki kullanıcıları göster"))
    .addSubcommand(cmd =>
      cmd.setName("temizle").setDescription("Whitelist'i tamamen sıfırla"))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "ekle") {
      const user = interaction.options.getUser("kullanıcı");
      addToWhitelist(user.id);
      return interaction.reply({ content: "✅ Kullanıcı whitelist'e eklendi.", flags: 64 });
    }

    if (sub === "sil") {
      const user = interaction.options.getUser("kullanıcı");
      removeFromWhitelist(user.id);
      return interaction.reply({ content: `❌ ${user.tag} whitelist'ten çıkarıldı.`, flags: 64 });
    }

    if (sub === "liste") {
      const whitelist = getWhitelist();
      if (whitelist.length === 0) return interaction.reply({ content: "📭 Whitelist boş.", flags: 64 });
      const list = whitelist.map(id => `<@${id}> (\`${id}\`)`).join("\n");
      return interaction.reply({ content: `📋 Whitelist:\n${list}`, flags: 64 });
    }

    if (sub === "temizle") {
      clearWhitelist();
      return interaction.reply({ content: "🧹 Whitelist tamamen temizlendi.", flags: 64 });
    }
  }
};