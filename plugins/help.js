const {MessageEmbed} = require('discord.js');
const {serverConfig} = require('../global');
const {prefix} = require('../config.js');
const {pageEmbed} = require('../lib/utils');

module.exports = {
    help: {
        description: 'Mostra os comandos.',
        usage: 'help [comando1] [comando2]...',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<void>}
         */
        fn: async (message, args) => {
            const sc = serverConfig.get(message.guild.id);
            const serverPrefix = sc ? sc.prefix : prefix;

            const description = `
O prefixo deste servidor é \`${serverPrefix}\`.

Digite \`${serverPrefix}help {comando1} {comando2}\` para obter ajuda de um ou mais comandos em específico.`;

            const commands = message.client.commands;

            if (args.length > 0) {
                for (let i = 0; i < args.length; i++) {
                    if (!(args[i] in commands)) {
                        return await message.channel.send(`Comando \`${args[i]}\` não encontrado.`);
                    }
                }

                for (let i = 0; i < args.length; i++) {
                    const desc = `
O prefixo deste servidor é \`${serverPrefix}\`

\`${serverPrefix}${args[i]}\`
${commands[args[i]].description}

Uso: ${commands[args[i]].usage}

${commands[args[i]].alias ? `Alias: ${commands[args[i]].alias.map(a => `\`${a}\``).join(', ')}` : ''}`;

                    await message.channel.send(new MessageEmbed()
                        .setTitle('Ajuda')
                        .setDescription(desc)
                        .setAuthor(message.client.user.username, message.client.user.avatarURL())
                        .setTimestamp());
                }

                return;
            }

            const cmds = [];
            for (const c in commands) {
                if (commands[c].only && !commands[c].only.includes(message.author.id)) {
                    continue;
                }

                cmds[cmds.length] = {
                    name: `${serverPrefix}${c}`,
                    value: commands[c].description + (commands[c].alias ? `\n\nAlias: ${commands[c].alias.map(a => `\`${a}\``).join(', ')}` : '')
                };
            }

            return await pageEmbed(message, {title: 'Eu entendo isso aqui vei', description}, cmds);
        }
    }
}
