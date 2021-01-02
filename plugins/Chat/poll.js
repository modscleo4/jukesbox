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
 * @file Chat plugin (poll command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {MessageEmbed} from "discord.js";

import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import {serverConfig} from "../../global.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Create a poll (max. of 10 items). They must be between `""`.',
        pt_BR: 'Cria uma enquete (máx. de 10 itens). Os itens devem estar entre `""`',
    },
    usage: 'poll /title{[title]} [n1] [n2] ... [n10]',

    botPermissions: {
        text: ['EMBED_LINKS'],
    },

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id);

        await this.checkPermissions(message);

        const titleI = args.findIndex(a => /\/title{[^}]+}/gmi.test(a));
        if (titleI === -1) {
            return await message.channel.send(i18n('chat.poll.missingTitle', sc?.lang));
        }

        const title = /\/title{(?<Title>[^}]+)}/gmi.exec(args[titleI]).groups.Title;
        args.splice(titleI, 1);
        args = args.map(a => a.replace(/"/gmi, ''));

        const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].splice(0, args.length);

        const msg = await message.channel.send(new MessageEmbed({
            title,
            author: {name: message.client.user.username, iconURL: message.client.user.avatarURL()},
            timestamp: new Date(),
            description: args.map((r, i) => `**${i + 1}** - ${r}`).join('\n\n'),
        }));

        await message.delete().catch(() => {

        });

        reactions.map(async r => await msg.react(r));
    },
});
