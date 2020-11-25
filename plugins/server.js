const {serverConfig} = require('../global');
const {database_url, prefix} = require('../config.js');
const {serverConfigConstruct, saveServerConfig} = require('../lib/utils');

module.exports = {
    prefix: {
        description: 'Mostra/altera o prefixo no servidor.',
        usage: 'setprefix [prefix]',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<void>}
         */
        fn: async (message, args) => {
            const sc = serverConfig.get(message.guild.id) || serverConfigConstruct(prefix);

            if (args.length === 0) {
                return await message.channel.send(`Prefixo: \`${sc.prefix}\`.`);
            }

            if (!message.member.guild.member(message.author).hasPermission('MANAGE_SERVER')) {
                return await message.channel.send('Coé rapaz tá doidão?');
            }

            sc.prefix = args[0];
            serverConfig.set(message.guild.id, sc);
            await saveServerConfig(database_url, message.guild.id, sc);

            return await message.channel.send(`Prefixo alterado para \`${args[0]}\`.`);
        },
    },
};
