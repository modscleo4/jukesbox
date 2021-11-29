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
 * @file Server Configuration Class
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {TextChannel} from "discord.js";
import DB from "./DB.js";
import Message from "./Message.js";

export default class ServerConfig {
    /**
     * @type {number}
     */
    #id;

    /**
     * @type {string}
     */
    #guild;

    /**
     * @type {string}
     */
    #prefix;

    /**
     * @type {number}
     */
    #volume;

    /**
     * @type {string}
     */
    #lang;

    /**
     * @type {number}
     */
    #telemetryLevel;

    /**
     * @type {Object<string, Set<string>>}
     */
    #channelDenies;

    /**
     * @type {boolean}
     */
    #dirty;

    /**
     * @type {boolean}
     */
    #channelDeniesDirty;

    /**
     *
     * @param {Object} params
     * @param {number} [params.id=null] Internal ID
     * @param {string} params.guild Server Guild ID
     * @param {string} [params.prefix='.'] Server prefix
     * @param {number} [params.volume=100] Bot volume in the Server
     * @param {string} [params.lang='pt_BR'] Bot language in the Server
     * @param {number} [params.telemetry_level=1] Telemetry Level in the Server
     * @param {Object<string, Set<string>>} [params.channelDenies={}] Channel denies and the blocked commands
     */
    constructor({id = null, guild, prefix = '.', volume = 100, lang = 'pt_BR', telemetry_level = 1, channelDenies = {}}) {
        this.#id = id;
        this.#guild = guild;
        this.#prefix = prefix;
        this.#volume = volume;
        this.#lang = lang;
        this.#telemetryLevel = telemetry_level;
        this.#channelDenies = channelDenies;

        this.#dirty = false;
        this.#channelDeniesDirty = false;
    }

    /**
     *
     * @param {string} database_url
     * @return {Promise<void>}
     */
    async save(database_url) {
        const db = new DB(database_url);

        if (this.#id) {
            if (this.#dirty) {
                await db.query('UPDATE server_configs SET prefix = $2, volume = $3, lang = $4, telemetry_level = $5 WHERE id = $1', [this.#id, this.#prefix, this.#volume, this.#lang, this.#telemetryLevel]);
            }

            if (this.#channelDeniesDirty) {
                for (const channel in this.#channelDenies) {
                    await db.query('DELETE FROM channel_denies WHERE server_config_id = $1;', [this.#id]);

                    for (const command of this.#channelDenies[channel]) {
                        await db.query('INSERT INTO channel_denies (server_config_id, channel, command) VALUES ($1, $2, $3)', [this.#id, channel, command]);
                    }
                }
            }
        } else {
            this.#id = (await db.query('INSERT INTO server_configs (guild, prefix, volume, lang, telemetry_level) VALUES ($1, $2, $3, $4, $5) RETURNING id', [this.#guild, this.#prefix, this.#volume, this.#lang, this.#telemetryLevel])).rows[0].id;

            for (const channel in this.#channelDenies) {
                for (const command of this.#channelDenies[channel]) {
                    await db.query('INSERT INTO channel_denies (server_config_id, channel, command) VALUES ($1, $2, $3)', [this.#id, channel, command]);
                }
            }
        }

        await db.close();

        this.#dirty = false;
        this.#channelDeniesDirty = false;
    }

    /**
     *
     * @param {string} database_url
     * @return {Promise<void>}
     */
    async delete(database_url) {
        const db = new DB(database_url);

        if (!this.#id) {
            return;
        }

        await db.query('DELETE FROM channel_denies WHERE server_config_id = $1', [this.#id]);
        await db.query('DELETE FROM server_configs WHERE id = $1', [this.#id]);

        await db.close();
    }

    get id() {
        return this.#id;
    }

    get guild() {
        return this.#guild;
    }

    get prefix() {
        return this.#prefix;
    }

    set prefix(value) {
        this.#prefix = value;
        this.#dirty = true;
    }

    get volume() {
        return this.#volume;
    }

    set volume(value) {
        this.#volume = value;
        this.#dirty = true;
    }

    get lang() {
        return this.#lang;
    }

    set lang(value) {
        this.#lang = value;
        this.#dirty = true;
    }

    get telemetryLevel() {
        return this.#telemetryLevel;
    }

    set telemetryLevel(value) {
        this.#telemetryLevel = value;
        this.#dirty = true;
    }

    get channelDenies() {
        return this.#channelDenies;
    }

    /**
     *
     * @param {Object} message
     * @param {TextChannel} message.channel
     * @param {string[]} args
     */
    denyCommands({channel}, args) {
        if (!(channel.id in this.#channelDenies)) {
            this.#channelDenies[channel.id] = new Set();
        }

        args.forEach(c => {
            this.#channelDenies[channel.id].add(c);
        });

        this.#channelDeniesDirty = true;
    }

    /**
     *
     * @param {Object} message
     * @param {TextChannel} message.channel
     * @param {string[]} args
     */
    allowCommands({channel}, args) {
        if (!(channel.id in this.#channelDenies)) {
            this.#channelDenies[channel.id] = new Set();
        }

        args.forEach(c => {
            this.#channelDenies[channel.id].delete(c);
        });

        this.#channelDeniesDirty = true;
    }
}
