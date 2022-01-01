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
 * @file Server configuration plugin (lang command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import {database_url, prefix} from "../../config.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n, {langs} from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Shows/changes the bot language.',
        pt_BR: 'Mostra/altera o idioma do bot no servidor.',
    },
    options: [
        {
            name: 'lang',
            description: 'Language to set.',
            type: OptionType.STRING,
            choices: [
                {
                    name: 'Portuguese (Brazil)',
                    value: 'pt_BR',
                },
                {
                    name: 'English (United States)',
                    value: 'en_US',
                },
            ],
        }
    ],

    userPermissions: {
        server: ['MANAGE_GUILD'],
    },

    /**
     *
     * @this {Command}
     * @param {Object} message
     * @param {import('../../lib/Client.js').default} message.client
     * @param {import('discord.js').Guild} message.guild
     * @param {import('discord.js').TextChannel} message.channel
     * @param {import('discord.js').User} message.author
     * @param {import('discord.js').GuildMember} message.member
     * @param {import('../../lib/Command.js').SendMessageFn} message.sendMessage
     * @param {string[]} args
     * @return {Promise<import('../../lib/Command.js').CommandReturn>}
     */
    async fn({client, guild, channel, author, member, sendMessage}, args) {
        const sc = serverConfig.get(guild.id) ?? new ServerConfig({guild: guild.id, prefix});

        if (args.length === 0) {
            return {content: i18n('server.lang.lang', sc?.lang, {lang: sc.lang})};
        }

        await this.checkPermissions({guild, channel, author, member});

        if (!(args[0] in langs)) {
            return {content: i18n('server.lang.unknownLang', sc?.lang)};
        }

        sc.lang = args[0];
        serverConfig.set(guild.id, sc);
        await sc.save(database_url);

        return {content: i18n('server.lang.success', sc?.lang, {lang: args[0]})};
    },
});
