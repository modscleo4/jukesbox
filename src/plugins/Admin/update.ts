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

import { execSync } from 'child_process';

import { options } from "../../config.js";
import Command, { CommandContext, CommandReturn } from "../../lib/Command.js";
import { serverConfig } from "../../global.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";
import { ActivityType } from 'discord.js';

class Update extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Updates the bot.',
                pt_BR: 'Atualiza o bot.',
            },

            only: [options.adminID]
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id);

        client.user!.setPresence({
            activities: [{
                name: 'Atualizando',
                type: ActivityType.Custom,
            }],

            status: 'dnd',
        });

        try {
            const gitpull = execSync('git pull --rebase').toString();
            await sendMessage({ content: '```' + gitpull + '```' });

            try {
                // Only run npm install if the dependencies were updated
                if (gitpull.includes('package.json') || gitpull.includes('package-lock.json')) {
                    await sendMessage({ content: '```' + execSync('npm ci') + '```' });
                }
            } catch (e) {
                if (e instanceof Error) {
                    throw new CommandExecutionError({ content: 'Error during npm ci: \n```' + e.message + '```' });
                }

                throw new CommandExecutionError({ content: 'Error during npm ci: \n```' + e + '```' });
            }
        } catch (e) {
            if (e instanceof Error) {
                throw new CommandExecutionError({ content: 'Error during git pull: \n```' + e.message + '```' });
            }

            throw new CommandExecutionError({ content: 'Error during git pull: \n```' + e + '```' });
        }

        setTimeout(() => {
            process.exit(1);
        }, 1000);

        return { content: i18n('admin.update.updating', sc?.lang) };
    }
}

export default new Update();
