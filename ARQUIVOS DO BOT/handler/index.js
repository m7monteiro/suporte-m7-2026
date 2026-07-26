const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
    const SlashsArray = [];
    const comandosPath = path.join(__dirname, "..", "Comandos");

    if (!fs.existsSync(comandosPath)) {
        console.error(`❌ Pasta de comandos não encontrada em: ${comandosPath}`);
        return;
    }

    const folders = fs.readdirSync(comandosPath);

    folders.forEach(subfolder => {
        const subfolderPath = path.join(comandosPath, subfolder);
        
        if (fs.lstatSync(subfolderPath).isDirectory()) {
            const files = fs.readdirSync(subfolderPath);

            files.forEach(file => {
                if (!file.endsWith('.js')) return;

                try {
                    const command = require(path.join(subfolderPath, file));
                    if (!command.name) return;

                    client.slashCommands.set(command.name, command);
                    SlashsArray.push(command);
                    console.log(`✅ Comando carregado: ${command.name}`);
                } catch (err) {
                    console.error(`❌ Erro ao carregar comando ${file}:`, err);
                }
            });
        }
    });

    client.on("ready", async () => {
        console.log("🚀 Registrando comandos slash globalmente...");
        try {
            await client.application.commands.set(SlashsArray);
            console.log("✅ Comandos registrados com sucesso!");
        } catch (err) {
            console.error("❌ Erro ao registrar comandos globais:", err);
        }
    });
};
