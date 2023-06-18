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
 * @file Discord.js extended Client Class
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {joinVoiceChannel as JoinVoiceChannel, VoiceConnection, VoiceConnectionStatus} from "@discordjs/voice";
import {Client as BaseClient} from "discord.js";

import {options} from '../config.js';
import {voiceConnections} from "../global.js";
import Command from "./Command.js";

export default class Client extends BaseClient {
    /**
     * @type {Object<string, Object<string, Command>>}
     */
    #categoriesCommands;

    /**
     * @type {Object<string, Command>}
     */
    #commands;

    /**
     * @type {Object<string, string>}
     */
    #aliases;

    /**
     *
     * @param {import('discord.js').ClientOptions} [options={}]
     */
    constructor(options = {intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGE_TYPING', 'GUILD_VOICE_STATES', 'DIRECT_MESSAGES']}) {
        super(options);
    }

    /**
     *
     * @param {Object<string, Object<string, Command>>} categoriesCommands
     */
    loadCommands(categoriesCommands) {
        this.#categoriesCommands = categoriesCommands;
        this.#commands = Object.keys(this.#categoriesCommands).map(k => this.#categoriesCommands[k]).reduce((a, m) => ({...a, ...m}), {});
        this.#aliases = Object.keys(this.#commands).filter(k => this.#commands[k].aliases.length > 0).map(k => ({
            command: k,
            aliases: this.#commands[k].aliases
        })).reduce((a, {
            command,
            aliases
        }) => ({...a, ...(aliases.map(a => ({[a]: command}))).reduce((a, mm) => ({...a, ...mm}), {})}), {});
    }

    async clearCache() {
        const connections = new Map(voiceConnections);

        for (const [, channel] of this.channels.cache) {
            channel.messages?.cache?.clear();
        }
        this.users.cache.clear();
        this.emojis.cache.clear();
        this.channels.cache.clear();
        this.guilds.cache.clear();

        globalThis.gc();

        await this.login(options.token);

        // Reconnect to voice channels
        for (const [guildId, connection] of connections) {
            try {
                this.leaveVoiceChannel(guildId);

                this.joinVoiceChannel(connection.joinConfig).on(VoiceConnectionStatus.Disconnected, async () => {
                    this.leaveVoiceChannel(guildId);
                });
            } catch (e) {

            }
        }
    }

    /**
     *
     * @param {string} guildId
     * @return {VoiceConnection}
     */
    getVoiceChannel(guildId) {
        return voiceConnections.get(guildId);
    }

    /**
     * @param {import("@discordjs/voice").JoinVoiceChannelOptions & import("@discordjs/voice").CreateVoiceConnectionOptions} options
     * @return {VoiceConnection}
     */
    joinVoiceChannel(options) {
        if (voiceConnections.has(options.guildId)) {
            return voiceConnections.get(options.guildId);
        }

        const voiceConnection = JoinVoiceChannel(options);
        voiceConnections.set(options.guildId, voiceConnection);
        return voiceConnection;
    }

    /**
     *
     * @param {string} guildId
     */
    leaveVoiceChannel(guildId) {
        if (voiceConnections.has(guildId)) {
            const voiceConnection = voiceConnections.get(guildId);
            if (![VoiceConnectionStatus.Disconnected, VoiceConnectionStatus.Destroyed].includes(voiceConnection.state.status)) {
                voiceConnection.destroy();
            }
            voiceConnections.delete(guildId);
        }
    }

    get categoriesCommands() {
        return this.#categoriesCommands;
    }

    get commands() {
        return this.#commands;
    }

    get aliases() {
        return this.#aliases;
    }
}
