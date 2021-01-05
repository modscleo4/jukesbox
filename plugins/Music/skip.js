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

import {queue} from "../../global.js";
import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Skip `n` songs.',
        pt_BR: 'Pula `n` músicas.',
    },
    usage: 'skip [n]',

    aliases: ['next'],

    /**
     *
     * @this {Command}
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id);
        const serverQueue = queue.get(message.guild.id);

        await this.checkVoiceChannel(message);

        if (!serverQueue) {
            return await message.channel.send(i18n('music.queueEmpty', sc?.lang));
        }

        let skips = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 1;
        if (skips > serverQueue.songs.length) {
            skips = serverQueue.songs.length;
            serverQueue.playing = false;
        }

        serverQueue.songs.splice(serverQueue.position, skips - 1);
        if (serverQueue.loop) {
            serverQueue.songs.shift();
        }

        serverQueue.connection.dispatcher.end();

        return await message.channel.send(i18n('music.skip.success', sc?.lang));
    },
});
