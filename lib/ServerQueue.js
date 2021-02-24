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
    /**
     * @type {import('discord.js').VoiceConnection}
     */
    #connection;

    /**
     * @type {import('discord.js').StreamDispatcher}
     */
    #player;

    /**
     * @type {Song[]}
     */
    #songs;

    /**
     * @type {number}
     */
    #volume;

    /**
     * @type {boolean}
     */
    #playing;

    /**
     * @type {boolean}
     */
    #loop;

    /**
     * @type {boolean}
     */
    #shuffle;

    /**
     * @type {Message?}
     */
    #toDelete;

    /**
     * @type {number}
     */
    #position;

    /**
     * @type {number}
     */
    #startTime;

    /**
     *
     * @param {Object} params
     * @param {Song[]} params.songs
     * @param {number} [params.volume=100]
     */
    constructor({songs, volume = 100}) {
        this.#connection = null;
        this.#player = null;
        this.#songs = songs;
        this.#volume = volume;
        this.#playing = true;
        this.#loop = false;
        this.#shuffle = false;
        this.#toDelete = null;
        this.#position = 0;
        this.#startTime = 0;
    }

    get connection() {
        return this.#connection;
    }

    set connection(value) {
        this.#connection = value;
    }

    get player() {
        return this.#player;
    }

    set player(value) {
        this.#player = value;
    }

    get songs() {
        return this.#songs;
    }

    set songs(value) {
        this.#songs = value;
    }

    get volume() {
        return this.#volume;
    }

    set volume(value) {
        this.#volume = value;
    }

    get playing() {
        return this.#playing;
    }

    set playing(value) {
        this.#playing = value;
    }

    get loop() {
        return this.#loop;
    }

    set loop(value) {
        this.#loop = value;
    }

    get shuffle() {
        return this.#shuffle;
    }

    set shuffle(value) {
        this.#shuffle = value;
    }

    get toDelete() {
        return this.#toDelete;
    }

    set toDelete(value) {
        this.#toDelete = value;
    }

    get position() {
        return this.#position;
    }

    set position(value) {
        this.#position = value;
    }

    get startTime() {
        return this.#startTime;
    }

    set startTime(value) {
        this.#startTime = value;
    }

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
        if (this.toDelete && !this.toDelete.deleted) {
            await this.toDelete.delete().catch(e => {
                console.error(e);
            });

            this.toDelete = null;
        }
    }
}
