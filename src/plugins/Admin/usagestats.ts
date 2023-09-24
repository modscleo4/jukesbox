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

import MessageEmbed from "../../lib/MessageEmbed.js";

import { serverConfig } from "../../global.js";
import { options } from "../../config.js";
import Command, { CommandContext, CommandReturn, OptionType } from "../../lib/Command.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";
import { prisma } from "../../lib/prisma.js";

class UsageStats extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Show the commands stats.',
                pt_BR: 'Mostra as estatísticas dos comandos.',
            },

            only: [options.adminID],

            botPermissions: {
                text: ['EmbedLinks'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id);

        await this.checkPermissions({ guild, channel, author, member });

        const stats = await prisma.commandStat.findMany({ orderBy: { used: 'desc' } });
        if (stats.length === 0) {
            throw new CommandExecutionError({ content: i18n('admin.usagestats.noStats', sc?.lang) });
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
                author: { name: client.user!.username, iconURL: client.user!.avatarURL()! },
                timestamp: new Date(),
                fields: cmds,
            })]
        };
    }
}

export default new UsageStats();
