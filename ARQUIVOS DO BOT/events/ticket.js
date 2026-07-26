const Discord = require("discord.js");
const config1 = require("../config.json");
const ticket = require("../json/config.ticket.json");
const { QuickDB } = require("quick.db");
const db = new QuickDB({ table: "ticket" });
const randomString = require("randomized-string");
const fs = require('fs');
const path = require('path');

const assumedFilePath = path.join(__dirname, "..", "json", "assumidos.json");
const logsFilePath = path.join(__dirname, "..", "json", "logs.json");
const configTicketPath = path.join(__dirname, "..", "json", "config.ticket.json");

function readAssumedData() {
  try {
    const data = fs.readFileSync(assumedFilePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}
function saveAssumedData(data) {
  fs.writeFileSync(assumedFilePath, JSON.stringify(data, null, 4), "utf8");
}


module.exports = {
    name: 'ticket',
    async execute(interaction, message, client) {
        if (!interaction.customId) return;
        let config;
        try {
            const rawData = fs.readFileSync(configTicketPath);
            config = JSON.parse(rawData);
        } catch (err) {
            console.error("❌ Erro ao ler config.ticket.json:", err);
            return;
        }


        if(interaction.customId === "abrir-ticket") {
            const cleanUsername = interaction.user.username
      .toLowerCase()
      .replace(/[\s._]/g, "");
  
    const channel = interaction.guild.channels.cache.find(
      (c) => c.name === `🎫-${cleanUsername}`
    );
  
    if (channel)
      return interaction.reply({
        embeds: [
          new Discord.EmbedBuilder()
          .setColor("#ce717b")
            .setDescription(
              `${interaction.user} Você já possui um ticket aberto em ${channel}.`
            ),
        ],
        components: [
          new Discord.ActionRowBuilder()
            .addComponents(
              new Discord.ButtonBuilder()
                .setLabel("Ir para o seu Ticket")
                .setStyle(Discord.ButtonStyle.Link)
                .setURL(channel.url)
            ),
        ],
        ephemeral: true,
      });

            const modal = new Discord.ModalBuilder().setCustomId("modal_ticket").setTitle("Descreva o motivo do ticket")

            const text = new Discord.TextInputBuilder()
            .setCustomId("motivo")
            .setLabel("Descreva o motivo do ticket")
            .setPlaceholder("Digite aqui ✏")
            .setStyle(1)

            modal.addComponents(new Discord.ActionRowBuilder().addComponents(text))
            
            return interaction.showModal(modal)
        }

        if(interaction.isModalSubmit() && interaction.customId === "modal_ticket"){
            // CORREÇÃO TIMEOUT: Responder imediatamente antes de criar o canal
            await interaction.reply({
                content:`Seu Ticket está sendo aberto, aguarde...`,
                ephemeral:true
            });

            const motivo = interaction.fields.getTextInputValue("motivo");
            const permissionOverwrites = [
                {
                  id: interaction.guild.id,
                  deny: ["ViewChannel"],
                },
                {
                  id: interaction.user.id,
                  allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"],
                },
                {
                  id: ticket.config_principais.cargo_staff,
                  allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"],
                },
              ];

              await db.add(`quantiaticket_${interaction.user.id}`, 1)
              
              const abc = await db.get(`quantiaticket_${interaction.user.id}`)
              var randomToken = randomString
              .generate({ length: 6, charset: "hex" })
              .toUpperCase();
        
              const aaaaa = randomToken
              
              const cargo_staff = interaction.guild.roles.cache.get(ticket.config_principais.cargo_staff)
              
              const channels = await interaction.guild.channels.create({
                name: `🎫-${interaction.user.username}`,
                type: 0,
                parent: ticket.config_principais.category_ticket,
                topic: interaction.user.id,
                permissionOverwrites: permissionOverwrites,
              });

              await interaction.editReply({
                  content:`${interaction.user} Seu Ticket foi aberto no canal: ${channels.url}`,
                  components:[
                      new Discord.ActionRowBuilder()
                      .addComponents(
                          new Discord.ButtonBuilder()
                          .setStyle(5)
                          .setURL(channels.url)
                          .setLabel("Ir para o ticket")
                      )
                  ]
              });

              const user = interaction.user;

              await db.set(`ticket_${channels.id}`, {
                  usuario:interaction.user.id,
                  motivo:motivo,
                  codigo:aaaaa,
                  staff:"Ninguem Assumiu"
                });

              function substituirVariaveis(texto, user, motivo, aaaaa) {
                  return texto
                      .replace('{user}', user)
                      .replace('{motivo}', motivo)
                      .replace('{assumido}', `Ninguem assumiu`)
                      .replace('{codigo}', aaaaa);
              }

              const embeds = new Discord.EmbedBuilder()
              .setDescription(substituirVariaveis(config.config_dentro.texto, user, motivo, aaaaa));
              
              if(ticket.config_dentro.thumbnail){
                  embeds.setImage(`${ticket.config_dentro.thumbnail}`);
              }

              await channels.send({
                  content:`||${cargo_staff} - ${interaction.user}||`,
                  embeds:[
                      embeds
                  ],
                  components:[
                      new Discord.ActionRowBuilder()
                      .addComponents(
                          new Discord.ButtonBuilder()
                          .setCustomId("sair_ticket")
                          .setLabel("Sair do ticket")
                          .setStyle(Discord.ButtonStyle.Danger),
                          new Discord.ButtonBuilder()
                          .setCustomId("painel_member")
                          .setLabel("Painel Membro")
                          .setStyle(2),
                          new Discord.ButtonBuilder()
                          .setCustomId("painel_staff")
                          .setLabel("Painel Staff")
                          .setStyle(2),
                          new Discord.ButtonBuilder()
                          .setCustomId("ticket_assumir")
                          .setLabel("Assumir Ticket")
                          .setStyle(3),
                          new Discord.ButtonBuilder()
                          .setCustomId("finalization_ticket")
                          .setLabel("Finalizar Ticket")
                          .setStyle(Discord.ButtonStyle.Danger),
                      )
                  ]
              });

              const chanal = interaction.guild.channels.cache.get(ticket.config_principais.channel_logs);
              if(!chanal) return;
              await chanal.send({
                  content:"Novo Ticket Aberto",
                  embeds:[
                      new Discord.EmbedBuilder()
                      .addFields(
                          {
                              name:"👥 Usuario",
                              value:`${interaction.user} \`${interaction.user.id}\``,
                              inline:true
                          },
                          {
                              name:"🎫 Ticket",
                              value:`${channels.url}`,
                              inline:true
                          },
                          {
                              name:"🔰 Tickets Abertos",
                              value: `${abc}`,
                              inline:true
                          },
                          {
                              name:"🔐 Codigo do ticket",
                              value: `\`${aaaaa}\``,
                              inline:true
                          },
                          {
                              name:"⚠ Motivo do Ticket",
                              value: `\`${motivo}\``,
                              inline:true
                          },
                          
                      )
                  ]
              });
        }


        if(interaction.customId === "painel_staff"){
          const user1 = interaction.guild.members.cache.get(interaction.user.id);
          const roleIdToCheck = ticket.config_principais.cargo_staff;
        
          const hasRequiredRole = user1.roles.cache.has(roleIdToCheck);
        
          if (!hasRequiredRole) {
            await interaction.reply({ content: 'Você não tem permissão para usar este botão.', ephemeral: true });
            return;
          }
            // CORREÇÃO TIMEOUT: ephemeral reply é rápido o suficiente, mas deferReply seria mais seguro
            // Aqui mantemos reply pois é uma resposta direta com conteúdo fixo.
            await interaction.reply({
                content:`${interaction.user}`,
                embeds:[
                    new Discord.EmbedBuilder()
                    .setDescription("✅ | Painel Staff Aberto com Sucesso!")
                ], 
                ephemeral:true,
                components:[
                    new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.StringSelectMenuBuilder()
                        .setCustomId("painelstaff")
                        .setPlaceholder("Escolha alguma opção")
                        .addOptions(
                            {
                                label:"Chamar Usuario",
                                description:"Notifique o usuario",
                                value:"Cham_User",
                            },
                            {
                                label:"Adicionar um usuario",
                                description:"Adicione um usuario!",
                                value:"add_user",
                            },
                            {
                                label:"Remova um usuario",
                                description:"Remova um usuario do ticket!",
                                value:"remove_user",
                            },
                        )
                    )
                ]
            })
        }

        if(interaction.isStringSelectMenu() && interaction.customId === "painelstaff"){
            const options = interaction.values[0]
            
            // CORREÇÃO TIMEOUT: Se for add_user ou remove_user, eles já usam update() que é imediato.
            // Se for Cham_User, ele faz operações async, então precisamos de deferReply.
            if(options === "Cham_User"){
                await interaction.deferReply({ ephemeral: true });
                
                const tickets = await db.get(`ticket_${interaction.channel.id}`) 
                const usuario = tickets.usuario
                const user = interaction.guild.members.cache.get(usuario)
                
                try {
                    await user.send({
                        content:`O Staff ${interaction.user}, está lhe chamando, veja o motivo no ticket: ${interaction.channel.url}`,
                        components:[
                            new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                .setLabel("Ir para o ticket")
                                .setStyle(5)
                                .setURL(interaction.channel.url)
                            )
                        ]
                    });
                } catch (e) {
                    console.warn(`⚠ Não foi possível enviar DM para ${user.user.tag}: DMs desativadas.`);
                }

                await interaction.editReply({
                    content:`Usuario está notificado`
                })
            }



            if(options === "add_user"){
                // CORREÇÃO TIMEOUT: interaction.update() é imediato e seguro contra timeout.
                await interaction.update({
                    embeds: [
                      new Discord.EmbedBuilder().setDescription(
                        `👤 | Marque ou envie o ID do usuário que você deseja adicionar!`
                      ),
                    ],
                    components: [],
                  });
          
                  const filter = (i) => i.member.id === interaction.user.id;
                  const collector = interaction.channel.createMessageCollector({
                    filter,
                    time: 60000, // Adicionado timeout ao collector por segurança
                    max: 1
                  });
          
                  collector.on("collect", async (collect) => {
                    const user_content = collect.content;
                    collect.delete().catch(() => {});
          
                    const user_collected =
                      interaction.guild.members.cache.get(user_content);
          
                    if (!user_collected)
                      return interaction.editReply({
                        embeds: [
                          new Discord.EmbedBuilder().setDescription(
                            `Não foi possível encontrar o usuário \`${user_content}\`, tente novamente!`
                          ),
                        ],
                        components: [],
                      });
          
                    const tickets = await db.get(`ticket_${interaction.channel.id}`) 
                    const usuario = tickets.usuario
                    const user = interaction.guild.members.cache.get(usuario)

                    if (
                      interaction.channel
                        .permissionsFor(user_collected.id)
                        .has("ViewChannel")
                    )
                      return interaction.editReply({
                        embeds: [
                          new Discord.EmbedBuilder().setDescription(
                            `O usuário ${user_collected}(\`${user_collected.id}\`) já possui acesso ao ticket!`
                          ),
                        ],
                        components: [],
                      });
          
                    const permissionOverwrites = [
                        {
                          id: interaction.guild.id,
                          deny: ["ViewChannel"],
                        },
                        {
                          id: user.id,
                          allow: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                          ],
                        },
                        {
                          id: user_collected.id,
                          allow: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                            "ReadMessageHistory",
                          ],
                        },
                        {
                          id: ticket.config_principais.cargo_staff,
                          allow: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                            "ReadMessageHistory",
                          ],
                        },
                    ];

                    await interaction.channel.edit({
                      permissionOverwrites: permissionOverwrites,
                    });
          
                    await interaction.editReply({
                      embeds: [
                        new Discord.EmbedBuilder().setDescription(
                          `O usuário ${user_collected}(\`${user_collected.id}\`) foi adicionado com sucesso!`
                        ),
                      ],
                      components: [],
                    });
          
                    collector.stop();
                  });
            }



            if(options === "remove_user"){
                await interaction.update({
                    embeds: [
                      new Discord.EmbedBuilder().setDescription(
                        `👤 | Marque ou envie o ID do usuário que você deseja remover!`
                      ),
                    ],
                    components: [],
                  });
          
                  const filter = (i) => i.member.id === interaction.user.id;
                  const collector = interaction.channel.createMessageCollector({
                    filter,
                    time: 60000,
                    max: 1
                  });
          
                  collector.on("collect", async (collect) => {
                    const user_content = collect.content;
                    collect.delete().catch(() => {});
          
                    const user_collected =
                      interaction.guild.members.cache.get(user_content);
          
                    if (!user_collected)
                      return interaction.editReply({
                        embeds: [
                          new Discord.EmbedBuilder().setDescription(
                            `Não foi possível encontrar o usuário \`${user_content}\`, tente novamente!`
                          ),
                        ],
                        components: [],
                      });

                    const tickets = await db.get(`ticket_${interaction.channel.id}`) 
                    const usuario = tickets.usuario
                    const user = interaction.guild.members.cache.get(usuario)

                    if (
                      !interaction.channel
                        .permissionsFor(user_collected.id)
                        .has("ViewChannel")
                    )
                      return interaction.editReply({
                        embeds: [
                          new Discord.EmbedBuilder().setDescription(
                            ` O usuário ${user_collected}(\`${user_collected.id}\`) não possui acesso ao ticket!`
                          ),
                        ],
                        components: [],
                      });

                      const cargoIDs = ticket.config_principais.cargo_staff;
                      const permissionOverwrites = [
                        {
                          id: interaction.guild.id,
                          deny: ["ViewChannel"],
                        },
                        {
                          id: user_collected.id,
                          deny: ["ViewChannel"],
                        },
                        {
                          id: user.id,
                          allow: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                            "ReadMessageHistory",
                          ],
                        },
                        {
                          id: cargoIDs,
                          allow: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                            "ReadMessageHistory",
                          ],
                        },
                    ];
                    
                    await interaction.channel.edit({
                      permissionOverwrites: permissionOverwrites,
                    });
          
                    await interaction.editReply({
                      embeds: [
                        new Discord.EmbedBuilder().setDescription(
                          `O usuário ${user_collected}(\`${user_collected.id}\`) foi removido com sucesso!`
                        ),
                      ],
                      components: [],
                    });
          
                    collector.stop();
                  });
            }
        }


        if(interaction.customId === "finalization_ticket"){
            const user1 = interaction.guild.members.cache.get(interaction.user.id);
            const roleIdToCheck = ticket.config_principais.cargo_staff;
            const hasRequiredRole = user1.roles.cache.has(roleIdToCheck);
          
            if (!hasRequiredRole) {
              await interaction.reply({ content: 'Você não tem permissão para usar este botão.', ephemeral: true });
              return;
            }

            // CORREÇÃO TIMEOUT: Responder imediatamente
            await interaction.reply({
                content:`Este Ticket será finalizado em alguns segundos...`
            });

            const tickets = await db.get(`ticket_${interaction.channel.id}`)
            const usuario = tickets.usuario
            const user = interaction.guild.members.cache.get(usuario)
            const motivo = tickets.motivo
            const codigo = tickets.codigo
            const logs = interaction.guild.channels.cache.get(ticket.config_principais.channel_logs)
            const assumiu = interaction.guild.members.cache.get(tickets.staff)
            const assumiu1 = tickets.staff

            if(logs) {
                await logs.send({
                    content:"Ticket Finalizado",
                    embeds:[
                        new Discord.EmbedBuilder()
                        .addFields(
                            {
                                name:`Dono Ticket`,
                                value:`${user}`,
                                inline:true
                            },
                            {
                                name:`Quem Fechou`,
                                value:`${interaction.user}`,
                                inline:true
                            },
                            {
                                name:`Quem Assumiu?`,
                                value:`${assumiu ?? `Ninguem Assumiu`}`,
                                inline:true
                            },
                            {
                                name:`Motivo Ticket`,
                                value:`\`${motivo}\``,
                                inline:true
                            },
                            {
                                name:`Codigo Ticket`,
                                value:`\`${codigo}\``,
                                inline:true
                            }
                        )
                    ]
                }).catch(() => {});
            }

            const lags = JSON.parse(fs.readFileSync(logsFilePath, 'utf-8'));
            const idDoUsuario = user.id;
            const newUserLog = {
              dono_ticket: idDoUsuario,
              fechou_ticket: interaction.user.id,
              assumido: assumiu1 ?? 'Ninguem assumiu',
              motivo: motivo,
              codigo: codigo,
            };
            
            if (!lags[idDoUsuario]) {
                lags[idDoUsuario] = [newUserLog];
            } else {
                lags[idDoUsuario].push(newUserLog);
            }
            
            fs.writeFileSync(logsFilePath, JSON.stringify(lags, null, 2), 'utf-8');

            try {
                await user.send({
                    content:"Ticket Finalizado",
                    embeds:[
                        new Discord.EmbedBuilder()
                        .addFields(
                            {
                                name:`Dono Ticket`,
                                value:`${user}`,
                                inline:true
                            },
                            {
                                name:`Quem Fechou`,
                                value:`${interaction.user}`,
                                inline:true
                            },
                            {
                                name:`Quem Assumiu?`,
                                value:`${assumiu ?? `Ninguem Assumiu`}`,
                                inline:true
                            },
                            {
                                name:`Motivo Ticket`,
                                value:`\`${motivo}\``,
                                inline:true
                            },
                            {
                                name:`Codigo Ticket`,
                                value:`\`${codigo}\``,
                                inline:true
                            }
                        )
                    ],
                    components:[
                        new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                            .setCustomId("avaliar_servidor")
                            .setLabel("Avalie o atendimento!")
                            .setEmoji("❤")
                            .setStyle(3)
                        )
                    ]
                });
            } catch (e) {}

            await db.set(`final_ticket_${user.id}`,{
                dono_ticket: idDoUsuario,
                fechou_ticket: interaction.user.id,
                assumido: assumiu1 ?? 'Ninguem assumiu',
                motivo: motivo,
                codigo: codigo,
            });

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 5000);
        }


        if (interaction.customId === "avaliar_servidor") {
            // CORREÇÃO TIMEOUT: showModal() é instantâneo e não precisa de defer
            const modal = new Discord.ModalBuilder().setCustomId("modal_avalia").setTitle("Avalie nosso atendimento")

            const text = new Discord.TextInputBuilder()
            .setCustomId("numero_avalia")
            .setLabel("Escolha de 1 a 5")
            .setPlaceholder("Digite aqui ✏")
            .setStyle(1)
            .setMaxLength(1)
            .setValue("1")
            const desc = new Discord.TextInputBuilder()
            .setCustomId("desc_avalia")
            .setLabel("Diga mais sobre o nosso atendimento")
            .setPlaceholder("Digite aqui ✏")
            .setStyle(2)
            .setValue("Gostei muito do atendimento, rápido e prático")

            modal.addComponents(new Discord.ActionRowBuilder().addComponents(text))
            modal.addComponents(new Discord.ActionRowBuilder().addComponents(desc))
            
            return interaction.showModal(modal)
        }

        if(interaction.isModalSubmit() && interaction.customId==="modal_avalia"){
            const num = interaction.fields.getTextInputValue("numero_avalia");
            const desc = interaction.fields.getTextInputValue("desc_avalia");
            const channel_avalia = interaction.client.channels.cache.get(ticket.config_principais.channel_avaliation);
            const tickets = await db.get(`final_ticket_${interaction.user.id}`)

            if (!channel_avalia) {
                return interaction.reply({ content: "❌ Canal de avaliação não configurado.", ephemeral: true });
            }

            const notasValidas = ["1", "2", "3", "4", "5"];
            if (!notasValidas.includes(num)) {
                return interaction.reply({ content: `Escolha um número de 1 a 5`, ephemeral: true });
            }

            // CORREÇÃO TIMEOUT: update() é imediato
            await interaction.update({ content: "Enviado com sucesso!", components: [], embeds: [] });
            
            await channel_avalia.send({
                content: "Nova avaliação",
                embeds: [
                    new Discord.EmbedBuilder()
                    .addFields({ name: `Usuario`, value: `${interaction.user}`, inline: true })
                    .addFields({ name: `Descrição`, value: `${desc}`, inline: true })
                    .addFields({ name: `Avaliação:`, value: `${num}/5 Estrelas`, inline: true })
                    .addFields({ name: `Quem Assumiu:`, value: `${interaction.client.users.cache.get(tickets.assumido) ?? "\`Ninguem assumiu\`"}`, inline: true })
                    .addFields({ name: `Codigo do ticket:`, value: `\`${tickets.codigo}\``, inline: true })
                    .addFields({ name: `Motivo:`, value: `\`${tickets.motivo}\``, inline: true })
                ]
            }).catch(() => {});
            await db.delete(`final_ticket_${interaction.user.id}`);
        }


        if(interaction.customId === "ticket_assumir"){
            const user1 = interaction.guild.members.cache.get(interaction.user.id);
            const roleIdToCheck = ticket.config_principais.cargo_staff;
            const hasRequiredRole = user1.roles.cache.has(roleIdToCheck);
        
            if (!hasRequiredRole) {
              await interaction.reply({ content: 'Você não tem permissão para usar este botão.', ephemeral: true });
              return;
            }

            // CORREÇÃO TIMEOUT: update() imediato para desativar o botão
            // Antes o bot fazia várias operações de DB e FileSystem antes de responder.
            await interaction.deferUpdate();

            const tickets = await db.get(`ticket_${interaction.channel.id}`)
            const usuario = tickets.usuario
            const user = interaction.guild.members.cache.get(usuario)
            const motivo = tickets.motivo
            const codigo = tickets.codigo

            await db.set(`ticket_${interaction.channel.id}`, {
                usuario:usuario,
                motivo:motivo,
                codigo:codigo,
                staff:interaction.user.id
            });

            const staffUserId = interaction.user.id;
            const assumedData = readAssumedData();
            if (!assumedData[staffUserId]) {
                assumedData[staffUserId] = 0;
            }
            assumedData[staffUserId]++;
            saveAssumedData(assumedData);

            function substituirVariaveis(texto, user, motivo, codigo) {
                return texto
                    .replace('{user}', user)
                    .replace('{motivo}', motivo)
                    .replace('{assumido}', `${interaction.user}`)
                    .replace('{codigo}', codigo);
            }

            const embeds = new Discord.EmbedBuilder()
            .setDescription(substituirVariaveis(config.config_dentro.texto, user, motivo, codigo));
            
            if(ticket.config_dentro.thumbnail){
                embeds.setImage(`${ticket.config_dentro.thumbnail}`);
            }
            
            try {
                await user.send({
                    embeds:[
                        new Discord.EmbedBuilder()
                        .setDescription(`O Staff: ${interaction.user}, Assumiu seu ticket no canal: ${interaction.channel.url}`)
                    ],
                    components:[
                        new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                            .setLabel("Ir para o Ticket")
                            .setStyle(5)
                            .setURL(`${interaction.channel.url}`)
                        )
                    ]
                });
            } catch (e) {}

            await interaction.editReply({
                embeds:[
                    embeds
                ],
                components:[
                    new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                        .setCustomId("sair_ticket")
                        .setLabel("Sair do ticket")
                        .setStyle(Discord.ButtonStyle.Danger),
                        new Discord.ButtonBuilder()
                        .setCustomId("painel_member")
                        .setLabel("Painel Membro")
                        .setStyle(2),
                        new Discord.ButtonBuilder()
                        .setCustomId("painel_staff")
                        .setLabel("Painel Staff")
                        .setStyle(2),
                        new Discord.ButtonBuilder()
                        .setCustomId("ticket_assumir")
                        .setLabel("Assumir Ticket")
                        .setDisabled(true)
                        .setStyle(3),
                        new Discord.ButtonBuilder()
                        .setCustomId("finalization_ticket")
                        .setLabel("Finalizar Ticket")
                        .setStyle(Discord.ButtonStyle.Danger),
                    )
                ]
            });

            const logs = interaction.guild.channels.cache.get(ticket.config_principais.channel_logs);
            if (logs) {
                const quantidadeAssumido = assumedData[staffUserId];
                await logs.send({
                    content:`Um Ticket foi assumido`,
                    embeds:[
                        new Discord.EmbedBuilder()
                        .addFields(
                            {
                                name:`Usuario`,
                                value:`${interaction.user}`,
                                inline:true
                            },
                            {
                                name:`Canal`,
                                value:`${interaction.channel.url}`,
                                inline:true
                            },
                            {
                                name:`Tickets assumidos`,
                                value:`${quantidadeAssumido}`,
                                inline:true
                            }
                        )
                    ]
                }).catch(() => {});
            }
        }


        if( interaction.customId === "painel_member"){
            // Resposta efêmera simples é rápida o suficiente
            await interaction.reply({
                content:`${interaction.user}`,
                embeds:[
                    new Discord.EmbedBuilder()
                    .setDescription("✅ | Painel Ticket Aberto com Sucesso!")
                ], 
                ephemeral:true,
                components:[
                    new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.StringSelectMenuBuilder()
                        .setCustomId("painel_membro")
                        .setPlaceholder("Escolha alguma opção")
                        .addOptions(
                            {
                                label:"Chamar Staff",
                                description:"Chame algum staff!",
                                value:"Cham_Staff",
                            },
                            {
                                label:"Criar uma call",
                                description:"Crie uma call se for necessario!",
                                value:"call_create",
                            },
                            {
                                label:"Deletar sua call",
                                description:"Delete a call que foi criada!",
                                value:"del_call",
                            },
                        )
                    )
                ]
            })
        }

        if(interaction.isStringSelectMenu() && interaction.customId === "painel_membro"){
            const options = interaction.values[0]

            if(options === "Cham_Staff"){
                await interaction.deferReply({ ephemeral: true });

                const tickets = await db.get(`ticket_${interaction.channel.id}`)
                const usuario = tickets.usuario
                const user = interaction.guild.members.cache.get(usuario)
                const staff = interaction.guild.members.cache.get(tickets.staff)

                if(interaction.user.id !== user.id) {
                    return interaction.editReply({
                        content:`Só o usuario: ${user}, pode usar esta função`
                    });
                }

                if(staff){
                    try {
                        await staff.send({
                            content:`O Usuario: ${interaction.user}, está lhe esperando no ticket: ${interaction.channel.url}`,
                            components:[
                                new Discord.ActionRowBuilder()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                    .setURL(interaction.channel.url)
                                    .setLabel("Ir para o Ticket")
                                    .setStyle(5)
                                )
                            ]
                        });
                    } catch (e) {}

                    await interaction.editReply({
                        content:`Enviado com sucesso`
                    })
                } else {
                    await interaction.editReply({
                        content:`Ninguem assumiu seu ticket ainda!`
                    })
                }
            }

            if (options === "call_create") {
                // CORREÇÃO TIMEOUT: update() imediato
                await interaction.deferUpdate();

                const channel_find = interaction.guild.channels.cache.find(
                  (c) =>
                    c.name ===
                    `📞-${interaction.user.username.toLowerCase().replace(/ /g, "-")}`
                );
        
                if (channel_find)
                  return interaction.editReply({
                    embeds: [
                      new Discord.EmbedBuilder().setDescription(
                        ` Você já possui uma call aberta em ${channel_find}`
                      ),
                    ],
                    components: [
                      new Discord.ActionRowBuilder().addComponents(
                        new Discord.ButtonBuilder()
                          .setStyle(5)
                          .setLabel("Entrar na call")
                          .setURL(channel_find.url)
                      ),
                    ],
                  });
        
                const permissionOverwrites = [
                  {
                    id: interaction.guild.id,
                    deny: ["ViewChannel"],
                  },
                  {
                    id: interaction.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"],
                  },
                  {
                    id: ticket.config_principais.cargo_staff,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"],
                  },
                ];
        
                const channel = await interaction.guild.channels.create({
                  name: `📞-${interaction.user.username
                    .toLowerCase()
                    .replace(/ /g, "-")}`,
                  type: 2,
                  parent: interaction.channel.parent,
                  permissionOverwrites: permissionOverwrites,
                });
        
                await interaction.editReply({
                  embeds: [
                    new Discord.EmbedBuilder().setDescription(
                      `Call criada com sucesso em ${channel}`
                    ),
                  ],
                  components: [
                    new Discord.ActionRowBuilder().addComponents(
                      new Discord.ButtonBuilder()
                        .setStyle(5)
                        .setLabel("Entrar na call")
                        .setURL(channel.url)
                    ),
                  ],
                });
            }

            if (options === "del_call") {
                await interaction.deferUpdate();

                const channel_find = interaction.guild.channels.cache.find(
                  (c) =>
                    c.name ===
                    `📞-${interaction.user.username.toLowerCase().replace(/ /g, "-")}`
                );
        
                if (!channel_find)
                  return interaction.editReply({
                    embeds: [
                      new Discord.EmbedBuilder().setDescription(
                        `Você não possui nenhuma call aberta!`
                      ),
                    ],
                    components: [],
                  });
        
                await channel_find.delete().catch(() => {});
        
                await interaction.editReply({
                  embeds: [
                    new Discord.EmbedBuilder().setDescription(
                      `Call deletada com sucesso!`
                    ),
                  ],
                  components: [],
                });
            }
        }


        if(interaction.customId === "sair_ticket"){
            const tickets = await db.get(`ticket_${interaction.channel.id}`)
            const user = tickets.usuario
            if(user !== interaction.user.id){
                return interaction.reply({
                    content:`Só quem pode sair é o usuario <@${user}>`,
                    ephemeral:true
                })
            }

            // CORREÇÃO TIMEOUT: Responder antes de editar o canal
            await interaction.reply({
                content:`<@&${ticket.config_principais.cargo_staff}>`,
                embeds:[
                    new Discord.EmbedBuilder()
                    .setDescription("O Dono do ticket saiu, clique no botão abaixo para finalizar o ticket")
                ],
                components:[
                    new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                        .setCustomId("finalization_ticket")
                        .setLabel("Finalizar Ticket")
                        .setStyle(Discord.ButtonStyle.Danger),
                    )
                ]
            });

            await interaction.channel.edit({
                name:`closed-${interaction.user.username}`,
                permissionOverwrites: [
                    {
                  id: interaction.guild.id,
                  deny: ["ViewChannel"],
                },
                {
                    id: interaction.user.id,
                    deny: [
                      "ViewChannel",
                      "SendMessages",
                      "AttachFiles",
                      "AddReactions",
                    ],
                  },{
                    id: ticket.config_principais.cargo_staff,
                    allow: [
                      "ViewChannel",
                      "SendMessages",
                      "AttachFiles",
                      "AddReactions",
                    ],
                  },
                ],
              }).catch(() => {});
        }

    }}
