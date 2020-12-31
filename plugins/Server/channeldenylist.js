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
 * @file Server configuration plugin (channelallow command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import {database_url, prefix} from "../../config.js";
import ServerConfig from "../../lib/ServerConfig.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Shows the blocked Commands on the current Text Channel.',
        pt_BR: 'Mostra os comandos bloqueados no Canal de Texto atual.',
    },
    usage: 'channeldenylist',

    userPermissions: {
        text: ['MANAGE_CHANNELS'],
    },

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id) ?? new ServerConfig({guild: message.guild.id, prefix});

        await this.checkPermissions(message);

        if (!sc.channelDenies[message.channel.id]) {
            return await message.channel.send(i18n('server.channeldenylist.noBlocked', sc?.lang));
        }

        return await message.channel.send(i18n('server.channeldenylist.list', sc?.lang, {cmds: Array.from(sc.channelDenies[message.channel.id]).map(c => `\`${c}\``)}));
    },
});
