const { SlashCommandBuilder } = require("discord.js");
const { setTestMode, isTestMode } = require("../sharedClient");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("testmodu")
    .setDescription("Test modunu aç/kapat")
    .addStringOption(opt =>
      opt.setName("durum")
        .setDescription("Aç veya kapa")
        .setRequired(true)
        .addChoices(
          { name: "Aç", value: "on" },
          { name: "Kapat", value: "off" }
        )
    ),

  async execute(interaction) {
    const durum = interaction.options.getString("durum");
    setTestMode(durum === "on");
    return interaction.reply({
      content: `🧪 Test modu başarıyla ${durum === "on" ? "açıldı" : "kapatıldı"}.`,
      flags: 64
    });
  }
};