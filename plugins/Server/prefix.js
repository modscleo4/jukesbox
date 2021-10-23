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
 * @file Server configuration plugin (prefix command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import {database_url, prefix} from "../../config.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Shows/changes the server prefix.',
        pt_BR: 'Mostra/altera o prefixo no servidor.',
    },
    options: [
        {
            name: 'prefix',
            description: 'Number of messages to delete.',
            type: OptionType.STRING,
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
     * @param {Function} message.sendMessage
     * @param {string[]} args
     * @return {Promise<{content?: string, embeds?: import('discord.js').MessageEmbed[], lockAuthor?: boolean, reactions?: string[], onReact?: Function, onEndReact?: Function, timer?: number, deleteAfter?: boolean}>}{Promise<string|import('discord.js').MessageEmbed|{embed: import('discord.js').MessageEmbed, reactions: string[]}>}
     */
    async fn({client, guild, channel, author, member, sendMessage}, args) {
        const sc = serverConfig.get(guild.id) ?? new ServerConfig({guild: guild.id, prefix});

        if (args.length === 0) {
            return {content: i18n('server.prefix.prefix', sc?.lang, {prefix: sc.prefix})};
        }

        await this.checkPermissions({guild, channel, author, member});

        sc.prefix = args[0];
        serverConfig.set(guild.id, sc);
        await sc.save(database_url);

        return {content: i18n('server.prefix.success', sc?.lang, {prefix: args[0]})};
    },
});
