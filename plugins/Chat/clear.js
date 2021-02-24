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
 * @file Chat plugin (clear command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Deletes `n` messages from the current channel.',
        pt_BR: 'Apaga `n` mensagens do canal atual.',
    },
    usage: 'clear [n]...',

    botPermissions: {
        text: ['MANAGE_MESSAGES'],
    },

    userPermissions: {
        text: ['MANAGE_MESSAGES'],
    },

    /**
     *
     * @this {Command}
     * @param {Message} message
     * @param {string[]} args
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id);

        await this.checkPermissions(message);

        if (!args[0]) {
            return await message.channel.send(i18n('chat.clear.noArgs', sc?.lang));
        }

        const n = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 100;

        await message.delete().then(async () => {
            n % 100 > 0 && await message.channel.bulkDelete(n % 100);

            for (let i = 0; i < Math.floor(n / 100); i++) {
                await message.channel.bulkDelete(100);
            }
        }).then(async () => {
            await message.channel.send(i18n('chat.clear.deletedN', sc?.lang, {n})).then(async m => await m.delete({timeout: 1000}));
        }).catch(e => {
            
        });
    }
});
