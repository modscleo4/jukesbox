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

import Command, { CommandContext, CommandReturn, OptionType } from "../../lib/Command.js";
import { serverConfig } from "../../global.js";
import { options } from "../../config.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n from "../../lang/lang.js";
import MessageEmbed from "../../lib/MessageEmbed.js";
import { ChannelType } from "discord.js";

class ServerInfo extends Command {
    constructor() {
        super({
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
                text: ['EmbedLinks'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id) ?? new ServerConfig({ guild: guild.id, prefix: options.prefix });

        const subcommands: Record<string, () => Promise<CommandReturn>> = {
            async roles() {
                return {
                    embeds: [new MessageEmbed({
                        title: i18n('server.serverinfo.roles_embedTitle', sc?.lang, { serverName: guild.name }),
                        author: { name: author.username, iconURL: author.avatarURL()! },
                        timestamp: new Date(),
                        thumbnail: { url: guild.iconURL()! },
                        description: guild.roles.cache.map(r => `\`${r.name}\``).join(' '),
                    })]
                };
            },

            async emojis() {
                return {
                    embeds: [new MessageEmbed({
                        title: i18n('server.serverinfo.emojis_embedTitle', sc?.lang, { serverName: guild.name }),
                        author: { name: author.username, iconURL: author.avatarURL()! },
                        timestamp: new Date(),
                        thumbnail: { url: guild.iconURL()! },
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
                author: { name: author.username, iconURL: author.avatarURL()! },
                timestamp: new Date(),
                thumbnail: { url: guild.iconURL()! },
                fields: [
                    { name: i18n('server.serverinfo.owner', sc?.lang), value: `<@!${guild.ownerId}>`, inline: true },
                    { name: i18n('server.serverinfo.id', sc?.lang), value: guild.id, inline: true },
                    { name: i18n('server.serverinfo.members', sc?.lang), value: '' + guild.memberCount, inline: true },
                    { name: '\u200B', value: '\u200B', inline: false },
                    { name: i18n('server.serverinfo.textChannels', sc?.lang), value: '' + guild.channels.cache.filter(k => k.type === ChannelType.GuildText).size, inline: true },
                    { name: i18n('server.serverinfo.voiceChannels', sc?.lang), value: '' + guild.channels.cache.filter(k => k.type === ChannelType.GuildVoice).size, inline: true },
                    { name: i18n('server.serverinfo.afkChannel', sc?.lang), value: guild.afkChannel?.name ?? i18n('server.serverinfo.noAfkChannel', sc?.lang), inline: true },
                    { name: i18n('server.serverinfo.roles', sc?.lang), value: '' + guild.roles.cache.size, inline: true },
                    { name: i18n('server.serverinfo.emojis', sc?.lang), value: '' + guild.emojis.cache.size, inline: true },
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
    }
}

export default new ServerInfo();
