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
 * @file Chat plugin
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {Message, MessageEmbed} from "discord.js";
import Command from "../lib/Command.js";

export const clear = new Command({
    description: 'Apaga {n} mensagens do canal atual.',
    usage: 'clear [n]...',

    /**
     *
     * @param {Message} message
     * @param {String[]} args
     */
    fn: async (message, args) => {
        if (!message.guild.me.hasPermission('MANAGE_MESSAGES')) {
            return await message.channel.send('ME AJUDA.');
        }

        if (!message.member.guild.member(message.author).hasPermission('MANAGE_MESSAGES')) {
            return await message.channel.send('Coé rapaz tá doidão?');
        }

        const n = (args.length > 0 && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > 0) ? parseInt(args[0]) : 100;

        await message.delete().then(async () => {
            n % 100 > 0 && await message.channel.bulkDelete(n % 100);

            for (let i = 0; i < Math.floor(n / 100); i++) {
                await message.channel.bulkDelete(100);
            }
        }).then(async () => {
            await message.channel.send(`Apaguei ${n} mensage${n > 1 ? 'ns' : 'm'}.`).then(m => m.delete({timeout: 1000}));
        }).catch(async e => {
            console.error(e);
            await message.channel.send('Deu ruim aqui lek.');
        });
    }
});

export const poll = new Command({
    description: 'Cria uma enquete (máx. de 10 itens). Os itens devem estar entre `""`',
    usage: 'poll [n1] [n2] ... n[10]',

    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @return {Promise<*>}
     */
    fn: async (message, args) => {
        const titleI = args.findIndex(a => /\/title{[^}]+}/gmi.test(a));
        if (titleI === -1) {
            return await message.channel.send('Informe o título da enquete.');
        }

        const title = /\/title{(?<Title>[^}]+)}/gmi.exec(args[titleI]).groups.Title;
        args.splice(titleI, 1);
        args = args.map(a => a.replace(/"/gmi, ''));

        const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].splice(0, args.length);

        const msg = await message.channel.send(new MessageEmbed()
            .setTitle(title)
            .setAuthor(message.client.user.username, message.client.user.avatarURL())
            .setTimestamp()
            .setDescription(args.map((r, i) => `**${i + 1}** - ${r}`).join('\n\n')));

        await message.delete();
        reactions.map(async r => await msg.react(r));
    },
});
