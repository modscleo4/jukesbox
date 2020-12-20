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
 * @file Music plugin (resume command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {queue} from "../../global.js";
import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import getLocalizedString from "../../lang/lang.js";


export default new Command({
    description: {
        en_US: 'Resumes the playback.',
        pt_BR: 'Continua a reprodução da música.',
    },
    usage: 'resume',

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    async fn(message) {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = queue.get(message.guild.id);

        if (!voiceChannel) {
            return await message.channel.send('Tá solo né filha da puta.');
        }

        if (!serverQueue) {
            return await message.channel.send('Tá limpo vei.');
        }

        if (serverQueue.playing) {
            return await message.channel.send('Já tá tocando lek.');
        }

        serverQueue.connection.dispatcher.resume();
        serverQueue.playing = true;
        return await message.channel.send(`Solta o filha da puta pra eu da um tiro na cabeça dele.`);
    },
});
