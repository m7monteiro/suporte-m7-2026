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

        // --- FUNÇÃO: ABRIR TICKET ---
        if(interaction.customId === "abrir-ticket") {
            const cleanUsername = interaction.user.username.toLowerCase().replace(/[\s._]/g, "");
            const channel = interaction.guild.channels.cache.find(c => c.name === `🎫-${cleanUsername}`);
  
            if (channel) {
                return interaction.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor("#ce717b")
                            .setDescription(`${interaction.user} Você já possui um ticket aberto em ${channel}.`),
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
            }

            const modal = new Discord.ModalBuilder().setCustomId("modal_ticket").setTitle("Descreva o motivo do ticket")
            const text = new Discord.TextInputBuilder()
                .setCustomId("motivo")
                .setLabel("Descreva o motivo do ticket")
                .setPlaceholder("Digite aqui ✏")
                .setStyle(1)

            modal.addComponents(new Discord.ActionRowBuilder().addComponents(text))
            return interaction.showModal(modal)
        }

        // --- FUNÇÃO: SUBMISSÃO DO MODAL DE TICKET ---
        if(interaction.isModalSubmit() && interaction.customId === "modal_ticket"){
            await interaction.reply({ content: `Seu Ticket está sendo aberto, aguarde...`, ephemeral: true });

            try {
                const motivo = interaction.fields.getTextInputValue("motivo");
                const permissionOverwrites = [
                    { id: interaction.guild.id, deny: ["ViewChannel"] },
                    { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"] },
                    { id: config.config_principais.cargo_staff, allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"] },
                ];

                await db.add(`quantiaticket_${interaction.user.id}`, 1);
                const abc = await db.get(`quantiaticket_${interaction.user.id}`);
                const aaaaa = randomString.generate({ length: 6, charset: "hex" }).toUpperCase();
                const cargo_staff = interaction.guild.roles.cache.get(config.config_principais.cargo_staff);
                
                const channels = await interaction.guild.channels.create({
                    name: `🎫-${interaction.user.username}`,
                    type: 0,
                    parent: config.config_principais.category_ticket,
                    topic: interaction.user.id,
                    permissionOverwrites: permissionOverwrites,
                });

                await interaction.editReply({
                    content: `${interaction.user} Seu Ticket foi aberto no canal: ${channels.url}`,
                    components: [
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.ButtonBuilder().setStyle(5).setURL(channels.url).setLabel("Ir para o ticket")
                        )
                    ]
                });

                await db.set(`ticket_${channels.id}`, {
                    usuario: interaction.user.id,
                    motivo: motivo,
                    codigo: aaaaa,
                    staff: "Ninguem Assumiu"
                });

                const substituirVariaveis = (texto, user, motivo, code) => {
                    return texto
                        .replace('{user}', user)
                        .replace('{motivo}', motivo)
                        .replace('{assumido}', `Ninguem assumiu`)
                        .replace('{codigo}', code);
                };

                const embeds = new Discord.EmbedBuilder()
                    .setDescription(substituirVariaveis(config.config_dentro.texto, interaction.user, motivo, aaaaa));
                
                if(config.config_dentro.thumbnail) embeds.setImage(config.config_dentro.thumbnail);

                await channels.send({
                    content: `||${cargo_staff} - ${interaction.user}||`,
                    embeds: [embeds],
                    components: [
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.ButtonBuilder().setCustomId("sair_ticket").setLabel("Sair do ticket").setStyle(Discord.ButtonStyle.Danger),
                            new Discord.ButtonBuilder().setCustomId("painel_member").setLabel("Painel Membro").setStyle(2),
                            new Discord.ButtonBuilder().setCustomId("painel_staff").setLabel("Painel Staff").setStyle(2),
                            new Discord.ButtonBuilder().setCustomId("ticket_assumir").setLabel("Assumir Ticket").setStyle(3),
                            new Discord.ButtonBuilder().setCustomId("finalization_ticket").setLabel("Finalizar Ticket").setStyle(Discord.ButtonStyle.Danger),
                        )
                    ]
                });

                const logChannel = interaction.guild.channels.cache.get(config.config_principais.channel_logs);
                if(logChannel) {
                    await logChannel.send({
                        content: "Novo Ticket Aberto",
                        embeds: [
                            new Discord.EmbedBuilder().addFields(
                                { name: "👥 Usuario", value: `${interaction.user} \`${interaction.user.id}\``, inline: true },
                                { name: "🎫 Ticket", value: `${channels.url}`, inline: true },
                                { name: "🔰 Tickets Abertos", value: `${abc}`, inline: true },
                                { name: "🔐 Codigo do ticket", value: `\`${aaaaa}\``, inline: true },
                                { name: "⚠ Motivo do Ticket", value: `\`${motivo}\``, inline: true }
                            )
                        ]
                    }).catch(() => {});
                }
            } catch (err) {
                console.error("Erro ao abrir ticket:", err);
                await interaction.editReply({ content: "Ocorreu um erro ao abrir seu ticket. Verifique as permissões do bot." });
            }
        }

        // --- FUNÇÃO: PAINEL STAFF ---
        if(interaction.customId === "painel_staff"){
            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (!member.roles.cache.has(config.config_principais.cargo_staff)) {
                return interaction.reply({ content: 'Você não tem permissão para usar este botão.', ephemeral: true });
            }

            await interaction.reply({
                content: `${interaction.user}`,
                embeds: [new Discord.EmbedBuilder().setDescription("✅ | Painel Staff Aberto com Sucesso!")], 
                ephemeral: true,
                components: [
                    new Discord.ActionRowBuilder().addComponents(
                        new Discord.StringSelectMenuBuilder()
                            .setCustomId("painelstaff")
                            .setPlaceholder("Escolha alguma opção")
                            .addOptions(
                                { label: "Chamar Usuario", description: "Notifique o usuario", value: "Cham_User" },
                                { label: "Adicionar um usuario", description: "Adicione um usuario!", value: "add_user" },
                                { label: "Remova um usuario", description: "Remova um usuario do ticket!", value: "remove_user" }
                            )
                    )
                ]
            });
        }

        // --- FUNÇÃO: SELEÇÃO PAINEL STAFF ---
        if(interaction.isStringSelectMenu() && interaction.customId === "painelstaff"){
            const option = interaction.values[0];
            const ticketData = await db.get(`ticket_${interaction.channel.id}`);
            if (!ticketData) return interaction.reply({ content: "Erro: Dados do ticket não encontrados no banco.", ephemeral: true });

            if(option === "Cham_User"){
                await interaction.deferReply({ ephemeral: true });
                const user = interaction.guild.members.cache.get(ticketData.usuario);
                if (user) {
                    await user.send({
                        content: `O Staff ${interaction.user}, está lhe chamando no ticket: ${interaction.channel.url}`,
                        components: [new Discord.ActionRowBuilder().addComponents(
                            new Discord.ButtonBuilder().setLabel("Ir para o ticket").setStyle(5).setURL(interaction.channel.url)
                        )]
                    }).catch(() => {});
                }
                await interaction.editReply({ content: `Usuário notificado.` });
            }

            if(option === "add_user" || option === "remove_user"){
                const isAdd = option === "add_user";
                await interaction.update({
                    embeds: [new Discord.EmbedBuilder().setDescription(`👤 | Marque ou envie o ID do usuário que você deseja ${isAdd ? 'adicionar' : 'remover'}!`)],
                    components: [],
                });
          
                const filter = (m) => m.author.id === interaction.user.id;
                const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1 });
          
                collector.on("collect", async (m) => {
                    const targetId = m.content.replace(/[<@!>]/g, "");
                    m.delete().catch(() => {});
                    const target = interaction.guild.members.cache.get(targetId);
          
                    if (!target) return interaction.editReply({ content: "Usuário não encontrado." });

                    const overwrites = Array.from(interaction.channel.permissionOverwrites.cache.values()).map(o => ({
                        id: o.id,
                        allow: o.allow.toArray(),
                        deny: o.deny.toArray()
                    }));

                    if (isAdd) {
                        overwrites.push({ id: target.id, allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions", "ReadMessageHistory"] });
                    } else {
                        const index = overwrites.findIndex(o => o.id === target.id);
                        if (index > -1) overwrites.splice(index, 1);
                        overwrites.push({ id: target.id, deny: ["ViewChannel"] });
                    }

                    await interaction.channel.edit({ permissionOverwrites: overwrites });
                    await interaction.editReply({ content: `Usuário ${target} ${isAdd ? 'adicionado' : 'removido'} com sucesso!` });
                });
            }
        }

        // --- FUNÇÃO: FINALIZAR TICKET (CORREÇÃO CRÍTICA) ---
        if(interaction.customId === "finalization_ticket"){
            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (!member.roles.cache.has(config.config_principais.cargo_staff)) {
                return interaction.reply({ content: 'Você não tem permissão para usar este botão.', ephemeral: true });
            }

            // Resposta imediata para evitar timeout
            await interaction.reply({ content: `Este Ticket será finalizado em 5 segundos...` });

            try {
                const ticketData = await db.get(`ticket_${interaction.channel.id}`);
                if (ticketData) {
                    const owner = interaction.guild.members.cache.get(ticketData.usuario);
                    const staff = interaction.guild.members.cache.get(ticketData.staff);
                    const logChannel = interaction.guild.channels.cache.get(config.config_principais.channel_logs);

                    const logEmbed = new Discord.EmbedBuilder()
                        .setTitle("Ticket Finalizado")
                        .addFields(
                            { name: `Dono Ticket`, value: owner ? `${owner}` : `Desconhecido`, inline: true },
                            { name: `Quem Fechou`, value: `${interaction.user}`, inline: true },
                            { name: `Quem Assumiu?`, value: staff ? `${staff}` : `Ninguém`, inline: true },
                            { name: `Motivo`, value: `\`${ticketData.motivo}\``, inline: true },
                            { name: `Código`, value: `\`${ticketData.codigo}\``, inline: true }
                        );

                    if (logChannel) await logChannel.send({ embeds: [logEmbed] }).catch(() => {});

                    // Salvar logs no arquivo
                    if (owner) {
                        const allLogs = JSON.parse(fs.readFileSync(logsFilePath, 'utf-8') || "{}");
                        const newEntry = {
                            dono_ticket: owner.id,
                            fechou_ticket: interaction.user.id,
                            assumido: ticketData.staff,
                            motivo: ticketData.motivo,
                            codigo: ticketData.codigo,
                        };
                        if (!allLogs[owner.id]) allLogs[owner.id] = [];
                        allLogs[owner.id].push(newEntry);
                        fs.writeFileSync(logsFilePath, JSON.stringify(allLogs, null, 2));

                        // Enviar DM para o dono
                        await owner.send({
                            content: "Seu ticket foi finalizado.",
                            embeds: [logEmbed],
                            components: [new Discord.ActionRowBuilder().addComponents(
                                new Discord.ButtonBuilder().setCustomId("avaliar_servidor").setLabel("Avalie o atendimento!").setEmoji("❤").setStyle(3)
                            )]
                        }).catch(() => {});

                        await db.set(`final_ticket_${owner.id}`, newEntry);
                    }
                }
            } catch (err) {
                console.error("Erro ao finalizar ticket:", err);
            }

            // Deletar canal após 5 segundos
            setTimeout(() => {
                interaction.channel.delete().catch(e => console.error("Erro ao deletar canal:", e));
            }, 5000);
        }

        // --- FUNÇÃO: AVALIAR SERVIÇO ---
        if (interaction.customId === "avaliar_servidor") {
            const modal = new Discord.ModalBuilder().setCustomId("modal_avalia").setTitle("Avalie nosso atendimento")
            const nota = new Discord.TextInputBuilder().setCustomId("numero_avalia").setLabel("Escolha de 1 a 5").setMaxLength(1).setValue("5").setStyle(1);
            const desc = new Discord.TextInputBuilder().setCustomId("desc_avalia").setLabel("Diga mais sobre o atendimento").setStyle(2).setValue("Excelente atendimento!");

            modal.addComponents(new Discord.ActionRowBuilder().addComponents(nota), new Discord.ActionRowBuilder().addComponents(desc));
            return interaction.showModal(modal);
        }

        if(interaction.isModalSubmit() && interaction.customId === "modal_avalia"){
            const num = interaction.fields.getTextInputValue("numero_avalia");
            const desc = interaction.fields.getTextInputValue("desc_avalia");
            const avaliaChannel = interaction.client.channels.cache.get(config.config_principais.channel_avaliation);
            const lastTicket = await db.get(`final_ticket_${interaction.user.id}`);

            if (!avaliaChannel) return interaction.reply({ content: "Canal de avaliação não configurado.", ephemeral: true });

            await interaction.update({ content: "Obrigado pela sua avaliação!", components: [], embeds: [] });
            
            const evalEmbed = new Discord.EmbedBuilder()
                .setTitle("Nova Avaliação")
                .addFields(
                    { name: `Usuário`, value: `${interaction.user}`, inline: true },
                    { name: `Nota`, value: `${num}/5 Estrelas`, inline: true },
                    { name: `Descrição`, value: desc, inline: false }
                );
            
            if (lastTicket) {
                evalEmbed.addFields(
                    { name: `Código Ticket`, value: `\`${lastTicket.codigo}\``, inline: true },
                    { name: `Motivo`, value: `\`${lastTicket.motivo}\``, inline: true }
                );
            }

            await avaliaChannel.send({ embeds: [evalEmbed] }).catch(() => {});
            await db.delete(`final_ticket_${interaction.user.id}`);
        }

        // --- FUNÇÃO: ASSUMIR TICKET ---
        if(interaction.customId === "ticket_assumir"){
            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (!member.roles.cache.has(config.config_principais.cargo_staff)) {
                return interaction.reply({ content: 'Apenas staff pode assumir tickets.', ephemeral: true });
            }

            await interaction.deferUpdate();
            const ticketData = await db.get(`ticket_${interaction.channel.id}`);
            if (!ticketData) return;

            ticketData.staff = interaction.user.id;
            await db.set(`ticket_${interaction.channel.id}`, ticketData);

            const assumed = readAssumedData();
            assumed[interaction.user.id] = (assumed[interaction.user.id] || 0) + 1;
            saveAssumedData(assumed);

            const owner = interaction.guild.members.cache.get(ticketData.usuario);
            if (owner) {
                await owner.send({
                    content: `O Staff ${interaction.user} assumiu seu ticket: ${interaction.channel.url}`
                }).catch(() => {});
            }

            const substituirVariaveis = (texto, user, motivo, code) => {
                return texto
                    .replace('{user}', user)
                    .replace('{motivo}', motivo)
                    .replace('{assumido}', `${interaction.user}`)
                    .replace('{codigo}', code);
            };

            const updatedEmbed = new Discord.EmbedBuilder()
                .setDescription(substituirVariaveis(config.config_dentro.texto, owner || 'Usuário', ticketData.motivo, ticketData.codigo));
            if(config.config_dentro.thumbnail) updatedEmbed.setImage(config.config_dentro.thumbnail);

            await interaction.editReply({
                embeds: [updatedEmbed],
                components: [
                    new Discord.ActionRowBuilder().addComponents(
                        new Discord.ButtonBuilder().setCustomId("sair_ticket").setLabel("Sair do ticket").setStyle(Discord.ButtonStyle.Danger),
                        new Discord.ButtonBuilder().setCustomId("painel_member").setLabel("Painel Membro").setStyle(2),
                        new Discord.ButtonBuilder().setCustomId("painel_staff").setLabel("Painel Staff").setStyle(2),
                        new Discord.ButtonBuilder().setCustomId("ticket_assumir").setLabel("Assumir Ticket").setDisabled(true).setStyle(3),
                        new Discord.ButtonBuilder().setCustomId("finalization_ticket").setLabel("Finalizar Ticket").setStyle(Discord.ButtonStyle.Danger),
                    )
                ]
            });
        }

        // --- FUNÇÃO: PAINEL MEMBRO ---
        if(interaction.customId === "painel_member"){
            await interaction.reply({
                content: `${interaction.user}`,
                embeds: [new Discord.EmbedBuilder().setDescription("✅ | Painel Membro Aberto!")], 
                ephemeral: true,
                components: [
                    new Discord.ActionRowBuilder().addComponents(
                        new Discord.StringSelectMenuBuilder()
                            .setCustomId("painel_membro")
                            .setPlaceholder("Escolha uma opção")
                            .addOptions(
                                { label: "Chamar Staff", description: "Notifique a staff", value: "Cham_Staff" },
                                { label: "Criar Call", description: "Crie uma sala de voz", value: "call_create" },
                                { label: "Deletar Call", description: "Remova sua sala de voz", value: "del_call" }
                            )
                    )
                ]
            });
        }

        // --- FUNÇÃO: SELEÇÃO PAINEL MEMBRO ---
        if(interaction.isStringSelectMenu() && interaction.customId === "painel_membro"){
            const option = interaction.values[0];
            const ticketData = await db.get(`ticket_${interaction.channel.id}`);
            if (!ticketData) return;

            if (option === "Cham_Staff") {
                await interaction.deferReply({ ephemeral: true });
                const staff = interaction.guild.members.cache.get(ticketData.staff);
                if (staff) {
                    await staff.send({ content: `O usuário ${interaction.user} está te aguardando no ticket: ${interaction.channel.url}` }).catch(() => {});
                    await interaction.editReply({ content: "Staff notificada!" });
                } else {
                    await interaction.editReply({ content: "Ninguém assumiu seu ticket ainda." });
                }
            }

            if (option === "call_create") {
                await interaction.deferUpdate();
                const callName = `📞-${interaction.user.username.toLowerCase().replace(/ /g, "-")}`;
                let call = interaction.guild.channels.cache.find(c => c.name === callName);
                if (call) return interaction.editReply({ content: `Você já tem uma call: ${call}` });

                call = await interaction.guild.channels.create({
                    name: callName,
                    type: 2,
                    parent: interaction.channel.parent,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: ["ViewChannel"] },
                        { id: interaction.user.id, allow: ["ViewChannel", "Connect", "Speak"] },
                        { id: config.config_principais.cargo_staff, allow: ["ViewChannel", "Connect", "Speak"] }
                    ]
                });
                await interaction.editReply({ content: `Call criada: ${call}` });
            }

            if (option === "del_call") {
                await interaction.deferUpdate();
                const callName = `📞-${interaction.user.username.toLowerCase().replace(/ /g, "-")}`;
                const call = interaction.guild.channels.cache.find(c => c.name === callName);
                if (call) {
                    await call.delete().catch(() => {});
                    await interaction.editReply({ content: "Call deletada." });
                } else {
                    await interaction.editReply({ content: "Você não tem uma call aberta." });
                }
            }
        }

        // --- FUNÇÃO: SAIR DO TICKET ---
        if(interaction.customId === "sair_ticket"){
            const ticketData = await db.get(`ticket_${interaction.channel.id}`);
            if (ticketData && interaction.user.id === ticketData.usuario) {
                await interaction.reply({ content: "Você saiu do ticket. A staff foi notificada para finalizar." });
                await interaction.channel.edit({
                    name: `fechado-${interaction.user.username}`,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: ["ViewChannel"] },
                        { id: interaction.user.id, deny: ["ViewChannel"] },
                        { id: config.config_principais.cargo_staff, allow: ["ViewChannel", "SendMessages"] }
                    ]
                });
            } else {
                await interaction.reply({ content: "Apenas o dono do ticket pode sair.", ephemeral: true });
            }
        }
    }
}
