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
 * @file Admin plugin
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {Message, MessageEmbed} from "discord.js";

import {startupTime, queue} from "../global.js";
import {adminID} from "../config.js";
import {pageEmbed} from "../lib/utils.js";
import Command from "../lib/Command.js";
import getLocalizedString from "../lang/lang.js";

export const botinfo = new Command({
    description: {
        en_US: 'Bot information.',
        pt_BR: 'Informações do bot.',
    },
    usage: 'botinfo [servers] [voicechannels]',
    only: [adminID],

    /**
     *
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const subcommands = {
            servers: async () => {
                const servers = message.client.guilds.cache.map((g, i) => ({
                    name: g.name,
                    value: `ID: ${g.id}`,
                }));

                return await pageEmbed(message, {title: 'Servidores', content: servers});
            },

            voicechannels: async () => {
                const voicechannels = message.client.voice.connections.map((g, i) => ({
                    name: g.channel.name,
                    value: `Servidor: ${g.channel.guild.name}`,
                }));

                return await pageEmbed(message, {title: 'Canais de voz', content: voicechannels});
            },
        };

        if (args[0] && args[0] in subcommands) {
            return await subcommands[args[0]]();
        }

        return await message.channel.send(new MessageEmbed({
            title: 'Admin',
            author: {name: message.client.user.username, iconURL: message.client.user.avatarURL()},
            timestamp: new Date(),
            fields: [
                {name: 'Servidores', value: message.client.guilds.cache.size, inline: true},
                {name: 'Canais de voz', value: message.client.voice.connections.size, inline: true},
                {name: 'Uptime', value: `${((Date.now() - startupTime) / 1000).toFixed(0)} s`, inline: true},
                {name: 'UID', value: message.client.user.id, inline: false},
                {name: 'Servidor', value: message.guild.region, inline: true},
                {name: 'Ping', value: `${message.client.ws.ping.toFixed(0)} ms`, inline: true},
                {name: 'Tocando em', value: `${queue.size} servidor(es)`, inline: true},
                {name: 'RAM', value: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1)} MiB`, inline: true},
                {name: 'Plataforma', value: process.platform, inline: true},
            ],
        }));
    }
});

export const restart = new Command({
    description: {
        en_US: 'Restarts the bot.',
        pt_BR: 'Reinicia o bot.',
    },
    usage: 'restart',
    only: [adminID],

    /**
     *
     * @param {Message} message
     * @return {Promise<*>}
     */
    async fn(message) {
        await message.channel.send('F');
        process.exit(0);
    },
});
