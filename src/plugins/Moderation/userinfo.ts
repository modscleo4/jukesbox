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
 * @file Moderation plugin (userinfo command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import MessageEmbed from "../../lib/MessageEmbed.js";

import Command, { CommandContext, CommandReturn, OptionType } from "../../lib/Command.js";
import { serverConfig } from "../../global.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

class UserInfo extends Command {
    constructor() {
        super({
            description: {
                en_US: '`@member` information.',
                pt_BR: 'Informações de um `@membro`.',
            },
            options: [
                {
                    name: 'user',
                    description: 'Target User',
                    type: OptionType.USER,
                    required: true,
                }
            ],

            botPermissions: {
                text: ['EmbedLinks'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id);

        await this.checkPermissions({ guild, channel, author, member });

        if (!args[0].match(/\d+/gm)) {
            throw new CommandExecutionError({ content: i18n('mod.userinfo.missingUser', sc?.lang) });
        }

        const userID = /(?<User>\d+)/gmi.exec(args.shift())!.groups!.User;
        const guildMember = await guild.members.fetch(userID);

        if (!guildMember) {
            throw new CommandExecutionError({ content: i18n('mod.userinfo.invalidUser', sc?.lang) });
        }

        return {
            embeds: [new MessageEmbed({
                title: guildMember.nickname ?? guildMember.user.tag,
                author: { name: author.username, iconURL: author.avatarURL()! },
                color: guildMember.displayColor,
                timestamp: new Date(),
                thumbnail: { url: guildMember.user.avatarURL()! },
                fields: [
                    { name: i18n('mod.userinfo.username#tag', sc?.lang), value: guildMember.user.tag, inline: true },
                    { name: i18n('mod.userinfo.uuid', sc?.lang), value: guildMember.id, inline: true },
                    { name: i18n('mod.userinfo.roles', sc?.lang), value: guildMember.roles.cache.map(r => `\`${r.name}\``).join(' '), inline: false },
                    {
                        name: i18n('mod.userinfo.joined', sc?.lang),
                        value: new Intl.DateTimeFormat('pt-br', {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric"
                        }).format(guildMember.joinedAt!),
                        inline: true
                    },
                    {
                        name: i18n('mod.userinfo.created', sc?.lang),
                        value: new Intl.DateTimeFormat('pt-br', {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric"
                        }).format(guildMember.user.createdAt),
                        inline: true
                    },
                    { name: i18n('mod.userinfo.bot', sc?.lang), value: guildMember.user.bot ? i18n('mod.userinfo.yes', sc?.lang) : i18n('mod.userinfo.no', sc?.lang), inline: true },
                ],
            })]
        };
    }
}

export default new UserInfo();
