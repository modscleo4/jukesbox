/**
 * Copyright 2021 Dhiego Cassiano Fogaça Barbosa

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
 * @file Admin plugin (eval command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import { options } from "../../config.js";
import Command from "../../lib/Command.js";
import { serverConfig } from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Register Slash Commands.',
        pt_BR: 'Registra os Comandos Slash.',
    },

    only: [options.adminID],

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
        const sc = serverConfig.get(guild.id);

        Object.keys(client.categoriesCommands).filter(c => c !== 'Admin').map(c => client.categoriesCommands[c]).forEach(cmds => {
            Object.keys(cmds).filter(cmdName => cmdName !== 'euquero').forEach(async cmdName => {
                const cmd = cmds[cmdName];
                await client.api.applications(client.user.id).commands.post({
                    data: {
                        name: cmdName,
                        description: cmd.description['en_US'],
                        options: cmd.options,
                    }
                });
            });
        });

        Object.keys(client.categoriesCommands).map(c => client.categoriesCommands[c]).forEach(cmds => {
            Object.keys(cmds).forEach(async cmdName => {
                const cmd = cmds[cmdName];
                await client.api.applications(client.user.id).guilds(guild.id).commands.post({
                    data: {
                        name: cmdName,
                        description: cmd.description['en_US'],
                        options: cmd.options,
                    }
                });
            });
        });

        return { content: i18n('admin.registercommands.success', sc?.lang) };
    },
});
