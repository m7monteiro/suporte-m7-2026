const Discord = require("discord.js");
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "mylogs",
  description: "Veja seus logs de tickets assumidos",
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    // CORREÇÃO TIMEOUT: Responder imediatamente
    await interaction.deferReply({ ephemeral: true });

    const logsFilePath = path.join(__dirname, "..", "..", "json", "logs.json");
    let logs;
    try {
        const rawData = fs.readFileSync(logsFilePath, 'utf-8');
        logs = JSON.parse(rawData);
    } catch (e) {
        return interaction.editReply({ content: "❌ Erro ao ler arquivo de logs ou arquivo vazio." });
    }

    const idDoUsuario = interaction.user.id;
    const userLogs = logs[idDoUsuario];

    if (!userLogs || userLogs.length === 0) {
      return interaction.editReply({ content: "Você não possui nenhum log de ticket." });
    }

    let currentPage = 0;
    const maxPage = userLogs.length - 1;

    const generateEmbed = (page) => {
      const log = userLogs[page];
      const embed = new Discord.EmbedBuilder()
        .setTitle(`Logs de Tickets - Página ${page + 1}/${userLogs.length}`)
        .setColor("Blue")
        .addFields(
          { name: "Dono do Ticket", value: `<@${log.dono_ticket}>`, inline: true },
          { name: "Fechou o Ticket", value: `<@${log.fechou_ticket}>`, inline: true },
          { name: "Assumido por", value: log.assumido === "Ninguem assumiu" ? "`Ninguém Assumiu`" : `<@${log.assumido}>`, inline: true },
          { name: "Motivo", value: `\`${log.motivo}\``, inline: false },
          { name: "Código", value: `\`${log.codigo}\``, inline: true }
        );
      return embed;
    };

    const row = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId("previousPage")
        .setLabel("Anterior")
        .setStyle(Discord.ButtonStyle.Primary)
        .setDisabled(true),
      new Discord.ButtonBuilder()
        .setCustomId("nextPage")
        .setLabel("Próxima")
        .setStyle(Discord.ButtonStyle.Primary)
        .setDisabled(userLogs.length <= 1)
    );

    const message = await interaction.editReply({
      embeds: [generateEmbed(currentPage)],
      components: [row],
    });

    const filter = (i) => i.user.id === interaction.user.id; 
    const collector = message.createMessageComponentCollector({
      filter,
      time: 120000, 
    });

    collector.on("collect", async (i) => {
      if (i.customId === "previousPage" && currentPage > 0) {
        currentPage--;
      } else if (i.customId === "nextPage" && currentPage < maxPage) {
        currentPage++;
      }

      const updatedRow = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setCustomId("previousPage")
          .setLabel("Anterior")
          .setStyle(Discord.ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new Discord.ButtonBuilder()
          .setCustomId("nextPage")
          .setLabel("Próxima")
          .setStyle(Discord.ButtonStyle.Primary)
          .setDisabled(currentPage === maxPage)
      );

      // CORREÇÃO TIMEOUT: update() imediato
      await i.update({
        embeds: [generateEmbed(currentPage)],
        components: [updatedRow],
      }).catch(() => {});
    });

    collector.on("end", () => {
      const disabledRow = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setCustomId("previousPage")
          .setLabel("Anterior")
          .setStyle(Discord.ButtonStyle.Primary)
          .setDisabled(true),
        new Discord.ButtonBuilder()
          .setCustomId("nextPage")
          .setLabel("Próxima")
          .setStyle(Discord.ButtonStyle.Primary)
          .setDisabled(true)
      );
      interaction.editReply({ components: [disabledRow] }).catch(() => {});
    });
  },
};
