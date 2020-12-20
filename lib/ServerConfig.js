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

import DB from "./DB.js";

export default class ServerConfig {
    #id;
    #guild;
    #prefix;
    #volume;
    #lang;

    /**
     *
     * @param {Object} params
     * @param {number} [params.id=null] Internal ID
     * @param {string} params.guild Server Guild ID
     * @param {string} params.prefix Server prefix
     * @param {number} [params.volume=100] Bot volume in the Server
     * @param {string} [params.lang='pt_BR'] Bot language in the Server
     */
    constructor({id = null, guild, prefix, volume = 100, lang = 'pt_BR'}) {
        this.#id = id;
        this.#guild = guild;
        this.#prefix = prefix;
        this.#volume = volume;
        this.#lang = lang;
    }

    /**
     *
     * @param {string} database_url
     * @return {Promise<void>}
     */
    async save(database_url) {
        const db = new DB(database_url);

        if (this.#id) {
            await db.query('UPDATE server_configs SET prefix = $2, volume = $3, lang = $4 WHERE id = $1', [this.#id, this.#prefix, this.#volume, this.#lang]);
        } else {
            this.#id = (await db.query('INSERT INTO server_configs (guild, prefix, volume, lang) VALUES ($1, $2, $3, $4) RETURNING id', [this.#guild, this.#prefix, this.#volume, this.#lang])).rows[0].id;
        }
    }

    /**
     *
     * @return {number|null}
     */
    get id() {
        return this.#id;
    }

    /**
     *
     * @return {string}
     */
    get guild() {
        return this.#guild;
    }

    /**
     *
     * @return {string}
     */
    get prefix() {
        return this.#prefix;
    }

    /**
     *
     * @param {string} value
     */
    set prefix(value) {
        this.#prefix = value;
    }

    /**
     *
     * @return {number}
     */
    get volume() {
        return this.#volume;
    }

    /**
     *
     * @param {number} value
     */
    set volume(value) {
        this.#volume = value;
    }

    /**
     *
     * @return {string}
     */
    get lang() {
        return this.#lang;
    }

    /**
     *
     * @param {string} value
     */
    set lang(value) {
        this.#lang = value;
    }
}
