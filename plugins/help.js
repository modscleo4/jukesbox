const {MessageEmbed} = require('discord.js');
const {serverConfig} = require('../global');
const {prefix} = require('../config.js');
const {pageEmbed} = require('../lib/utils');

module.exports = {
    help: {
        description: 'Mostra os comandos.',

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
O prefixo deste servidor é \`${serverPrefix}\`.\n
`;

            const commands = message.client.commands;
            const cmds = [];
            for (const c in commands) {
                if (commands[c].only && !commands[c].only.includes(message.author.id)) {
                    continue;
                }

                cmds[cmds.length] = {name: `${serverPrefix}${c}`, value: commands[c].description};
            }

            return await pageEmbed(message, {title: 'Eu entendo isso aqui vei', description}, cmds);
        }
    }
}
