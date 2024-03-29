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
 * @file Music plugin (nowplaying command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import MessageEmbed from "../../lib/MessageEmbed.js";

import { queue } from "../../global.js";
import { getGeniusLyrics } from "../../lib/utils.js";
import Command, { CommandContext, CommandReturn, OptionType } from "../../lib/Command.js";
import { options } from '../../config.js';
import { serverConfig } from "../../global.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

class Lyrics extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Shows the current song lyrics.',
                pt_BR: 'Mostra a letra da música que está tocando.',
            },
            options: [
                {
                    name: 'query',
                    description: 'The song to search for.',
                    type: OptionType.STRING,
                    required: false,
                }
            ],

            botPermissions: {
                text: ['EmbedLinks'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id);
        const serverQueue = queue.get(guild.id);

        await this.checkPermissions({ guild, channel, author, member });

        let q;
        if (!args.length) {
            if (!serverQueue || !serverQueue.song) {
                throw new CommandExecutionError({ content: i18n('music.queueEmpty', sc?.lang) });
            }

            q = `${serverQueue.song.uploader} - ${serverQueue.song.title}`;
        } else {
            q = args.join(' ');
        }

        const lyrics = await getGeniusLyrics(options.geniusToken, q);
        if (!lyrics) {
            throw new CommandExecutionError({ content: i18n('music.lyrics.nothingFound', sc?.lang) });
        }

        return { content: lyrics };
    }
}

export default new Lyrics();
