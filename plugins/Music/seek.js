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
 * @file Music plugin (seek command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {queue} from "../../global.js";
import Message from "../../lib/Message.js";
import Command, {OptionType} from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Seeks on a specific timestamp of the song. Format is in `seconds`.',
        pt_BR: 'Altera a posição da música. Formato em `segundos`.',
    },
    options: [
        {
            name: 's',
            description: 'Seconds timestamp.',
            type: OptionType.INTEGER,
            required: true,
        }
    ],

    /**
     *
     * @this {Command}
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<string|import('discord.js').MessageEmbed|{embed: import('discord.js').MessageEmbed, reactions: string[]}>}
     */
    async fn({client, guild, channel, author, member}, args) {
        const sc = serverConfig.get(guild.id);
        const serverQueue = queue.get(guild.id);

        if (!serverQueue) {
            return i18n('music.queueEmpty', sc?.lang);
        }

        if (args.length === 0) {
            return i18n('music.seek.noTime', sc?.lang);
        }

        if (args[0].match(/^\+\d+$/)) {
            args[0] = (Math.floor(serverQueue.player.streamTime / 1000 + serverQueue.startTime) + parseInt(args[0].slice(1))).toString();
        } else if (args[0].match(/^-\d+$/)) {
            args[0] = (Math.floor(serverQueue.player.streamTime / 1000 + serverQueue.startTime) - parseInt(args[0].slice(1))).toString();
        }

        const s = Math.min((Number.isInteger(parseInt(args[0])) && parseInt(args[0]) >= 0) ? parseInt(args[0]) : 0, serverQueue.song.duration);

        serverQueue.song.seek = s;
        serverQueue.startTime = s;
        serverQueue.connection.dispatcher?.end();
    },
});
