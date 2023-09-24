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

import { CreateVoiceConnectionOptions, joinVoiceChannel as JoinVoiceChannel, JoinVoiceChannelOptions, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { Client as BaseClient, ClientOptions } from "discord.js";

import { options } from '../config.js';
import { queue, voiceConnections } from "../global.js";
import Command from "./Command.js";

export default class Client extends BaseClient {
    #categoriesCommands: Record<string, Record<string, Command>> = {};
    #commands: Record<string, Command> = {};
    #aliases: Record<string, string> = {};

    constructor(options: ClientOptions = { intents: ['Guilds', 'GuildMessages', 'GuildMessageReactions', 'GuildMessageTyping', 'GuildVoiceStates', 'DirectMessages'] }) {
        super(options);
    }

    loadCommands(categoriesCommands: Record<string, Record<string, Command>>) {
        this.#categoriesCommands = categoriesCommands;
        this.#commands = Object.keys(this.#categoriesCommands).map(k => this.#categoriesCommands[k]).reduce((acc, m) => ({ ...acc, ...m }), {});
        this.#aliases = Object.keys(this.#commands).filter(k => this.#commands[k].aliases.length > 0).map(k => ({
            command: k,
            aliases: this.#commands[k].aliases
        })).reduce((acc, {
            command,
            aliases
        }) => ({ ...acc, ...(aliases.map(a => ({ [a]: command }))).reduce((acc, mm) => ({ ...acc, ...mm }), {}) }), {});
    }

    getVoiceChannel(guildId: string): VoiceConnection | undefined {
        return voiceConnections.get(guildId);
    }

    joinVoiceChannel(options: JoinVoiceChannelOptions & CreateVoiceConnectionOptions): VoiceConnection {
        if (voiceConnections.has(options.guildId)) {
            return voiceConnections.get(options.guildId)!;
        }

        const voiceConnection = JoinVoiceChannel(options);
        voiceConnections.set(options.guildId, voiceConnection);
        return voiceConnection;
    }

    leaveVoiceChannel(guildId: string) {
        const serverQueue = queue.get(guildId);

        if (serverQueue) {
            serverQueue.songs = [];
            serverQueue.connection?.destroy();
            serverQueue.playing = false;
        }

        if (voiceConnections.has(guildId)) {
            const voiceConnection = voiceConnections.get(guildId)!;
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
