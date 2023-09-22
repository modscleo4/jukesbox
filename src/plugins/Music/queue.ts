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
 * @file Music plugin (queue command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import { queue } from "../../global.js";
import { pageEmbed, parseMS } from "../../lib/utils.js";
import Command, { CommandContext, CommandReturn } from "../../lib/Command.js";
import { serverConfig } from "../../global.js";
import i18n from "../../lang/lang.js";
import CommandExecutionError from "../../errors/CommandExecutionError.js";

class Queue extends Command {
    constructor() {
        super({
            description: {
                en_US: 'Displays the current queue.',
                pt_BR: 'Mostra a fila.',
            },

            botPermissions: {
                text: ['EmbedLinks'],
            }
        });
    }

    async fn({ client, guild, channel, author, member, sendMessage }: CommandContext, args: any[]): Promise<CommandReturn> {
        const sc = serverConfig.get(guild.id);
        const serverQueue = queue.get(guild.id);

        await this.checkPermissions({ guild, channel, author, member });

        if (!serverQueue || !serverQueue.resource) {
            throw new CommandExecutionError({ content: i18n('music.queueEmpty', sc?.lang) });
        }

        const songs = serverQueue.songs.map((s, i) => {
            return { name: `${i + 1}: [${s.title}](${s.url})`, value: s.uploader + "\n" + parseMS(1000 * s.duration) };
        });
        const time = parseMS(1000 * serverQueue.songs.reduce((acc, v) => acc + v.duration, 0) - (serverQueue.resource.playbackDuration + serverQueue.startTime * 1000)).toString();

        return await pageEmbed({ client }, { title: i18n('music.queue.embedTitle', sc?.lang), description: i18n('music.queue.description', sc?.lang, { time }), content: songs });
    }
}

export default new Queue();
