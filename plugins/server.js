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

import Command from "../lib/Command.js";
import {serverConfig} from "../global.js";
import {database_url, prefix as Prefix} from "../config.js";
import ServerConfig from "../lib/ServerConfig.js";
import getLocalizedString, {langs} from "../lang/lang.js";

export const prefix = new Command({
    description: {
        en_US: 'Shows/changes the server prefix.',
        pt_BR: 'Mostra/altera o prefixo no servidor.',
    },
    usage: 'setprefix [prefix]',

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id) ?? new ServerConfig({guild: message.guild.id, prefix: Prefix});

        if (args.length === 0) {
            return await message.channel.send(`Prefixo: \`${sc.prefix}\`.`);
        }

        if (!message.member.guild.member(message.author).hasPermission('MANAGE_GUILD')) {
            return await message.channel.send('Coé rapaz tá doidão?');
        }

        sc.prefix = args[0];
        serverConfig.set(message.guild.id, sc);
        await sc.save(database_url);

        return await message.channel.send(`Prefixo alterado para \`${args[0]}\`.`);
    },
});

export const lang = new Command({
    description: {
        en_US: 'Changes the bot language.',
        pt_BR: 'Altera o idioma do bot no servidor.',
    },
    usage: 'lang [lang_COUNTRY]',

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id) ?? new ServerConfig({guild: message.guild.id, prefix: Prefix});

        if (args.length === 0) {
            return await message.channel.send(`Qual o idioma lek?`);
        }

        if (!message.member.guild.member(message.author).hasPermission('MANAGE_GUILD')) {
            return await message.channel.send('Coé rapaz tá doidão?');
        }

        if (!(args[0] in langs)) {
            return await message.channel.send('Não falo em língua estranha.');
        }

        sc.lang = args[0];
        serverConfig.set(message.guild.id, sc);
        await sc.save(database_url);

        return await message.channel.send(`Idioma alterado para \`${args[0]}\`.`);
    },
});
