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
 * @file Admin plugin (update command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {execSync} from 'child_process';

import {options} from "../../config.js";
import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

export default new Command({
    description: {
        en_US: 'Updates the bot.',
        pt_BR: 'Atualiza o bot.',
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
    async fn({client, guild, channel, author, member, sendMessage}, args) {
        const sc = serverConfig.get(guild.id);

        await client.user.setPresence({
            activity: {
                name: 'Atualizando',
                type: 'CUSTOM_STATUS',
            },

            status: 'dnd',
        });

        try {
            const gitpull = execSync('git pull --rebase').toString();
            await sendMessage({content: '```' + gitpull + '```'});

            try {
                // Only run npm install if the dependencies were updated
                if (gitpull.includes('package.json') || gitpull.includes('package-lock.json')) {
                    await sendMessage({content: '```' + execSync('npm ci') + '```'});
                }
            } catch (e) {
                throw new CommandExecutionError({content: 'Error during npm ci: \n```' + e.message + '```'});
            }
        } catch (e) {
            throw new CommandExecutionError({content: 'Error during git pull: \n```' + e.message + '```'});
        }

        setTimeout(() => {
            process.exit(1);
        }, 1000);

        return {content: i18n('admin.update.updating', sc?.lang)};
    },
});
