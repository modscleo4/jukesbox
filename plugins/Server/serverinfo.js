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
* @file Server configuration plugin (serverinfo command)
*
* @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
*/

'use strict';

import Command, { OptionType } from "../../lib/Command.js";
import { serverConfig } from "../../global.js";
import { options } from "../../config.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n from "../../lang/lang.js";
import MessageEmbed from "../../lib/MessageEmbed.js";

export default new Command({
    description: {
        en_US: 'Shows all Server settings and info.',
        pt_BR: 'Mostra as configurações e informações do Servidor.',
    },
    options: [
        {
            name: 'subcommand',
            description: 'Show all Roles/Emojis of this Guild.',
            type: OptionType.STRING,
            choices: [
                {
                    name: 'Roles',
                    value: 'roles',
                },
                {
                    name: 'Emojis',
                    value: 'emojis',
                },
            ]
        },
    ],

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
    async fn({ client, guild, channel, author, member, sendMessage }, args) {
        const sc = serverConfig.get(guild.id) ?? new ServerConfig({ guild: guild.id, prefix: options.prefix });

        const subcommands = {
            async roles() {
                return {
                    embeds: [new MessageEmbed({
                        title: i18n('server.serverinfo.roles_embedTitle', sc?.lang, { serverName: guild.name }),
                        author: { name: author.username, icon_url: author.avatarURL() },
                        timestamp: new Date().toUTCString(),
                        thumbnail: { url: guild.iconURL() },
                        description: guild.roles.cache.map(r => `\`${r.name}\``).join(' '),
                    })]
                };
            },

            async emojis() {
                return {
                    embeds: [new MessageEmbed({
                        title: i18n('server.serverinfo.emojis_embedTitle', sc?.lang, { serverName: guild.name }),
                        author: { name: author.username, icon_url: author.avatarURL() },
                        timestamp: new Date().toUTCString(),
                        thumbnail: { url: guild.iconURL() },
                        description: guild.emojis.cache.map(e => e.toString()).join(' '),
                    })]
                };
            },
        };

        await this.checkPermissions({ guild, channel, author, member });

        if (args[0] && args[0] in subcommands) {
            return await subcommands[args[0]]();
        }

        return {
            embeds: [new MessageEmbed({
                title: guild.name,
                author: { name: author.username, icon_url: author.avatarURL() },
                timestamp: new Date().toUTCString(),
                thumbnail: { url: guild.iconURL() },
                fields: [
                    { name: i18n('server.serverinfo.owner', sc?.lang), value: `<@!${guild.ownerId}>`, inline: true },
                    { name: i18n('server.serverinfo.id', sc?.lang), value: guild.id, inline: true },
                    { name: i18n('server.serverinfo.members', sc?.lang), value: guild.memberCount, inline: true },
                    { name: '\u200B', value: '\u200B', inline: false },
                    { name: i18n('server.serverinfo.textChannels', sc?.lang), value: guild.channels.cache.filter(k => k.type === 'GUILD_TEXT').size, inline: true },
                    { name: i18n('server.serverinfo.voiceChannels', sc?.lang), value: guild.channels.cache.filter(k => k.type === 'GUILD_VOICE').size, inline: true },
                    { name: i18n('server.serverinfo.afkChannel', sc?.lang), value: guild.afkChannel?.name ?? i18n('server.serverinfo.noAfkChannel', sc?.lang), inline: true },
                    { name: i18n('server.serverinfo.roles', sc?.lang), value: guild.roles.cache.size, inline: true },
                    { name: i18n('server.serverinfo.emojis', sc?.lang), value: guild.emojis.cache.size, inline: true },
                    {
                        name: i18n('server.serverinfo.createdAt', sc?.lang),
                        value: new Intl.DateTimeFormat('pt-br', {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric"
                        }).format(guild.createdAt),
                        inline: true
                    },
                    { name: '\u200B', value: '\u200B', inline: false },
                    { name: i18n('server.serverinfo.prefix', sc?.lang), value: sc?.prefix ?? options.prefix, inline: true },
                    { name: i18n('server.serverinfo.lang', sc?.lang), value: sc?.lang ?? 'pt_BR', inline: true },
                    { name: i18n('server.serverinfo.telemetry', sc?.lang), value: [i18n('minimal', sc?.lang), i18n('full', sc?.lang)][sc?.telemetryLevel ?? 1], inline: true },
                ],
            })]
        };
    },
});
