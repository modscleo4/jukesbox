import {User} from "discord.js";

export default class Song {
    #title;
    #url;
    #channelTitle;
    #thumbnail;
    #duration;
    #findOnYT;
    #from;
    #addedBy;
    #fn;
    #options;

    /**
     *
     * @param {Object} params
     * @param {string} params.title
     * @param {string?} params.url
     * @param {string} params.channelTitle
     * @param {string?} params.thumbnail
     * @param {number?} params.duration
     * @param {boolean?} params.findOnYT
     * @param {('yt'|'sc'|'sp')} params.from
     * @param {User} params.addedBy
     * @param {Function|Promise<*>} params.fn
     * @param {Object} params.options
     */
    constructor({title, url, channelTitle, thumbnail, duration, findOnYT = null, from, addedBy, fn, options}) {
        this.#title = title;
        this.#url = url;
        this.#channelTitle = channelTitle;
        this.#thumbnail = thumbnail;
        this.#duration = duration;
        this.#findOnYT = findOnYT;
        this.#from = from;
        this.#addedBy = addedBy;
        this.#fn = fn;
        this.#options = options;
    }


    get title() {
        return this.#title;
    }

    get url() {
        return this.#url;
    }

    get channelTitle() {
        return this.#channelTitle;
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
}
