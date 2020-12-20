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
 * @file Music plugin (remove command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {queue} from "../../global.js";
import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import skip from "./skip.js";
import getLocalizedString from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Removes a song from the queue.',
        pt_BR: 'Remove uma música da fila.',
    },
    usage: 'remove',

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const serverQueue = queue.get(message.guild.id);

        if (!serverQueue) {
            return await message.channel.send('Tá limpo vei.');
        }

        let toRemove = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 1;
        if (toRemove >= serverQueue.songs.length) {
            toRemove = serverQueue.songs.length - 1;
        }

        if (toRemove === 0) {
            return await skip.fn(message, ['1']);
        }

        serverQueue.songs.splice(toRemove, 1);

        return await message.channel.send('Cospe esse filha da puta porra.');
    },
});
