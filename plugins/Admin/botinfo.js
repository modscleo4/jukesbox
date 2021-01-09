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
 * @file Admin plugin (botinfo command)
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {MessageEmbed} from "discord.js";

import {startupTime, queue, serverConfig} from "../../global.js";
import {adminID} from "../../config.js";
import {pageEmbed, parseMS} from "../../lib/utils.js";
import Message from "../../lib/Message.js";
import Command from "../../lib/Command.js";
import i18n from "../../lang/lang.js";

export default new Command({
    description: {
        en_US: 'Bot information.',
        pt_BR: 'Informações do bot.',
    },
    usage: 'botinfo [servers] [voicechannels]',
    only: [adminID],

    botPermissions: {
        text: ['EMBED_LINKS'],
    },

    /**
     *
     * @this {Command}
     * @param {Message} message
     * @param {string[]} args
     * @return {Promise<*>}
     */
    async fn(message, args) {
        const sc = serverConfig.get(message.guild.id);

        const subcommands = {
            async servers() {
                const servers = message.client.guilds.cache.map(g => ({
                    name: g.name,
                    value: i18n('admin.botinfo.serverID', sc?.lang, {id: g.id}),
                }));

                return await pageEmbed(message, {title: i18n('admin.botinfo.servers', sc?.lang), content: servers});
            },

            async voicechannels() {
                const voiceChannels = message.client.voice.connections.map(g => ({
                    name: g.channel.name,
                    value: i18n('admin.botinfo.serverName', sc?.lang, {server: g.channel.guild.name}),
                }));

                return await pageEmbed(message, {title: i18n('admin.botinfo.voiceChannels', sc?.lang), content: voiceChannels});
            },
        };

        await this.checkPermissions(message);

        if (args[0] && args[0] in subcommands) {
            return await subcommands[args[0]]();
        }

        return await message.channel.send(new MessageEmbed({
            title: 'Admin',
            author: {name: message.client.user.username, iconURL: message.client.user.avatarURL()},
            timestamp: new Date(),
            fields: [
                {name: i18n('admin.botinfo.servers', sc?.lang), value: message.client.guilds.cache.size, inline: true},
                {name: i18n('admin.botinfo.voiceChannels', sc?.lang), value: message.client.voice.connections.size, inline: true},
                {name: i18n('admin.botinfo.uptime', sc?.lang), value: parseMS(Date.now() - startupTime).toString(), inline: true},
                {name: i18n('admin.botinfo.uuid', sc?.lang), value: message.client.user.id, inline: false},
                {name: i18n('admin.botinfo.server', sc?.lang), value: message.guild.region, inline: true},
                {name: i18n('admin.botinfo.ping', sc?.lang), value: `${message.client.ws.ping.toFixed(0)} ms`, inline: true},
                {name: i18n('admin.botinfo.playingIn', sc?.lang), value: i18n('admin.botinfo.nServers', sc?.lang, {n: queue.size}), inline: true},
                {name: i18n('admin.botinfo.ram', sc?.lang), value: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1)} MiB`, inline: true},
                {name: i18n('admin.botinfo.platform', sc?.lang), value: process.platform, inline: true},
            ],
        }));
    }
});
