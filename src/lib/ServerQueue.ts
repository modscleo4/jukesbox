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

import { Message } from "discord.js";

import Song from "./Song.js";
import { AudioPlayer, AudioResource, VoiceConnection } from "@discordjs/voice";

export default class ServerQueue {
    #connection?: VoiceConnection;
    #player?: AudioPlayer;
    #resource?: AudioResource;
    #songs: Song[];
    #volume: number;
    #playing: boolean;
    #loop: boolean;
    #shuffle: boolean;
    #toDelete: Message[];
    #position: number;
    #runSeek: boolean;
    #lastPlaybackTime: number;

    constructor({ songs, volume = 100 }: { songs: Song[]; volume?: number; }) {
        this.#songs = songs;
        this.#volume = volume;
        this.#playing = true;
        this.#loop = false;
        this.#shuffle = false;
        this.#toDelete = [];
        this.#position = 0;
        this.#runSeek = false;
        this.#lastPlaybackTime = 0;
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

    get resource() {
        return this.#resource;
    }

    set resource(value) {
        this.#resource = value;
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
        return this.song?.seek ?? 0;
    }

    get song(): Song | null {
        if (this.#songs.length === 0 || this.#position >= this.#songs.length) {
            return null;
        }

        return this.#songs[this.#position];
    }

    set song(song: Song) {
        this.#songs[this.#position] = song;
    }

    get runSeek() {
        return this.#runSeek;
    }

    set runSeek(value) {
        this.#runSeek = value;
    }

    get lastPlaybackTime() {
        return this.#lastPlaybackTime;
    }

    set lastPlaybackTime(value) {
        this.#lastPlaybackTime = value;
    }

    next() {
        if (!this.loop) {
            this.songs.splice(this.position, 1);
        }

        this.position = 0;
        if (this.shuffle) {
            this.position = Math.floor(Math.random() * this.songs.length);
        }
    }

    async deletePending() {
        while (this.toDelete.length > 0) {
            const msg = this.toDelete.shift()!;
            await msg.delete().catch(e => {
                console.error(e);
            });
        }
    }
}
