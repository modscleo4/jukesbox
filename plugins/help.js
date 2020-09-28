const {MessageEmbed} = require('discord.js');
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
            const commands = message.client.commands;
            const cmds = [];
            for (const c in commands) {
                if (commands[c].only && !commands[c].only.includes(message.author.id)) {
                    continue;
                }

                cmds[cmds.length] = {name: `${prefix}${c}`, value: commands[c].description};
            }

            return await pageEmbed(message, 'Eu entendo isso aqui vei', cmds);
        }
    }
}
