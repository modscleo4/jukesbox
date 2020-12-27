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
 * @file Music plugin (volume command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {queue, serverConfig} from "../../global.js";
import {database_url, prefix} from "../../config.js";
import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Shows/changes the volume (0-100).',
        pt_BR: 'Mostra/altera o volume (0-100).',
    },
    usage: 'volume [v]',

    userPermissions: {
        server: ['MANAGE_GUILD'],
    },

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const serverQueue = queue.get(message.guild.id);
        const sc = serverConfig.get(message.guild.id) ?? new ServerConfig({guild: message.guild.id, prefix});

        if (args.length === 0) {
            return await message.channel.send(i18n('music.volume.volume', sc?.lang, {volume: sc.volume}));
        }

        await this.checkPermissions(message);

        let volume = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) >= 0) ? parseInt(args[0]) : 0;
        if (volume > 100) {
            volume = 100;
        }

        if (serverQueue) {
            serverQueue.volume = volume;
            serverQueue.connection.dispatcher.setVolume(serverQueue.volume / 100);
        }

        sc.volume = volume;
        serverConfig.set(message.guild.id, sc);
        await sc.save(database_url);

        return await message.channel.send(i18n('music.volume.success', sc?.lang));
    },
});
