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
 * @file Server Music Queue Class
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import {Message} from "discord.js";

import Song from "./Song.js";

export default class ServerQueue {
    #connection;
    #songs;
    #volume;
    #playing;
    #loop;
    #shuffle;
    #toDelete;
    #position;
    #seek;

    /**
     *
     * @param {Object} params
     * @param {Song[]} params.songs
     * @param {number} [params.volume=100]
     */
    constructor({songs, volume = 100}) {
        this.#connection = null;
        this.#songs = songs;
        this.#volume = volume;
        this.#playing = true;
        this.#loop = false;
        this.#shuffle = false;
        this.#toDelete = null;
        this.#position = 0;
        this.#seek = null;
    }

    /**
     *
     * @return {*}
     */
    get connection() {
        return this.#connection;
    }

    /**
     *
     * @param {*} value
     */
    set connection(value) {
        this.#connection = value;
    }

    /**
     *
     * @return {Song[]}
     */
    get songs() {
        return this.#songs;
    }

    /**
     *
     * @param {Song[]} value
     */
    set songs(value) {
        this.#songs = value;
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
     * @return {boolean}
     */
    get playing() {
        return this.#playing;
    }

    /**
     *
     * @param {boolean} value
     */
    set playing(value) {
        this.#playing = value;
    }

    /**
     *
     * @return {boolean}
     */
    get loop() {
        return this.#loop;
    }

    /**
     *
     * @param {boolean} value
     */
    set loop(value) {
        this.#loop = value;
    }

    get shuffle() {
        return this.#shuffle;
    }

    /**
     *
     * @param {boolean} value
     */
    set shuffle(value) {
        this.#shuffle = value;
    }

    /**
     *
     * @return {Message|null}
     */
    get toDelete() {
        return this.#toDelete;
    }

    /**
     *
     * @param {Message|null} value
     */
    set toDelete(value) {
        this.#toDelete = value;
    }

    /**
     *
     * @return {number}
     */
    get position() {
        return this.#position;
    }

    /**
     *
     * @param {number} value
     */
    set position(value) {
        this.#position = value;
    }

    /**
     *
     * @return {number|null}
     */
    get seek() {
        return this.#seek;
    }

    /**
     *
     * @param {number|null} value
     */
    set seek(value) {
        this.#seek = value;
    }

    /**
     *
     * @return {Song}
     */
    get song() {
        return this.#songs[this.#position];
    }

    /**
     *
     * @param {Song} song
     */
    set song(song) {
        this.#songs[this.#position] = song;
    }

    async deletePending() {
        if (this.toDelete !== null && !this.toDelete.deleted) {
            await this.toDelete.delete().catch(e => {
                console.error(e);
            });

            this.toDelete = null;
        }
    }
}
