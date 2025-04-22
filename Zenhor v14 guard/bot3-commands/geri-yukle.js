const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("geri-yükle")
    .setDescription("Yedekten kanal, rol veya emoji geri yükle.")
    .addStringOption(opt =>
      opt.setName("tip")
        .setDescription("Geri yüklenecek şeyin tipi")
        .setRequired(true)
        .addChoices(
          { name: "kanal", value: "channel" },
          { name: "rol", value: "role" },
          { name: "emoji", value: "emoji" }
        )
    )
    .addStringOption(opt =>
      opt.setName("isim")
        .setDescription("Geri yüklenecek öğenin adı")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const tip = interaction.options.getString("tip");

    if (!tip) return interaction.respond([]);

    const backupsPath = path.join(__dirname, "../../backups");
    const fileMap = {
      channel: "channels.json",
      role: "roles.json",
      emoji: "emojis.json"
    };

    const fileName = fileMap[tip];
    if (!fileName) return interaction.respond([]);

    try {
      const filePath = path.join(backupsPath, fileName);
      const raw = fs.readFileSync(filePath, "utf-8");
      const dataList = JSON.parse(raw);

      const filtered = dataList
        .filter(item => item.name.toLowerCase().includes(focusedValue.toLowerCase()))
        .slice(0, 25)
        .map(item => ({ name: item.name, value: item.name }));

      await interaction.respond(filtered);
    } catch (err) {
      console.error("❌ Autocomplete veri yükleme hatası:", err);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const tip = interaction.options.getString("tip");
    const isim = interaction.options.getString("isim").toLowerCase();
    const guild = interaction.guild;
    const backupsPath = path.join(__dirname, "../../backups");

    try {
      if (tip === "channel") {
        const channels = JSON.parse(fs.readFileSync(path.join(backupsPath, "channels.json"), "utf-8"));
        const channelData = channels.find(c => c.name.toLowerCase() === isim);
        if (!channelData) return interaction.editReply("❌ Kanal bulunamadı.");

        const newChannel = await guild.channels.create({
          name: channelData.name,
          type: channelData.type,
          parent: channelData.parent || null,
          position: channelData.position
        });

        return interaction.editReply(`✅ Kanal yeniden oluşturuldu: <#${newChannel.id}>`);
      }

      if (tip === "role") {
        const roles = JSON.parse(fs.readFileSync(path.join(backupsPath, "roles.json"), "utf-8"));
        const roleData = roles.find(r => r.name.toLowerCase() === isim);
        if (!roleData) return interaction.editReply("❌ Rol bulunamadı.");

        const newRole = await guild.roles.create({
          name: roleData.name,
          color: roleData.color,
          hoist: roleData.hoist,
          permissions: BigInt(roleData.permissions),
          position: roleData.position
        });

        return interaction.editReply(`✅ Rol yeniden oluşturuldu: <@&${newRole.id}>`);
      }

      if (tip === "emoji") {
        const emojis = JSON.parse(fs.readFileSync(path.join(backupsPath, "emojis.json"), "utf-8"));
        const emojiData = emojis.find(e => e.name.toLowerCase() === isim);
        if (!emojiData) return interaction.editReply("❌ Emoji bulunamadı.");

        const emoji = await guild.emojis.create({
          name: emojiData.name,
          attachment: emojiData.url
        });

        return interaction.editReply(`✅ Emoji yeniden oluşturuldu: ${emoji.toString()}`);
      }

      return interaction.editReply("❌ Bilinmeyen işlem tipi.");
    } catch (error) {
      console.error("❌ Geri yükleme hatası:", error);
      return interaction.editReply("❌ Geri yükleme sırasında bir hata oluştu.");
    }
  }
};