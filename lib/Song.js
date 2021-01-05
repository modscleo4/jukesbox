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

import {Readable} from "stream";
import {User} from "discord.js";

/**
 * @callback SongFunction
 * @param {string} url
 * @param {Object} args
 */

export default class Song {
    /**
     * @type {string}
     */
    #title;

    /**
     * @type {string}
     */
    #url;

    /**
     * @type {string}
     */
    #uploader;

    /**
     * @type {string}
     */
    #thumbnail;

    /**
     * @type {number}
     */
    #duration;

    /**
     * @type {boolean}
     */
    #findOnYT;

    /**
     * @type {('yt'|'sc'|'sp')}
     */
    #from;

    /**
     * @type {User}
     */
    #addedBy;

    /**
     * @type {SongFunction}
     */
    #fn;

    /**
     * @type {Object}
     */
    #options;

    /**
     * @type {Readable}
     */
    #stream;

    /**
     *
     * @param {Object} params
     * @param {string} params.title
     * @param {string} [params.url=null]
     * @param {string} params.uploader
     * @param {string} [params.thumbnail=null]
     * @param {number} [params.duration=null]
     * @param {boolean} [params.findOnYT=null]
     * @param {('yt'|'sc'|'sp')} params.from
     * @param {User} params.addedBy
     * @param {SongFunction} [params.fn=null]
     * @param {Object} [params.options=null]
     */
    constructor({title, url = null, uploader, thumbnail = null, duration = null, findOnYT = null, from, addedBy, fn = null, options = null}) {
        this.#title = title;
        this.#url = url;
        this.#uploader = uploader;
        this.#thumbnail = thumbnail;
        this.#duration = duration;
        this.#findOnYT = findOnYT;
        this.#from = from;
        this.#addedBy = addedBy;
        this.#fn = fn;
        this.#options = options;
        this.#stream = null;
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
