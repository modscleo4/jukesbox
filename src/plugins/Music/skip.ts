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
 * @file Music plugin (skip command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import { queue } from "../../global.js";
import Command, { CommandContext, CommandReturn, OptionType } from "../../lib/Command.js";
import { serverConfig } from "../../global.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

class Skip extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Skip `n` songs.',
                pt_BR: 'Pula `n` músicas.',
            },
            options: [
                {
                    name: 'n',
                    description: 'Number of songs to skip.',
                    type: OptionType.INTEGER,
                    required: false,
                }
            ],

            aliases: ['next']
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id);
        const serverQueue = queue.get(guild.id);

        await this.checkVoiceChannel({ guild, member });

        if (!serverQueue) {
            throw new CommandExecutionError({ content: i18n('music.queueEmpty', sc?.lang) });
        }

        const skips = Math.min((args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 1, serverQueue.songs.length);
        if (skips === serverQueue.songs.length) {
            serverQueue.playing = false;
        }

        serverQueue.songs.splice(serverQueue.position, skips - 1);
        if (serverQueue.loop) {
            serverQueue.songs.shift();
        }

        !serverQueue.playing && serverQueue.player?.unpause();
        serverQueue.player?.stop(true);

        return { content: i18n('music.skip.success', sc?.lang) };
    }
}

export default new Skip();
