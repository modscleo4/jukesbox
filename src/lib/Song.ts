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
 * @file Song Class
 *
 * @author Dhiego Cassiano Fogaça Barbosa <modscleo4@outlook.com>
 */

'use strict';

import { Readable } from "stream";
import { User } from "discord.js";

type SongFunction = (url: string, args: any) => Readable | Promise<Readable>;

export default class Song {
    #title: string;
    #url: string;
    #uploader: string;
    #thumbnail: string;
    #duration: number;
    #findOnYT: boolean;
    #from: ('yt' | 'sc' | 'sp');
    #addedBy: User;
    #seek?: number;
    #fn?: SongFunction;
    #options: object;
    #stream?: Readable;

    constructor({ title, url = '', uploader, thumbnail = '', duration = 0, findOnYT = false, from, addedBy, seek, fn, options = {} }: { title: string; url?: string; uploader: string; thumbnail?: string; duration?: number; findOnYT?: boolean; from: ('yt' | 'sc' | 'sp'); addedBy: User; seek?: number; fn?: SongFunction; options?: any; }) {
        this.#title = title;
        this.#url = url;
        this.#uploader = uploader;
        this.#thumbnail = thumbnail;
        this.#duration = duration;
        this.#findOnYT = findOnYT;
        this.#from = from;
        this.#addedBy = addedBy;
        this.#seek = seek;
        this.#fn = fn;
        this.#options = options;
    }

    get title() {
        return this.#title;
    }

    get url() {
        return this.#url;
    }

    get uploader() {
        return this.#uploader;
    }

    get thumbnail() {
        return this.#thumbnail;
    }

    get duration() {
        return this.#duration;
    }

    get findOnYT() {
        return this.#findOnYT;
    }

    get from() {
        return this.#from;
    }

    get addedBy() {
        return this.#addedBy;
    }

    get seek() {
        return this.#seek;
    }

    set seek(value) {
        this.#seek = value;
    }

    get fn() {
        return this.#fn;
    }

    get options() {
        return this.#options;
    }

    get stream() {
        return this.#stream;
    }

    set stream(value) {
        this.#stream = value;
    }
}
