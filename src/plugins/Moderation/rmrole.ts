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
 * @file Moderation plugin (rmrole command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import { Role } from "discord.js";

import Command, { CommandContext, CommandReturn, OptionType } from "../../lib/Command.js";
import { serverConfig } from "../../global.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

class RmRole extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Remove one or more roles from a `@member`.',
                pt_BR: 'Remove um ou mais cargos de um `@membro`.',
            },
            options: [
                {
                    name: 'user',
                    description: 'Target User',
                    type: OptionType.USER,
                    required: true,
                },
                {
                    name: 'role_1',
                    description: 'Target Role',
                    type: OptionType.ROLE,
                    required: true,
                },
                {
                    name: 'role_2',
                    description: 'Target Role',
                    type: OptionType.ROLE,
                },
                {
                    name: 'role_3',
                    description: 'Target Role',
                    type: OptionType.ROLE,
                },
                {
                    name: 'role_4',
                    description: 'Target Role',
                    type: OptionType.ROLE,
                },
                {
                    name: 'role_5',
                    description: 'Target Role',
                    type: OptionType.ROLE,
                },
                {
                    name: 'role_6',
                    description: 'Target Role',
                    type: OptionType.ROLE,
                },
                {
                    name: 'role_7',
                    description: 'Target Role',
                    type: OptionType.ROLE,
                },
                {
                    name: 'role_8',
                    description: 'Target Role',
                    type: OptionType.ROLE,
                },
                {
                    name: 'role_9',
                    description: 'Target Role',
                    type: OptionType.ROLE,
                },
                {
                    name: 'role_10',
                    description: 'Target Role',
                    type: OptionType.ROLE,
                },
            ],

            botPermissions: {
                server: ['ManageRoles'],
            },

            userPermissions: {
                server: ['ManageRoles'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id);

        await this.checkPermissions({ guild, channel, author, member });

        if (!args[0]?.match(/\d + /gm)) {
            throw new CommandExecutionError({ content: i18n('mod.rmrole.missingUser', sc?.lang) });
        }

        if (args.length < 2) {
            throw new CommandExecutionError({ content: i18n('mod.rmrole.missingRole', sc?.lang) });
        }

        const userID = /(?<User>\d+)/gmi.exec(args.shift())!.groups!.User;
        const guildMember = await guild.members.fetch(userID);
        const roles = args.map(r => guild.roles.cache.find(g => g.name === r || g.id === r));

        if (!guildMember) {
            throw new CommandExecutionError({ content: i18n('mod.rmrole.invalidUser', sc?.lang) });
        }

        if (roles.includes(undefined)) {
            throw new CommandExecutionError({ content: i18n('mod.rmrole.invalidRole', sc?.lang, { role: args[roles.indexOf(undefined)] }) });
        }

        if (roles.find(r => r && !r.editable)) {
            throw new CommandExecutionError({ content: i18n('mod.rmrole.nonEditableRole', sc?.lang, { role: roles.find(r => !r!.editable)!.name }) });
        }

        await guildMember.roles.remove(roles as Role[]);
        return { content: i18n('mod.rmrole.success', sc?.lang, { user: guildMember.user.id }) };
    }
}

export default new RmRole();
