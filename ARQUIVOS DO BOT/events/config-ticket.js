const Discord = require("discord.js");
const config = require("../config.json")
const embed = new Discord.EmbedBuilder()
.setColor("Default")
.setDescription("Ticket")

module.exports = {
    name: 'config-ticket',
    async execute(interaction, message, client) {

        if(interaction.customId === "add-titule"){
            // CORREÇÃO TIMEOUT: deferUpdate() é imediato
            await interaction.deferUpdate();

            await interaction.channel.send({
                content:"Qual sera o novo titulo?",
            }).then((msg1) => {
              const filter = (m) => m.author.id === interaction.user.id;
              const collector = msg1.channel.createMessageCollector({
                filter,
                max: 1,
                time: 60000
              });

              collector.on("collect", (message) => {
                message.delete().catch(() => {});
                embed.setTitle(message.content)
                msg1.edit("⏰ | Alterado!");
                setTimeout(() => {
                    msg1.delete().catch(() => {});
                }, 1000);
              });
            });
        }
        
        if(interaction.customId === "add-footer"){
            await interaction.deferUpdate();

            await interaction.channel.send({
                content:"Qual sera o novo rodapé?",
            }).then((msg1) => {
              const filter = (m) => m.author.id === interaction.user.id;
              const collector = msg1.channel.createMessageCollector({
                filter,
                max: 1,
                time: 60000
              });

              collector.on("collect", (message) => {
                message.delete().catch(() => {});
                embed.setFooter({ text:`${message.content}`, iconURL:interaction.guild.iconURL() })
                
                msg1.edit("⏰ | Alterado!");
                setTimeout(() => {
                    msg1.delete().catch(() => {});
                }, 1000);
              });
            });
        }
        if(interaction.customId === "add-image"){
            await interaction.deferUpdate();

            await interaction.channel.send({
                content:"Qual sera a nova imagem?",
            }).then((msg1) => {
              const filter = (m) => m.author.id === interaction.user.id;
              const collector = msg1.channel.createMessageCollector({
                filter,
                max: 1,
                time: 60000
              });

              collector.on("collect", (message) => {
                message.delete().catch(() => {});
                embed.setImage(message.content)

                msg1.edit("⏰ | Alterado!");
                setTimeout(() => {
                    msg1.delete().catch(() => {});
                }, 1000);
              });
            });
        }
        if(interaction.customId === "enviar_ticket"){
            // CORREÇÃO TIMEOUT: deferReply() imediato
            await interaction.deferReply({ ephemeral: true });

            await interaction.channel.send({
                embeds:[embed],
                components:[
                    new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                        .setCustomId("abrir-ticket")
                        .setLabel("Abrir ticket")
                        .setStyle(Discord.ButtonStyle.Secondary)
                    )
                ]
            }).then(() => {
                interaction.editReply({
                    content:"enviado com sucesso"
                })
            }).catch(() => {
                interaction.editReply({
                    content:"Erro ao enviar o ticket."
                })
            });
        }
        if(interaction.customId === "alterar-desc"){
            await interaction.deferUpdate();

            await interaction.channel.send({
                content:"Qual sera a nova descrição?",
            }).then((msg1) => {
              const filter = (m) => m.author.id === interaction.user.id;
              const collector = msg1.channel.createMessageCollector({
                filter,
                max: 1,
                time: 60000
              });

              collector.on("collect", (message) => {
                message.delete().catch(() => {});
                embed.setDescription(message.content)

                msg1.edit("⏰ | Alterado!");
                setTimeout(() => {
                    msg1.delete().catch(() => {});
                }, 1000);
              });
            });
        }

        if(interaction.customId === "reiniciar-ticket") {
            // CORREÇÃO TIMEOUT: update() imediato
            await interaction.update({
                embeds:[
                    new Discord.EmbedBuilder()
                .setDescription("Configure o ticket antes de envia-lo"),
                embed
                ]
            })
        }
    }}
