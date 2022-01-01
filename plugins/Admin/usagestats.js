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
 * @file Admin plugin (usagestats command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {MessageEmbed} from "discord.js";

import {serverConfig} from "../../global.js";
import {adminID, database_url} from "../../config.js";
import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import i18n from "../../lang/lang.js";
import {loadUsageStats} from "../../lib/utils.js";

export default new Command({
    description: {
        en_US: 'Show the commands stats.',
        pt_BR: 'Mostra as estatísticas dos comandos.',
    },
    only: [adminID],
    botPermissions: {
        text: ['EMBED_LINKS'],
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
        const sc = serverConfig.get(guild.id);

        await this.checkPermissions({guild, channel, author, member});

        const stats = (await loadUsageStats(database_url)).sort((a, b) => b.used - a.used);
        if (stats.length === 0) {
            return {content: i18n('admin.usagestats.noStats', sc?.lang)};
        }

        const cmds = [
            {
                name: '\u200B',
                value: stats.reduce((acc, cur) => acc + `\`${cur.command}\`: **${cur.used}**\n`, ''),
                inline: false,
            }
        ];

        return {
            embeds: [new MessageEmbed({
                title: i18n('admin.usagestats.embedTitle', sc?.lang),
                description: '',
                author: {name: client.user.username, iconURL: client.user.avatarURL()},
                timestamp: new Date(),
                fields: cmds,
            })]
        };
    }
});
