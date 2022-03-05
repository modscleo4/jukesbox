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

import {Client as BaseClient} from "discord.js";

import {options} from '../config.js';
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
     * @param {import('discord.js').ClientOptions} [options=undefined]
     */
    constructor(options = undefined) {
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
        const voiceChannels = this.voice.connections.map(c => c.channel);

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
        for (const channel of voiceChannels) {
            await channel.join().catch(() => { });
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
