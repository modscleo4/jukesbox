/**
 * Copyright 2020 Dhiego Cassiano Fogaça Barbosa

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @file Server configuration plugin
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

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
