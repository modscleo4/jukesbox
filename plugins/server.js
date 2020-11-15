const {serverConfig} = require('../global');
const {database_url, prefix} = require('../config.js');
const {serverConfigConstruct, saveServerConfig} = require('../lib/utils');

module.exports = {
    setprefix: {
        description: 'Altera o prefixo no servidor.',
        usage: 'setprefix [prefix]',

        /**
         *
         * @param {Message} message
         * @param {String[]} args
         * @return {Promise<void>}
         */
        fn: async (message, args) => {
            if (args.length === 0) {
                return await message.channel.send('Informa o prefixo lek.');
            }

            const sc = serverConfig.get(message.guild.id) || serverConfigConstruct(prefix);

            sc.prefix = args[0];
            serverConfig.set(message.guild.id, sc);
            await saveServerConfig(database_url, message.guild.id, sc);

            return await message.channel.send(`Prefixo alterado para \`${args[0]}\`.`);
        },
    },
};
